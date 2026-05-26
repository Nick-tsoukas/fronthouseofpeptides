import { requireOwnerAuth } from '~/server/utils/ownerAuth'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  requireOwnerAuth(event, config.ownerSessionSecret as string)

  const id = getRouterParam(event, 'id')
  if (!id || isNaN(Number(id))) {
    throw createError({ statusCode: 400, message: 'Invalid product ID.' })
  }

  const strapiUrl = config.public.strapiUrl
  const strapiToken = config.strapiToken as string

  const params = new URLSearchParams()
  params.set('populate[variants]', '*')
  params.set('populate[image][fields][0]', 'url')
  params.set('populate[image][fields][1]', 'formats')
  params.set('populate[image][fields][2]', 'alternativeText')

  const response = await $fetch<{ data: any }>(
    `${strapiUrl}/api/products/${id}?${params.toString()}`,
    { headers: { Authorization: `Bearer ${strapiToken}` } }
  ).catch(() => {
    throw createError({ statusCode: 404, message: 'Product not found.' })
  })

  const entry = response.data
  if (!entry) throw createError({ statusCode: 404, message: 'Product not found.' })

  const a = entry.attributes
  const variants = (a.variants?.data || []).map((v: any) => ({
    id: v.id,
    name: v.attributes.name,
    sku: v.attributes.sku,
    price: v.attributes.price,
    active: v.attributes.active ?? true,
    inventory: v.attributes.inventory ?? null,
  }))

  const imageUrl = a.image?.data?.attributes?.formats?.medium?.url
    || a.image?.data?.attributes?.formats?.small?.url
    || a.image?.data?.attributes?.url
    || null

  return {
    id: entry.id,
    name: a.name,
    slug: a.slug,
    shortDescription: a.shortDescription || null,
    active: a.active ?? true,
    badgeText: a.badgeText || null,
    requiresConfirmation: a.requiresConfirmation ?? true,
    imageUrl,
    variants,
  }
})
