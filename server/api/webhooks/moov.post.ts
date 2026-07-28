import { createHmac, timingSafeEqual } from 'crypto'
import { type H3Event } from 'h3'
import { getMoovConfig, safeLog } from '~/server/utils/moov'
import { checkoutTrace, strapiHostname } from '~/server/utils/checkout-trace'
import {
  extractTransferIdFromWebhookPayload,
  verifyMoovTransferAgainstOrder,
  applyVerifiedTransferToOrder,
} from '~/server/utils/moov-reconcile'

function asWebhookIdList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((v) => String(v)).filter(Boolean)
  }
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) {
        return parsed.map((v) => String(v)).filter(Boolean)
      }
    } catch {
      return [value.trim()]
    }
  }
  return []
}

async function findOrderByTransferId(
  strapiUrl: string,
  authHeaders: Record<string, string>,
  transferId: string
) {
  const params = new URLSearchParams()
  params.set('filters[moovTransferId][$eq]', transferId)
  params.set('populate[orderItems][populate][variant]', 'true')
  params.set('pagination[pageSize]', '1')

  const response = await $fetch<{ data: any[] }>(
    `${strapiUrl}/api/orders?${params.toString()}`,
    { headers: authHeaders }
  )

  return response.data?.[0] || null
}

export default defineEventHandler(async (event: H3Event) => {
  const config = useRuntimeConfig(event)
  const webhookSecret = config.moovWebhookSecret as string
  const strapiUrl = config.public.strapiUrl as string
  const strapiToken = config.strapiToken as string
  const strapiHost = strapiHostname(strapiUrl)

  const authHeaders: Record<string, string> = strapiToken
    ? { Authorization: `Bearer ${strapiToken}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' }

  if (!webhookSecret) {
    console.error('Moov webhook: missing MOOV_WEBHOOK_SECRET server configuration')
    throw createError({
      statusCode: 500,
      statusMessage: 'Webhook not configured',
      message: 'Server webhook secret is not configured.',
    })
  }

  const rawBody = await readRawBody(event)
  if (!rawBody) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Empty body',
      message: 'Request body is empty.',
    })
  }

  const headers = getHeaders(event)
  const timestamp: string = headers['x-timestamp'] || ''
  const nonce: string = headers['x-nonce'] || ''
  const webhookId: string = headers['x-webhook-id'] || ''
  const receivedSignature: string = headers['x-signature'] || ''

  if (!timestamp || !nonce || !webhookId || !receivedSignature) {
    console.error('Moov webhook: missing signature headers')
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      message: 'Missing webhook signature headers.',
    })
  }

  const signingString: string = `${timestamp}|${nonce}|${webhookId}`
  const expectedSignature = createHmac('sha512', webhookSecret)
    .update(Buffer.from(signingString, 'utf-8'))
    .digest('hex')

  const expectedBuf = Buffer.from(expectedSignature, 'utf-8')
  const receivedBuf = Buffer.from(receivedSignature, 'utf-8')

  if (expectedBuf.length !== receivedBuf.length || !timingSafeEqual(expectedBuf, receivedBuf)) {
    console.error('Moov webhook: signature mismatch')
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      message: 'Invalid webhook signature.',
    })
  }

  let payload: any
  try {
    payload = JSON.parse(rawBody.toString())
  } catch {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid JSON',
      message: 'Request body is not valid JSON.',
    })
  }

  const eventId = String(payload?.eventID ?? payload?.eventId ?? webhookId)
  const eventType = typeof payload?.type === 'string' ? payload.type : 'unknown'
  const transferId = extractTransferIdFromWebhookPayload(payload)

  console.info('[moov-webhook] received', { eventType, eventId })

  safeLog('Moov webhook received', {
    eventId,
    eventType,
    strapiHost,
    ...(transferId && { transferId }),
  })

  if (eventType === 'event.test' || eventType === 'paymentMethod.enabled') {
    return { received: true }
  }

  const isTransferEvent =
    eventType === 'transfer.created' ||
    eventType === 'transfer.updated' ||
    eventType.startsWith('transfer.')

  if (!isTransferEvent) {
    return { received: true }
  }

  if (!transferId) {
    safeLog('Moov webhook missing transferId', { eventId, eventType })
    return { received: true }
  }

  const moovConfig = getMoovConfig(event)
  if (!moovConfig.publicKey || !moovConfig.secretKey || !moovConfig.accountId) {
    console.error('Moov webhook: Moov credentials missing')
    return { received: true }
  }

  let orderEntry: any
  try {
    orderEntry = await findOrderByTransferId(strapiUrl, authHeaders, transferId)
  } catch (err: any) {
    console.error('Moov webhook order lookup failed:', err?.message || err)
    return { received: true }
  }

  if (!orderEntry) {
    safeLog('Moov webhook no matching order', { eventId, eventType, transferId })
    return { received: true }
  }

  const orderId = orderEntry.id
  const attrs = orderEntry.attributes || {}
  const processedWebhookIds = asWebhookIdList(attrs.processedWebhookIds)

  if (processedWebhookIds.includes(eventId)) {
    safeLog('Moov webhook duplicate ignored', {
      eventId,
      eventType,
      transferId,
      orderNumber: attrs.orderNumber,
    })
    return { received: true }
  }

  const verified = await verifyMoovTransferAgainstOrder(moovConfig, attrs, transferId)
  if (!verified.ok) {
    safeLog('Moov webhook verification failed', {
      eventId,
      eventType,
      transferId,
      orderNumber: attrs.orderNumber,
      reason: verified.reason,
    })
    return { received: true }
  }

  if (!verified.mappedPaymentStatus) {
    const nextIds = [...processedWebhookIds, eventId]
    await $fetch(`${strapiUrl}/api/orders/${orderId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: { data: { processedWebhookIds: nextIds } },
    }).catch((err: any) => {
      console.error('Failed to store processed webhook id:', err?.message || err)
    })

    safeLog('Moov webhook unmapped status', {
      eventId,
      eventType,
      transferId,
      status: verified.transferStatus,
      orderNumber: attrs.orderNumber,
    })
    return { received: true }
  }

  try {
    const applied = await applyVerifiedTransferToOrder({
      event,
      strapiUrl,
      authHeaders,
      orderId,
      attrs,
      mappedPaymentStatus: verified.mappedPaymentStatus,
      processedWebhookIds,
      eventId,
      sendEmailsOnPaid: true,
    })

    safeLog('Moov webhook order updated', {
      eventId,
      eventType,
      transferId,
      status: verified.transferStatus,
      cardDetailsStatus: verified.cardDetailsStatus,
      orderNumber: attrs.orderNumber,
      strapiHost,
      paymentStatus: applied.paymentStatus,
    })

    checkoutTrace('webhook:order-updated', {
      orderId,
      orderNumber: attrs.orderNumber,
      strapiHost,
      paymentStatus: applied.paymentStatus,
      hasMoovTransferId: true,
    })
  } catch (err: any) {
    console.error('Moov webhook order update failed:', err?.message || err)
  }

  return { received: true }
})
