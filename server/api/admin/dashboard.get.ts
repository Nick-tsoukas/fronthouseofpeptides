import { requireAdminAuth } from '~/server/utils/adminAuth'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  requireAdminAuth(event, config.ownerSessionSecret as string)

  const strapiUrl = config.public.strapiUrl as string
  const strapiToken = config.strapiToken as string
  const headers = {
    Authorization: `Bearer ${strapiToken}`,
    'Content-Type': 'application/json',
  }

  const ordersParams = new URLSearchParams()
  ordersParams.set('pagination[pageSize]', '100')
  ordersParams.set('sort', 'createdAt:desc')
  ordersParams.set('fields[0]', 'paymentStatus')
  ordersParams.set('fields[1]', 'status')
  ordersParams.set('fields[2]', 'totalCents')
  ordersParams.set('fields[3]', 'amountTotal')
  ordersParams.set('fields[4]', 'shippingStatus')

  const productsParams = new URLSearchParams()
  productsParams.set('populate[variants][fields][0]', 'inventory')
  productsParams.set('populate[variants][fields][1]', 'active')
  productsParams.set('pagination[pageSize]', '100')

  const [ordersRes, productsRes] = await Promise.all([
    $fetch<{ data: any[]; meta: any }>(`${strapiUrl}/api/orders?${ordersParams}`, { headers }).catch(
      () => ({ data: [], meta: null })
    ),
    $fetch<{ data: any[] }>(`${strapiUrl}/api/products?${productsParams}`, { headers }).catch(() => ({
      data: [],
    })),
  ])

  const orders = ordersRes.data || []
  let paidOrders = 0
  let pendingProcessing = 0
  let revenueCents = 0

  for (const entry of orders) {
    const a = entry.attributes || {}
    const paymentStatus = a.paymentStatus || ''
    if (paymentStatus === 'paid') {
      paidOrders += 1
      const totalCents = Number(a.totalCents)
      if (Number.isFinite(totalCents) && totalCents > 0) revenueCents += totalCents
      else revenueCents += Math.round((Number(a.amountTotal) || 0) * 100)
    }
    if (paymentStatus === 'pending' || paymentStatus === 'processing') {
      pendingProcessing += 1
    }
  }

  let lowStock = 0
  let outOfStock = 0
  for (const product of productsRes.data || []) {
    const variants = product.attributes?.variants?.data || []
    for (const v of variants) {
      const inv = v.attributes?.inventory
      if (inv === null || inv === undefined) continue
      if (Number(inv) <= 0) outOfStock += 1
      else if (Number(inv) <= 5) lowStock += 1
    }
  }

  return {
    ok: true,
    totalOrders: ordersRes.meta?.pagination?.total ?? orders.length,
    pendingProcessingOrders: pendingProcessing,
    paidOrders,
    revenueCents,
    lowStockVariants: lowStock,
    outOfStockVariants: outOfStock,
    recentOrders: orders.slice(0, 5).map((entry: any) => {
      const a = entry.attributes || {}
      return {
        id: entry.id,
        paymentStatus: a.paymentStatus || null,
        status: a.status || null,
        totalCents:
          Number(a.totalCents) ||
          Math.round((Number(a.amountTotal) || 0) * 100),
      }
    }),
  }
})
