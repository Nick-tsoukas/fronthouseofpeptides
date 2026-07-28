import { requireAdminAuth } from '~/server/utils/adminAuth'

function dollarsFromOrder(a: Record<string, any>) {
  const totalCents = Number(a.totalCents)
  if (Number.isFinite(totalCents) && totalCents > 0) return totalCents / 100
  return Number(a.amountTotal) || 0
}

function centsOrFallback(cents: unknown, dollars: unknown) {
  const c = Number(cents)
  if (Number.isFinite(c) && c >= 0) return c
  const d = Number(dollars)
  if (Number.isFinite(d) && d >= 0) return Math.round(d * 100)
  return 0
}

function normalizeOrder(entry: any) {
  const a = entry.attributes || {}
  return {
    id: entry.id,
    orderNumber: a.orderNumber || null,
    customerName: a.customerName || a.shippingName || 'N/A',
    email: a.email || '',
    phone: a.phone || null,
    status: a.status || null,
    paymentStatus: a.paymentStatus || null,
    shippingStatus: a.shippingStatus || null,
    subtotalCents: centsOrFallback(a.subtotalCents, a.amountSubtotal),
    shippingCostCents: centsOrFallback(a.shippingCostCents ?? a.shippingCents, a.shippingAmount),
    taxCents: Number(a.taxCents) || 0,
    totalCents: centsOrFallback(a.totalCents, a.amountTotal),
    amountTotal: dollarsFromOrder(a),
    createdAt: a.createdAt || null,
    paidAt: a.paidAt || null,
    inventoryCommitted: Boolean(a.inventoryCommitted),
    shippingCarrier: a.shippingCarrier || null,
    shippingService: a.shippingService || null,
  }
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  requireAdminAuth(event, config.ownerSessionSecret as string)

  const query = getQuery(event)
  const filter = String(query.filter || 'all').toLowerCase()
  const search = String(query.search || '').toLowerCase().trim()
  const page = Math.max(1, parseInt(String(query.page || '1'), 10) || 1)
  const pageSize = Math.min(100, Math.max(1, parseInt(String(query.pageSize || '50'), 10) || 50))

  const strapiUrl = config.public.strapiUrl as string
  const strapiToken = config.strapiToken as string

  const params = new URLSearchParams()
  params.set('sort', 'createdAt:desc')
  params.set('pagination[page]', String(page))
  params.set('pagination[pageSize]', String(pageSize))
  params.set('populate[orderItems][fields][0]', 'id')

  // Prefer paymentStatus / shippingStatus filters matching commerce reality
  if (filter === 'pending') {
    params.set('filters[paymentStatus][$eq]', 'pending')
  } else if (filter === 'processing') {
    params.set('filters[paymentStatus][$eq]', 'processing')
  } else if (filter === 'paid') {
    params.set('filters[paymentStatus][$eq]', 'paid')
  } else if (filter === 'failed') {
    params.set('filters[paymentStatus][$eq]', 'failed')
  } else if (filter === 'cancelled' || filter === 'canceled') {
    params.set('filters[$or][0][paymentStatus][$eq]', 'cancelled')
    params.set('filters[$or][1][status][$eq]', 'cancelled')
  } else if (filter === 'shipped') {
    params.set('filters[shippingStatus][$eq]', 'shipped')
  }

  const response = await $fetch<{ data: any[]; meta: any }>(
    `${strapiUrl}/api/orders?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${strapiToken}`,
        'Content-Type': 'application/json',
      },
    }
  ).catch((err: any) => {
    console.error('Admin orders list failed:', err?.message || err)
    throw createError({ statusCode: 502, message: 'Could not load orders.' })
  })

  let orders = (response.data || []).map(normalizeOrder)

  if (search) {
    orders = orders.filter(
      (o) =>
        o.customerName?.toLowerCase().includes(search) ||
        o.email?.toLowerCase().includes(search) ||
        o.orderNumber?.toLowerCase().includes(search) ||
        String(o.id).includes(search)
    )
  }

  return {
    ok: true,
    orders,
    pagination: response.meta?.pagination || null,
  }
})
