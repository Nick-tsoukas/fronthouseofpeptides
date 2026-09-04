import { requireAdminAuth } from '~/server/utils/adminAuth'
import {
  hasTrackingInfo,
  sendAndRecordTrackingEmail,
} from '~/server/utils/orderTrackingEmail'

/**
 * POST /api/admin/orders/:id/mark-shipped
 * Works for Shippo labels and manual tracking.
 * Auto-sends tracking email once if not already sent.
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

  if (!hasTrackingInfo(attrs)) {
    throw createError({
      statusCode: 400,
      message: 'Add tracking or buy a label before marking this order shipped.',
    })
  }

  const alreadyShipped =
    attrs.shippingStatus === 'shipped' || attrs.shippingStatus === 'delivered'

  let shippedAt = attrs.shippedAt || null

  if (!alreadyShipped) {
    shippedAt = new Date().toISOString()
    await $fetch(`${strapiUrl}/api/orders/${entry.id}`, {
      method: 'PUT',
      headers,
      body: {
        data: {
          shippingStatus: 'shipped',
          shippedAt,
          status:
            attrs.status === 'approved' ||
            attrs.status === 'awaiting_payment' ||
            attrs.status === 'paid'
              ? 'fulfilled'
              : attrs.status,
        },
      },
    }).catch(() => {
      throw createError({ statusCode: 502, message: 'Could not update order shipping status.' })
    })
  }

  // Auto-email tracking once (Shippo or manual). Skip if already sent.
  let trackingEmailSentAt = attrs.trackingEmailSentAt || null
  let trackingEmailSent = false
  let trackingEmailSkipped = Boolean(attrs.trackingEmailSentAt)
  let trackingEmailError: string | undefined

  if (!attrs.trackingEmailSentAt) {
    const emailResult = await sendAndRecordTrackingEmail({
      event,
      strapiUrl,
      headers,
      orderId: entry.id,
      attrs,
      forceResend: false,
    })
    trackingEmailSent = emailResult.sent
    trackingEmailSkipped = emailResult.skipped
    trackingEmailSentAt = emailResult.trackingEmailSentAt
    trackingEmailError = emailResult.error
  }

  return {
    ok: true,
    alreadyShipped,
    orderNumber: attrs.orderNumber || null,
    shippingStatus: alreadyShipped ? attrs.shippingStatus : 'shipped',
    shippedAt,
    trackingNumber: attrs.trackingNumber || null,
    trackingUrl: attrs.trackingUrl || null,
    trackingEmailSent,
    trackingEmailSkipped,
    trackingEmailSentAt,
    trackingEmailError: trackingEmailError || null,
    message: alreadyShipped
      ? trackingEmailSent
        ? 'Order was already marked shipped. Tracking email sent.'
        : 'Order was already marked shipped.'
      : trackingEmailSent
        ? 'Order marked as shipped. Tracking email sent to customer.'
        : trackingEmailSkipped
          ? 'Order marked as shipped. Tracking email was already sent earlier.'
          : trackingEmailError
            ? `Order marked as shipped, but tracking email failed: ${trackingEmailError}`
            : 'Order marked as shipped.',
  }
})
