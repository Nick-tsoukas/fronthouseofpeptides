import { requireAdminAuth } from '~/server/utils/adminAuth'
import { isCashAppManualOrder } from '~/server/utils/finalizePaidOrder'
import { fetchStoreSettings, getEmailBrand } from '~/server/utils/storeSettings'
import { sendPaymentRejectedEmail } from '~/server/utils/sendOrderEmails'

/**
 * POST /api/admin/orders/:id/reject-payment
 * Rejects a claimed Cash App payment. No inventory change. Label stays locked.
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  requireAdminAuth(event, config.ownerSessionSecret as string)

  const id = getRouterParam(event, 'id')
  const orderId = Number(id)
  if (!Number.isInteger(orderId) || orderId <= 0) {
    throw createError({ statusCode: 400, message: 'Invalid order ID.' })
  }

  const body = await readBody<{ reason?: string }>(event)
  const reason = String(body?.reason || '').trim().slice(0, 1000)
  if (!reason) {
    throw createError({ statusCode: 400, message: 'A rejection reason is required.' })
  }

  const strapiUrl = config.public.strapiUrl as string
  const strapiToken = config.strapiToken as string
  const authHeaders: Record<string, string> = {
    Authorization: `Bearer ${strapiToken}`,
    'Content-Type': 'application/json',
  }

  const response = await $fetch<{ data: any }>(`${strapiUrl}/api/orders/${orderId}`, {
    headers: authHeaders,
  }).catch(() => {
    throw createError({ statusCode: 404, message: 'Order not found.' })
  })

  const entry = response.data
  if (!entry) throw createError({ statusCode: 404, message: 'Order not found.' })
  const attrs = entry.attributes || {}

  if (!isCashAppManualOrder(attrs) && attrs.paymentProvider !== 'manual') {
    throw createError({ statusCode: 400, message: 'Reject payment is only for manual Cash App orders.' })
  }

  if (attrs.paymentStatus === 'paid') {
    throw createError({ statusCode: 400, message: 'Cannot reject a paid order.' })
  }
  if (attrs.paymentStatus === 'cancelled' || attrs.paymentStatus === 'refunded') {
    throw createError({ statusCode: 400, message: `Cannot reject a ${attrs.paymentStatus} order.` })
  }

  const now = new Date().toISOString()
  await $fetch(`${strapiUrl}/api/orders/${orderId}`, {
    method: 'PUT',
    headers: authHeaders,
    body: {
      data: {
        paymentStatus: 'failed',
        manualPaymentRejectedAt: now,
        manualPaymentRejectionReason: reason,
      },
    },
  })

  const { settings } = await fetchStoreSettings(event)
  const brand = await getEmailBrand(event)
  const totalCents =
    Number(attrs.totalCents) >= 0
      ? Number(attrs.totalCents)
      : Math.round((Number(attrs.amountTotal) || 0) * 100)

  void sendPaymentRejectedEmail(
    {
      orderId,
      orderNumber: attrs.orderNumber || String(orderId),
      customerName: attrs.customerName || '',
      email: attrs.email || '',
      totalCents,
      reason,
      supportEmail: settings.manualPaymentSupportEmail || settings.supportEmail,
    },
    {
      smtpHost: config.smtpHost as string,
      smtpPort: config.smtpPort as string,
      smtpUser: config.smtpUser as string,
      smtpPass: config.smtpPass as string,
      orderFromEmail: config.orderFromEmail as string,
      ownerOrderEmail: config.ownerOrderEmail as string,
      brand,
    }
  ).catch((err: any) => console.error('[reject-payment] email failed:', err?.message || err))

  return {
    ok: true,
    paymentStatus: 'failed',
    rejectedAt: now,
    message: 'Payment rejected. Customer was emailed correction instructions.',
  }
})
