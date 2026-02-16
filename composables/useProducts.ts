import type { Product, StrapiResponse } from '~/types'
import { mockProducts } from '~/data/mockProducts'

// Set to true to use mock data (no backend required)
const USE_MOCK_DATA = true

export function useProducts() {
  const config = useRuntimeConfig()
  const strapiUrl = config.public.strapiUrl

  const fetchProducts = async (): Promise<Product[]> => {
    // Use mock data for demo/MVP
    if (USE_MOCK_DATA) {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300))
      return mockProducts.filter(p => p.attributes.active)
    }

    try {
      const response = await $fetch<StrapiResponse<Product[]>>(
        `${strapiUrl}/api/products?populate=variants`
      )
      return response.data || []
    } catch (error) {
      console.error('Error fetching products:', error)
      return []
    }
  }

  const fetchProductBySlug = async (slug: string): Promise<Product | null> => {
    // Use mock data for demo/MVP
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 200))
      return mockProducts.find(p => p.attributes.slug === slug) || null
    }

    try {
      const response = await $fetch<StrapiResponse<Product[]>>(
        `${strapiUrl}/api/products?filters[slug][$eq]=${slug}&populate=variants`
      )
      return response.data?.[0] || null
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
