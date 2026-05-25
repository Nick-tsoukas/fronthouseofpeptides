/**
 * GET /api/admin/products/:id
 * Fetch a single product with variants
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const strapiUrl = config.public.strapiUrl
  const strapiToken = config.strapiToken
  const id = getRouterParam(event, 'id')

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
    const response = await $fetch(`${strapiUrl}/api/products/${id}?populate=variants`, {
      headers,
    })
    return response
  } catch (error: any) {
    console.error('Error fetching product:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to fetch product',
    })
  }
})
