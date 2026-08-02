/**
 * Normalize Strapi media URL to absolute.
 */
export function absoluteStrapiMediaUrl(
  strapiUrl: string,
  url: string | null | undefined
): string | null {
  if (!url) return null
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url
  }
  const base = strapiUrl.replace(/\/$/, '')
  return url.startsWith('/') ? `${base}${url}` : `${base}/${url}`
}

/**
 * Extract a usable image URL from Strapi v4 (nested) or flatter media shapes.
 */
export function extractProductImageUrl(strapiUrl: string, productEntry: any): string | null {
  const attrs = productEntry?.attributes || productEntry || {}
  const image = attrs.image

  // v4 relation: image.data.attributes.url
  const nested = image?.data?.attributes || image?.data || null
  if (nested) {
    const url =
      nested.formats?.medium?.url ||
      nested.formats?.small?.url ||
      nested.formats?.thumbnail?.url ||
      nested.url ||
      null
    return absoluteStrapiMediaUrl(strapiUrl, url)
  }

  // Already flattened / plugin variants
  if (image && typeof image === 'object') {
    const url =
      image.formats?.medium?.url ||
      image.formats?.small?.url ||
      image.url ||
      null
    return absoluteStrapiMediaUrl(strapiUrl, url)
  }

  return null
}

/**
 * Map a Strapi product entry into storefront-friendly shape with absolute imageUrl.
 */
export function mapStorefrontProduct(strapiUrl: string, entry: any) {
  const attrs = entry?.attributes || {}
  const imageUrl = extractProductImageUrl(strapiUrl, entry)
  const imageData = attrs.image?.data

  // Keep Strapi shape for existing components, but ensure nested URL is absolute
  let image = attrs.image
  if (imageData?.attributes?.url) {
    const abs = absoluteStrapiMediaUrl(strapiUrl, imageData.attributes.url)
    const formats = imageData.attributes.formats
      ? Object.fromEntries(
          Object.entries(imageData.attributes.formats).map(([key, fmt]: [string, any]) => [
            key,
            fmt && typeof fmt === 'object'
              ? { ...fmt, url: absoluteStrapiMediaUrl(strapiUrl, fmt.url) || fmt.url }
              : fmt,
          ])
        )
      : imageData.attributes.formats

    image = {
      data: {
        id: imageData.id,
        attributes: {
          ...imageData.attributes,
          url: abs || imageData.attributes.url,
          formats,
        },
      },
    }
  } else if (imageUrl && !imageData) {
    // Flat / unexpected shape — synthesize v4-like structure for ProductCard
    image = {
      data: {
        id: attrs.image?.id || 0,
        attributes: {
          url: imageUrl,
          alternativeText: null,
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
      // Convenience field used by hardened ProductCard
      imageUrl,
    },
  }
}
