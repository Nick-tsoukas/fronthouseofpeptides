/**
 * Legacy Stripe Checkout session endpoint — RETIRED.
 * Card processor path is not used. Do not re-enable without admin auth
 * and a deliberate payment-provider switch.
 */
export default defineEventHandler(() => {
  throw createError({
    statusCode: 410,
    statusMessage: 'Gone',
    message: 'Stripe checkout is retired. Cash App manual or Moov checkout is used instead.',
  })
})
