import { requireAdminAuth } from '~/server/utils/adminAuth'
import { getShippoConfig, purchaseShippoLabelFromRate, getShippoTransaction } from '~/server/utils/shippo'

function hasShippingAddress(attrs: Record<string, any>): boolean {
  const line1 = attrs.shippingAddressLine1 || attrs.shippingAddress1
  return Boolean(
    line1 &&
      attrs.shippingCity &&
      attrs.shippingState &&
      attrs.shippingPostalCode &&
      (attrs.shippingCountry || 'US')
  )
}

/**
 * POST /api/admin/orders/:id/buy-label
 * Purchase a Shippo label for a paid order using the previously selected rate.
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
  const orderId = entry.id

  // Idempotent: already have a successful label
  if (attrs.shippoTransactionId && attrs.shippingLabelUrl) {
    return {
      ok: true,
      orderNumber: attrs.orderNumber || null,
      shippingStatus: attrs.shippingStatus || 'label_purchased',
      shippoTransactionId: attrs.shippoTransactionId,
      shippingLabelUrl: attrs.shippingLabelUrl,
      trackingNumber: attrs.trackingNumber || null,
      trackingUrl: attrs.trackingUrl || null,
      alreadyPurchased: true,
    }
  }

  // If transaction exists but label URL missing, try to refresh from Shippo
  if (attrs.shippoTransactionId && !attrs.shippingLabelUrl) {
    const shippoConfig = getShippoConfig(event)
    if (shippoConfig.apiToken) {
      try {
        const existing = await getShippoTransaction(shippoConfig, attrs.shippoTransactionId)
        const status = String(existing.status || '').toUpperCase()
        if (status === 'SUCCESS' && existing.label_url) {
          const patch = {
            shippingLabelUrl: existing.label_url,
            trackingNumber: existing.tracking_number || attrs.trackingNumber || null,
            trackingUrl: existing.tracking_url_provider || attrs.trackingUrl || null,
            shippingStatus: 'label_purchased',
            labelPurchasedAt: attrs.labelPurchasedAt || new Date().toISOString(),
            labelErrorMessage: null,
          }
          await $fetch(`${strapiUrl}/api/orders/${orderId}`, {
            method: 'PUT',
            headers,
            body: { data: patch },
          })
          return {
            ok: true,
            orderNumber: attrs.orderNumber || null,
            shippingStatus: 'label_purchased',
            shippoTransactionId: attrs.shippoTransactionId,
            shippingLabelUrl: existing.label_url,
            trackingNumber: patch.trackingNumber,
            trackingUrl: patch.trackingUrl,
            alreadyPurchased: true,
          }
        }
        if (status === 'WAITING' || status === 'QUEUED') {
          return {
            ok: true,
            orderNumber: attrs.orderNumber || null,
            shippingStatus: 'label_purchasing',
            shippoTransactionId: attrs.shippoTransactionId,
            shippingLabelUrl: null,
            trackingNumber: attrs.trackingNumber || null,
            trackingUrl: attrs.trackingUrl || null,
            message: 'Label is being generated. Check again shortly.',
          }
        }
      } catch (err: any) {
        console.error('Shippo transaction refresh failed:', err?.message || err)
      }
    }
  }

  if (attrs.paymentStatus !== 'paid') {
    throw createError({
      statusCode: 400,
      message: 'Label can be purchased after payment is confirmed.',
    })
  }

  if (attrs.status === 'cancelled' || attrs.paymentStatus === 'refunded' || attrs.paymentStatus === 'cancelled') {
    throw createError({ statusCode: 400, message: 'Cannot buy a label for a cancelled or refunded order.' })
  }

  if (!attrs.shippoRateId) {
    throw createError({ statusCode: 400, message: 'No Shippo rate is selected for this order.' })
  }

  if (!hasShippingAddress(attrs)) {
    throw createError({ statusCode: 400, message: 'Shipping address is incomplete.' })
  }

  const allowedStatuses = ['selected', 'ready_to_ship', 'label_failed']
  if (!allowedStatuses.includes(attrs.shippingStatus)) {
    throw createError({
      statusCode: 400,
      message: `Cannot buy a label when shipping status is "${attrs.shippingStatus}".`,
    })
  }

  const shippoConfig = getShippoConfig(event)
  if (!shippoConfig.apiToken) {
    throw createError({ statusCode: 500, message: 'Shippo is not configured.' })
  }

  // Mark purchasing before Shippo call
  await $fetch(`${strapiUrl}/api/orders/${orderId}`, {
    method: 'PUT',
    headers,
    body: { data: { shippingStatus: 'label_purchasing', labelErrorMessage: null } },
  }).catch(() => {
    // continue — purchasing status is best-effort
  })

  let result
  try {
    result = await purchaseShippoLabelFromRate(shippoConfig, attrs.shippoRateId, {
      labelFileType: 'PDF_4x6',
      async: false,
    })
  } catch (err: any) {
    console.error('Shippo label purchase failed:', err?.message || err)
    const safeMsg = String(err?.message || 'Label purchase failed.')
      .replace(/ShippoToken\s+\S+/gi, '[redacted]')
      .slice(0, 400)

    await $fetch(`${strapiUrl}/api/orders/${orderId}`, {
      method: 'PUT',
      headers,
      body: {
        data: {
          shippingStatus: 'label_failed',
          labelErrorMessage: safeMsg,
        },
      },
    }).catch(() => {})

    throw createError({
      statusCode: 502,
      message: 'Label purchase failed. Review the address, package details, and Shippo error.',
    })
  }

  const status = String(result.status || '').toUpperCase()

  if (status === 'SUCCESS') {
    const patch = {
      shippoTransactionId: result.transactionId,
      shippingLabelUrl: result.labelUrl,
      trackingNumber: result.trackingNumber,
      trackingUrl: result.trackingUrl,
      labelCostCents: result.labelCostCents,
      labelPurchasedAt: new Date().toISOString(),
      shippingStatus: 'label_purchased',
      labelErrorMessage: null,
    }
    await $fetch(`${strapiUrl}/api/orders/${orderId}`, {
      method: 'PUT',
      headers,
      body: { data: patch },
    })

    return {
      ok: true,
      orderNumber: attrs.orderNumber || null,
      shippingStatus: 'label_purchased',
      shippoTransactionId: result.transactionId,
      shippingLabelUrl: result.labelUrl,
      trackingNumber: result.trackingNumber,
      trackingUrl: result.trackingUrl,
    }
  }

  if (status === 'WAITING' || status === 'QUEUED') {
    await $fetch(`${strapiUrl}/api/orders/${orderId}`, {
      method: 'PUT',
      headers,
      body: {
        data: {
          shippoTransactionId: result.transactionId,
          shippingStatus: 'label_purchasing',
          labelErrorMessage: null,
        },
      },
    })

    return {
      ok: true,
      orderNumber: attrs.orderNumber || null,
      shippingStatus: 'label_purchasing',
      shippoTransactionId: result.transactionId,
      shippingLabelUrl: null,
      trackingNumber: null,
      trackingUrl: null,
      message: 'Label is being generated. Check again shortly.',
    }
  }

  // ERROR or unknown
  await $fetch(`${strapiUrl}/api/orders/${orderId}`, {
    method: 'PUT',
    headers,
    body: {
      data: {
        shippoTransactionId: result.transactionId || attrs.shippoTransactionId || null,
        shippingStatus: 'label_failed',
        labelErrorMessage: result.errorMessage || 'Shippo returned an error creating the label.',
      },
    },
  })

  throw createError({
    statusCode: 502,
    message:
      result.errorMessage ||
      'Label purchase failed. Review the address, package details, and Shippo error.',
  })
})
