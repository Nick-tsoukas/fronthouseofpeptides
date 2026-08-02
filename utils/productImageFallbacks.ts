/**
 * Same-origin product images under /public/product-images/
 * Used when Strapi has no media linked to the product.
 */
export const PRODUCT_IMAGE_FALLBACKS: Record<string, string> = {
  'klow-blend': '/product-images/klow-blend.png',
}

export function getProductImageFallback(slug: string | null | undefined): string | null {
  if (!slug) return null
  return PRODUCT_IMAGE_FALLBACKS[slug] || null
}
