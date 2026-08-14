import { getProductImageFallback } from '~/utils/productImageFallbacks'

export type ProductImageSource = 'uploaded' | 'generated' | 'placeholder'

export function generatedProductImagePath(productId: number | string): string {
  return `/product-images/generated/product-${productId}.svg`
}

function uploadedFromMedia(product: any): string | null {
  const attrs = product?.attributes || product || {}
  const image = attrs.image
  const nested = image?.data?.attributes || image?.data || null
  if (nested?.url || nested?.formats) {
    return (
      nested.formats?.medium?.url ||
      nested.formats?.large?.url ||
      nested.formats?.small?.url ||
      nested.url ||
      null
    )
  }
  if (image && typeof image === 'object' && (image.url || image.formats)) {
    return image.formats?.medium?.url || image.url || null
  }
  return null
}

/**
 * Storefront/admin display image.
 * Priority: uploaded → generated → placeholder (null).
 */
export function getProductImage(product: any): {
  url: string | null
  source: ProductImageSource
} {
  if (!product) return { url: null, source: 'placeholder' }

  const attrs = product.attributes || product
  const sourceHint = attrs.imageSource as ProductImageSource | undefined
  const generated =
    (typeof attrs.generatedImageUrl === 'string' && attrs.generatedImageUrl) ||
    (product.id ? generatedProductImagePath(product.id) : null)

  const mediaUrl = uploadedFromMedia(product)
  const resolved = typeof attrs.imageUrl === 'string' && attrs.imageUrl ? attrs.imageUrl : null

  // Explicit uploaded source from BFF
  if (sourceHint === 'uploaded' && resolved) {
    return { url: resolved, source: 'uploaded' }
  }

  if (mediaUrl && !String(mediaUrl).includes('/product-images/generated/')) {
    return { url: mediaUrl, source: 'uploaded' }
  }

  if (resolved && !resolved.includes('/product-images/generated/')) {
    return { url: resolved, source: 'uploaded' }
  }

  const slugFallback = getProductImageFallback(attrs.slug)
  if (slugFallback) {
    return { url: slugFallback, source: 'uploaded' }
  }

  if (generated) {
    return { url: generated, source: 'generated' }
  }

  if (resolved) {
    return { url: resolved, source: sourceHint || 'generated' }
  }

  return { url: null, source: 'placeholder' }
}
