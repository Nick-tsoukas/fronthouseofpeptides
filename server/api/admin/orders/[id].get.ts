import { requireAdminAuth } from '~/server/utils/adminAuth'
import { loadOrderStockLines } from '~/server/utils/finalizePaidOrder'

function centsOrFallback(cents: unknown, dollars: unknown) {
  const c = Number(cents)
  if (Number.isFinite(c) && c >= 0) return c
  const d = Number(dollars)
  if (Number.isFinite(d) && d >= 0) return Math.round(d * 100)
  return 0
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  requireAdminAuth(event, config.ownerSessionSecret as string)

  const id = getRouterParam(event, 'id')
  if (!id || isNaN(Number(id))) {
    throw createError({ statusCode: 400, message: 'Invalid order ID.' })
  }

  const strapiUrl = config.public.strapiUrl as string
  const strapiToken = config.strapiToken as string
  const authHeaders: Record<string, string> = {
    Authorization: `Bearer ${strapiToken}`,
    'Content-Type': 'application/json',
  }

  const params = new URLSearchParams()
  params.set('populate[orderItems][populate][variant]', 'true')

  const response = await $fetch<{ data: any }>(
    `${strapiUrl}/api/orders/${id}?${params.toString()}`,
    { headers: authHeaders }
  ).catch(() => {
    throw createError({ statusCode: 404, message: 'Order not found.' })
  })

  const entry = response.data
  if (!entry) throw createError({ statusCode: 404, message: 'Order not found.' })

  const a = entry.attributes || {}
  const stockLines = await loadOrderStockLines(strapiUrl, authHeaders, entry.id, a)
  const stockByVariant = new Map(
    stockLines
      .filter((l) => l.variantId != null)
      .map((l) => [l.variantId as number, l])
  )

  return {
    ok: true,
    id: entry.id,
    orderNumber: a.orderNumber || null,
    customerName: a.customerName || a.shippingName || null,
    email: a.email || null,
    phone: a.phone || a.shippingPhone || null,
    companyName: a.companyName || null,
    status: a.status || null,
    paymentStatus: a.paymentStatus || null,
    shippingStatus: a.shippingStatus || null,
    paymentProvider: a.paymentProvider || null,
    paymentMethod: a.paymentMethod || null,
    moovTransferId: a.moovTransferId || null,
    inventoryCommitted: Boolean(a.inventoryCommitted),
    inventoryAdjusted: Boolean(a.inventoryAdjusted),
    createdAt: a.createdAt || null,
    paidAt: a.paidAt || null,
    paymentFinalizingAt: a.paymentFinalizingAt || null,
    paidReceiptSentAt: a.paidReceiptSentAt || null,
    manualPaymentClaimedAt: a.manualPaymentClaimedAt || null,
    manualPaymentClaimedSenderName: a.manualPaymentClaimedSenderName || null,
    manualPaymentClaimedHandle: a.manualPaymentClaimedHandle || null,
    manualPaymentClaimedNote: a.manualPaymentClaimedNote || null,
    manualPaymentRejectedAt: a.manualPaymentRejectedAt || null,
    manualPaymentRejectionReason: a.manualPaymentRejectionReason || null,
    manualPaymentExpiresAt: a.manualPaymentExpiresAt || null,
    shippingName: a.shippingName || null,
    shippingAddressLine1: a.shippingAddressLine1 || a.shippingAddress1 || null,
    shippingAddressLine2: a.shippingAddressLine2 || a.shippingAddress2 || null,
    shippingCity: a.shippingCity || null,
    shippingState: a.shippingState || null,
    shippingPostalCode: a.shippingPostalCode || null,
    shippingCountry: a.shippingCountry || null,
    shippingCarrier: a.shippingCarrier || null,
    shippingService: a.shippingService || null,
    shippoRateId: a.shippoRateId || null,
    shippoShipmentId: a.shippoShipmentId || null,
    shippoTransactionId: a.shippoTransactionId || null,
    shippingLabelUrl: a.shippingLabelUrl || null,
    trackingNumber: a.trackingNumber || null,
    trackingUrl: a.trackingUrl || null,
    labelCostCents: a.labelCostCents ?? null,
    labelPurchasedAt: a.labelPurchasedAt || null,
    trackingEmailSentAt: a.trackingEmailSentAt || null,
    shippedAt: a.shippedAt || null,
    fulfillmentMethod: a.fulfillmentMethod || null,
    manualTrackingAddedAt: a.manualTrackingAddedAt || null,
    labelErrorMessage: a.labelErrorMessage || null,
    subtotalCents: centsOrFallback(a.subtotalCents, a.amountSubtotal),
    shippingCostCents: centsOrFallback(a.shippingCostCents ?? a.shippingCents, a.shippingAmount),
    taxCents: Number(a.taxCents) || 0,
    discountCents: Number(a.discountCents) || 0,
    totalCents: centsOrFallback(a.totalCents, a.amountTotal),
    customerNotes: a.customerNotes || null,
    ownerNotes: a.ownerNotes || null,
    stockLines,
    items: (a.orderItems?.data || []).map((item: any) => {
      const ia = item.attributes || {}
      const variantId = ia.variant?.data?.id || null
      const stock =
        (variantId != null ? stockByVariant.get(variantId) : null) ||
        stockLines.find(
          (l) =>
            l.productName === (ia.productNameSnapshot || '') &&
            l.variantName === (ia.variantNameSnapshot || '') &&
            l.orderedQty === (Number(ia.quantity) || 0)
        )
      return {
        id: item.id,
        productName: ia.productNameSnapshot || '',
        variantName: ia.variantNameSnapshot || '',
        sku: ia.skuSnapshot || '',
        quantity: ia.quantity || 0,
        unitPrice: Number(ia.unitPriceSnapshot) || 0,
        currentStock: stock?.currentStock ?? null,
        insufficient: Boolean(stock?.insufficient),
      }
    }),
  }
})
