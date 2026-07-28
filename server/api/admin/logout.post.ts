import { clearAdminSession } from '~/server/utils/adminAuth'

export default defineEventHandler(async (event) => {
  clearAdminSession(event)
  return { ok: true }
})
