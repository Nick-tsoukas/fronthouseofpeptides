import { requireOwnerAuth } from '~/server/utils/ownerAuth'

function normalizeOrder(entry: any) {
  const a = entry.attributes
  return {
    id: entry.id,
    customerName: a.customerName,
    email: a.email,
    phone: a.phone || null,
    companyName: a.companyName || null,
    status: a.status,
    amountTotal: a.amountTotal,
    inventoryAdjusted: a.inventoryAdjusted ?? false,
    itemCount: a.orderItems?.data?.length ?? 0,
    createdAt: a.createdAt,
  }
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  requireOwnerAuth(event, config.ownerSessionSecret as string)

  const query = getQuery(event)
  const status = query.status as string | undefined
  const search = (query.search as string | undefined)?.toLowerCase().trim()
  const page = parseInt((query.page as string) || '1', 10)
  const pageSize = 50

  const strapiUrl = config.public.strapiUrl
  const strapiToken = config.strapiToken as string

  const params = new URLSearchParams()
  params.set('populate[orderItems][fields][0]', 'id')
  params.set('sort', 'createdAt:desc')
  params.set('pagination[page]', String(page))
  params.set('pagination[pageSize]', String(pageSize))

  if (status && status !== 'all') {
    params.set('filters[status][$eq]', status)
  }

  const response = await $fetch<{ data: any[]; meta: any }>(
    `${strapiUrl}/api/orders?${params.toString()}`,
    { headers: { Authorization: `Bearer ${strapiToken}` } }
  ).catch(() => {
    throw createError({ statusCode: 502, message: 'Could not reach order database.' })
  })

  let orders = (response.data || []).map(normalizeOrder)

  if (search) {
    orders = orders.filter(
      (o) =>
        o.customerName?.toLowerCase().includes(search) ||
        o.email?.toLowerCase().includes(search) ||
        String(o.id).includes(search)
    )
  }

  return {
    orders,
    pagination: response.meta?.pagination || null,
  }
})
