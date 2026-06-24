import { type H3Event } from 'h3'
import { validateCheckoutSession } from '~/server/utils/checkout-session'
import {
  getShippoConfig,
  shippoFetch,
  sanitizeRate,
  type ShippoAddress,
  type ShippoShipment,
  type ShippoRate,
} from '~/server/utils/shippo'

const TERMS_VERSION = '2026-06-20'
const RESEARCH_ATTESTATION_VERSION = '2026-06-20'

interface RequestBody {
  orderId?: number
  checkoutSessionToken?: string
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

  const { attributes: attrs } = await validateCheckoutSession(event, {
    orderId,
    token: token || undefined,
    requiredFields: [
      'customerName',
      'email',
      'phone',
      'shippingFirstName',
      'shippingLastName',
      'shippingPhone',
      'shippingAddress1',
      'shippingAddress2',
      'shippingCity',
      'shippingState',
      'shippingPostalCode',
      'shippingCountry',
      'subtotalCents',
      'shippingCents',
      'taxCents',
      'totalCents',
      'shippingStatus',
      'ageConfirmed',
      'researchUseConfirmed',
      'qualifiedPurchaserConfirmed',
      'termsAccepted',
      'verificationAcknowledged',
    ],
  })

  const errors: string[] = []

  const firstName = (attrs.shippingFirstName || '').trim()
  const lastName = (attrs.shippingLastName || '').trim()
  const phone = (attrs.shippingPhone || '').trim()
  const address1 = (attrs.shippingAddress1 || '').trim()
  const city = (attrs.shippingCity || '').trim()
  const state = (attrs.shippingState || '').trim()
  const postalCode = (attrs.shippingPostalCode || '').trim()
  const country = (attrs.shippingCountry || 'US').trim().toUpperCase()

  if (!firstName) errors.push('Shipping first name is required.')
  if (!lastName) errors.push('Shipping last name is required.')
  if (!phone) errors.push('Shipping phone is required.')
  if (!address1) errors.push('Shipping address is required.')
  if (!city) errors.push('Shipping city is required.')
  if (!state) errors.push('Shipping state is required.')
  if (!postalCode) errors.push('Shipping postal code is required.')
  if (country !== 'US') errors.push('Only US shipping is supported at this time.')

  const confirmations: Record<string, boolean | undefined> = {
    ageConfirmed: attrs.ageConfirmed,
    researchUseConfirmed: attrs.researchUseConfirmed,
    qualifiedPurchaserConfirmed: attrs.qualifiedPurchaserConfirmed,
    termsAccepted: attrs.termsAccepted,
    verificationAcknowledged: attrs.verificationAcknowledged,
  }

  for (const [key, value] of Object.entries(confirmations)) {
    if (value !== true) {
      errors.push(`Required confirmation not accepted: ${key}.`)
    }
  }

  if (errors.length > 0) {
    throw createError({ statusCode: 400, message: errors.join(' ') })
  }

  // If the order already has a selected rate, return it without creating a new Shippo shipment.
  if (attrs.shippingStatus === 'selected' || attrs.shippingStatus === 'label_purchased') {
    const selectedRate = attrs.shippoRateId
      ? [{
          rateId: attrs.shippoRateId,
          carrier: attrs.shippingCarrier || '',
          service: attrs.shippingService || '',
          serviceToken: '',
          amountCents: Number(attrs.shippingCostCents) || 0,
          currency: 'USD',
          deliveryDays: Number(attrs.shippingDeliveryDays) || null,
          test: true,
        }]
      : []
    return {
      ok: true,
      rates: selectedRate,
      shippingStatus: attrs.shippingStatus,
      totals: {
        subtotalCents: Number(attrs.subtotalCents) || 0,
        shippingCostCents: Number(attrs.shippingCostCents) || 0,
        taxCents: Number(attrs.taxCents) || 0,
        discountCents: Number(attrs.discountCents) || 0,
        totalCents: Number(attrs.totalCents) || 0,
      },
    }
  }

