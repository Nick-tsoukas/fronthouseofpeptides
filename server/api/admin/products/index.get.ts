/**
 * GET /api/admin/products
 * Fetch all products with variants for admin (server-side Strapi token).
 */
import { requireAdminAuth } from '~/server/utils/adminAuth'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  requireAdminAuth(event, config.ownerSessionSecret as string)

  const strapiUrl = config.public.strapiUrl as string
  const strapiToken = config.strapiToken as string

  const params = new URLSearchParams()
  params.set('populate[variants][fields][0]', 'id')
  params.set('populate[variants][fields][1]', 'name')
  params.set('populate[variants][fields][2]', 'sku')
  params.set('populate[variants][fields][3]', 'price')
  params.set('populate[variants][fields][4]', 'active')
  params.set('populate[variants][fields][5]', 'inventory')
  params.set('sort', 'name:asc')
  params.set('pagination[pageSize]', '100')

  const response = await $fetch<{ data: any[] }>(
    `${strapiUrl}/api/products?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${strapiToken}`,
        'Content-Type': 'application/json',
      },
    }
  ).catch((err: any) => {
    console.error('Admin products fetch failed:', err?.message || err)
    throw createError({ statusCode: 502, message: 'Failed to fetch products' })
  })

  const products = (response.data || []).map((entry: any) => {
    const a = entry.attributes || {}
    const variants = (a.variants?.data || []).map((v: any) => ({
      id: v.id,
      name: v.attributes?.name || '',
      sku: v.attributes?.sku || '',
      price: Number(v.attributes?.price) || 0,
      active: v.attributes?.active ?? true,
      inventory:
        v.attributes?.inventory === null || v.attributes?.inventory === undefined
          ? null
          : Number(v.attributes.inventory),
    }))

    const tracked = variants.filter((v: any) => v.inventory !== null)
    const totalStock = tracked.reduce((sum: number, v: any) => sum + (v.inventory || 0), 0)
    const hasUntracked = variants.some((v: any) => v.inventory === null)

    return {
      id: entry.id,
      name: a.name,
      slug: a.slug,
      active: a.active ?? true,
      variantCount: variants.length,
      totalStock,
      hasUntracked,
      variants,
    }
  })

  return { ok: true, products }
})
