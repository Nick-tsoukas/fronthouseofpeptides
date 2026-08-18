import { requireAdminAuth } from '~/server/utils/adminAuth'
import { sendTrackingEmail } from '~/server/utils/sendOrderEmails'
import { getEmailBrand } from '~/server/utils/storeSettings'

/**
 * POST /api/admin/orders/:id/email-tracking
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

  if (!attrs.email) {
    throw createError({ statusCode: 400, message: 'Customer email is missing.' })
  }
  if (!attrs.trackingNumber || !attrs.trackingUrl) {
    throw createError({ statusCode: 400, message: 'Tracking is not available yet.' })
  }
  if (!['label_purchased', 'shipped', 'in_transit'].includes(attrs.shippingStatus)) {
    throw createError({
      statusCode: 400,
      message: 'Tracking email can only be sent after a label is purchased.',
    })
  }

  const result = await sendTrackingEmail(
    {
      orderNumber: attrs.orderNumber || String(entry.id),
      email: attrs.email,
      customerName: attrs.customerName || attrs.shippingName || '',
      carrier: attrs.shippingCarrier || '',
      service: attrs.shippingService || '',
      trackingNumber: attrs.trackingNumber,
      trackingUrl: attrs.trackingUrl,
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
  await $fetch(`${strapiUrl}/api/orders/${entry.id}`, {
    method: 'PUT',
    headers,
    body: { data: { trackingEmailSentAt } },
  }).catch((err: any) => {
    console.error('Failed to save trackingEmailSentAt:', err?.message || err)
  })

  return {
    ok: true,
    orderNumber: attrs.orderNumber || null,
    trackingEmailSentAt,
  }
})
