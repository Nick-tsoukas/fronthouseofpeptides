import type { Product } from '~/types'
import { mockProducts } from '~/data/mockProducts'

// Set to true to use mock data (no backend required)
const USE_MOCK_DATA = false

export function useProducts() {
  const fetchProducts = async (): Promise<Product[]> => {
    if (USE_MOCK_DATA) {
      await new Promise((resolve) => setTimeout(resolve, 300))
      return mockProducts.filter((p) => p.attributes.active)
    }

    try {
      // BFF: server uses Strapi token and returns absolute image URLs
      const response = await $fetch<{ ok: boolean; data: Product[] }>('/api/products')
      return response.data || []
    } catch (error) {
      console.error('Error fetching products:', error)
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
      return response.data || null
    } catch (error) {
      console.error('Error fetching product:', error)
      return null
    }
  }

  return {
    fetchProducts,
    fetchProductBySlug,
  }
}
