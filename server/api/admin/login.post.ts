import { setAdminSession } from '~/server/utils/adminAuth'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const secret = config.ownerSessionSecret as string
  const adminPassword = (config.ownerAdminPassword as string) || 'admin123'

  const body = await readBody<{ password?: string }>(event)
  const password = String(body?.password || '')

  if (!password || password !== adminPassword) {
    throw createError({ statusCode: 401, message: 'Invalid password.' })
  }

  setAdminSession(event, secret)
  return { ok: true }
})
