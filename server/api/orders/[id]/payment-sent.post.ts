/**
 * POST /api/orders/:id/payment-sent
 * Customer claim that a manual payment was sent. This is NOT proof of payment:
 * it never marks the order paid, never touches inventory, and never unlocks Shippo.
 */
import { type H3Event } from 'h3'
import { validateCheckoutSession } from '~/server/utils/checkout-session'
import {
  MANUAL_ORDER_FIELDS,
  getManualPaymentSetup,
  isManualPaymentOrder,
} from '~/server/utils/manual-payment'
import { sendManualPaymentClaimEmails } from '~/server/utils/manualPaymentEmails'
import { notifyOwnerPush } from '~/server/utils/ownerPush'
import { getEmailBrand } from '~/server/utils/storeSettings'
import { getManualPaymentMethodConfig, type ManualPaymentMethod } from '~/utils/storeSettings'

const CLAIMABLE_STATUSES = ['awaiting_manual_payment', 'manual_payment_rejected']

interface RequestBody {
  senderName?: string
  senderHandle?: string
  note?: string
  checkoutSessionToken?: string
}

function clean(value: unknown, maxLength: number): string {
  return String(value ?? '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .trim()
    .slice(0, maxLength)
}

export default defineEventHandler(async (event: H3Event) => {
  const config = useRuntimeConfig(event)
  const strapiUrl = config.public.strapiUrl as string
  const strapiToken = config.strapiToken as string
  const authHeaders: Record<string, string> = strapiToken
    ? { Authorization: `Bearer ${strapiToken}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' }

  const orderId = Number(getRouterParam(event, 'id'))
  const body = await readBody<RequestBody>(event)

  const senderName = clean(body?.senderName, 120)
  const senderHandle = clean(body?.senderHandle, 120)
  const note = clean(body?.note, 500)

  if (!senderName) {
    throw createError({ statusCode: 400, message: 'Enter the name on the account you paid from.' })
  }

  const { attributes: attrs } = await validateCheckoutSession(event, {
    orderId,
    token: (body?.checkoutSessionToken || '').trim() || undefined,
    requiredFields: MANUAL_ORDER_FIELDS,
    skipStatusGate: true,
  })

  if (!isManualPaymentOrder(attrs)) {
    throw createError({ statusCode: 400, message: 'This order does not use manual payment.' })
  }

  if (attrs.paymentStatus === 'payment_claimed_by_customer') {
    return { ok: true, paymentStatus: attrs.paymentStatus, alreadyClaimed: true }
  }

  if (!CLAIMABLE_STATUSES.includes(String(attrs.paymentStatus))) {
    throw createError({
      statusCode: 400,
      message: 'This order is no longer waiting on a payment claim.',
    })
  }

  const claimedAt = new Date().toISOString()

  try {
    await $fetch(`${strapiUrl}/api/orders/${orderId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: {
        data: {
          paymentStatus: 'payment_claimed_by_customer',
          customerPaymentClaimedAt: claimedAt,
          customerPaymentSenderName: senderName,
          customerPaymentSenderHandle: senderHandle,
          customerPaymentNote: note,
        },
      },
    })
  } catch (err: any) {
    console.error('[manual-payment] claim failed:', err?.data || err?.message || err)
    throw createError({ statusCode: 502, message: 'Could not record your payment. Please try again.' })
  }

  const setup = await getManualPaymentSetup(event)
  const method = (attrs.manualPaymentMethod as ManualPaymentMethod) || setup.method || 'cashapp'
  const methodConfig = getManualPaymentMethodConfig(setup.settings, method)
  const orderLabel = attrs.orderNumber || `Order #${orderId}`

  void notifyOwnerPush({
    title: 'Payment needs verification',
    body: `Order ${orderLabel} ${methodConfig.label} payment claimed.`,
    url: `/admin/orders/${orderId}`,
    tag: `order-${orderId}-manual-claim`,
  })

  await sendManualPaymentClaimEmails(
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
      senderName,
      senderHandle,
      note,
      claimedAt,
    },
    {
      smtpHost: config.smtpHost as string,
      smtpPort: config.smtpPort as string,
      smtpUser: config.smtpUser as string,
      smtpPass: config.smtpPass as string,
      orderFromEmail: config.orderFromEmail as string,
      ownerOrderEmail: config.ownerOrderEmail as string,
      brand: await getEmailBrand(event),
    }
  )

  return {
    ok: true,
    paymentStatus: 'payment_claimed_by_customer',
    customerPaymentClaimedAt: claimedAt,
  }
})
