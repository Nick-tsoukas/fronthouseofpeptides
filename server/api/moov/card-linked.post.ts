import { type H3Event } from 'h3'
import { getMoovConfig, getAccountPaymentMethods, getAccountCards, safeLog } from '~/server/utils/moov'
import { validateCheckoutSession } from '~/server/utils/checkout-session'

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

  if (!cardId) {
    throw createError({ statusCode: 400, message: 'Card ID is required.' })
  }

  const { attributes: attrs } = await validateCheckoutSession(event, {
    orderId,
    token: checkoutSessionToken || undefined,
    requiredFields: ['orderNumber', 'moovCustomerAccountId'],
  })

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
