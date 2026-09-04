import { requireAdminAuth } from '~/server/utils/adminAuth'
import { sendTrackingEmail } from '~/server/utils/sendOrderEmails'
import { getEmailBrand } from '~/server/utils/storeSettings'

function fallbackTrackingUrl(attrs: Record<string, any>): string {
  const existing = String(attrs.trackingUrl || '').trim()
  if (existing) return existing
  const tn = encodeURIComponent(String(attrs.trackingNumber || '').trim())
  if (!tn) return ''
  const carrier = String(attrs.shippingCarrier || '').toUpperCase()
  if (carrier.includes('USPS')) return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${tn}`
  if (carrier.includes('UPS')) return `https://www.ups.com/track?tracknum=${tn}`
  if (carrier.includes('FEDEX')) return `https://www.fedex.com/fedextrack/?trknbr=${tn}`
  return `https://www.google.com/search?q=${tn}+tracking`
}

/**
 * POST /api/admin/orders/:id/email-tracking
 * Works for Shippo labels and manual tracking.
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
  if (!attrs.email) {
    throw createError({ statusCode: 400, message: 'Customer email is missing.' })
  }
  if (!attrs.trackingNumber) {
    throw createError({ statusCode: 400, message: 'Tracking is not available yet.' })
  }

  const allowedStatuses = [
    'label_purchased',
    'manual_tracking_added',
    'shipped',
    'in_transit',
    'delivered',
  ]
  if (attrs.shippingStatus && !allowedStatuses.includes(attrs.shippingStatus)) {
    // Allow if tracking exists even if status naming differs on older schemas.
    if (!attrs.trackingNumber) {
      throw createError({
        statusCode: 400,
        message: 'Tracking email can only be sent after a label or manual tracking is added.',
      })
    }
  }

  const trackingUrl = fallbackTrackingUrl(attrs)
  if (!trackingUrl) {
    throw createError({ statusCode: 400, message: 'Tracking URL could not be determined.' })
  }

  const result = await sendTrackingEmail(
    {
      orderNumber: attrs.orderNumber || String(entry.id),
      email: attrs.email,
      customerName: attrs.customerName || attrs.shippingName || '',
      carrier: attrs.shippingCarrier || '',
      service: attrs.shippingService || '',
      trackingNumber: attrs.trackingNumber,
      trackingUrl,
    },
    {
      smtpHost: config.smtpHost as string,
      smtpPort: config.smtpPort as string,
      smtpUser: config.smtpUser as string,
      smtpPass: config.smtpPass as string,
      orderFromEmail: config.orderFromEmail as string,
      brand: await getEmailBrand(event),
    }
  )

  if (!result.sent) {
    throw createError({
      statusCode: 502,
      message: result.error || 'Could not send tracking email.',
    })
  }

  const trackingEmailSentAt = new Date().toISOString()
  const patch: Record<string, any> = { trackingEmailSentAt }
  if (!attrs.trackingUrl) patch.trackingUrl = trackingUrl

  await $fetch(`${strapiUrl}/api/orders/${entry.id}`, {
    method: 'PUT',
    headers,
    body: { data: patch },
  }).catch((err: any) => {
    console.error('Failed to save trackingEmailSentAt:', err?.message || err)
  })

  return {
    ok: true,
    trackingEmailSentAt,
    resent: Boolean(attrs.trackingEmailSentAt),
    trackingUrl,
  }
})
