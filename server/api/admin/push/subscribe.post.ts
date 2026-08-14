import { requireAdminAuth } from '~/server/utils/adminAuth'
import { saveOwnerPushSubscription } from '~/server/utils/ownerPush'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  requireAdminAuth(event, config.ownerSessionSecret as string)

  const body = await readBody(event)
  await saveOwnerPushSubscription(body)
  return { ok: true }
})
