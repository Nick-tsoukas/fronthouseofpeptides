export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)
  const sessionId = query.session_id as string

  if (!sessionId) {
    throw createError({
      statusCode: 400,
      message: 'Missing session_id parameter',
    })
  }

  try {
    const strapiUrl = config.public.strapiUrl
    const strapiToken = config.strapiToken

    const headers: Record<string, string> = {}
    if (strapiToken) {
      headers['Authorization'] = `Bearer ${strapiToken}`
    }

    const response = await $fetch<{ data: any[] }>(
      `${strapiUrl}/api/orders?filters[stripeSessionId][$eq]=${sessionId}&populate=orderItems`,
      { headers }
    )

    if (!response.data || response.data.length === 0) {
      throw createError({
        statusCode: 404,
        message: 'Order not found',
      })
    }

    const order = response.data[0]

    return {
      id: order.id,
      status: order.attributes.status,
      email: order.attributes.email,
      amountTotal: order.attributes.amountTotal,
      shippingAmount: order.attributes.shippingAmount,
      currency: order.attributes.currency,
      createdAt: order.attributes.createdAt,
      items: order.attributes.orderItems?.data?.map((item: any) => ({
        productName: item.attributes.productNameSnapshot,
        variantName: item.attributes.variantNameSnapshot,
        quantity: item.attributes.quantity,
        unitPrice: item.attributes.unitPriceSnapshot,
      })) || [],
    }
  } catch (error: any) {
    console.error('Order lookup error:', error)
    
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      message: 'Failed to lookup order',
    })
  }
})
