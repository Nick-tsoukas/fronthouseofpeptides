import { type H3Event } from 'h3'
import { safeLog } from '~/server/utils/moov'
import { setCheckoutSessionCookie, validateCheckoutSession } from '~/server/utils/checkout-session'

interface RequestBody {
  orderId?: number
  checkoutSessionToken?: string
}

export default defineEventHandler(async (event: H3Event) => {
  const body = await readBody<RequestBody>(event)
  const orderId = Number(body?.orderId)
  const checkoutSessionToken = (body?.checkoutSessionToken || '').trim()

  if (!Number.isInteger(orderId) || orderId <= 0) {
    throw createError({ statusCode: 400, message: 'Invalid order ID.' })
  }
  if (!checkoutSessionToken) {
    throw createError({ statusCode: 400, message: 'Checkout session token is required.' })
  }

  const { attributes: attrs } = await validateCheckoutSession(event, {
    orderId,
    token: checkoutSessionToken,
    requiredFields: [
      'orderNumber',
      'customerName',
      'email',
      'subtotalCents',
      'shippingCents',
      'taxCents',
      'totalCents',
      'shippingStatus',
    ],
  })

  setCheckoutSessionCookie(event, checkoutSessionToken)

  safeLog('Checkout session cookie set', { orderId, shippingStatus: attrs.shippingStatus })

  return {
    ok: true,
    orderId,
    orderNumber: attrs.orderNumber,
    customerName: attrs.customerName,
    email: attrs.email,
    subtotalCents: attrs.subtotalCents,
    shippingCents: attrs.shippingCents,
    taxCents: attrs.taxCents,
    totalCents: attrs.totalCents,
    paymentStatus: attrs.paymentStatus,
    shippingStatus: attrs.shippingStatus || 'not_quoted',
  }
})
