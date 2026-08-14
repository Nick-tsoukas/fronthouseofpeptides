import { requireAdminAuth } from '~/server/utils/adminAuth'
import { notifyOwnerPush } from '~/server/utils/ownerPush'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  requireAdminAuth(event, config.ownerSessionSecret as string)

  await notifyOwnerPush({
    title: 'QBP Owner',
    body: 'Tap to open the owner app. You’ll get alerts for paid orders, labels, and stock.',
    url: '/admin/orders',
    tag: 'qbp-push-test',
  })

  return { ok: true }
})
