import type { H3Event } from 'h3'
import { hashToken } from '~/server/utils/moov'

const COOKIE_NAME = 'checkout_session'
const COOKIE_MAX_AGE_SECONDS = 15 * 60 // 15 minutes

function isProduction(event: H3Event): boolean {
  const config = useRuntimeConfig(event)
  return (config.nodeEnv || process.env.NODE_ENV) === 'production'
}

export function setCheckoutSessionCookie(event: H3Event, token: string): void {
  setCookie(event, COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction(event),
    sameSite: 'strict',
    path: '/api',
    maxAge: COOKIE_MAX_AGE_SECONDS,
  })
}

export function clearCheckoutSessionCookie(event: H3Event): void {
  deleteCookie(event, COOKIE_NAME, { path: '/api' })
}

export function getCheckoutSessionTokenFromCookie(event: H3Event): string | undefined {
  return getCookie(event, COOKIE_NAME)
}

export interface ValidatedCheckoutOrder {
  orderId: number
  attributes: Record<string, any>
}

export async function validateCheckoutSession(
  event: H3Event,
  opts: {
    token?: string
    orderId?: number
    requiredFields?: string[]
    allowedOrderStatuses?: string[]
    allowedPaymentStatuses?: string[]
    skipStatusGate?: boolean
  } = {}
): Promise<ValidatedCheckoutOrder> {
  const config = useRuntimeConfig(event)
  const strapiUrl = config.public.strapiUrl as string
  const strapiToken = config.strapiToken as string

  const authHeaders: Record<string, string> = strapiToken
    ? { Authorization: `Bearer ${strapiToken}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' }

  const token = (opts.token || getCheckoutSessionTokenFromCookie(event))?.trim()
  if (!token) {
    throw createError({ statusCode: 401, message: 'Checkout session is missing.' })
  }

  const orderId = Number(opts.orderId)
  if (!Number.isInteger(orderId) || orderId <= 0) {
    throw createError({ statusCode: 400, message: 'Order ID is required.' })
  }

  const tokenHash = hashToken(token)

  // Merge uniquely — duplicate fields[i] indices make Strapi return 500.
  const fields = Array.from(
    new Set([
      'orderNumber',
      'status',
      'paymentStatus',
      'checkoutSessionTokenHash',
      ...(opts.requiredFields || []),
    ])
  )
  const fieldsParam = fields
    .map((f, i) => `fields[${i}]=${encodeURIComponent(f)}`)
    .join('&')

  let order: any
  try {
    const orderResponse = await $fetch<{ data: any }>(
      `${strapiUrl}/api/orders/${orderId}?${fieldsParam}`,
      { headers: authHeaders }
    )
    order = orderResponse.data
  } catch (err: any) {
    console.error('Order load failed:', err?.data || err?.message || err)
    throw createError({ statusCode: 502, message: 'Could not load order. Please try again.' })
  }

  if (!order) {
    throw createError({ statusCode: 404, message: 'Order not found.' })
  }

  const attrs = order.attributes || {}

  if (attrs.checkoutSessionTokenHash !== tokenHash) {
    throw createError({ statusCode: 401, message: 'Invalid checkout session.' })
  }

  if (!opts.skipStatusGate) {
    const allowedOrderStatuses = opts.allowedOrderStatuses || ['awaiting_payment']
    const allowedPaymentStatuses = opts.allowedPaymentStatuses || ['pending']

    if (!allowedOrderStatuses.includes(attrs.status) || !allowedPaymentStatuses.includes(attrs.paymentStatus)) {
      throw createError({ statusCode: 400, message: 'Order is not available for checkout.' })
    }
  }

  return { orderId, attributes: attrs }
}
