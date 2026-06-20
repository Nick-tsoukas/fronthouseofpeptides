import { type H3Event } from 'h3'
import {
  getMoovConfig,
  getSiteOrigin,
  createMoovIndividualAccount,
  createMoovAccessToken,
  hashToken,
  safeLog,
} from '~/server/utils/moov'

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

  if (!Number.isInteger(orderId) || orderId <= 0) {
    throw createError({ statusCode: 400, message: 'Invalid order ID.' })
  }
  if (!checkoutSessionToken) {
    throw createError({ statusCode: 400, message: 'Checkout session token is required.' })
  }

  const tokenHash = hashToken(checkoutSessionToken)

  // Load order and validate session token hash
  let order: any
  try {
    const orderResponse = await $fetch<{ data: any }>(
      `${strapiUrl}/api/orders/${orderId}?fields[0]=customerName&fields[1]=email&fields[2]=paymentStatus&fields[3]=status&fields[4]=moovCustomerAccountId&fields[5]=checkoutSessionTokenHash`,
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
  })

  return {
    ok: true,
    accessToken,
    customerAccountId,
    merchantAccountId: moovConfig.accountId,
    mode: moovConfig.mode,
    expiresIn,
  }
})
