import { isOwnerAuthenticated } from '~/server/utils/ownerAuth'

export default defineEventHandler((event) => {
  const config = useRuntimeConfig()
  const authenticated = isOwnerAuthenticated(event, config.ownerSessionSecret as string)
  return { authenticated }
})
