/**
 * GET /api/products/by-slug?slug=
 * Public storefront product detail.
 */
import { mapStorefrontProduct, extractProductImageUrl } from '~/server/utils/storefrontProducts'
import { getProductImageFallback } from '~/utils/productImageFallbacks'
import { ensureProductFallbackImage, variantsFromStrapi } from '~/server/utils/productImageService'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const strapiUrl = String(config.public.strapiUrl || '').replace(/\/$/, '')
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

  const attempts = [
    (() => {
      const p = new URLSearchParams()
      p.set('filters[slug][$eq]', slug)
      p.set('filters[active][$eq]', 'true')
      p.set('populate[variants]', '*')
      p.set('populate[image]', '*')
      p.set('pagination[pageSize]', '1')
      return p.toString()
    })(),
    (() => {
      const p = new URLSearchParams()
      p.set('filters[slug][$eq]', slug)
      p.set('filters[active][$eq]', 'true')
      p.set('populate[variants]', 'true')
      p.set('populate[image][fields][0]', 'url')
      p.set('populate[image][fields][1]', 'formats')
      p.set('pagination[pageSize]', '1')
      return p.toString()
    })(),
  ]

  let response: { data: any[] } | null = null
  let lastError: any = null

  for (const qs of attempts) {
    try {
      response = await $fetch<{ data: any[] }>(`${strapiUrl}/api/products?${qs}`, { headers })
      lastError = null
      break
    } catch (err: any) {
      lastError = err
      console.error('[api/products/by-slug] Strapi query failed:', err?.message || err)
    }
  }

  if (!response) {
    throw createError({
      statusCode: 502,
      message: 'Failed to load product.',
      data: { detail: String(lastError?.message || 'unknown').slice(0, 300) },
    })
  }

  const entry = response.data?.[0]
  if (!entry) {
    return { ok: true, data: null }
  }

  try {
    const uploaded = extractProductImageUrl(strapiUrl, entry)
    const slugFallback = getProductImageFallback(entry?.attributes?.slug)
    if (!uploaded && !slugFallback && entry?.id && entry?.attributes?.name) {
      await ensureProductFallbackImage({
        productId: entry.id,
        productName: entry.attributes.name,
        variants: variantsFromStrapi(entry),
        hasUploadedImage: false,
        strapiUrl,
        headers,
        force: false,
      })
      if (!entry.attributes.generatedImageUrl) {
        entry.attributes.generatedImageUrl = `/product-images/generated/product-${entry.id}.svg`
      }
    }
    return { ok: true, data: mapStorefrontProduct(strapiUrl, entry) }
  } catch {
    return {
      ok: true,
      data: {
        id: entry.id,
        attributes: {
          ...(entry.attributes || {}),
          imageUrl: null,
        },
      },
    }
  }
})
