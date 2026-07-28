import { requireAdminAuth } from '~/server/utils/adminAuth'
import { createInventoryAdjustmentLog } from '~/server/utils/inventory-log'

function toCents(dollars: number): number {
  return Math.round(Number(dollars) * 100)
}

function makeManualOrderNumber() {
  const d = new Date()
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `QBP-MAN-${y}${m}${day}-${rand}`
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  requireAdminAuth(event, config.ownerSessionSecret as string)

  const body = await readBody<{
    variantId?: number
    quantity?: number
    customerName?: string
    customerEmail?: string
    paymentMethod?: 'cash' | 'external' | 'other'
    note?: string
  }>(event)

  const variantId = Number(body?.variantId)
  const quantity = Number(body?.quantity)
  const customerName = String(body?.customerName || 'Manual sale').trim() || 'Manual sale'
  const customerEmail = String(body?.customerEmail || 'manual@local').trim() || 'manual@local'
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
  if (!variant) throw createError({ statusCode: 404, message: 'Variant not found.' })

  const vAttrs = variant.attributes || {}
  const product = vAttrs.product?.data
  const productId = product?.id || null
  const productName = product?.attributes?.name || 'Product'
  const unitPrice = Number(vAttrs.price) || 0
  const previousInventory =
    vAttrs.inventory === null || vAttrs.inventory === undefined ? null : Number(vAttrs.inventory)

  if (previousInventory === null) {
    throw createError({
      statusCode: 400,
      message: 'This variant does not track inventory. Set a stock count before recording a sale.',
    })
  }

  if (previousInventory < quantity) {
    throw createError({
      statusCode: 400,
      message: `Insufficient stock. Available: ${previousInventory}, requested: ${quantity}.`,
    })
  }

  const newInventory = previousInventory - quantity
  const subtotalCents = toCents(unitPrice) * quantity
  const orderNumber = makeManualOrderNumber()
  const now = new Date().toISOString()

  await $fetch(`${strapiUrl}/api/variants/${variantId}`, {
    method: 'PUT',
    headers,
    body: { data: { inventory: newInventory } },
  }).catch(() => {
    throw createError({ statusCode: 502, message: 'Failed to update inventory.' })
  })

  let orderId: number | null = null
  try {
    const orderRes = await $fetch<{ data: any }>(`${strapiUrl}/api/orders`, {
      method: 'POST',
      headers,
      body: {
        data: {
          orderNumber,
          customerName,
          email: customerEmail,
          customerNotes: note || null,
          ownerNotes: `Manual/offline sale. Method: ${paymentMethod}.${note ? ` Note: ${note}` : ''}`,
          amountSubtotal: subtotalCents / 100,
          amountTotal: subtotalCents / 100,
          shippingAmount: 0,
          currency: 'USD',
          subtotalCents,
          shippingCents: 0,
          shippingCostCents: 0,
          taxCents: 0,
          discountCents: 0,
          totalCents: subtotalCents,
          paymentProvider: 'manual',
          paymentMethod,
          paymentStatus: 'paid',
          status: 'fulfilled',
          shippingStatus: 'cancelled',
          inventoryCommitted: true,
          inventoryAdjusted: true,
          paidAt: now,
        },
      },
    })
    orderId = orderRes.data?.id || null

    if (orderId) {
      await $fetch(`${strapiUrl}/api/order-items`, {
        method: 'POST',
        headers,
        body: {
          data: {
            order: orderId,
            variant: variantId,
            productNameSnapshot: productName,
            variantNameSnapshot: vAttrs.name || '',
            skuSnapshot: vAttrs.sku || '',
            quantity,
            unitPriceSnapshot: unitPrice,
          },
        },
      }).catch((err: any) => {
        console.error('Manual sale order-item create failed:', err?.message || err)
      })
    }
  } catch (err: any) {
    console.error('Manual sale order create failed:', err?.message || err)
    // Inventory already decremented — still log adjustment; order may be missing if schema rejects manual enums
  }

  await createInventoryAdjustmentLog({
    strapiUrl,
    authHeaders: headers,
    variantId,
    productId,
    adjustmentType: 'remove',
    quantity,
    previousInventory,
    newInventory,
    reason: 'Manual/offline sale',
    note: note || null,
    source: 'manual_sale',
    relatedOrderId: orderId,
    createdByAdmin: 'admin',
  })

  return {
    ok: true,
    variantId,
    previousInventory,
    newInventory,
    orderId,
    orderNumber: orderId ? orderNumber : null,
  }
})
