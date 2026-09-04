/**
 * Legacy Stripe webhook — RETIRED.
 * Previously created paid orders and decremented inventory.
 */
export default defineEventHandler(() => {
  throw createError({
    statusCode: 410,
    statusMessage: 'Gone',
    message: 'Stripe webhooks are retired.',
  })
})
