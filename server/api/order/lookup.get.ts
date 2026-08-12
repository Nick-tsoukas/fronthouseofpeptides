/**
 * Legacy Stripe order lookup — disabled.
 * Orders are never public; Moov checkout uses session-gated /api/checkout/status.
 */
export default defineEventHandler(async () => {
  throw createError({
    statusCode: 410,
    message: 'This order lookup endpoint has been retired.',
  })
})
