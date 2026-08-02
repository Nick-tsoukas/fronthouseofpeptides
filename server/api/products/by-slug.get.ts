/**
 * GET /api/products/by-slug?slug=
 * Public storefront product detail.
 */
import { mapStorefrontProduct } from '~/server/utils/storefrontProducts'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const strapiUrl = (config.public.strapiUrl as string) || ''
  const strapiToken = config.strapiToken as string
  const query = getQuery(event)
  const slug = String(query.slug || '').trim()

  if (!slug) {
    throw createError({ statusCode: 400, message: 'Missing product slug.' })
  }

  const headers: Record<string, string> = {
    Accept: 'application/json',
  }
  if (strapiToken) {
    headers.Authorization = `Bearer ${strapiToken}`
  }

  const params = new URLSearchParams()
  params.set('filters[slug][$eq]', slug)
  params.set('filters[active][$eq]', 'true')
  params.set('populate[image]', 'true')
  params.set('populate[variants]', 'true')
  params.set('pagination[pageSize]', '1')

  try {
    const response = await $fetch<{ data: any[] }>(
      `${strapiUrl}/api/products?${params.toString()}`,
      { headers }
    )
    const entry = response.data?.[0]
    if (!entry) {
      return { ok: true, data: null }
    }
    return { ok: true, data: mapStorefrontProduct(strapiUrl, entry) }
  } catch (err: any) {
    console.error('[api/products/by-slug] fetch failed:', err?.message || err)
    throw createError({
      statusCode: 502,
      message: 'Failed to load product.',
    })
  }
})
