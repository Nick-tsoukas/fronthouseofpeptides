import { requireAdminAuth } from '~/server/utils/adminAuth'

function centsOrFallback(cents: unknown, dollars: unknown) {
  const c = Number(cents)
  if (Number.isFinite(c) && c >= 0) return c
  const d = Number(dollars)
  if (Number.isFinite(d) && d >= 0) return Math.round(d * 100)
  return 0
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  requireAdminAuth(event, config.ownerSessionSecret as string)

  const id = getRouterParam(event, 'id')
  if (!id || isNaN(Number(id))) {
    throw createError({ statusCode: 400, message: 'Invalid order ID.' })
  }

  const strapiUrl = config.public.strapiUrl as string
  const strapiToken = config.strapiToken as string

  const params = new URLSearchParams()
  params.set('populate[orderItems][populate][variant]', 'true')

  const response = await $fetch<{ data: any }>(
    `${strapiUrl}/api/orders/${id}?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${strapiToken}`,
        'Content-Type': 'application/json',
      },
    }
  ).catch(() => {
    throw createError({ statusCode: 404, message: 'Order not found.' })
  })

  const entry = response.data
  if (!entry) throw createError({ statusCode: 404, message: 'Order not found.' })

  const a = entry.attributes || {}

  return {
    ok: true,
    id: entry.id,
    orderNumber: a.orderNumber || null,
    customerName: a.customerName || a.shippingName || null,
    email: a.email || null,
    phone: a.phone || a.shippingPhone || null,
    companyName: a.companyName || null,
    status: a.status || null,
    paymentStatus: a.paymentStatus || null,
    shippingStatus: a.shippingStatus || null,
    paymentProvider: a.paymentProvider || null,
    paymentMethod: a.paymentMethod || null,
    moovTransferId: a.moovTransferId || null,
    inventoryCommitted: Boolean(a.inventoryCommitted),
    inventoryAdjusted: Boolean(a.inventoryAdjusted),
    createdAt: a.createdAt || null,
    paidAt: a.paidAt || null,
    shippingName: a.shippingName || null,
    shippingAddressLine1: a.shippingAddressLine1 || a.shippingAddress1 || null,
    shippingAddressLine2: a.shippingAddressLine2 || a.shippingAddress2 || null,
    shippingCity: a.shippingCity || null,
    shippingState: a.shippingState || null,
    shippingPostalCode: a.shippingPostalCode || null,
    shippingCountry: a.shippingCountry || null,
    shippingCarrier: a.shippingCarrier || null,
    shippingService: a.shippingService || null,
    shippoRateId: a.shippoRateId || null,
    subtotalCents: centsOrFallback(a.subtotalCents, a.amountSubtotal),
    shippingCostCents: centsOrFallback(a.shippingCostCents ?? a.shippingCents, a.shippingAmount),
    taxCents: Number(a.taxCents) || 0,
    discountCents: Number(a.discountCents) || 0,
    totalCents: centsOrFallback(a.totalCents, a.amountTotal),
    customerNotes: a.customerNotes || null,
    ownerNotes: a.ownerNotes || null,
    items: (a.orderItems?.data || []).map((item: any) => ({
      id: item.id,
      productName: item.attributes?.productNameSnapshot || '',
      variantName: item.attributes?.variantNameSnapshot || '',
      sku: item.attributes?.skuSnapshot || '',
      quantity: item.attributes?.quantity || 0,
      unitPrice: Number(item.attributes?.unitPriceSnapshot) || 0,
    })),
  }
})
