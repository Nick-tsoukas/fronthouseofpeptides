import { requireOwnerAuth } from '~/server/utils/ownerAuth'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  requireOwnerAuth(event, config.ownerSessionSecret as string)

  const id = getRouterParam(event, 'id')
  if (!id || isNaN(Number(id))) {
    throw createError({ statusCode: 400, message: 'Invalid order ID.' })
  }

  const strapiUrl = config.public.strapiUrl
  const strapiToken = config.strapiToken as string

  const params = new URLSearchParams()
  params.set('populate[orderItems]', '*')

  const response = await $fetch<{ data: any }>(
    `${strapiUrl}/api/orders/${id}?${params.toString()}`,
    { headers: { Authorization: `Bearer ${strapiToken}` } }
  ).catch(() => {
    throw createError({ statusCode: 404, message: 'Order not found.' })
  })

  const entry = response.data
  if (!entry) throw createError({ statusCode: 404, message: 'Order not found.' })

  const a = entry.attributes

  return {
    id: entry.id,
    customerName: a.customerName,
    email: a.email,
    phone: a.phone || null,
    companyName: a.companyName || null,
    customerNotes: a.customerNotes || null,
    ownerNotes: a.ownerNotes || null,
    status: a.status,
    inventoryAdjusted: a.inventoryAdjusted ?? false,
    reviewedAt: a.reviewedAt || null,
    shippingName: a.shippingName || null,
    shippingAddressLine1: a.shippingAddressLine1 || null,
    shippingAddressLine2: a.shippingAddressLine2 || null,
    shippingCity: a.shippingCity || null,
    shippingState: a.shippingState || null,
    shippingPostalCode: a.shippingPostalCode || null,
    shippingCountry: a.shippingCountry || null,
    amountSubtotal: a.amountSubtotal,
    shippingAmount: a.shippingAmount,
    amountTotal: a.amountTotal,
    currency: a.currency,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
    confirmationAccepted: a.confirmationAccepted ?? false,
    items: (a.orderItems?.data || []).map((item: any) => ({
      id: item.id,
      productName: item.attributes.productNameSnapshot,
      variantName: item.attributes.variantNameSnapshot,
      sku: item.attributes.skuSnapshot,
      quantity: item.attributes.quantity,
      unitPrice: item.attributes.unitPriceSnapshot,
    })),
  }
})
