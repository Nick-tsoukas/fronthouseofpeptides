import { setAdminSession } from '~/server/utils/adminAuth'

const INSECURE_DEFAULTS = new Set(['admin123', 'changeme', 'password', 'changeme-dev-secret'])

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const secret = String(config.ownerSessionSecret || '')
  const adminPassword = String(config.ownerAdminPassword || '')
  const nodeEnv = String(config.nodeEnv || process.env.NODE_ENV || 'development').toLowerCase()
  const isProd = nodeEnv === 'production'

  if (!adminPassword) {
    throw createError({
      statusCode: 503,
      message: 'Admin login is not configured. Set OWNER_ADMIN_PASSWORD.',
    })
  }

  if (isProd && INSECURE_DEFAULTS.has(adminPassword)) {
    throw createError({
      statusCode: 503,
      message: 'Admin login rejected: replace the default OWNER_ADMIN_PASSWORD in production.',
    })
  }

  if (isProd && (!secret || INSECURE_DEFAULTS.has(secret))) {
    throw createError({
      statusCode: 503,
      message: 'Admin login rejected: set a strong OWNER_SESSION_SECRET in production.',
    })
  }

  const body = await readBody<{ password?: string }>(event)
  const password = String(body?.password || '')

  if (!password || password !== adminPassword) {
    throw createError({ statusCode: 401, message: 'Invalid password.' })
  }

  setAdminSession(event, secret || 'dev-only-session-secret')
  return { ok: true }
})