  let shipment: ShippoShipment | undefined
  let addressToId: string = attrs.shippoAddressToId
  let normalizedAddress: any

  if (attrs.shippingStatus === 'quoted' && attrs.shippoShipmentId) {
    // Reuse the existing shipment to prevent duplicate Shippo objects
    try {
      shipment = await shippoFetch<ShippoShipment>(shippoConfig, `/shipments/${attrs.shippoShipmentId}/`)
      addressToId = shipment.address_to?.object_id || addressToId
    } catch (err: any) {
      console.error('Shippo shipment reuse failed:', err?.message || err)
      // Fall through to create a new shipment below
    }
  }

  if (!shipment) {
    // Build Shippo destination address
    const addressTo: ShippoAddress = {
      name: `${firstName} ${lastName}`,
      street1: address1,
      street2: (attrs.shippingAddress2 || '').trim() || undefined,
      city,
      state,
      zip: postalCode,
      country,
      phone,
      email: (attrs.email || '').trim() || undefined,
      is_residential: true,
    }

    // Validate and create the destination address via Shippo
    try {
      const addressResult = await shippoFetch<any>(shippoConfig, '/addresses/', {
        method: 'POST',
        body: addressTo,
      })
      addressToId = addressResult.object_id
      normalizedAddress = addressResult
    } catch (err: any) {
      console.error('Shippo address validation failed:', err?.message || err)
      throw createError({ statusCode: 400, message: 'Shipping address could not be validated.' })
    }

    if (normalizedAddress?.validation_results?.is_valid === false) {
      throw createError({ statusCode: 400, message: 'Shipping address is invalid.' })
    }

    // Create the Shippo shipment
    try {
      shipment = await shippoFetch<ShippoShipment>(shippoConfig, '/shipments/', {
        method: 'POST',
        body: {
          address_from: shippoConfig.from,
          address_to: { object_id: addressToId },
          parcels: [shippoConfig.parcel],
          metadata: `Order ${attrs.orderNumber || orderId}`,
          async: false,
        },
      })
    } catch (err: any) {
      console.error('Shippo shipment creation failed:', err?.message || err)
      throw createError({ statusCode: 502, message: 'Could not retrieve shipping rates. Please try again.' })
    }
  }

  if (!shipment) {
    throw createError({ statusCode: 502, message: 'Could not retrieve shipping rates. Please try again.' })
  }

  const rates: ShippoRate[] = shipment.rates || []
  const safeRates = rates
    .filter((rate) => rate.currency === 'USD')
    .map((rate) => sanitizeRate(rate))

  if (safeRates.length === 0) {
    throw createError({ statusCode: 400, message: 'No valid shipping rates were found for this address.' })
  }

  // Store the Shippo IDs and set status to quoted
  const now = new Date().toISOString()
  try {
    await $fetch(`${strapiUrl}/api/orders/${orderId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: {
        data: {
          shippoAddressToId: addressToId,
          shippoShipmentId: shipment.object_id,
          shippingStatus: 'quoted',
          attestationsAcceptedAt: now,
          termsVersion: TERMS_VERSION,
          researchAttestationVersion: RESEARCH_ATTESTATION_VERSION,
          // Keep normalized address fields in case they changed
          shippingFirstName: normalizedAddress?.name?.split(' ')[0] || firstName,
          shippingLastName: normalizedAddress?.name?.split(' ').slice(1).join(' ') || lastName,
          shippingCity: normalizedAddress?.city || city,
          shippingState: normalizedAddress?.state || state,
          shippingPostalCode: normalizedAddress?.zip || postalCode,
          shippingCountry: normalizedAddress?.country || country,
        },
      },
    })
  } catch (err: any) {
    console.error('Failed to save shipping quote:', err?.message || err)
    throw createError({ statusCode: 502, message: 'Could not save shipping quote. Please try again.' })
  }

  return {
    ok: true,
    rates: safeRates,
    shippingStatus: 'quoted',
  }
})
