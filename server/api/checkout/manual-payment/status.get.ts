/**
 * GET /api/checkout/manual-payment/status?orderId=123
 * Session-scoped manual payment state for the customer instructions/status page.
 */
import { type H3Event } from 'h3'
import { validateCheckoutSession } from '~/server/utils/checkout-session'
import {
  MANUAL_ORDER_FIELDS,
  getManualPaymentSetup,
  isManualPaymentOrder,
  toPublicManualPaymentConfig,
} from '~/server/utils/manual-payment'
import { getManualPaymentMethodConfig, type ManualPaymentMethod } from '~/utils/storeSettings'

export default defineEventHandler(async (event: H3Event) => {
  const query = getQuery(event)
  const orderId = Number(query.orderId)
  const token = String(query.checkoutSessionToken || '').trim()

  const { attributes: attrs } = await validateCheckoutSession(event, {
    orderId,
    token: token || undefined,
    requiredFields: MANUAL_ORDER_FIELDS,
    skipStatusGate: true,
  })

  if (!isManualPaymentOrder(attrs)) {
    throw createError({ statusCode: 400, message: 'This order does not use manual payment.' })
  }

  const setup = await getManualPaymentSetup(event)
  const method = (attrs.manualPaymentMethod as ManualPaymentMethod) || setup.method || 'cashapp'
  const methodConfig = getManualPaymentMethodConfig(setup.settings, method)

  return {
    ok: true,
    order: {
      id: orderId,
      orderNumber: attrs.orderNumber,
      customerName: attrs.customerName || '',
      email: attrs.email || '',
      paymentStatus: attrs.paymentStatus,
      status: attrs.status,
      manualPaymentMethod: method,
      totalCents: Number(attrs.totalCents) || 0,
      subtotalCents: Number(attrs.subtotalCents) || 0,
      shippingCostCents: Number(attrs.shippingCostCents) || 0,
      taxCents: Number(attrs.taxCents) || 0,
      currency: attrs.currency || 'USD',
      manualPaymentExpiresAt: attrs.manualPaymentExpiresAt || null,
      customerPaymentClaimedAt: attrs.customerPaymentClaimedAt || null,
      manualPaymentRejectionReason: attrs.manualPaymentRejectionReason || null,
      paidAt: attrs.paidAt || null,
    },
    payment: toPublicManualPaymentConfig(methodConfig),
  }
})
