import { requireAdminAuth } from '~/server/utils/adminAuth'
import {
  hasTrackingInfo,
  sendAndRecordTrackingEmail,
} from '~/server/utils/orderTrackingEmail'

/**
 * POST /api/admin/orders/:id/email-tracking
 * Explicit send/re-send for Shippo and manual tracking.
 * Does not mark the order shipped.
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
    throw createError({ statusCode: 400, message: 'Order must be paid before emailing tracking.' })
  }
  if (!hasTrackingInfo(attrs)) {
    throw createError({ statusCode: 400, message: 'Tracking is not available yet.' })
  }
  if (!attrs.email) {
    throw createError({ statusCode: 400, message: 'Customer email is missing.' })
  }

  const result = await sendAndRecordTrackingEmail({
    event,
    strapiUrl,
    headers,
    orderId: entry.id,
    attrs,
    forceResend: true,
  })

  if (!result.sent) {
    throw createError({
      statusCode: 502,
      message: result.error || 'Could not send tracking email.',
    })
  }

  return {
    ok: true,
    trackingEmailSentAt: result.trackingEmailSentAt,
    resent: Boolean(attrs.trackingEmailSentAt),
    trackingUrl: result.trackingUrl,
  }
})
