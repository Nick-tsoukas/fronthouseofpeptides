import { clearOwnerSession } from '~/server/utils/ownerAuth'

export default defineEventHandler((event) => {
  clearOwnerSession(event)
  return { ok: true }
})
