import { requireAdminAuth } from '~/server/utils/adminAuth'

/**
 * POST /api/admin/orders/:id/mark-shipped
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  requireAdminAuth(event, config.ownerSessionSecret as string)

  const id = getRouterParam(event, 'id')
  if (!id || isNaN(Number(id))) {
    throw createError({ statusCode: 400, message: 'Invalid order ID.' })
  }

  const strapiUrl = config.public.strapiUrl as string
  const strapiToken = config.strapiToken as string
  const headers = {
    Authorization: `Bearer ${strapiToken}`,
    'Content-Type': 'application/json',
  }

  const orderRes = await $fetch<{ data: any }>(`${strapiUrl}/api/orders/${id}`, { headers }).catch(
    () => {
      throw createError({ statusCode: 404, message: 'Order not found.' })
    }
  )

  const entry = orderRes.data
  if (!entry) throw createError({ statusCode: 404, message: 'Order not found.' })
  const attrs = entry.attributes || {}

  if (attrs.paymentStatus !== 'paid') {
    throw createError({ statusCode: 400, message: 'Order must be paid before marking as shipped.' })
  }
  if (!attrs.shippoTransactionId) {
    throw createError({ statusCode: 400, message: 'A shipping label must be purchased first.' })
  }
  if (!attrs.trackingNumber) {
    throw createError({ statusCode: 400, message: 'Tracking number is required before marking as shipped.' })
  }

  const shippedAt = new Date().toISOString()
  await $fetch(`${strapiUrl}/api/orders/${entry.id}`, {
    method: 'PUT',
    headers,
    body: {
      data: {
        shippingStatus: 'shipped',
        shippedAt,
        status: attrs.status === 'approved' || attrs.status === 'awaiting_payment' ? 'fulfilled' : attrs.status,
      },
    },
  }).catch(() => {
    throw createError({ statusCode: 502, message: 'Could not update order shipping status.' })
  })

  return {
    ok: true,
    orderNumber: attrs.orderNumber || null,
    shippingStatus: 'shipped',
    shippedAt,
    trackingNumber: attrs.trackingNumber,
    trackingUrl: attrs.trackingUrl || null,
  }
})
