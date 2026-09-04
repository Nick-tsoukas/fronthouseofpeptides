/**
 * Legacy public order endpoint — RETIRED.
 * Previously created unpaid/approved orders and could decrement inventory
 * without payment or admin auth. Do not re-enable.
 */
export default defineEventHandler(() => {
  throw createError({
    statusCode: 410,
    statusMessage: 'Gone',
    message: 'This order endpoint has been retired. Use checkout.',
  })
})
