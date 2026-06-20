import { createHmac, timingSafeEqual } from 'crypto'
import { type H3Event } from 'h3'

export default defineEventHandler(async (event: H3Event) => {
  const config = useRuntimeConfig(event)
  const webhookSecret = config.moovWebhookSecret as string

  if (!webhookSecret) {
    console.error('Moov webhook: missing MOOV_WEBHOOK_SECRET server configuration')
    throw createError({
      statusCode: 500,
      statusMessage: 'Webhook not configured',
      message: 'Server webhook secret is not configured.',
    })
  }

  // Read raw body before any JSON parsing
  const rawBody = await readRawBody(event)
  if (!rawBody) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Empty body',
      message: 'Request body is empty.',
    })
  }

  // Read required headers
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

  // Construct exact signing string
  const signingString: string = `${timestamp}|${nonce}|${webhookId}`

  // Calculate HMAC-SHA512
  const expectedSignature = createHmac('sha512', webhookSecret)
    .update(Buffer.from(signingString, 'utf-8'))
    .digest('hex')

  // Timing-safe comparison
  const expectedBuf = Buffer.from(expectedSignature, 'utf-8')
  const receivedBuf = Buffer.from(receivedSignature, 'utf-8')

  if (expectedBuf.length !== receivedBuf.length) {
    console.error('Moov webhook: signature length mismatch')
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      message: 'Invalid webhook signature.',
    })
  }

  if (!timingSafeEqual(expectedBuf, receivedBuf)) {
    console.error('Moov webhook: signature mismatch')
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      message: 'Invalid webhook signature.',
    })
  }

  // Parse body only after verification
  let payload: any
  try {
    payload = JSON.parse(rawBody.toString())
  } catch (err) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid JSON',
      message: 'Request body is not valid JSON.',
    })
  }

  const eventId = payload?.eventID ?? payload?.eventId ?? webhookId
  const eventType = typeof payload?.type === 'string' ? payload.type : 'unknown'

  // Extract safe fields from payload.data when present
  const data = payload?.data || {}
  const transferId = data?.transferID || data?.transferId || undefined
  const accountId = data?.accountID || data?.accountId || undefined
  const status = data?.status || data?.transferStatus || undefined

  // Debug: log only top-level keys, never the full payload or headers
  console.log('Moov webhook payload keys', Object.keys(payload))

  // Log only safe fields
  console.log('Moov webhook received', {
    eventId,
    eventType,
    ...(transferId && { transferId }),
    ...(accountId && { accountId }),
    ...(status && { status }),
  })

  // Handle supported event types
  switch (eventType) {
    case 'event.test':
      // Test event — no action needed
      break
    case 'transfer.created':
      // Transfer created — no Strapi update yet
      break
    case 'transfer.updated':
      // Transfer updated — no Strapi update yet
      break
    case 'paymentMethod.enabled':
      // Payment method enabled — no action needed
      break
    default:
      // Unsupported event type: accept and ignore
      break
  }

  return { received: true }
})
