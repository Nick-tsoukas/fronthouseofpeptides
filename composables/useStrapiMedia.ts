export function useStrapiMedia() {
  const config = useRuntimeConfig()
  const strapiUrl = config.public.strapiUrl

  const getStrapiMediaUrl = (url: string | null | undefined): string | null => {
    if (!url) return null
    if (url.startsWith('http://') || url.startsWith('https://')) return url
    return `${strapiUrl}${url}`
  }

  return { getStrapiMediaUrl }
}
