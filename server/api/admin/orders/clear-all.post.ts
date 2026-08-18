/**
 * POST /api/admin/orders/clear-all
 * Permanently delete all orders and order items.
 * Does not restore inventory or delete products.
 */
import { requireAdminAuth } from '~/server/utils/adminAuth'

const CONFIRM_PHRASE = 'DELETE ALL ORDERS'

async function listAllIds(
  strapiUrl: string,
  headers: Record<string, string>,
  collection: string
): Promise<number[]> {
  const ids: number[] = []
  let page = 1
  const pageSize = 100

  while (page <= 50) {
    const params = new URLSearchParams()
    params.set('pagination[page]', String(page))
    params.set('pagination[pageSize]', String(pageSize))
    params.set('fields[0]', 'id')
    params.set('sort', 'id:asc')

    const res = await $fetch<{ data: { id: number }[]; meta?: { pagination?: { pageCount?: number } } }>(
      `${strapiUrl}/api/${collection}?${params.toString()}`,
      { headers }
    )
    const batch = (res.data || []).map((row) => row.id).filter(Boolean)
    ids.push(...batch)

    const pageCount = Number(res.meta?.pagination?.pageCount || 1)
    if (page >= pageCount || batch.length === 0) break
    page += 1
  }

  return ids
}

async function deleteById(
  strapiUrl: string,
  headers: Record<string, string>,
  collection: string,
  id: number
) {
  await $fetch(`${strapiUrl}/api/${collection}/${id}`, {
    method: 'DELETE',
    headers,
  })
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  requireAdminAuth(event, config.ownerSessionSecret as string)

  const body = await readBody<{ confirm?: string }>(event).catch(() => ({}))
  if (String(body?.confirm || '').trim() !== CONFIRM_PHRASE) {
    throw createError({
      statusCode: 400,
      message: `Type ${CONFIRM_PHRASE} to confirm.`,
    })
  }

  const strapiUrl = String(config.public.strapiUrl || '').replace(/\/$/, '')
  const strapiToken = config.strapiToken as string
  if (!strapiUrl || !strapiToken) {
    throw createError({ statusCode: 500, message: 'Strapi is not configured.' })
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${strapiToken}`,
    'Content-Type': 'application/json',
  }

  let unlinkedAdjustments = 0
  let deletedItems = 0
  let deletedOrders = 0
  const errors: string[] = []

  try {
    // Unlink inventory logs so order deletes are not blocked by relations.
    const adjustmentIds = await listAllIds(strapiUrl, headers, 'inventory-adjustments')
    for (const id of adjustmentIds) {
      try {
        await $fetch(`${strapiUrl}/api/inventory-adjustments/${id}`, {
          method: 'PUT',
          headers,
          body: { data: { relatedOrder: null } },
        })
        unlinkedAdjustments += 1
      } catch {
        // Adjustment may already have no order; continue.
      }
    }
  } catch (err: any) {
    errors.push(`inventory-adjustments: ${err?.message || 'unlink failed'}`)
  }

  try {
    const itemIds = await listAllIds(strapiUrl, headers, 'order-items')
    for (const id of itemIds) {
      try {
        await deleteById(strapiUrl, headers, 'order-items', id)
        deletedItems += 1
      } catch (err: any) {
        errors.push(`order-item ${id}`)
      }
    }
  } catch (err: any) {
    throw createError({
      statusCode: 502,
      message: err?.message || 'Could not load order items.',
    })
  }

  try {
    const orderIds = await listAllIds(strapiUrl, headers, 'orders')
    for (const id of orderIds) {
      try {
        await deleteById(strapiUrl, headers, 'orders', id)
        deletedOrders += 1
      } catch (err: any) {
        errors.push(`order ${id}`)
      }
    }
  } catch (err: any) {
    throw createError({
      statusCode: 502,
      message: err?.message || 'Could not load orders.',
    })
  }

  return {
    ok: errors.length === 0,
    deletedOrders,
    deletedItems,
    unlinkedAdjustments,
    remainingErrors: errors.slice(0, 20),
    message:
      errors.length === 0
        ? `Deleted ${deletedOrders} orders and ${deletedItems} line items. Inventory was not restored.`
        : `Deleted ${deletedOrders} orders and ${deletedItems} line items, with ${errors.length} leftover error(s). Inventory was not restored.`,
  }
})
