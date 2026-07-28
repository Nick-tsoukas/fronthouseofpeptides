import { type H3Event } from 'h3'
import { validateCheckoutSession } from '~/server/utils/checkout-session'
import { getMoovConfig } from '~/server/utils/moov'
import { verifyMoovTransferAgainstOrder } from '~/server/utils/moov-reconcile'

/**
 * Test-mode only diagnostic for Moov payment finalization.
 * GET /api/moov/payment-debug?orderId=...
 */
export default defineEventHandler(async (event: H3Event) => {
  const config = useRuntimeConfig(event)
  const moovMode = (config.moovMode as string) || 'test'

  if (moovMode !== 'test') {
    throw createError({ statusCode: 404, message: 'Not found.' })
  }

  const query = getQuery(event)
  const orderId = Number(query.orderId)

  const { attributes: attrs } = await validateCheckoutSession(event, {
    orderId,
    skipStatusGate: true,
    requiredFields: [
      'orderNumber',
      'paymentStatus',
      'moovTransferId',
      'moovPaymentMethodId',
      'totalCents',
      'inventoryCommitted',
      'paidAt',
    ],
  })

  const hasMoovTransferId = Boolean(attrs.moovTransferId)
  let transferStatus: string | null = null
  let cardDetailsStatus: string | null = null
  let transferAmountMatchesOrder: boolean | null = null
  let sourceMatchesOrder: boolean | null = null
  let currency: string | null = null
  let mappedPaymentStatus: string | null = null

  if (hasMoovTransferId) {
    const moovConfig = getMoovConfig(event)
    if (moovConfig.publicKey && moovConfig.secretKey && moovConfig.accountId) {
      const verified = await verifyMoovTransferAgainstOrder(
        moovConfig,
        attrs,
        attrs.moovTransferId
      )
      transferStatus = verified.transferStatus || null
      cardDetailsStatus = verified.cardDetailsStatus || null
      mappedPaymentStatus = verified.mappedPaymentStatus || null
      transferAmountMatchesOrder =
        typeof verified.amountMatches === 'boolean' ? verified.amountMatches : null
      sourceMatchesOrder =
        typeof verified.sourceMatches === 'boolean' ? verified.sourceMatches : null
      currency = verified.currency || null
    }
  }

  return {
    ok: true,
    orderNumber: attrs.orderNumber || null,
    orderPaymentStatus: attrs.paymentStatus || null,
    hasMoovTransferId,
    transferStatus,
    cardDetailsStatus,
    mappedPaymentStatus,
    transferAmountMatchesOrder,
    sourceMatchesOrder,
    currency,
    inventoryCommitted: Boolean(attrs.inventoryCommitted),
    paidAt: attrs.paidAt || null,
  }
})
