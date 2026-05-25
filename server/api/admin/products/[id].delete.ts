/**
 * DELETE /api/admin/products/:id
 * Delete a product and its variants
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
    // First, fetch the product to get its variants
    const productResponse = await $fetch<{ data: { attributes: { variants: { data: { id: number }[] } } } }>(
      `${strapiUrl}/api/products/${id}?populate=variants`,
      { headers }
    )

    // Delete all variants first
    const variants = productResponse.data?.attributes?.variants?.data || []
    for (const variant of variants) {
      try {
        await $fetch(`${strapiUrl}/api/variants/${variant.id}`, {
          method: 'DELETE',
          headers,
        })
      } catch (err) {
        console.error(`Failed to delete variant ${variant.id}:`, err)
      }
    }

    // Then delete the product
    await $fetch(`${strapiUrl}/api/products/${id}`, {
      method: 'DELETE',
      headers,
    })

    return { message: 'Product deleted successfully' }
  } catch (error: any) {
    console.error('Error deleting product:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.data?.error?.message || error.message || 'Failed to delete product',
    })
  }
})
