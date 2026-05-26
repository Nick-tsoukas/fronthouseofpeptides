import { requireOwnerAuth } from '~/server/utils/ownerAuth'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  requireOwnerAuth(event, config.ownerSessionSecret as string)

  const id = getRouterParam(event, 'id')
  if (!id || isNaN(Number(id))) {
    throw createError({ statusCode: 400, message: 'Invalid variant ID.' })
  }

  const body = await readBody<{ active?: boolean; inventory?: number | null; price?: number }>(event)

  const patch: Record<string, any> = {}

  if (body.active !== undefined) {
    if (typeof body.active !== 'boolean') {
      throw createError({ statusCode: 400, message: 'active must be a boolean.' })
    }
    patch.active = body.active
  }

  if (body.inventory !== undefined) {
    if (body.inventory === null) {
      patch.inventory = null
    } else {
      const inv = Number(body.inventory)
      if (!Number.isInteger(inv) || inv < 0) {
        throw createError({ statusCode: 400, message: 'inventory must be null or a non-negative integer.' })
      }
      patch.inventory = inv
    }
  }

  if (body.price !== undefined) {
    const price = Number(body.price)
    if (isNaN(price) || price < 0) {
      throw createError({ statusCode: 400, message: 'price must be a non-negative number.' })
    }
    patch.price = Math.round(price * 100) / 100
  }

  if (Object.keys(patch).length === 0) {
    throw createError({ statusCode: 400, message: 'Nothing to update.' })
  }

  const strapiUrl = config.public.strapiUrl
  const strapiToken = config.strapiToken as string

  await $fetch(`${strapiUrl}/api/variants/${id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${strapiToken}`, 'Content-Type': 'application/json' },
    body: { data: patch },
  }).catch(() => {
    throw createError({ statusCode: 502, message: 'Failed to update variant.' })
  })

  return { ok: true, id: Number(id), ...patch }
})
