import { createHmac, timingSafeEqual } from 'crypto'
import { type H3Event } from 'h3'
import {
  getMoovConfig,
  getMoovTransfer,
  getAccountPaymentMethods,
  findMoovWalletPaymentMethod,
  mapMoovTransferToPaymentStatus,
  safeLog,
} from '~/server/utils/moov'
import { sendPaidOrderEmails } from '~/server/utils/sendOrderEmails'

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

async function commitInventoryOnce(
  strapiUrl: string,
  authHeaders: Record<string, string>,
  orderId: number,
  orderItems: any[]
): Promise<boolean> {
  let anyTracked = false

  for (const item of orderItems) {
    const attrs = item.attributes || {}
    const quantity = Number(attrs.quantity) || 0
    const variant = attrs.variant?.data
    if (!variant?.id || quantity <= 0) continue

    const inventory = variant.attributes?.inventory
    if (inventory === null || inventory === undefined) continue

    anyTracked = true
    const newInventory = Math.max(0, Number(inventory) - quantity)
    await $fetch(`${strapiUrl}/api/variants/${variant.id}`, {
      method: 'PUT',
      headers: authHeaders,
      body: { data: { inventory: newInventory } },
    })

    safeLog('Inventory decremented', {
      orderId,
      variantId: variant.id,
      from: inventory,
      to: newInventory,
    })
  }

  return anyTracked
}

