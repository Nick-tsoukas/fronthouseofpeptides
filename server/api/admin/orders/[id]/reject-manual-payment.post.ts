/**
 * POST /api/admin/orders/:id/reject-manual-payment
 * Admin-only. Marks a claimed manual payment as not verified and emails the
 * customer correction instructions. Never touches inventory or Shippo.
 */
import { requireAdminAuth } from '~/server/utils/adminAuth'
import { getManualPaymentSetup, isManualPaymentOrder } from '~/server/utils/manual-payment'
import { sendManualPaymentRejectedEmail } from '~/server/utils/manualPaymentEmails'
import { getEmailBrand } from '~/server/utils/storeSettings'
import { getManualPaymentMethodConfig, type ManualPaymentMethod } from '~/utils/storeSettings'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  requireAdminAuth(event, config.ownerSessionSecret as string)

  const strapiUrl = config.public.strapiUrl as string
  const strapiToken = config.strapiToken as string
  const authHeaders: Record<string, string> = strapiToken
    ? { Authorization: `Bearer ${strapiToken}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' }

  const orderId = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(orderId) || orderId <= 0) {
    throw createError({ statusCode: 400, message: 'Order ID is required.' })
  }

  const body = await readBody<{ reason?: string }>(event).catch(() => ({}) as { reason?: string })
  const reason = String(body?.reason || '').trim().slice(0, 500)

  let attrs: Record<string, any>
  try {
    const res = await $fetch<{ data: any }>(`${strapiUrl}/api/orders/${orderId}`, {
      headers: authHeaders,
    })
    attrs = res.data?.attributes || {}
    if (!res.data) throw new Error('not found')
  } catch (err: any) {
    console.error('[manual-payment] admin order load failed:', err?.message || err)
    throw createError({ statusCode: 404, message: 'Order not found.' })
  }

  if (!isManualPaymentOrder(attrs)) {
    throw createError({ statusCode: 400, message: 'This order is not a manual payment order.' })
  }

  if (attrs.paymentStatus === 'paid') {
    throw createError({
      statusCode: 400,
      message: 'This order is already paid. Refund it instead of rejecting the payment.',
    })
  }

  const rejectedAt = new Date().toISOString()

  try {
    await $fetch(`${strapiUrl}/api/orders/${orderId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: {
        data: {
          paymentStatus: 'manual_payment_rejected',
          manualPaymentRejectedAt: rejectedAt,
          manualPaymentRejectionReason: reason,
        },
      },
    })
  } catch (err: any) {
    console.error('[manual-payment] reject failed:', err?.data || err?.message || err)
    throw createError({ statusCode: 502, message: 'Could not update the order. Try again.' })
  }

  const setup = await getManualPaymentSetup(event)
  const method = (attrs.manualPaymentMethod as ManualPaymentMethod) || setup.method || 'cashapp'
  const methodConfig = getManualPaymentMethodConfig(setup.settings, method)

  const emailResult = await sendManualPaymentRejectedEmail(
    {
      orderId,
      orderNumber: attrs.orderNumber || String(orderId),
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
      reason,
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

  return {
    ok: true,
    paymentStatus: 'manual_payment_rejected',
    manualPaymentRejectedAt: rejectedAt,
    customerEmailSent: emailResult.sent,
    message: emailResult.sent
      ? 'Payment rejected. Correction instructions emailed to the customer.'
      : 'Payment rejected. Customer email could not be sent — contact them directly.',
  }
})
