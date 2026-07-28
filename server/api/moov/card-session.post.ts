import { type H3Event } from 'h3'
import {
  getMoovConfig,
  getSiteOrigin,
  createMoovIndividualAccount,
  createMoovAccessToken,
  safeLog,
} from '~/server/utils/moov'
import { validateCheckoutSession } from '~/server/utils/checkout-session'

interface RequestBody {
  orderId?: number
  checkoutSessionToken?: string
}

export default defineEventHandler(async (event: H3Event) => {
  const config = useRuntimeConfig(event)
  const strapiUrl = config.public.strapiUrl as string
  const strapiToken = config.strapiToken as string

  const authHeaders: Record<string, string> = strapiToken
    ? { Authorization: `Bearer ${strapiToken}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' }

  const moovConfig = getMoovConfig(event)
  const origin = getSiteOrigin(event)
  if (!moovConfig.publicKey || !moovConfig.secretKey || !moovConfig.accountId) {
    throw createError({ statusCode: 500, message: 'Moov integration is not configured.' })
  }

  const body = await readBody<RequestBody>(event)
  const orderId = Number(body?.orderId)
  const checkoutSessionToken = (body?.checkoutSessionToken || '').trim()

  const { attributes: attrs } = await validateCheckoutSession(event, {
    orderId,
    token: checkoutSessionToken || undefined,
    allowedPaymentStatuses: ['pending', 'processing', 'paid', 'failed'],
    requiredFields: [
      'customerName',
      'email',
      'moovCustomerAccountId',
      'shippingStatus',
      'paymentStatus',
      'subtotalCents',
      'shippingCents',
      'shippingCostCents',
      'taxCents',
      'discountCents',
      'totalCents',
      'shippingCarrier',
      'shippingService',
      'shippingDeliveryDays',
      'shippingFirstName',
      'shippingLastName',
      'shippingAddress1',
      'shippingCity',
      'shippingState',
      'shippingPostalCode',
      'shippingCountry',
      'ageConfirmed',
      'researchUseConfirmed',
      'qualifiedPurchaserConfirmed',
      'termsAccepted',
      'verificationAcknowledged',
    ],
  })

  const orderSummary = {
    orderNumber: attrs.orderNumber || '',
    subtotalCents: Number(attrs.subtotalCents) || 0,
    shippingCostCents: Number(attrs.shippingCostCents ?? attrs.shippingCents) || 0,
    taxCents: Number(attrs.taxCents) || 0,
    discountCents: Number(attrs.discountCents) || 0,
    totalCents: Number(attrs.totalCents) || 0,
    paymentStatus: attrs.paymentStatus || 'pending',
    shippingStatus: attrs.shippingStatus || 'not_quoted',
    shippingCarrier: attrs.shippingCarrier || '',
    shippingService: attrs.shippingService || '',
    shippingDeliveryDays: attrs.shippingDeliveryDays ?? null,
  }

  if (attrs.shippingStatus !== 'selected') {
    return {
      ok: false,
      paymentBlocked: 'Shipping must be selected before payment.',
      ...orderSummary,
    }
  }

  // Resume paths: no card Drop needed once transfer is in flight or paid
  if (attrs.paymentStatus === 'processing' || attrs.paymentStatus === 'paid') {
    return {
      ok: true,
      ...orderSummary,
      customerName: (attrs.customerName || '').trim(),
      email: (attrs.email || '').trim(),
    }
  }

  // Parse first and last name from customerName
  const customerName = (attrs.customerName || '').trim()
  const [firstName, ...lastNameParts] = customerName.split(' ')
  const lastName = lastNameParts.join(' ')
  const email = (attrs.email || '').trim()

  if (!firstName || !email) {
    throw createError({ statusCode: 400, message: 'Order customer details are incomplete.' })
  }

  // Reuse or create Moov customer account
  let customerAccountId = attrs.moovCustomerAccountId
  if (!customerAccountId) {
    try {
      const account = await createMoovIndividualAccount(moovConfig, {
        firstName,
        lastName: lastName || firstName,
        email,
      })
      customerAccountId = account.accountID

      // Store customer account ID on the order
      await $fetch(`${strapiUrl}/api/orders/${orderId}`, {
        method: 'PUT',
        headers: authHeaders,
        body: {
          data: { moovCustomerAccountId: customerAccountId },
        },
      }).catch((err: any) => {
        console.error('Failed to save Moov customer account ID:', err?.message || err)
      })

      safeLog('Moov customer account created', { orderId, customerAccountId })
    } catch (err: any) {
      console.error('Moov customer account creation failed:', err?.message || err)
      throw createError({ statusCode: 502, message: 'Could not create payment account. Please try again.' })
    }
  }

  // Generate scoped OAuth token for card linking
  const scope = `/accounts/${customerAccountId}/cards.write`
  let accessToken: string
  let expiresIn: number

  try {
    const token = await createMoovAccessToken(moovConfig, scope, origin)
    accessToken = token.accessToken
    expiresIn = token.expiresIn
  } catch (err: any) {
    console.error('Moov access token generation failed:', err?.message || err)
    throw createError({ statusCode: 502, message: 'Could not initialize payment form. Please try again.' })
  }

  safeLog('Moov card session created', {
    orderId,
    customerAccountId,
    merchantAccountId: moovConfig.accountId,
    mode: moovConfig.mode,
    tokenExpiresIn: expiresIn,
    totalCents: orderSummary.totalCents,
  })

  return {
    ok: true,
    accessToken,
    customerAccountId,
    merchantAccountId: moovConfig.accountId,
    mode: moovConfig.mode,
    expiresIn,
    customerName,
    email,
    ...orderSummary,
  }
})
