import { type H3Event } from 'h3'
import { getMoovConfig, getAccountPaymentMethods, getAccountCards, hashToken, safeLog } from '~/server/utils/moov'

interface RequestBody {
  orderId?: number
  checkoutSessionToken?: string
  cardId?: string
}

export default defineEventHandler(async (event: H3Event) => {
  const config = useRuntimeConfig(event)
  const strapiUrl = config.public.strapiUrl as string
  const strapiToken = config.strapiToken as string

  const authHeaders: Record<string, string> = strapiToken
    ? { Authorization: `Bearer ${strapiToken}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' }

  const moovConfig = getMoovConfig(event)
  if (!moovConfig.publicKey || !moovConfig.secretKey || !moovConfig.accountId) {
    throw createError({ statusCode: 500, message: 'Moov integration is not configured.' })
  }

  const body = await readBody<RequestBody>(event)
  const orderId = Number(body?.orderId)
  const checkoutSessionToken = (body?.checkoutSessionToken || '').trim()
  const cardId = (body?.cardId || '').trim()

  if (!Number.isInteger(orderId) || orderId <= 0) {
    throw createError({ statusCode: 400, message: 'Invalid order ID.' })
  }
  if (!checkoutSessionToken) {
    throw createError({ statusCode: 400, message: 'Checkout session token is required.' })
  }
  if (!cardId) {
    throw createError({ statusCode: 400, message: 'Card ID is required.' })
  }

  const tokenHash = hashToken(checkoutSessionToken)

  // Load order and validate session token hash
  let order: any
  try {
    const orderResponse = await $fetch<{ data: any }>(
      `${strapiUrl}/api/orders/${orderId}?fields[0]=orderNumber&fields[1]=paymentStatus&fields[2]=status&fields[3]=moovCustomerAccountId&fields[4]=checkoutSessionTokenHash`,
      { headers: authHeaders }
    )
    order = orderResponse.data
  } catch (err: any) {
    console.error('Order load failed:', err?.message || err)
    throw createError({ statusCode: 502, message: 'Could not load order. Please try again.' })
  }

  if (!order) {
    throw createError({ statusCode: 404, message: 'Order not found.' })
  }

  const attrs = order.attributes || {}

  if (attrs.checkoutSessionTokenHash !== tokenHash) {
    throw createError({ statusCode: 401, message: 'Invalid checkout session.' })
  }

  if (attrs.status !== 'awaiting_payment' || attrs.paymentStatus !== 'pending') {
    throw createError({ statusCode: 400, message: 'Order is not available for payment.' })
  }

  const customerAccountId = attrs.moovCustomerAccountId
  if (!customerAccountId) {
    throw createError({ statusCode: 400, message: 'Payment account not found for this order.' })
  }

  // Verify the card belongs to the customer account
  let cards: any[] = []
  try {
    cards = await getAccountCards(moovConfig, customerAccountId)
  } catch (err: any) {
    console.error('Moov card verification failed:', err?.message || err)
    throw createError({ statusCode: 502, message: 'Could not verify card. Please try again.' })
  }

  const matchingCard = cards.find((c) => c.cardID === cardId)
  if (!matchingCard) {
    throw createError({ statusCode: 400, message: 'Card does not belong to this payment account.' })
  }

  // Locate the card payment method
  let paymentMethods: any[] = []
  try {
    paymentMethods = await getAccountPaymentMethods(moovConfig, customerAccountId)
  } catch (err: any) {
    console.error('Moov payment methods lookup failed:', err?.message || err)
    throw createError({ statusCode: 502, message: 'Could not retrieve payment methods. Please try again.' })
  }

  const cardPaymentMethod = paymentMethods.find(
    (pm) => pm.paymentMethodType === 'card-payment' && pm.card?.cardID === cardId
  )

  if (!cardPaymentMethod) {
    throw createError({ statusCode: 400, message: 'Card payment method could not be verified.' })
  }

  const moovPaymentMethodId = cardPaymentMethod.paymentMethodID

  // Save card and payment method IDs on the order
  const now = new Date().toISOString()
  try {
    await $fetch(`${strapiUrl}/api/orders/${orderId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: {
        data: {
          moovCardId: cardId,
          moovPaymentMethodId,
          moovCardLinkedAt: now,
        },
      },
    })
  } catch (err: any) {
    console.error('Failed to save Moov card details:', err?.message || err)
    throw createError({ statusCode: 502, message: 'Could not save card details. Please try again.' })
  }

  safeLog('Moov card linked', {
    orderId,
    customerAccountId,
    cardId,
    paymentMethodId: moovPaymentMethodId,
  })

  return {
    ok: true,
    orderNumber: attrs.orderNumber,
    cardLinked: true,
    paymentReady: true,
    paymentStatus: 'pending',
  }
})
