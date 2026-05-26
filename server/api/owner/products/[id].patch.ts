import { requireOwnerAuth } from '~/server/utils/ownerAuth'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  requireOwnerAuth(event, config.ownerSessionSecret as string)

  const id = getRouterParam(event, 'id')
  if (!id || isNaN(Number(id))) {
    throw createError({ statusCode: 400, message: 'Invalid product ID.' })
  }

  const body = await readBody<{ active?: boolean; badgeText?: string; shortDescription?: string }>(event)

  const patch: Record<string, any> = {}

  if (body.active !== undefined) {
    if (typeof body.active !== 'boolean') {
      throw createError({ statusCode: 400, message: 'active must be a boolean.' })
    }
    patch.active = body.active
  }

  if (body.badgeText !== undefined) {
    patch.badgeText = String(body.badgeText).trim().slice(0, 100)
  }

  if (body.shortDescription !== undefined) {
    patch.shortDescription = String(body.shortDescription).trim().slice(0, 500)
  }

  if (Object.keys(patch).length === 0) {
    throw createError({ statusCode: 400, message: 'Nothing to update.' })
  }

  const strapiUrl = config.public.strapiUrl
  const strapiToken = config.strapiToken as string

  await $fetch(`${strapiUrl}/api/products/${id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${strapiToken}`, 'Content-Type': 'application/json' },
    body: { data: patch },
  }).catch(() => {
    throw createError({ statusCode: 502, message: 'Failed to update product.' })
  })

  return { ok: true, id: Number(id), ...patch }
})
