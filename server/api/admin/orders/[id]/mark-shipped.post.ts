import { requireAdminAuth } from '~/server/utils/adminAuth'

/**
 * POST /api/admin/orders/:id/mark-shipped
 * Works for Shippo labels and manual tracking. Does not buy labels or touch inventory.
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
  if (['cancelled', 'refunded'].includes(String(attrs.paymentStatus))) {
    throw createError({ statusCode: 400, message: 'Cannot mark a cancelled/refunded order shipped.' })
  }

  const hasTracking = Boolean(String(attrs.trackingNumber || '').trim())
  const hasShippoLabel = Boolean(attrs.shippoTransactionId || attrs.shippingLabelUrl)
  const hasManual =
    attrs.fulfillmentMethod === 'manual_label' ||
    attrs.shippingStatus === 'manual_tracking_added' ||
    (hasTracking && !attrs.shippoTransactionId)

  if (!hasTracking && !hasShippoLabel && !hasManual) {
    throw createError({
      statusCode: 400,
      message: 'Add tracking or buy a label before marking this order shipped.',
    })
  }
  if (!hasTracking) {
    throw createError({
      statusCode: 400,
      message: 'Tracking number is required before marking as shipped.',
    })
  }

  if (attrs.shippingStatus === 'shipped' || attrs.shippingStatus === 'delivered') {
    return {
      ok: true,
      alreadyShipped: true,
      orderNumber: attrs.orderNumber || null,
      shippingStatus: attrs.shippingStatus,
      shippedAt: attrs.shippedAt || null,
      trackingNumber: attrs.trackingNumber,
      trackingUrl: attrs.trackingUrl || null,
      message: 'Order was already marked shipped.',
    }
  }

  const shippedAt = new Date().toISOString()
  await $fetch(`${strapiUrl}/api/orders/${entry.id}`, {
    method: 'PUT',
    headers,
    body: {
      data: {
        shippingStatus: 'shipped',
        shippedAt,
        status:
          attrs.status === 'approved' || attrs.status === 'awaiting_payment' || attrs.status === 'paid'
            ? 'fulfilled'
            : attrs.status,
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
