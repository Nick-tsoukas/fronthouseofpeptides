import { requireAdminAuth } from '~/server/utils/adminAuth'
import { isOwnerPushConfigured } from '~/server/utils/ownerPush'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  requireAdminAuth(event, config.ownerSessionSecret as string)

  const publicKey = String(config.public?.vapidPublicKey || config.vapidPublicKey || '').trim()
  return {
    ok: true,
    configured: isOwnerPushConfigured(config) && Boolean(publicKey),
    publicKey,
  }
})
