/**
 * GET /api/products
 * Public storefront product list (server-side Strapi token + absolute image URLs).
 *
 * Resilience:
 * - Prefer field/relation populate that Strapi accepts
 * - Fall back to populate=* if needed
 * - Never throw away a successful product list because of image mapping
 */
import { mapStorefrontProduct, extractProductImageUrl } from '~/server/utils/storefrontProducts'
import { getProductImageFallback } from '~/utils/productImageFallbacks'
import { ensureProductFallbackImage, variantsFromStrapi } from '~/server/utils/productImageService'

async function fetchStrapiProducts(
  strapiUrl: string,
  headers: Record<string, string>,
  query: string
) {
  return await $fetch<{ data: any[] }>(`${strapiUrl}/api/products?${query}`, { headers })
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const strapiUrl = String(config.public.strapiUrl || '').replace(/\/$/, '')
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

  // Proven storefront query (this is what worked before the image BFF change)
  const primary = new URLSearchParams()
  primary.set('filters[active][$eq]', 'true')
  primary.set('populate[variants]', '*')
  primary.set('populate[image]', '*')
  primary.set('sort', 'name:asc')
  primary.set('pagination[pageSize]', '100')

  // Alternate populate style used elsewhere in admin/owner
  const secondary = new URLSearchParams()
  secondary.set('filters[active][$eq]', 'true')
  secondary.set('populate[variants]', 'true')
  secondary.set('populate[image][fields][0]', 'url')
  secondary.set('populate[image][fields][1]', 'formats')
  secondary.set('populate[image][fields][2]', 'alternativeText')
  secondary.set('sort', 'name:asc')
  secondary.set('pagination[pageSize]', '100')

  let response: { data: any[] } | null = null
  let lastError: any = null

  for (const qs of [primary.toString(), secondary.toString()]) {
    try {
      response = await fetchStrapiProducts(strapiUrl, headers, qs)
      lastError = null
      break
    } catch (err: any) {
      lastError = err
      console.error(
        '[api/products] Strapi query failed:',
        err?.statusCode || err?.response?.status || '',
        err?.message || err
      )
    }
  }

  if (!response) {
    throw createError({
      statusCode: 502,
      message: 'Failed to load products from Strapi.',
      data: {
        detail: String(lastError?.message || 'unknown').slice(0, 300),
      },
    })
  }

  const products = []
  for (const entry of response.data || []) {
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
      products.push(mapStorefrontProduct(strapiUrl, entry))
    } catch (mapErr: any) {
      console.error('[api/products] mapStorefrontProduct failed for id=', entry?.id, mapErr?.message || mapErr)
      products.push({
        id: entry.id,
        attributes: {
          ...(entry.attributes || {}),
          imageUrl: null,
        },
      })
    }
  }

  return {
    ok: true,
    data: products,
    meta: { count: products.length },
  }
})
