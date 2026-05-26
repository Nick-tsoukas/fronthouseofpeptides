/**
 * POST /api/admin/products
 * Create a new product with variants
 */

interface VariantInput {
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
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const strapiUrl = config.public.strapiUrl
  const strapiToken = config.strapiToken
  const body = await readBody<ProductInput>(event)

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  
  if (strapiToken) {
    headers['Authorization'] = `Bearer ${strapiToken}`
  }

  // Validate required fields
  if (!body.name?.trim()) {
    throw createError({
      statusCode: 400,
      message: 'Product name is required',
    })
  }

  if (!body.variants || body.variants.length === 0) {
    throw createError({
      statusCode: 400,
      message: 'At least one variant is required',
    })
  }

  try {
    // Create the product first
    const productResponse = await $fetch<{ data: { id: number } }>(`${strapiUrl}/api/products`, {
      method: 'POST',
      headers,
      body: {
        data: {
          name: body.name,
          slug: body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          shortDescription: body.shortDescription || '',
          description: body.description || '',
          badgeText: body.badgeText || 'Research Use Only',
          active: body.active ?? true,
          requiresConfirmation: body.requiresConfirmation ?? true,
        },
      },
    })

    const productId = productResponse.data.id

    // Create variants for the product
    for (const variant of body.variants) {
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
            product: productId,
          },
        },
      })
    }

    return { data: { id: productId }, message: 'Product created successfully' }
  } catch (error: any) {
    console.error('Error creating product:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.data?.error?.message || error.message || 'Failed to create product',
    })
  }
})
