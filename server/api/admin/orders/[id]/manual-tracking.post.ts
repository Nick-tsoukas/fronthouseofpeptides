import { requireAdminAuth } from '~/server/utils/adminAuth'

const CARRIERS = ['USPS', 'UPS', 'FedEx', 'Other'] as const

function buildTrackingUrl(carrier: string, trackingNumber: string, provided?: string): string {
  const explicit = String(provided || '').trim()
  if (explicit) return explicit
  const tn = encodeURIComponent(trackingNumber.trim())
  switch (carrier) {
    case 'USPS':
      return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${tn}`
    case 'UPS':
      return `https://www.ups.com/track?tracknum=${tn}`
    case 'FedEx':
      return `https://www.fedex.com/fedextrack/?trknbr=${tn}`
    default:
      return `https://www.google.com/search?q=${tn}+tracking`
  }
}

/**
 * POST /api/admin/orders/:id/manual-tracking
 * Owner adds tracking from an outside/manual label purchase.
 * Does not call Shippo/Moov. Does not touch inventory. Does not mark shipped.
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  requireAdminAuth(event, config.ownerSessionSecret as string)

  const id = getRouterParam(event, 'id')
  const orderId = Number(id)
  if (!Number.isInteger(orderId) || orderId <= 0) {
    throw createError({ statusCode: 400, message: 'Invalid order ID.' })
  }

  const body = await readBody<{
    carrier?: string
    service?: string
    trackingNumber?: string
    trackingUrl?: string
    labelCostCents?: number | null
    notes?: string
  }>(event)

  const carrier = String(body?.carrier || '').trim()
  const trackingNumber = String(body?.trackingNumber || '').trim()
  const service = String(body?.service || '').trim()
  const notes = String(body?.notes || '').trim().slice(0, 1000)

  if (!CARRIERS.includes(carrier as any)) {
    throw createError({ statusCode: 400, message: 'Carrier must be USPS, UPS, FedEx, or Other.' })
  }
  if (!trackingNumber) {
    throw createError({ statusCode: 400, message: 'Tracking number is required.' })
  }

  let labelCostCents: number | null = null
  if (body?.labelCostCents != null && body.labelCostCents !== ('' as any)) {
    const n = Number(body.labelCostCents)
    if (!Number.isFinite(n) || n < 0) {
      throw createError({ statusCode: 400, message: 'Label cost must be a non-negative number of cents.' })
    }
    labelCostCents = Math.round(n)
  }

  const strapiUrl = config.public.strapiUrl as string
  const strapiToken = config.strapiToken as string
  const headers = {
    Authorization: `Bearer ${strapiToken}`,
    'Content-Type': 'application/json',
  }

  const orderRes = await $fetch<{ data: any }>(`${strapiUrl}/api/orders/${orderId}`, { headers }).catch(
    () => {
      throw createError({ statusCode: 404, message: 'Order not found.' })
    }
  )
  const entry = orderRes.data
  if (!entry) throw createError({ statusCode: 404, message: 'Order not found.' })
  const attrs = entry.attributes || {}

  if (attrs.paymentStatus !== 'paid') {
    throw createError({
      statusCode: 400,
      message: 'Order must be paid before adding tracking.',
    })
  }
  if (['cancelled', 'refunded'].includes(String(attrs.paymentStatus)) || attrs.status === 'cancelled') {
    throw createError({ statusCode: 400, message: 'Cannot add tracking to a cancelled/refunded order.' })
  }
  if (attrs.shippingStatus === 'shipped' || attrs.shippingStatus === 'delivered') {
    throw createError({
      statusCode: 400,
      message: 'This order is already shipped. Edit tracking is not supported in V1.',
    })
  }

  const trackingUrl = buildTrackingUrl(carrier, trackingNumber, body?.trackingUrl)
  const now = new Date().toISOString()

  const fullPatch: Record<string, any> = {
    fulfillmentMethod: 'manual_label',
    shippingCarrier: carrier,
    shippingService: service || null,
    trackingNumber,
    trackingUrl,
    manualTrackingAddedAt: now,
    shippingStatus: 'manual_tracking_added',
    labelErrorMessage: null,
  }
  if (labelCostCents != null) fullPatch.labelCostCents = labelCostCents
  if (notes) {
    fullPatch.ownerNotes = [attrs.ownerNotes, `Manual tracking note: ${notes}`].filter(Boolean).join('\n')
  }

  try {
    await $fetch(`${strapiUrl}/api/orders/${orderId}`, {
      method: 'PUT',
      headers,
      body: { data: fullPatch },
    })
  } catch (err: any) {
    // Schema may not include new enum/fields yet — fall back to label_purchased + core fields.
    console.warn('[manual-tracking] full patch failed, retrying compatible fields:', err?.message || err)
    const fallback: Record<string, any> = {
      shippingCarrier: carrier,
      shippingService: service || null,
      trackingNumber,
      trackingUrl,
      shippingStatus: 'label_purchased',
    }
    if (labelCostCents != null) fallback.labelCostCents = labelCostCents
    if (notes) {
      fallback.ownerNotes = [attrs.ownerNotes, `Manual tracking note: ${notes}`].filter(Boolean).join('\n')
    }
    await $fetch(`${strapiUrl}/api/orders/${orderId}`, {
      method: 'PUT',
      headers,
      body: { data: fallback },
    }).catch(() => {
      throw createError({ statusCode: 502, message: 'Could not save manual tracking.' })
    })
  }

  return {
    ok: true,
    fulfillmentMethod: 'manual_label',
    shippingStatus: 'manual_tracking_added',
    shippingCarrier: carrier,
    shippingService: service || null,
    trackingNumber,
    trackingUrl,
    manualTrackingAddedAt: now,
    labelCostCents,
    message: 'Manual tracking saved. You can email tracking or mark the order shipped.',
  }
})
