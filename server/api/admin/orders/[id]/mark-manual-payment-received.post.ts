/**
 * POST /api/admin/orders/:id/mark-manual-payment-received
 * Admin-only manual payment verification. This is the only path that can mark a
 * manual order paid, decrement inventory, and unlock label purchase.
 */
import { requireAdminAuth } from '~/server/utils/adminAuth'
import {
  MANUAL_ORDER_FIELDS,
  finalizeManualPaymentPaid,
  isManualPaymentOrder,
} from '~/server/utils/manual-payment'

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

  const body = await readBody<{ note?: string }>(event).catch(() => ({}) as { note?: string })

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
    throw createError({
      statusCode: 400,
      message: 'This order is not a manual payment order.',
    })
  }

  const verifiedBy = String(body?.note || '').trim().slice(0, 120) || 'admin'

  const result = await finalizeManualPaymentPaid({
    event,
    strapiUrl,
    authHeaders,
    orderId,
    attrs,
    verifiedBy,
  })

  console.info(
    '[manual-payment] verified',
    JSON.stringify({
      orderId,
      orderNumber: attrs.orderNumber,
      alreadyPaid: result.alreadyPaid,
      inventoryCommitted: result.inventoryCommitted,
    })
  )

  return {
    ok: true,
    alreadyPaid: result.alreadyPaid,
    paymentStatus: result.paymentStatus,
    inventoryCommitted: result.inventoryCommitted,
    paidAt: result.paidAt,
    message: result.alreadyPaid
      ? 'This order was already marked paid. Nothing changed.'
      : 'Payment verified. Order is paid and ready for a shipping label.',
  }
})
