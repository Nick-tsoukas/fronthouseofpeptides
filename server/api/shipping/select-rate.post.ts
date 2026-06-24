import { type H3Event } from 'h3'
import { validateCheckoutSession } from '~/server/utils/checkout-session'
import {
  getShippoConfig,
  shippoFetch,
  sanitizeRate,
  type ShippoRate,
  type ShippoShipment,
} from '~/server/utils/shippo'

interface RequestBody {
  orderId?: number
  checkoutSessionToken?: string
  rateId?: string
}

export default defineEventHandler(async (event: H3Event) => {
  const config = useRuntimeConfig(event)
  const strapiUrl = config.public.strapiUrl as string
  const strapiToken = config.strapiToken as string

  const authHeaders: Record<string, string> = strapiToken
    ? { Authorization: `Bearer ${strapiToken}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' }

  const shippoConfig = getShippoConfig(event)
  if (!shippoConfig.apiToken) {
    throw createError({ statusCode: 500, message: 'Shipping integration is not configured.' })
  }

  const body = await readBody<RequestBody>(event)
  const orderId = Number(body?.orderId)
  const token = (body?.checkoutSessionToken || '').trim()
  const rateId = (body?.rateId || '').trim()

  if (!rateId) {
    throw createError({ statusCode: 400, message: 'Shipping rate is required.' })
  }

  const { attributes: attrs } = await validateCheckoutSession(event, {
    orderId,
    token: token || undefined,
    requiredFields: [
      'subtotalCents',
      'taxCents',
      'discountCents',
      'shippingStatus',
      'shippoShipmentId',
      'totalCents',
    ],
  })

  if (attrs.shippingStatus !== 'quoted' && attrs.shippingStatus !== 'selected') {
    throw createError({ statusCode: 400, message: 'Shipping rates must be quoted before a rate can be selected.' })
  }

  if (['label_purchased', 'shipped', 'delivered', 'cancelled'].includes(attrs.shippingStatus)) {
    throw createError({ statusCode: 400, message: 'Shipping is already finalized for this order.' })
  }

  // Retrieve the Shipment and verify the rate belongs to it
  let shipment: ShippoShipment
  try {
    shipment = await shippoFetch<ShippoShipment>(shippoConfig, `/shipments/${attrs.shippoShipmentId}/`)
  } catch (err: any) {
    console.error('Shippo shipment lookup failed:', err?.message || err)
    throw createError({ statusCode: 502, message: 'Could not verify shipping rate. Please try again.' })
  }

  const rates: ShippoRate[] = shipment.rates || []
  const selectedRate = rates.find((r) => r.object_id === rateId)

  if (!selectedRate) {
    throw createError({ statusCode: 400, message: 'Selected shipping rate is not valid for this shipment.' })
  }

  if (selectedRate.currency !== 'USD') {
    throw createError({ statusCode: 400, message: 'Only USD shipping rates are supported.' })
  }

  const safeRate = sanitizeRate(selectedRate)
  const shippingCostCents = safeRate.amountCents
  const subtotalCents = Number(attrs.subtotalCents) || 0
  const taxCents = Number(attrs.taxCents) || 0
  const discountCents = Number(attrs.discountCents) || 0
  const totalCents = subtotalCents + shippingCostCents + taxCents - discountCents

  // Persist the selected rate and recalculated total
  try {
    await $fetch(`${strapiUrl}/api/orders/${orderId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: {
        data: {
          shippoRateId: rateId,
          shippingCarrier: safeRate.carrier,
          shippingService: safeRate.service,
          shippingDeliveryDays: safeRate.deliveryDays,
          shippingCostCents,
          shippingStatus: 'selected',
          totalCents,
        },
      },
    })
  } catch (err: any) {
    console.error('Failed to save selected shipping rate:', err?.message || err)
    throw createError({ statusCode: 502, message: 'Could not save selected shipping rate. Please try again.' })
  }

  return {
    ok: true,
    rate: safeRate,
    totals: {
      subtotalCents,
      shippingCostCents,
      taxCents,
      discountCents,
      totalCents,
    },
    shippingStatus: 'selected',
  }
})
