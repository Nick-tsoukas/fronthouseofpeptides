/**
 * GET /api/products
 * Public storefront product list (server-side Strapi token + absolute image URLs).
 */
import { mapStorefrontProduct } from '~/server/utils/storefrontProducts'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const strapiUrl = (config.public.strapiUrl as string) || ''
  const strapiToken = config.strapiToken as string

  if (!strapiUrl) {
    throw createError({ statusCode: 500, message: 'STRAPI_URL is not configured.' })
  }

  const headers: Record<string, string> = {
    Accept: 'application/json',
  }
  if (strapiToken) {
    headers.Authorization = `Bearer ${strapiToken}`
  }

  const params = new URLSearchParams()
  params.set('filters[active][$eq]', 'true')
  params.set('populate[image]', 'true')
  params.set('populate[variants]', 'true')
  params.set('sort', 'name:asc')
  params.set('pagination[pageSize]', '100')

  try {
    const response = await $fetch<{ data: any[] }>(
      `${strapiUrl}/api/products?${params.toString()}`,
      { headers }
    )

    const products = (response.data || []).map((entry) =>
      mapStorefrontProduct(strapiUrl, entry)
    )

    return { ok: true, data: products }
  } catch (err: any) {
    console.error('[api/products] fetch failed:', err?.message || err)
    throw createError({
      statusCode: 502,
      message: 'Failed to load products.',
    })
  }
})
