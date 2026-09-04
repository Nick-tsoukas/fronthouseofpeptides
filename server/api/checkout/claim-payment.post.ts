import { validateCheckoutSession } from '~/server/utils/checkout-session'
import { fetchStoreSettings, getEmailBrand } from '~/server/utils/storeSettings'
import { notifyOwnerPush } from '~/server/utils/ownerPush'
import {
  sendPaymentClaimedCustomerEmail,
  sendPaymentClaimedOwnerEmail,
} from '~/server/utils/sendOrderEmails'
import { isCashAppManualOrder } from '~/server/utils/finalizePaidOrder'

/**
 * POST /api/checkout/claim-payment
 * Customer asserts they sent Cash App payment.
 * NEVER marks paid, NEVER decrements inventory, NEVER unlocks labels.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<{
    orderId?: number
    senderName?: string
    cashAppHandle?: string
    note?: string
  }>(event)

  const orderId = Number(body?.orderId)
  const { attributes: attrs } = await validateCheckoutSession(event, {
    orderId,
    requiredFields: [
      'paymentProvider',
      'paymentMethod',
      'paymentStatus',
      'totalCents',
      'amountTotal',
      'email',
      'customerName',
      'manualPaymentClaimedAt',
      'manualPaymentClaimedSenderName',
      'manualPaymentClaimedHandle',
      'manualPaymentClaimedNote',
    ],
    skipStatusGate: true,
  })

  if (!isCashAppManualOrder(attrs)) {
    throw createError({
      statusCode: 400,
      message: 'This order does not use Cash App manual payment.',
    })
  }

  const status = String(attrs.paymentStatus || '')
  if (status === 'paid') {
    return {
      ok: true,
      alreadyPaid: true,
      paymentStatus: 'paid',
      message: 'Payment was already verified for this order.',
    }
  }
  if (status === 'cancelled' || status === 'refunded') {
    throw createError({ statusCode: 400, message: `Cannot claim payment for a ${status} order.` })
  }

  const senderName = String(body?.senderName || '').trim().slice(0, 120)
  const cashAppHandle = String(body?.cashAppHandle || '').trim().slice(0, 80)
  const note = String(body?.note || '').trim().slice(0, 500)
  const now = new Date().toISOString()

  // Idempotent if already claimed/processing
  if (status === 'processing' && attrs.manualPaymentClaimedAt) {
    return {
      ok: true,
      alreadyClaimed: true,
      paymentStatus: 'processing',
      claimedAt: attrs.manualPaymentClaimedAt,
      message:
        'Your payment submission was already received and is awaiting verification.',
    }
  }

  if (!['pending', 'failed'].includes(status)) {
    throw createError({
      statusCode: 400,
      message: 'This order is not awaiting a Cash App payment claim.',
    })
  }

  const config = useRuntimeConfig(event)
  const strapiUrl = config.public.strapiUrl as string
  const strapiToken = config.strapiToken as string
  const authHeaders: Record<string, string> = strapiToken
    ? { Authorization: `Bearer ${strapiToken}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' }

  const claimPayloadFull = {
    paymentStatus: 'processing',
    manualPaymentClaimedAt: now,
    manualPaymentClaimedSenderName: senderName || null,
    manualPaymentClaimedHandle: cashAppHandle || null,
    manualPaymentClaimedNote: note || null,
    manualPaymentRejectedAt: null,
    manualPaymentRejectionReason: null,
  }

  try {
    await $fetch(`${strapiUrl}/api/orders/${orderId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: { data: claimPayloadFull },
    })
  } catch (err: any) {
    // Schema may not include manual claim fields yet — fall back to status-only update.
    console.warn('[claim-payment] full claim patch failed, retrying status-only:', err?.message || err)
    await $fetch(`${strapiUrl}/api/orders/${orderId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: {
        data: {
          paymentStatus: 'processing',
          ownerNotes: [
            attrs.ownerNotes,
            `Cash App claim ${now}: sender=${senderName || '—'}; handle=${cashAppHandle || '—'}; note=${note || '—'}`,
          ]
            .filter(Boolean)
            .join('\n'),
        },
      },
    })
  }

  const { settings } = await fetchStoreSettings(event)
  const brand = await getEmailBrand(event)
  const totalCents =
    Number(attrs.totalCents) >= 0
      ? Number(attrs.totalCents)
      : Math.round((Number(attrs.amountTotal) || 0) * 100)
  const orderNumber = attrs.orderNumber || String(orderId)

  void notifyOwnerPush({
    title: 'Customer says paid',
    body: `${orderNumber} claims Cash App payment was sent.`,
    url: `/admin/orders/${orderId}`,
    tag: `order-${orderId}-claimed`,
  })

  const emailOpts = {
    smtpHost: config.smtpHost as string,
    smtpPort: config.smtpPort as string,
    smtpUser: config.smtpUser as string,
    smtpPass: config.smtpPass as string,
    orderFromEmail: config.orderFromEmail as string,
    ownerOrderEmail: config.ownerOrderEmail as string,
    brand,
  }

  void sendPaymentClaimedOwnerEmail(
    {
      orderId,
      orderNumber,
      customerName: attrs.customerName || '',
      email: attrs.email || '',
      totalCents,
      senderName,
      cashAppHandle,
      note,
    },
    emailOpts
  ).catch((err: any) => console.error('[claim-payment] owner email failed:', err?.message || err))

  void sendPaymentClaimedCustomerEmail(
    {
      orderId,
      orderNumber,
      customerName: attrs.customerName || '',
      email: attrs.email || '',
      totalCents,
      supportEmail: settings.manualPaymentSupportEmail || settings.supportEmail,
    },
    emailOpts
  ).catch((err: any) => console.error('[claim-payment] customer email failed:', err?.message || err))

  return {
    ok: true,
    paymentStatus: 'processing',
    claimedAt: now,
    message:
      'Your payment submission was received and is awaiting verification. Once verified, you’ll receive order confirmation. Tracking will be emailed when your order ships.',
  }
})
