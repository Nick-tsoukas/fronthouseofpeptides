import { requireOwnerAuth } from '~/server/utils/ownerAuth'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  requireOwnerAuth(event, config.ownerSessionSecret as string)

  const strapiUrl = config.public.strapiUrl
  const strapiToken = config.strapiToken as string

  const params = new URLSearchParams()
  params.set('populate[variants][fields][0]', 'id')
  params.set('populate[variants][fields][1]', 'name')
  params.set('populate[variants][fields][2]', 'sku')
  params.set('populate[variants][fields][3]', 'price')
  params.set('populate[variants][fields][4]', 'active')
  params.set('populate[variants][fields][5]', 'inventory')
  params.set('populate[image][fields][0]', 'url')
  params.set('populate[image][fields][1]', 'formats')
  params.set('sort', 'name:asc')
  params.set('pagination[pageSize]', '100')

  const response = await $fetch<{ data: any[] }>(
    `${strapiUrl}/api/products?${params.toString()}`,
    { headers: { Authorization: `Bearer ${strapiToken}` } }
  ).catch(() => {
    throw createError({ statusCode: 502, message: 'Could not reach product database.' })
  })

  const products = (response.data || []).map((entry: any) => {
    const a = entry.attributes
    const variants = (a.variants?.data || []).map((v: any) => ({
      id: v.id,
      name: v.attributes.name,
      sku: v.attributes.sku,
      price: v.attributes.price,
      active: v.attributes.active ?? true,
      inventory: v.attributes.inventory ?? null,
    }))

    const totalStock = variants.reduce((sum: number, v: any) => {
      return v.inventory !== null ? sum + v.inventory : sum
    }, 0)
    const hasUntracked = variants.some((v: any) => v.inventory === null)
    const isLowStock = !hasUntracked && variants.some((v: any) => v.inventory !== null && v.inventory <= 10)
    const imageUrl = a.image?.data?.attributes?.formats?.small?.url
      || a.image?.data?.attributes?.url
      || null

    return {
      id: entry.id,
      name: a.name,
      slug: a.slug,
      shortDescription: a.shortDescription || null,
      active: a.active ?? true,
      badgeText: a.badgeText || null,
      imageUrl,
      variantCount: variants.length,
      totalStock,
      hasUntracked,
      isLowStock,
      variants,
    }
  })

  return { products }
})
