import { isAdminAuthenticated } from '~/server/utils/adminAuth'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const secret = config.ownerSessionSecret as string
  return { authenticated: isAdminAuthenticated(event, secret) }
})
