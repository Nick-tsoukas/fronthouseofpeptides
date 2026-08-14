import { requireAdminAuth } from '~/server/utils/adminAuth'
import { extractProductImageUrl } from '~/server/utils/storefrontProducts'
import { ensureProductFallbackImage, variantsFromStrapi } from '~/server/utils/productImageService'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  requireAdminAuth(event, config.ownerSessionSecret as string)

  const id = Number(getRouterParam(event, 'id'))
  if (!id) {
    throw createError({ statusCode: 400, message: 'Product ID is required' })
  }

  const body = await readBody<{ force?: boolean }>(event).catch(() => ({}))
  const strapiUrl = String(config.public.strapiUrl || '').replace(/\/$/, '')
  const strapiToken = config.strapiToken as string
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (strapiToken) headers.Authorization = `Bearer ${strapiToken}`

  const productRes = await $fetch<{ data: any }>(
    `${strapiUrl}/api/products/${id}?populate[variants]=*&populate[image]=*`,
    { headers }
  )
  const entry = productRes.data
  if (!entry) {
    throw createError({ statusCode: 404, message: 'Product not found' })
  }

  const attrs = entry.attributes || {}
  const hasUploadedImage = Boolean(extractProductImageUrl(strapiUrl, entry))
  const result = await ensureProductFallbackImage({
    productId: id,
    productName: attrs.name || 'Research Compound',
    variants: variantsFromStrapi(entry),
    hasUploadedImage,
    strapiUrl,
    headers,
    force: body?.force !== false,
    syncFields: true,
  })

  return {
    ok: true,
    generatedImageUrl: result.generatedImageUrl,
    imageSource: result.imageSource,
  }
})
