export function useStrapiMedia() {
  const config = useRuntimeConfig()
  const strapiUrl = String(config.public.strapiUrl || '').replace(/\/$/, '')

  const getStrapiMediaUrl = (url: string | null | undefined): string | null => {
    if (!url) return null
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return url
    }
    // Same-origin public assets (e.g. /product-images/...) — do not prefix Strapi
    if (url.startsWith('/') && !url.startsWith('/uploads')) {
      return url
    }
    if (!strapiUrl) return url
    return url.startsWith('/') ? `${strapiUrl}${url}` : `${strapiUrl}/${url}`
  }

  return { getStrapiMediaUrl }
}
