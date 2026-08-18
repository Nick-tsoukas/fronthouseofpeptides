import { type H3Event } from 'h3'
import { validateCheckoutSession } from '~/server/utils/checkout-session'
import {
  getMoovConfig,
  getAccountPaymentMethods,
  getPaymentMethod,
  findMoovWalletPaymentMethod,
  isCardPaymentMethodAvailable,
  getMoovTransfer,
  createMoovTransfer,
  mapMoovTransferToPaymentStatus,
  extractCardDetailsStatus,
  safeLog,
} from '~/server/utils/moov'
import { applyVerifiedTransferToOrder } from '~/server/utils/moov-reconcile'
import {
  resolveShippoConfig,
  shippoFetch,
  sanitizeRate,
  type ShippoShipment,
  type ShippoRate,
} from '~/server/utils/shippo'
import { checkoutTrace, strapiHostname } from '~/server/utils/checkout-trace'

interface RequestBody {
  orderId?: number
  checkoutSessionToken?: string
}

function toCents(dollars: number): number {
  return Math.round(Number(dollars) * 100)
}

export default defineEventHandler(async (event: H3Event) => {
  const config = useRuntimeConfig(event)
  const strapiUrl = config.public.strapiUrl as string
  const strapiToken = config.strapiToken as string
  const strapiHost = strapiHostname(strapiUrl)

  const authHeaders: Record<string, string> = strapiToken
    ? { Authorization: `Bearer ${strapiToken}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' }

  const moovConfig = getMoovConfig(event)
  if (!moovConfig.publicKey || !moovConfig.secretKey || !moovConfig.accountId) {
    throw createError({ statusCode: 500, message: 'Moov integration is not configured.' })
  }

  const body = await readBody<RequestBody>(event)
  const orderId = Number(body?.orderId)
  const checkoutSessionToken = (body?.checkoutSessionToken || '').trim()

  const { attributes: attrs } = await validateCheckoutSession(event, {
    orderId,
    token: checkoutSessionToken || undefined,
    skipStatusGate: true,
    requiredFields: [
      'orderNumber',
      'status',
      'paymentStatus',
      'shippingStatus',
      'shippoShipmentId',
      'shippoRateId',
      'subtotalCents',
      'shippingCostCents',
      'taxCents',
      'discountCents',
      'totalCents',
      'moovCustomerAccountId',
      'moovCardId',
      'moovPaymentMethodId',
      'moovTransferId',
      'idempotencyKey',
    ],
  })

  checkoutTrace('create-transfer:start', {
    orderId,
    orderNumber: attrs.orderNumber,
    strapiHost,
    paymentStatus: attrs.paymentStatus,
    shippingStatus: attrs.shippingStatus,
    hasMoovCardId: Boolean(attrs.moovCardId),
    hasMoovPaymentMethodId: Boolean(attrs.moovPaymentMethodId),
    hasMoovTransferId: Boolean(attrs.moovTransferId),
  })

  if (!attrs || attrs.status === 'cancelled') {
    throw createError({ statusCode: 400, message: 'Order is not available for payment.' })
  }

  if (attrs.paymentStatus === 'paid') {
    throw createError({ statusCode: 400, message: 'Order is already paid.' })
  }

  if (attrs.status !== 'awaiting_payment') {
    throw createError({ statusCode: 400, message: 'Order is not available for payment.' })
  }

  // pending = first charge; processing = idempotent resume; failed = retryable
  if (!['pending', 'processing', 'failed'].includes(attrs.paymentStatus)) {
    throw createError({ statusCode: 400, message: 'Order is not available for payment.' })
  }

  if (attrs.shippingStatus !== 'selected') {
    throw createError({ statusCode: 400, message: 'Shipping must be selected before payment.' })
  }

  if (!attrs.shippoRateId) {
    throw createError({ statusCode: 400, message: 'Selected shipping rate is missing.' })
  }

  if (attrs.shippingCostCents == null) {
    throw createError({ statusCode: 400, message: 'Shipping cost is missing.' })
  }

  if (!attrs.moovCustomerAccountId) {
    throw createError({ statusCode: 400, message: 'Payment account is missing.' })
  }

  if (!attrs.moovCardId) {
    throw createError({ statusCode: 400, message: 'Verified card is missing.' })
  }

  if (!attrs.moovPaymentMethodId) {
    throw createError({ statusCode: 400, message: 'Card payment method is missing.' })
  }

  const storedTotalCents = Number(attrs.totalCents)
  if (!Number.isFinite(storedTotalCents) || storedTotalCents <= 0) {
    throw createError({ statusCode: 400, message: 'Order total is missing or invalid.' })
  }

  // Idempotent path: existing non-failed transfer — retrieve instead of creating another
  if (attrs.moovTransferId && attrs.paymentStatus !== 'failed') {
    try {
      await getMoovTransfer(moovConfig, attrs.moovTransferId)
    } catch (err: any) {
      console.error('Moov existing transfer lookup failed:', err?.message || err)
      throw createError({ statusCode: 502, message: 'Could not retrieve existing payment. Please try again.' })
    }

    safeLog('Moov transfer already exists (idempotent)', {
      orderId,
      orderNumber: attrs.orderNumber,
      strapiHost,
      transferId: attrs.moovTransferId,
      paymentStatus: attrs.paymentStatus,
    })

    return {
      ok: true,
      orderNumber: attrs.orderNumber,
      paymentStatus: attrs.paymentStatus === 'pending' ? 'processing' : attrs.paymentStatus,
      transferCreated: false,
    }
  }

  // Recalculate product subtotal from current Strapi Product/Variant data
  let orderItems: any[] = []
  try {
    const itemsResponse = await $fetch<{ data: any[] }>(
      `${strapiUrl}/api/order-items?filters[order][id][$eq]=${orderId}&populate[variant][populate]=product&pagination[pageSize]=100`,
      { headers: authHeaders }
    )
    orderItems = itemsResponse.data || []
  } catch (err: any) {
    console.error('Order items load failed:', err?.message || err)
    throw createError({ statusCode: 502, message: 'Could not load order items. Please try again.' })
  }

  if (!orderItems.length) {
    throw createError({ statusCode: 400, message: 'Order has no line items.' })
  }

  let subtotalCents = 0
  for (const item of orderItems) {
    const itemAttrs = item.attributes || {}
    const quantity = Number(itemAttrs.quantity) || 0
    const variant = itemAttrs.variant?.data
    if (!variant) {
      throw createError({ statusCode: 400, message: 'A line item is missing its product variant.' })
    }

    const product = variant.attributes?.product?.data
    if (!product?.attributes?.active || !variant.attributes?.active) {
      throw createError({ statusCode: 400, message: 'One or more items are no longer available.' })
    }

    const unitPrice = Number(variant.attributes?.price)
    if (!unitPrice || unitPrice <= 0) {
      throw createError({ statusCode: 400, message: 'One or more items have an invalid price.' })
    }

    subtotalCents += toCents(unitPrice) * quantity
  }

  // Verify shipping amount from selected Shippo rate when shipment data is available.
  // Soft-fail: expired Shippo shipments must not block Moov charge if cents are already stored.
  let shippingCostCents = Number(attrs.shippingCostCents) || 0
  if (attrs.shippoShipmentId && attrs.shippoRateId) {
    const shippoConfig = await resolveShippoConfig(event)
    if (shippoConfig.apiToken) {
      try {
        const shipment = await shippoFetch<ShippoShipment>(
          shippoConfig,
          `/shipments/${attrs.shippoShipmentId}/`
        )
        const rates: ShippoRate[] = shipment.rates || []
        const selectedRate = rates.find((r) => r.object_id === attrs.shippoRateId)
        if (selectedRate && selectedRate.currency === 'USD') {
          const safeRate = sanitizeRate(selectedRate)
          if (safeRate.amountCents !== Number(attrs.shippingCostCents)) {
            throw createError({
              statusCode: 400,
              message: 'Shipping cost changed. Return to checkout and select a shipping rate again.',
            })
          }
          shippingCostCents = safeRate.amountCents
        } else {
          checkoutTrace('create-transfer:shippo-rate-unavailable', {
            orderId,
            orderNumber: attrs.orderNumber,
            strapiHost,
            paymentStatus: attrs.paymentStatus,
          })
        }
      } catch (err: any) {
        if (err?.statusCode === 400) throw err
        console.error('Shippo rate verification skipped:', err?.message || err)
        checkoutTrace('create-transfer:shippo-verify-skipped', {
          orderId,
          orderNumber: attrs.orderNumber,
          strapiHost,
        })
      }
    }
  }

  const taxCents = Number(attrs.taxCents) || 0
  const discountCents = Number(attrs.discountCents) || 0
  const totalCents = subtotalCents + shippingCostCents + taxCents - discountCents

  if (subtotalCents !== Number(attrs.subtotalCents)) {
    throw createError({
      statusCode: 400,
      message: 'Order totals changed. Return to checkout and try again.',
    })
  }

  if (totalCents !== storedTotalCents) {
    throw createError({
      statusCode: 400,
      message: 'Order total mismatch. Return to checkout and try again.',
    })
  }

  // Verify customer card-payment method
  let customerPaymentMethod: any
  try {
    customerPaymentMethod = await getPaymentMethod(
      moovConfig,
      attrs.moovCustomerAccountId,
      attrs.moovPaymentMethodId
    )
  } catch (err: any) {
    console.error('Moov customer payment method lookup failed:', err?.message || err)
    throw createError({ statusCode: 502, message: 'Could not verify card payment method.' })
  }

  if (!customerPaymentMethod) {
    throw createError({ statusCode: 400, message: 'Card payment method was not found.' })
  }

  if (
    customerPaymentMethod.paymentMethodID !== attrs.moovPaymentMethodId &&
    customerPaymentMethod.paymentMethodId !== attrs.moovPaymentMethodId
  ) {
    throw createError({ statusCode: 400, message: 'Payment method does not match this order.' })
  }

  if (!isCardPaymentMethodAvailable(customerPaymentMethod)) {
    throw createError({ statusCode: 400, message: 'Card payment method is not available for payment.' })
  }

  // Merchant moov-wallet destination
  let merchantMethods: any[] = []
  try {
    merchantMethods = await getAccountPaymentMethods(moovConfig, moovConfig.accountId)
  } catch (err: any) {
    console.error('Moov merchant payment methods failed:', err?.message || err)
    throw createError({ statusCode: 502, message: 'Could not load merchant payment methods.' })
  }

  const merchantWallet = findMoovWalletPaymentMethod(merchantMethods)
  if (!merchantWallet?.paymentMethodID) {
    throw createError({ statusCode: 500, message: 'Merchant wallet payment method is not available.' })
  }

  const baseIdempotency = attrs.idempotencyKey || `transfer-${attrs.orderNumber || orderId}`
  const idempotencyKey =
    attrs.paymentStatus === 'failed'
      ? `${baseIdempotency}-retry-${Date.now()}`
      : baseIdempotency

  let transfer: any
  try {
    transfer = await createMoovTransfer(
      moovConfig,
      {
        sourcePaymentMethodId: attrs.moovPaymentMethodId,
        destinationPaymentMethodId: merchantWallet.paymentMethodID,
        amountCents: totalCents,
        description: String(attrs.orderNumber || orderId),
        metadata: {
          orderId: String(orderId),
          orderNumber: String(attrs.orderNumber || ''),
        },
      },
      idempotencyKey
    )
  } catch (err: any) {
    const safeDetail = err?.safeDetail || ''
    console.error('Moov create transfer failed:', err?.message || err)
    checkoutTrace('create-transfer:moov-failed', {
      orderId,
      orderNumber: attrs.orderNumber,
      strapiHost,
      paymentStatus: attrs.paymentStatus,
      moovStatus: err?.status || null,
      hasSafeDetail: Boolean(safeDetail),
    })
    throw createError({
      statusCode: 502,
      message: safeDetail
        ? `Payment provider rejected the transfer: ${safeDetail}`
        : 'Could not submit payment. Please try again.',
    })
  }

  const transferId = transfer?.transferID || transfer?.transferId
  if (!transferId) {
    throw createError({ statusCode: 502, message: 'Payment provider did not return a transfer ID.' })
  }

  const transferStatus = String(transfer?.status || '').toLowerCase()
  const cardDetailsStatus = extractCardDetailsStatus(transfer)
  const mappedFromCreate = mapMoovTransferToPaymentStatus(transferStatus, cardDetailsStatus)

  const now = new Date().toISOString()
  const orderUpdate: Record<string, any> = {
    moovTransferId: transferId,
    paymentStatus: 'processing',
    paymentProvider: 'moov',
    paymentMethod: 'card',
    paymentInitiatedAt: now,
  }

  try {
    await $fetch(`${strapiUrl}/api/orders/${orderId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: { data: orderUpdate },
    })
  } catch (err: any) {
    // paymentInitiatedAt may be missing until Strapi schema is redeployed
    console.error('Failed to save Moov transfer (with paymentInitiatedAt):', err?.message || err)
    try {
      const { paymentInitiatedAt: _ignored, ...fallback } = orderUpdate
      await $fetch(`${strapiUrl}/api/orders/${orderId}`, {
        method: 'PUT',
        headers: authHeaders,
        body: { data: fallback },
      })
    } catch (err2: any) {
      console.error('Failed to save Moov transfer on order:', err2?.message || err2)
      throw createError({
        statusCode: 502,
        message: 'Payment started but order could not be updated. Contact support with your order number.',
      })
    }
  }

  // If X-Wait-For already returned a confirmed card auth (or completed transfer),
  // finalize immediately — do not leave the order stuck on processing for settlement.
  let paymentStatus = 'processing'
  if (mappedFromCreate === 'paid' || mappedFromCreate === 'failed') {
    try {
      const applied = await applyVerifiedTransferToOrder({
        event,
        strapiUrl,
        authHeaders,
        orderId,
        attrs: {
          ...attrs,
          moovTransferId: transferId,
          paymentStatus: 'processing',
        },
        mappedPaymentStatus: mappedFromCreate,
        sendEmailsOnPaid: true,
      })
      paymentStatus = applied.paymentStatus
    } catch (err: any) {
      console.error('Immediate Moov finalize after create failed:', err?.message || err)
      // Keep processing; status poll / webhook can still reconcile.
      paymentStatus = 'processing'
    }
  }

  checkoutTrace('create-transfer:created', {
    orderId,
    orderNumber: attrs.orderNumber,
    strapiHost,
    paymentStatus,
    transferStatus: transferStatus || null,
    cardDetailsStatus: cardDetailsStatus || null,
    hasMoovCardId: true,
    hasMoovPaymentMethodId: true,
    hasMoovTransferId: true,
  })

  safeLog('Moov transfer created', {
    orderId,
    orderNumber: attrs.orderNumber,
    strapiHost,
    transferId,
    paymentStatus,
    transferStatus: transferStatus || null,
    cardDetailsStatus: cardDetailsStatus || null,
  })

  return {
    ok: true,
    orderNumber: attrs.orderNumber,
    paymentStatus,
    transferCreated: true,
  }
})
