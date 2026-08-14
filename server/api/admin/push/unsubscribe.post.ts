import { requireAdminAuth } from '~/server/utils/adminAuth'
import { removeOwnerPushSubscription } from '~/server/utils/ownerPush'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  requireAdminAuth(event, config.ownerSessionSecret as string)

  const body = await readBody<{ endpoint?: string }>(event)
  await removeOwnerPushSubscription(String(body?.endpoint || ''))
  return { ok: true }
})
