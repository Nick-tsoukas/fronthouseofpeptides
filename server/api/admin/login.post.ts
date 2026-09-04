import { setAdminSession } from '~/server/utils/adminAuth'

const INSECURE_DEFAULTS = new Set(['admin123', 'changeme', 'password', 'changeme-dev-secret'])

/** Simple in-memory throttle: max 8 attempts / 10 minutes per IP. */
const attempts = new Map<string, { count: number; resetAt: number }>()
const WINDOW_MS = 10 * 60 * 1000
const MAX_ATTEMPTS = 8

function clientKey(event: any): string {
  const xf = getHeader(event, 'x-forwarded-for')
  if (xf) return String(xf).split(',')[0].trim()
  return getRequestIP(event, { xForwardedFor: true }) || 'unknown'
}

function assertNotThrottled(event: any) {
  const key = clientKey(event)
  const now = Date.now()
  const entry = attempts.get(key)
  if (!entry || now > entry.resetAt) {
    attempts.set(key, { count: 0, resetAt: now + WINDOW_MS })
    return
  }
  if (entry.count >= MAX_ATTEMPTS) {
    throw createError({
      statusCode: 429,
      message: 'Too many login attempts. Try again in a few minutes.',
    })
  }
}

function recordAttempt(event: any, success: boolean) {
  const key = clientKey(event)
  const now = Date.now()
  const entry = attempts.get(key) || { count: 0, resetAt: now + WINDOW_MS }
  if (now > entry.resetAt) {
    entry.count = 0
    entry.resetAt = now + WINDOW_MS
  }
  if (success) {
    attempts.delete(key)
    return
  }
  entry.count += 1
  attempts.set(key, entry)
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const secret = String(config.ownerSessionSecret || '')
  const adminPassword = String(config.ownerAdminPassword || '')
  const nodeEnv = String(config.nodeEnv || process.env.NODE_ENV || 'development').toLowerCase()
  const isProd = nodeEnv === 'production'

  assertNotThrottled(event)

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
    recordAttempt(event, false)
    throw createError({ statusCode: 401, message: 'Invalid password.' })
  }

  recordAttempt(event, true)
  setAdminSession(event, secret || 'dev-only-session-secret')
  return { ok: true }
})
