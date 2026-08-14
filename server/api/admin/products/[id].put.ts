/**
 * PUT /api/admin/products/:id
 * Update a product and its variants
 */
import { requireAdminAuth } from '~/server/utils/adminAuth'
import { ensureProductFallbackImage } from '~/server/utils/productImageService'

interface VariantInput {
  id?: number
  name: string
  sku: string
  price: number
  inventory: number | null
  active?: boolean
}

interface ProductInput {
  name: string
  slug: string
  shortDescription?: string
  description?: string
  badgeText?: string
  active?: boolean
  requiresConfirmation?: boolean
  imageId?: number | null
  variants: VariantInput[]
  variantsToDelete?: number[]
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  requireAdminAuth(event, config.ownerSessionSecret as string)
  const strapiUrl = config.public.strapiUrl
  const strapiToken = config.strapiToken
  const id = getRouterParam(event, 'id')
  const body = await readBody<ProductInput>(event)

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Product ID is required',
    })
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  
  if (strapiToken) {
    headers['Authorization'] = `Bearer ${strapiToken}`
  }

  try {
    // Update the product
    await $fetch(`${strapiUrl}/api/products/${id}`, {
      method: 'PUT',
      headers,
      body: {
        data: {
          name: body.name,
          slug: body.slug,
          shortDescription: body.shortDescription || '',
          description: body.description || '',
          badgeText: body.badgeText || 'Research Use Only',
          active: body.active ?? true,
          requiresConfirmation: body.requiresConfirmation ?? true,
          ...(body.imageId !== undefined
            ? { image: body.imageId === null ? null : body.imageId }
            : {}),
        },
      },
    })

    // Delete removed variants
    if (body.variantsToDelete && body.variantsToDelete.length > 0) {
      for (const variantId of body.variantsToDelete) {
        try {
          await $fetch(`${strapiUrl}/api/variants/${variantId}`, {
            method: 'DELETE',
            headers,
          })
        } catch (err) {
          console.error(`Failed to delete variant ${variantId}:`, err)
        }
      }
    }

    // Update or create variants
    for (const variant of body.variants) {
      if (variant.id) {
        // Update existing variant
        await $fetch(`${strapiUrl}/api/variants/${variant.id}`, {
          method: 'PUT',
          headers,
          body: {
            data: {
              name: variant.name,
              sku: variant.sku,
              price: variant.price,
              inventory: variant.inventory,
              active: variant.active ?? true,
            },
          },
        })
      } else {
        // Create new variant
        await $fetch(`${strapiUrl}/api/variants`, {
          method: 'POST',
          headers,
          body: {
            data: {
              name: variant.name,
              sku: variant.sku,
              price: variant.price,
              inventory: variant.inventory,
              active: variant.active ?? true,
              product: parseInt(id),
            },
          },
        })
      }
    }

    try {
      await ensureProductFallbackImage({
        productId: parseInt(id),
        productName: body.name,
        variants: body.variants,
        hasUploadedImage: body.imageId != null,
        strapiUrl: String(strapiUrl),
        headers,
        force: false,
        syncFields: true,
      })
    } catch (err: any) {
      console.warn('[admin/products] fallback image generate failed:', err?.message || err)
    }

    return { message: 'Product updated successfully' }
  } catch (error: any) {
    console.error('Error updating product:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.data?.error?.message || error.message || 'Failed to update product',
    })
  }
})
