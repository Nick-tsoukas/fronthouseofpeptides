/**
 * PUT /api/admin/products/:id
 * Update a product and its variants
 */

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
  variants: VariantInput[]
  variantsToDelete?: number[]
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
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

    return { message: 'Product updated successfully' }
  } catch (error: any) {
    console.error('Error updating product:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.data?.error?.message || error.message || 'Failed to update product',
    })
  }
})
