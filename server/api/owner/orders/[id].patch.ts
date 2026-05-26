import { requireOwnerAuth } from '~/server/utils/ownerAuth'

const ALLOWED_STATUSES = ['awaiting_payment', 'fulfilled', 'cancelled', 'rejected', 'approved', 'pending_review']

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  requireOwnerAuth(event, config.ownerSessionSecret as string)

  const id = getRouterParam(event, 'id')
  if (!id || isNaN(Number(id))) {
    throw createError({ statusCode: 400, message: 'Invalid order ID.' })
  }

  const body = await readBody<{ status?: string; ownerNotes?: string }>(event)

  if (body.status !== undefined && !ALLOWED_STATUSES.includes(body.status)) {
    throw createError({ statusCode: 400, message: `Invalid status: ${body.status}` })
  }

  const strapiUrl = config.public.strapiUrl
  const strapiToken = config.strapiToken as string

  const patch: Record<string, any> = {}
  if (body.status !== undefined) {
    patch.status = body.status
    patch.reviewedAt = new Date().toISOString()
  }
  if (body.ownerNotes !== undefined) {
    patch.ownerNotes = body.ownerNotes
  }

  if (Object.keys(patch).length === 0) {
    throw createError({ statusCode: 400, message: 'Nothing to update.' })
  }

  await $fetch(`${strapiUrl}/api/orders/${id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${strapiToken}`,
      'Content-Type': 'application/json',
    },
    body: { data: patch },
  }).catch(() => {
    throw createError({ statusCode: 502, message: 'Failed to update order.' })
  })

  return { ok: true, id: Number(id), ...patch }
})
