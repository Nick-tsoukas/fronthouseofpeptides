import { requireAdminAuth } from '~/server/utils/adminAuth'
import { createInventoryAdjustmentLog } from '~/server/utils/inventory-log'

type AdjustmentType = 'add' | 'remove' | 'set'

const REASONS = [
  'New inventory',
  'Manual/offline sale',
  'Damaged/lost',
  'Correction',
  'Return/restock',
  'Other',
] as const

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  requireAdminAuth(event, config.ownerSessionSecret as string)

  const body = await readBody<{
    variantId?: number
    adjustmentType?: AdjustmentType
    quantity?: number
    reason?: string
    note?: string
  }>(event)

  const variantId = Number(body?.variantId)
  const adjustmentType = body?.adjustmentType
  const quantity = Number(body?.quantity)
  const reason = String(body?.reason || '').trim()
  const note = String(body?.note || '').trim()

  if (!variantId || !Number.isFinite(variantId)) {
    throw createError({ statusCode: 400, message: 'variantId is required.' })
  }
  if (!['add', 'remove', 'set'].includes(String(adjustmentType))) {
    throw createError({ statusCode: 400, message: 'adjustmentType must be add, remove, or set.' })
  }
  if (!Number.isInteger(quantity) || quantity < 0) {
    throw createError({ statusCode: 400, message: 'quantity must be a non-negative integer.' })
  }
  if (adjustmentType !== 'set' && quantity <= 0) {
    throw createError({ statusCode: 400, message: 'quantity must be a positive integer.' })
  }
  if (!reason || !(REASONS as readonly string[]).includes(reason)) {
    throw createError({ statusCode: 400, message: 'A valid reason is required.' })
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
  if (!variant) throw createError({ statusCode: 404, message: 'Variant not found.' })

  const previousInventory =
    variant.attributes?.inventory === null || variant.attributes?.inventory === undefined
      ? 0
      : Number(variant.attributes.inventory)

  if (!Number.isFinite(previousInventory) || previousInventory < 0) {
    throw createError({ statusCode: 400, message: 'Current inventory is invalid.' })
  }

  let newInventory = previousInventory
  if (adjustmentType === 'add') newInventory = previousInventory + quantity
  else if (adjustmentType === 'remove') newInventory = previousInventory - quantity
  else newInventory = quantity

  if (newInventory < 0) {
    throw createError({
      statusCode: 400,
      message: `Cannot reduce inventory below 0 (current: ${previousInventory}).`,
    })
  }

  await $fetch(`${strapiUrl}/api/variants/${variantId}`, {
    method: 'PUT',
    headers,
    body: { data: { inventory: newInventory } },
  }).catch(() => {
    throw createError({ statusCode: 502, message: 'Failed to update inventory.' })
  })

  const productId = variant.attributes?.product?.data?.id || null
  const source =
    reason === 'Manual/offline sale'
      ? 'manual_sale'
      : reason === 'Correction'
        ? 'correction'
        : 'admin'

  await createInventoryAdjustmentLog({
    strapiUrl,
    authHeaders: headers,
    variantId,
    productId,
    adjustmentType: adjustmentType as AdjustmentType,
    quantity,
    previousInventory,
    newInventory,
    reason,
    note: note || null,
    source,
    relatedOrderId: null,
    createdByAdmin: 'admin',
  })

  return {
    ok: true,
    variantId,
    previousInventory,
    newInventory,
    adjustmentType,
    reason,
  }
})
