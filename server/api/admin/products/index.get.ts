/**
 * GET /api/admin/products
 * Fetch all products with variants for admin
 */
export default defineEventHandler(async () => {
  const config = useRuntimeConfig()
  const strapiUrl = config.public.strapiUrl
  const strapiToken = config.strapiToken

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  
  if (strapiToken) {
    headers['Authorization'] = `Bearer ${strapiToken}`
  }

  try {
    const response = await $fetch(`${strapiUrl}/api/products?populate=variants&sort=name:asc`, {
      headers,
    })
    return response
  } catch (error: any) {
    console.error('Error fetching products:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to fetch products',
    })
  }
})
