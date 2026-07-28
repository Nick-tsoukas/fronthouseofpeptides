import { type H3Event } from 'h3'
import { getMoovConfig, getAccountPaymentMethods, getAccountCards, safeLog } from '~/server/utils/moov'
import { validateCheckoutSession } from '~/server/utils/checkout-session'
import { checkoutTrace, strapiHostname } from '~/server/utils/checkout-trace'

interface RequestBody {
  orderId?: number
  checkoutSessionToken?: string
  cardId?: string
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function findCardPaymentMethod(
  moovConfig: ReturnType<typeof getMoovConfig>,
  customerAccountId: string,
  cardId: string
) {
  const maxAttempts = 5
  const delayMs = 400

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const methods = await getAccountPaymentMethods(moovConfig, customerAccountId)
    const match = methods.find(
      (pm) => pm.paymentMethodType === 'card-payment' && pm.card?.cardID === cardId
    )
    if (match) return match
    if (attempt < maxAttempts) await sleep(delayMs)
  }

  return null
}

export default defineEventHandler(async (event: H3Event) => {
  const config = useRuntimeConfig(event)
  const strapiUrl = config.public.strapiUrl as string
  const strapiToken = config.strapiToken as string
  const strapiHost = strapiHostname(strapiUrl)

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
    allowedPaymentStatuses: ['pending', 'failed'],
    requiredFields: ['orderNumber', 'moovCustomerAccountId', 'paymentStatus', 'inventoryCommitted'],
  })

  checkoutTrace('card-linked:start', {
    orderId,
    orderNumber: attrs.orderNumber,
    strapiHost,
    paymentStatus: attrs.paymentStatus,
    hasMoovCardId: Boolean(attrs.moovCardId),
    hasMoovPaymentMethodId: Boolean(attrs.moovPaymentMethodId),
    hasMoovTransferId: Boolean(attrs.moovTransferId),
  })

  const customerAccountId = attrs.moovCustomerAccountId
  if (!customerAccountId) {
    throw createError({ statusCode: 400, message: 'Payment account not found for this order.' })
  }

  let cards: any[] = []
  try {
    cards = await getAccountCards(moovConfig, customerAccountId)
  } catch (err: any) {
    console.error('Moov card verification failed:', err?.message || err)
    throw createError({ statusCode: 502, message: 'Could not verify card. Please try again.' })
  }

  const matchingCard = cards.find((c) => c.cardID === cardId || c.cardId === cardId)
  if (!matchingCard) {
    throw createError({ statusCode: 400, message: 'Card does not belong to this payment account.' })
  }

  let cardPaymentMethod: any = null
  try {
    cardPaymentMethod = await findCardPaymentMethod(moovConfig, customerAccountId, cardId)
  } catch (err: any) {
    console.error('Moov payment methods lookup failed:', err?.message || err)
    throw createError({ statusCode: 502, message: 'Could not retrieve payment methods. Please try again.' })
  }

  if (!cardPaymentMethod) {
    throw createError({
      statusCode: 400,
      message: 'Card payment method could not be verified yet. Please wait a moment and try again.',
    })
  }

  const moovPaymentMethodId = cardPaymentMethod.paymentMethodID
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
          paymentStatus: 'pending',
          inventoryCommitted: false,
        },
      },
    })
  } catch (err: any) {
    console.error('Failed to save Moov card details:', err?.message || err)
    throw createError({ statusCode: 502, message: 'Could not save card details to the order. Please try again.' })
  }

  checkoutTrace('card-linked:saved', {
    orderId,
    orderNumber: attrs.orderNumber,
    strapiHost,
    paymentStatus: 'pending',
    hasMoovCardId: true,
    hasMoovPaymentMethodId: true,
    hasMoovTransferId: Boolean(attrs.moovTransferId),
  })

  safeLog('Moov card verified (pending payment)', {
    orderId,
    orderNumber: attrs.orderNumber,
    strapiHost,
    paymentStatus: 'pending',
  })

  return {
    ok: true,
    orderNumber: attrs.orderNumber,
    cardVerified: true,
    paymentReady: true,
    paymentStatus: 'pending',
    inventoryCommitted: false,
    cardLinked: true,
  }
})
