import { requireAdminAuth } from '~/server/utils/adminAuth'
import { finalizePaidOrder, isCashAppManualOrder, loadOrderStockLines } from '~/server/utils/finalizePaidOrder'

/**
 * POST /api/admin/orders/:id/mark-payment-received
 * Owner verifies Cash App payment. Idempotent. Decrements inventory once.
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  requireAdminAuth(event, config.ownerSessionSecret as string)

  const id = getRouterParam(event, 'id')
  const orderId = Number(id)
  if (!Number.isInteger(orderId) || orderId <= 0) {
    throw createError({ statusCode: 400, message: 'Invalid order ID.' })
  }

  const body = await readBody<{ confirmInsufficientStock?: boolean }>(event).catch(() => ({}))

  const strapiUrl = config.public.strapiUrl as string
  const strapiToken = config.strapiToken as string
  const authHeaders: Record<string, string> = {
    Authorization: `Bearer ${strapiToken}`,
    'Content-Type': 'application/json',
  }

  const response = await $fetch<{ data: any }>(
    `${strapiUrl}/api/orders/${orderId}?populate[orderItems][populate][variant]=true`,
    { headers: authHeaders }
  ).catch(() => {
    throw createError({ statusCode: 404, message: 'Order not found.' })
  })

  const entry = response.data
  if (!entry) throw createError({ statusCode: 404, message: 'Order not found.' })
  const attrs = entry.attributes || {}

  if (!isCashAppManualOrder(attrs) && attrs.paymentProvider !== 'manual') {
    throw createError({
      statusCode: 400,
      message: 'Mark Payment Received is only for manual Cash App orders.',
    })
  }

  if (attrs.paymentStatus === 'paid') {
    const stockLines = await loadOrderStockLines(strapiUrl, authHeaders, orderId, attrs)
    return {
      ok: true,
      alreadyPaid: true,
      paymentStatus: 'paid',
      inventoryCommitted: Boolean(attrs.inventoryCommitted),
      paidAt: attrs.paidAt || null,
      paidReceiptSentAt: attrs.paidReceiptSentAt || null,
      stockLines,
      message: 'Order was already marked paid.',
    }
  }

  if (!['pending', 'processing', 'failed'].includes(String(attrs.paymentStatus || ''))) {
    throw createError({
      statusCode: 400,
      message: `Cannot mark payment received while payment status is "${attrs.paymentStatus}".`,
    })
  }

  const result = await finalizePaidOrder({
    event,
    strapiUrl,
    authHeaders,
    orderId,
    attrs,
    allowInsufficientStock: Boolean(body?.confirmInsufficientStock),
    sendEmailsOnPaid: true,
    paymentProvider: attrs.paymentProvider || 'cashapp_manual',
    paymentMethod: attrs.paymentMethod || 'cashapp',
  })

  if (result.busy) {
    throw createError({ statusCode: 409, message: result.message || 'Finalization in progress.' })
  }

  if (result.insufficientStock && !result.ok) {
    throw createError({
      statusCode: 409,
      message: result.message || 'Insufficient stock.',
      data: {
        insufficientStock: true,
        stockLines: result.stockLines,
      },
    })
  }

  if (!result.ok) {
    throw createError({ statusCode: 502, message: result.message || 'Could not finalize payment.' })
  }

  return result
})
