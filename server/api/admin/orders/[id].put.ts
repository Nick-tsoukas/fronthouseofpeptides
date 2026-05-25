/**
 * PUT /api/admin/orders/:id
 * Update order status
 */

interface OrderUpdateInput {
  status: string
  trackingNumber?: string
  notes?: string
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const strapiUrl = config.public.strapiUrl
  const strapiToken = config.strapiToken
  const id = getRouterParam(event, 'id')
  const body = await readBody<OrderUpdateInput>(event)

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Order ID is required',
    })
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  
  if (strapiToken) {
    headers['Authorization'] = `Bearer ${strapiToken}`
  }

  // Validate status
  const validStatuses = ['pending', 'paid', 'processing', 'shipped', 'failed', 'refunded']
  if (body.status && !validStatuses.includes(body.status)) {
    throw createError({
      statusCode: 400,
      message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
    })
  }

  try {
    // Build update data - only include fields that exist in schema
    const updateData: Record<string, any> = {}
    
    if (body.status) {
      updateData.status = body.status
    }
    
    // Note: trackingNumber and notes require schema updates in Strapi
    // They are included here for future compatibility
    // if (body.trackingNumber !== undefined) {
    //   updateData.trackingNumber = body.trackingNumber
    // }
    // if (body.notes !== undefined) {
    //   updateData.notes = body.notes
    // }

    await $fetch(`${strapiUrl}/api/orders/${id}`, {
      method: 'PUT',
      headers,
      body: {
        data: updateData,
      },
    })

    return { message: 'Order updated successfully' }
  } catch (error: any) {
    console.error('Error updating order:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.data?.error?.message || error.message || 'Failed to update order',
    })
  }
})
