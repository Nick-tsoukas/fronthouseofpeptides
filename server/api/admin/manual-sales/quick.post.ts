import { requireAdminAuth } from '~/server/utils/adminAuth'
import { createInventoryAdjustmentLog } from '~/server/utils/inventory-log'

/**
 * POST /api/admin/manual-sales/quick
 * Fast in-person sale: decrement inventory + adjustment log. No Moov/Shippo/email/customer.
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  requireAdminAuth(event, config.ownerSessionSecret as string)

  const body = await readBody<{
    variantId?: number
    quantity?: number
    paymentMethod?: 'cash' | 'external' | 'other'
    note?: string
  }>(event)

  const variantId = Number(body?.variantId)
  const quantity = Number(body?.quantity)
  const paymentMethod = body?.paymentMethod || 'cash'
  const note = String(body?.note || '').trim()

  if (!variantId || !Number.isFinite(variantId)) {
    throw createError({ statusCode: 400, message: 'variantId is required.' })
  }
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw createError({ statusCode: 400, message: 'quantity must be a positive integer.' })
  }
  if (!['cash', 'external', 'other'].includes(paymentMethod)) {
    throw createError({ statusCode: 400, message: 'Invalid payment method.' })
  }

  const strapiUrl = config.public.strapiUrl as string
  const strapiToken = config.strapiToken as string
  const headers = {
    Authorization: `Bearer ${strapiToken}`,
    'Content-Type': 'application/json',
  }

  const variantRes = await $fetch<{ data: any }>(
    `${strapiUrl}/api/variants/${variantId}?populate=product`,
    { headers }
  ).catch(() => {
    throw createError({ statusCode: 404, message: 'Variant not found.' })
  })

  const variant = variantRes.data
  if (!variant) {
    throw createError({ statusCode: 404, message: 'Variant not found.' })
  }

  const vAttrs = variant.attributes || {}
  const product = vAttrs.product?.data
  const productId = product?.id || null
  const productName = product?.attributes?.name || 'Product'
  const variantName = vAttrs.name || 'Variant'

  if (vAttrs.inventory === null || vAttrs.inventory === undefined) {
    throw createError({
      statusCode: 400,
      message: 'This variant does not track inventory.',
    })
  }

  const previousInventory = Number(vAttrs.inventory)
  if (!Number.isFinite(previousInventory) || previousInventory < 0) {
    throw createError({ statusCode: 400, message: 'Current inventory is invalid.' })
  }

  if (quantity > previousInventory) {
    throw createError({
      statusCode: 400,
      message: 'Not enough inventory for this sale.',
    })
  }

  const newInventory = previousInventory - quantity

  await $fetch(`${strapiUrl}/api/variants/${variantId}`, {
    method: 'PUT',
    headers,
    body: { data: { inventory: newInventory } },
  }).catch(() => {
    throw createError({ statusCode: 502, message: 'Could not record quick sale. Please try again.' })
  })

  await createInventoryAdjustmentLog({
    strapiUrl,
    authHeaders: headers,
    variantId,
    productId,
    adjustmentType: 'remove',
    quantity,
    previousInventory,
    newInventory,
    reason: 'manual_sale',
    note: note || null,
    source: 'manual_sale',
    paymentMethod,
    relatedOrderId: null,
    createdByAdmin: 'admin',
  })

  return {
    ok: true,
    productName,
    variantName,
    quantitySold: quantity,
    previousInventory,
    newInventory,
    paymentMethod,
  }
})
