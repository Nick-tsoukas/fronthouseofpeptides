import { type H3Event } from 'h3'
import { validateCheckoutSession } from '~/server/utils/checkout-session'

export default defineEventHandler(async (event: H3Event) => {
  const query = getQuery(event)
  const orderId = Number(query.orderId)

  const { attributes: attrs } = await validateCheckoutSession(event, {
    orderId,
    skipStatusGate: true,
    requiredFields: [
      'orderNumber',
      'paymentStatus',
      'shippingStatus',
      'subtotalCents',
      'shippingCostCents',
      'taxCents',
      'totalCents',
      'inventoryCommitted',
      'shippingCarrier',
      'shippingService',
    ],
  })

  return {
    ok: true,
    orderNumber: attrs.orderNumber || null,
    paymentStatus: attrs.paymentStatus || 'pending',
    shippingStatus: attrs.shippingStatus || null,
    subtotalCents: Number(attrs.subtotalCents) || 0,
    shippingCostCents: Number(attrs.shippingCostCents) || 0,
    taxCents: Number(attrs.taxCents) || 0,
    totalCents: Number(attrs.totalCents) || 0,
    inventoryCommitted: Boolean(attrs.inventoryCommitted),
    shippingCarrier: attrs.shippingCarrier || null,
    shippingService: attrs.shippingService || null,
  }
})
