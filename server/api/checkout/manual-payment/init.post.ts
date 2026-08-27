/**
 * POST /api/checkout/manual-payment/init
 * Converts a prepared checkout order into a manual (Cash App / Zelle) payment order
 * and emails the payment instructions. Never marks the order paid.
 */
import { type H3Event } from 'h3'
import {
  getCheckoutSessionTokenFromCookie,
  setCheckoutSessionCookie,
  validateCheckoutSession,
} from '~/server/utils/checkout-session'
import {
  MANUAL_ORDER_FIELDS,
  getManualPaymentSetup,
  toPublicManualPaymentConfig,
} from '~/server/utils/manual-payment'
import { sendManualPaymentInstructionsEmail } from '~/server/utils/manualPaymentEmails'
import { getEmailBrand } from '~/server/utils/storeSettings'

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

  const body = await readBody<RequestBody>(event)
  const orderId = Number(body?.orderId)
  const token = (body?.checkoutSessionToken || '').trim()

  const setup = await getManualPaymentSetup(event)
  if (!setup.manualEnabled || !setup.method || !setup.config) {
    throw createError({ statusCode: 400, message: 'Manual payment is not enabled for this store.' })
  }
  if (!setup.config.configured) {
    throw createError({
      statusCode: 503,
      message: 'Payment instructions are not configured yet. Please contact us to complete your order.',
    })
  }

  const { attributes: attrs } = await validateCheckoutSession(event, {
    orderId,
    token: token || undefined,
    requiredFields: MANUAL_ORDER_FIELDS,
    allowedOrderStatuses: ['awaiting_payment', 'awaiting_manual_payment'],
    allowedPaymentStatuses: ['pending', 'awaiting_manual_payment', 'manual_payment_rejected'],
  })

  if (attrs.shippingStatus !== 'selected' || !(Number(attrs.totalCents) > 0)) {
    throw createError({ statusCode: 400, message: 'Select a shipping rate before payment.' })
  }

  const methodConfig = setup.config
  const now = new Date()
  const alreadyInitialized = attrs.paymentStatus === 'awaiting_manual_payment'

  if (!alreadyInitialized) {
    const expiresAt = new Date(now.getTime() + methodConfig.expirationHours * 3600 * 1000)
    try {
      await $fetch(`${strapiUrl}/api/orders/${orderId}`, {
        method: 'PUT',
        headers: authHeaders,
        body: {
          data: {
            paymentProvider: setup.method,
            manualPaymentMethod: setup.method,
            paymentMethod: 'external',
            paymentStatus: 'awaiting_manual_payment',
            status: 'awaiting_manual_payment',
            manualPaymentReference: attrs.orderNumber,
            manualPaymentInstructionsSentAt: now.toISOString(),
            manualPaymentExpiresAt: expiresAt.toISOString(),
            manualPaymentRejectedAt: null,
            manualPaymentRejectionReason: null,
          },
        },
      })
    } catch (err: any) {
      console.error('[manual-payment] init failed:', err?.data || err?.message || err)
      throw createError({ statusCode: 502, message: 'Could not start the payment. Please try again.' })
    }
  }

  // Manual payment takes longer than a card checkout — keep the session valid while the
  // customer switches to their payment app and comes back.
  const cookieToken = token || getCheckoutSessionTokenFromCookie(event)
  if (cookieToken) {
    setCheckoutSessionCookie(
      event,
      cookieToken,
      Math.min(Math.max(methodConfig.expirationHours, 1), 72) * 3600
    )
  }

  if (!alreadyInitialized) {
    await sendManualPaymentInstructionsEmail(
      {
        orderId,
        orderNumber: attrs.orderNumber,
        customerName: attrs.customerName || '',
        email: attrs.email || '',
        totalCents: Number(attrs.totalCents) || 0,
        methodLabel: methodConfig.label,
        handle: methodConfig.handle,
        recipientDisplayName: methodConfig.displayName,
        paymentUrl: methodConfig.paymentUrl,
        instructions: methodConfig.instructions,
        supportEmail: methodConfig.supportEmail,
        expirationHours: methodConfig.expirationHours,
      },
      {
        smtpHost: config.smtpHost as string,
        smtpPort: config.smtpPort as string,
        smtpUser: config.smtpUser as string,
        smtpPass: config.smtpPass as string,
        orderFromEmail: config.orderFromEmail as string,
        brand: await getEmailBrand(event),
      }
    )
  }

  return {
    ok: true,
    orderId,
    orderNumber: attrs.orderNumber,
    totalCents: Number(attrs.totalCents) || 0,
    paymentStatus: 'awaiting_manual_payment',
    payment: toPublicManualPaymentConfig(methodConfig),
  }
})
