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
    paymentProvider: a.paymentProvider || null,
    paymentMethod: a.paymentMethod || null,
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

function applyManualCashAppOr(params: URLSearchParams, andIndex: number) {
  // paymentProvider cashapp_manual | manual | paymentMethod cashapp
  params.set(`filters[$and][${andIndex}][$or][0][paymentProvider][$eq]`, 'cashapp_manual')
  params.set(`filters[$and][${andIndex}][$or][1][paymentProvider][$eq]`, 'manual')
  params.set(`filters[$and][${andIndex}][$or][2][paymentMethod][$eq]`, 'cashapp')
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

  if (filter === 'pending') {
    params.set('filters[paymentStatus][$eq]', 'pending')
  } else if (filter === 'processing') {
    params.set('filters[paymentStatus][$eq]', 'processing')
  } else if (filter === 'needs_verification') {
    params.set('filters[$and][0][paymentStatus][$eq]', 'processing')
    applyManualCashAppOr(params, 1)
  } else if (filter === 'awaiting_cashapp') {
    params.set('filters[$and][0][paymentStatus][$eq]', 'pending')
    applyManualCashAppOr(params, 1)
  } else if (filter === 'paid' || filter === 'new_paid') {
    params.set('filters[$and][0][paymentStatus][$eq]', 'paid')
    params.set('filters[$and][1][shippingStatus][$notIn][0]', 'shipped')
    params.set('filters[$and][1][shippingStatus][$notIn][1]', 'delivered')
  } else if (filter === 'ready_to_ship' || filter === 'ready_to_fulfill') {
    // Paid orders that still need a label or manual tracking
    params.set('filters[$and][0][paymentStatus][$eq]', 'paid')
    params.set('filters[$and][1][shippingStatus][$notIn][0]', 'label_purchased')
    params.set('filters[$and][1][shippingStatus][$notIn][1]', 'manual_tracking_added')
    params.set('filters[$and][1][shippingStatus][$notIn][2]', 'shipped')
    params.set('filters[$and][1][shippingStatus][$notIn][3]', 'in_transit')
    params.set('filters[$and][1][shippingStatus][$notIn][4]', 'delivered')
    params.set('filters[$and][1][shippingStatus][$notIn][5]', 'label_purchasing')
  } else if (filter === 'label_purchased' || filter === 'label_tracking_ready') {
    params.set('filters[$or][0][shippingStatus][$eq]', 'label_purchased')
    params.set('filters[$or][1][shippingStatus][$eq]', 'manual_tracking_added')
  } else if (filter === 'failed') {
    params.set('filters[paymentStatus][$eq]', 'failed')
  } else if (filter === 'attention') {
    params.set('filters[$or][0][paymentStatus][$eq]', 'failed')
    params.set('filters[$or][1][shippingStatus][$eq]', 'label_failed')
  } else if (filter === 'cancelled' || filter === 'canceled') {
    params.set('filters[$or][0][paymentStatus][$eq]', 'cancelled')
    params.set('filters[$or][1][status][$eq]', 'cancelled')
  } else if (filter === 'shipped') {
    params.set('filters[$or][0][shippingStatus][$eq]', 'shipped')
    params.set('filters[$or][1][shippingStatus][$eq]', 'delivered')
    params.set('filters[$or][2][shippingStatus][$eq]', 'in_transit')
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