export default defineEventHandler(async (event: H3Event) => {
  const config = useRuntimeConfig(event)
  const webhookSecret = config.moovWebhookSecret as string
  const strapiUrl = config.public.strapiUrl as string
  const strapiToken = config.strapiToken as string

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
  const data = payload?.data || {}
  const transferIdFromPayload = data?.transferID || data?.transferId || undefined
  const statusFromPayload = data?.status || data?.transferStatus || undefined

  safeLog('Moov webhook received', {
    eventId,
    eventType,
    ...(transferIdFromPayload && { transferId: transferIdFromPayload }),
    ...(statusFromPayload && { status: statusFromPayload }),
  })

  if (eventType === 'event.test' || eventType === 'paymentMethod.enabled') {
    return { received: true }
  }

  if (eventType !== 'transfer.created' && eventType !== 'transfer.updated') {
    return { received: true }
  }

  const transferId = transferIdFromPayload
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

  let transfer: any
  try {
    transfer = await getMoovTransfer(moovConfig, transferId)
  } catch (err: any) {
    console.error('Moov webhook transfer retrieve failed:', err?.message || err)
    return { received: true }
  }

  const verifiedTransferId = transfer?.transferID || transfer?.transferId
  const amountValue = Number(transfer?.amount?.value)
  const currency = String(transfer?.amount?.currency || '').toUpperCase()
  const sourcePm =
    transfer?.source?.paymentMethodID || transfer?.source?.paymentMethodId
  const destinationPm =
    transfer?.destination?.paymentMethodID || transfer?.destination?.paymentMethodId
  const destinationType = transfer?.destination?.paymentMethodType
  const verifiedStatus = String(transfer?.status || '').toLowerCase()

  if (verifiedTransferId !== attrs.moovTransferId) {
    safeLog('Moov webhook transfer ID mismatch', {
      eventId,
      orderNumber: attrs.orderNumber,
      transferId,
    })
    return { received: true }
  }

  if (amountValue !== Number(attrs.totalCents)) {
    safeLog('Moov webhook amount mismatch', {
      eventId,
      orderNumber: attrs.orderNumber,
      transferId,
      status: verifiedStatus,
    })
    return { received: true }
  }

  if (currency !== 'USD') {
    safeLog('Moov webhook currency mismatch', {
      eventId,
      orderNumber: attrs.orderNumber,
      transferId,
    })
    return { received: true }
  }

  if (sourcePm !== attrs.moovPaymentMethodId) {
    safeLog('Moov webhook source payment method mismatch', {
      eventId,
      orderNumber: attrs.orderNumber,
      transferId,
    })
    return { received: true }
  }

  let merchantWalletId: string | null = null
  try {
    const merchantMethods = await getAccountPaymentMethods(moovConfig, moovConfig.accountId)
    merchantWalletId = findMoovWalletPaymentMethod(merchantMethods)?.paymentMethodID || null
  } catch (err: any) {
    console.error('Moov webhook merchant wallet lookup failed:', err?.message || err)
    return { received: true }
  }

  if (!merchantWalletId || destinationPm !== merchantWalletId) {
    safeLog('Moov webhook destination mismatch', {
      eventId,
      orderNumber: attrs.orderNumber,
      transferId,
      destinationType,
    })
    return { received: true }
  }

  const mappedPaymentStatus = mapMoovTransferToPaymentStatus(verifiedStatus)
  if (!mappedPaymentStatus) {
    // Still record the event ID so we do not reprocess unknowns endlessly
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
      status: verifiedStatus,
      orderNumber: attrs.orderNumber,
    })
    return { received: true }
  }

  const alreadyPaid = attrs.paymentStatus === 'paid'
  const alreadyCommitted = Boolean(attrs.inventoryCommitted)
  const updateData: Record<string, any> = {
    processedWebhookIds: [...processedWebhookIds, eventId],
  }

  // Never change money totals from webhooks
  if (!alreadyPaid) {
    updateData.paymentStatus = mappedPaymentStatus
  } else if (mappedPaymentStatus === 'refunded') {
    updateData.paymentStatus = 'refunded'
  } else if (mappedPaymentStatus === 'failed' && attrs.paymentStatus !== 'paid') {
    updateData.paymentStatus = 'failed'
  }

  let shouldCommitInventory = false
  let shouldSendEmails = false

  if (mappedPaymentStatus === 'paid' && !alreadyPaid) {
    updateData.paymentStatus = 'paid'
    updateData.paidAt = new Date().toISOString()
    updateData.paymentProvider = 'moov'
    updateData.paymentMethod = 'card'
    shouldSendEmails = true

    if (!alreadyCommitted) {
      shouldCommitInventory = true
      updateData.inventoryCommitted = true
      updateData.inventoryAdjusted = true
    }
  }

  if (shouldCommitInventory) {
    try {
      await commitInventoryOnce(
        strapiUrl,
        authHeaders,
        orderId,
        attrs.orderItems?.data || []
      )
    } catch (err: any) {
      console.error('Inventory commit failed:', err?.message || err)
      updateData.inventoryCommitted = false
      updateData.inventoryAdjusted = false
      updateData.ownerNotes = [
        attrs.ownerNotes,
        'Inventory decrement failed after paid Moov transfer. Manual inventory check required.',
      ]
        .filter(Boolean)
        .join('\n')
    }
  }

  try {
    await $fetch(`${strapiUrl}/api/orders/${orderId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: { data: updateData },
    })
  } catch (err: any) {
    console.error('Moov webhook order update failed:', err?.message || err)
    return { received: true }
  }

  safeLog('Moov webhook order updated', {
    eventId,
    eventType,
    transferId,
    status: verifiedStatus,
    orderNumber: attrs.orderNumber,
    paymentStatus: updateData.paymentStatus || attrs.paymentStatus,
  })

  if (shouldSendEmails) {
    const items = (attrs.orderItems?.data || []).map((item: any) => ({
      productName: item.attributes?.productNameSnapshot || '',
      variantName: item.attributes?.variantNameSnapshot || '',
      skuSnapshot: item.attributes?.skuSnapshot || '',
      quantity: item.attributes?.quantity || 0,
      unitPrice: Number(item.attributes?.unitPriceSnapshot) || 0,
    }))

    await sendPaidOrderEmails(
      {
        orderId,
        orderNumber: attrs.orderNumber || String(orderId),
        status: 'paid',
        inventoryAdjusted: Boolean(updateData.inventoryAdjusted ?? attrs.inventoryAdjusted),
        customerName: attrs.customerName || '',
        email: attrs.email || '',
        phone: attrs.phone || null,
        companyName: attrs.companyName || null,
        customerNotes: attrs.customerNotes || null,
        shippingAddressLine1: attrs.shippingAddressLine1 || attrs.shippingAddress1 || '',
        shippingAddressLine2: attrs.shippingAddressLine2 || attrs.shippingAddress2 || null,
        shippingCity: attrs.shippingCity || '',
        shippingState: attrs.shippingState || '',
        shippingPostalCode: attrs.shippingPostalCode || '',
        shippingCountry: attrs.shippingCountry || 'US',
        amountSubtotal: (Number(attrs.subtotalCents) || 0) / 100,
        shippingAmount: (Number(attrs.shippingCostCents) || Number(attrs.shippingCents) || 0) / 100,
        amountTotal: (Number(attrs.totalCents) || 0) / 100,
        currency: attrs.currency || 'USD',
        items,
      },
      {
        smtpHost: config.smtpHost as string,
        smtpPort: config.smtpPort as string,
        smtpUser: config.smtpUser as string,
        smtpPass: config.smtpPass as string,
        orderFromEmail: config.orderFromEmail as string,
        ownerOrderEmail: config.ownerOrderEmail as string,
      }
    ).catch((err: any) => {
      console.error('Paid order email failed:', err?.message || err)
    })
  }

  return { received: true }
})
