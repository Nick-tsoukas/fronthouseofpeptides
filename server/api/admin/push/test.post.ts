import { requireAdminAuth } from '~/server/utils/adminAuth'
import { notifyOwnerPush } from '~/server/utils/ownerPush'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  requireAdminAuth(event, config.ownerSessionSecret as string)

  await notifyOwnerPush({
    title: 'QBP Owner',
    body: 'Push notifications are working. You’ll get alerts for paid orders and stock issues.',
    url: '/admin',
    tag: 'qbp-push-test',
  })

  return { ok: true }
})
