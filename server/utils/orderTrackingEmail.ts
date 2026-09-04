import type { H3Event } from 'h3'
import { sendTrackingEmail } from '~/server/utils/sendOrderEmails'
import { getEmailBrand } from '~/server/utils/storeSettings'

export function hasTrackingInfo(attrs: Record<string, any>): boolean {
  return Boolean(
    String(attrs.trackingNumber || '').trim() || String(attrs.trackingUrl || '').trim()
  )
}

export function resolveTrackingUrl(attrs: Record<string, any>): string {
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
 * Send customer tracking email and persist trackingEmailSentAt.
 * Works for Shippo and manual/outside labels. Does not expose Shippo IDs.
 */
export async function sendAndRecordTrackingEmail(opts: {
  event: H3Event
  strapiUrl: string
  headers: Record<string, string>
  orderId: number
  attrs: Record<string, any>
  /** If true, send even when trackingEmailSentAt is already set (re-send). */
  forceResend?: boolean
}): Promise<{
  sent: boolean
  skipped: boolean
  trackingEmailSentAt: string | null
  trackingUrl: string | null
  error?: string
}> {
  const { event, strapiUrl, headers, orderId, attrs, forceResend } = opts

  if (attrs.paymentStatus !== 'paid') {
    return { sent: false, skipped: true, trackingEmailSentAt: attrs.trackingEmailSentAt || null, trackingUrl: attrs.trackingUrl || null, error: 'Order must be paid.' }
  }
  if (!hasTrackingInfo(attrs)) {
    return { sent: false, skipped: true, trackingEmailSentAt: attrs.trackingEmailSentAt || null, trackingUrl: attrs.trackingUrl || null, error: 'Tracking is not available yet.' }
  }
  if (!attrs.email) {
    return { sent: false, skipped: true, trackingEmailSentAt: attrs.trackingEmailSentAt || null, trackingUrl: attrs.trackingUrl || null, error: 'Customer email is missing.' }
  }
  if (attrs.trackingEmailSentAt && !forceResend) {
    return {
      sent: false,
      skipped: true,
      trackingEmailSentAt: attrs.trackingEmailSentAt,
      trackingUrl: attrs.trackingUrl || resolveTrackingUrl(attrs) || null,
    }
  }

  const config = useRuntimeConfig(event)
  const trackingUrl = resolveTrackingUrl(attrs)
  const trackingNumber = String(attrs.trackingNumber || '').trim() || 'See tracking link'

  if (!trackingUrl && !trackingNumber) {
    return { sent: false, skipped: false, trackingEmailSentAt: attrs.trackingEmailSentAt || null, trackingUrl: null, error: 'Tracking URL could not be determined.' }
  }

  const result = await sendTrackingEmail(
    {
      orderNumber: attrs.orderNumber || String(orderId),
      email: attrs.email,
      customerName: attrs.customerName || attrs.shippingName || '',
      carrier: attrs.shippingCarrier || '',
      service: attrs.shippingService || '',
      trackingNumber,
      trackingUrl: trackingUrl || '',
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
    return {
      sent: false,
      skipped: false,
      trackingEmailSentAt: attrs.trackingEmailSentAt || null,
      trackingUrl: trackingUrl || null,
      error: result.error || 'Could not send tracking email.',
    }
  }

  const trackingEmailSentAt = new Date().toISOString()
  const patch: Record<string, any> = { trackingEmailSentAt }
  if (!attrs.trackingUrl && trackingUrl) patch.trackingUrl = trackingUrl

  await $fetch(`${strapiUrl}/api/orders/${orderId}`, {
    method: 'PUT',
    headers,
    body: { data: patch },
  }).catch((err: any) => {
    console.error('Failed to save trackingEmailSentAt:', err?.message || err)
  })

  return {
    sent: true,
    skipped: false,
    trackingEmailSentAt,
    trackingUrl: trackingUrl || attrs.trackingUrl || null,
  }
}
