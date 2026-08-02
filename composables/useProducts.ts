import type { Product } from '~/types'
import { mockProducts } from '~/data/mockProducts'
import { getProductImageFallback } from '~/utils/productImageFallbacks'

const USE_MOCK_DATA = false

function absoluteMediaUrl(strapiUrl: string, url: string | null | undefined): string | null {
  if (!url) return null
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url
  // Same-origin public assets — do not prefix Strapi
  if (url.startsWith('/') && !url.startsWith('/uploads')) return url
  const base = strapiUrl.replace(/\/$/, '')
  return url.startsWith('/') ? `${base}${url}` : `${base}/${url}`
}

/** Normalize image URLs when using the direct-Strapi fallback path. */
function normalizeProductImages(strapiUrl: string, products: any[]): Product[] {
  return (products || []).map((entry) => {
    const attrs = entry?.attributes || {}
    const imageData = attrs.image?.data
    const raw =
      imageData?.attributes?.formats?.medium?.url ||
      imageData?.attributes?.formats?.small?.url ||
      imageData?.attributes?.url ||
      null
    let imageUrl = absoluteMediaUrl(strapiUrl, raw) || getProductImageFallback(attrs.slug)

    let image = attrs.image
    if (imageData?.attributes) {
      image = {
        data: {
          id: imageData.id,
          attributes: {
            ...imageData.attributes,
            url: absoluteMediaUrl(strapiUrl, imageData.attributes.url) || imageData.attributes.url,
            formats: imageData.attributes.formats
              ? Object.fromEntries(
                  Object.entries(imageData.attributes.formats).map(([k, fmt]: [string, any]) => [
                    k,
                    fmt && typeof fmt === 'object'
                      ? { ...fmt, url: absoluteMediaUrl(strapiUrl, fmt.url) || fmt.url }
                      : fmt,
                  ])
                )
              : imageData.attributes.formats,
          },
        },
      }
    } else if (imageUrl) {
      image = {
        data: {
          id: 0,
          attributes: {
            url: imageUrl,
            alternativeText: attrs.name || null,
            width: 0,
            height: 0,
            formats: null,
          },
        },
      }
    }

    return {
      id: entry.id,
      attributes: {
        ...attrs,
        image,
        imageUrl,
      },
    } as Product
  })
}

async function fetchProductsFromStrapiDirect(): Promise<Product[]> {
  const config = useRuntimeConfig()
  const strapiUrl = String(config.public.strapiUrl || '').replace(/\/$/, '')
  if (!strapiUrl) return []

  // Exact query that previously powered the homepage successfully
  const response = await $fetch<{ data: any[] }>(
    `${strapiUrl}/api/products?filters[active][$eq]=true&populate[variants]=*&populate[image]=*&pagination[pageSize]=100&sort=name:asc`
  )
  return normalizeProductImages(strapiUrl, response.data || [])
}

export function useProducts() {
  const fetchProducts = async (): Promise<Product[]> => {
    if (USE_MOCK_DATA) {
      await new Promise((resolve) => setTimeout(resolve, 300))
      return mockProducts.filter((p) => p.attributes.active)
    }

    // 1) Prefer BFF (absolute URLs + server token)
    try {
      const response = await $fetch<{ ok: boolean; data: Product[] }>('/api/products')
      if (Array.isArray(response?.data)) {
        return response.data
      }
    } catch (error) {
      console.error('[useProducts] BFF /api/products failed, trying direct Strapi:', error)
    }

    // 2) Fallback: previous working client/server Strapi path
    try {
      return await fetchProductsFromStrapiDirect()
    } catch (error) {
      console.error('[useProducts] Direct Strapi products fetch failed:', error)
      return []
    }
  }

  const fetchProductBySlug = async (slug: string): Promise<Product | null> => {
    if (USE_MOCK_DATA) {
      await new Promise((resolve) => setTimeout(resolve, 200))
      return mockProducts.find((p) => p.attributes.slug === slug) || null
    }

    try {
      const response = await $fetch<{ ok: boolean; data: Product | null }>('/api/products/by-slug', {
        query: { slug },
      })
      if (response?.data) return response.data
      if (response?.ok && response.data === null) return null
    } catch (error) {
      console.error('[useProducts] BFF by-slug failed, trying direct Strapi:', error)
    }

    try {
      const config = useRuntimeConfig()
      const strapiUrl = String(config.public.strapiUrl || '').replace(/\/$/, '')
      const response = await $fetch<{ data: any[] }>(
        `${strapiUrl}/api/products?filters[slug][$eq]=${encodeURIComponent(slug)}&filters[active][$eq]=true&populate[variants]=*&populate[image]=*`
      )
      const mapped = normalizeProductImages(strapiUrl, response.data || [])
      return mapped[0] || null
    } catch (error) {
      console.error('[useProducts] Direct Strapi by-slug failed:', error)
      return null
    }
  }

  return {
    fetchProducts,
    fetchProductBySlug,
  }
}
