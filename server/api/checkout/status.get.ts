import { type H3Event } from 'h3'
import { validateCheckoutSession } from '~/server/utils/checkout-session'
import { reconcileProcessingOrder } from '~/server/utils/moov-reconcile'

export default defineEventHandler(async (event: H3Event) => {
  const config = useRuntimeConfig(event)
  const strapiUrl = config.public.strapiUrl as string
  const strapiToken = config.strapiToken as string

  const authHeaders: Record<string, string> = strapiToken
    ? { Authorization: `Bearer ${strapiToken}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' }

  const query = getQuery(event)
  const orderId = Number(query.orderId)

  const { orderId: validatedOrderId, attributes: attrs } = await validateCheckoutSession(event, {
    orderId,
    skipStatusGate: true,
    requiredFields: [
      'orderNumber',
      'paymentStatus',
      'shippingStatus',
      'subtotalCents',
      'shippingCostCents',
      'taxCents',
      'discountCents',
      'totalCents',
      'inventoryCommitted',
      'shippingCarrier',
      'shippingService',
      'trackingNumber',
      'trackingUrl',
      'paymentProvider',
      'paymentMethod',
      'moovTransferId',
      'moovPaymentMethodId',
      'paidAt',
      'customerName',
      'email',
      'phone',
      'companyName',
      'customerNotes',
      'ownerNotes',
      'shippingAddress1',
      'shippingAddress2',
      'shippingAddressLine1',
      'shippingAddressLine2',
      'shippingCity',
      'shippingState',
      'shippingPostalCode',
      'shippingCountry',
      'shippingCents',
      'currency',
    ],
  })

  let paymentStatus = attrs.paymentStatus || 'pending'
  let inventoryCommitted = Boolean(attrs.inventoryCommitted)
  let paidAt = attrs.paidAt || null

  // Backup reconciliation when webhook is delayed/missed
  if (paymentStatus === 'processing' && attrs.moovTransferId) {
    try {
      const reconciled = await reconcileProcessingOrder({
        event,
        orderId: validatedOrderId,
        attrs,
        strapiUrl,
        authHeaders,
      })
      paymentStatus = reconciled.paymentStatus
      inventoryCommitted = reconciled.inventoryCommitted
      paidAt = reconciled.paidAt
    } catch (err: any) {
      console.error('Checkout status reconcile failed:', err?.message || err)
    }
  }

  return {
    ok: true,
    orderId: validatedOrderId,
    orderNumber: attrs.orderNumber || null,
    paymentStatus,
    shippingStatus: attrs.shippingStatus || null,
    subtotalCents: Number(attrs.subtotalCents) || 0,
    shippingCostCents: Number(attrs.shippingCostCents) || 0,
    taxCents: Number(attrs.taxCents) || 0,
    discountCents: Number(attrs.discountCents) || 0,
    totalCents: Number(attrs.totalCents) || 0,
    shippingCarrier: attrs.shippingCarrier || null,
    shippingService: attrs.shippingService || null,
    trackingNumber: attrs.trackingNumber || null,
    trackingUrl: attrs.trackingUrl || null,
    paymentProvider: attrs.paymentProvider || null,
    paymentMethod: attrs.paymentMethod || null,
    inventoryCommitted,
    paidAt,
  }
})
