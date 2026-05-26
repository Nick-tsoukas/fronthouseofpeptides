import type { H3Event } from 'h3'
import { createHmac, timingSafeEqual } from 'crypto'

const COOKIE_NAME = 'owner_session'
const SESSION_VALUE = 'authenticated'
const MAX_AGE = 60 * 60 * 8 // 8 hours

function sign(value: string, secret: string): string {
  const hmac = createHmac('sha256', secret)
  hmac.update(value)
  return `${value}.${hmac.digest('hex')}`
}

function verify(signed: string, secret: string): string | null {
  const lastDot = signed.lastIndexOf('.')
  if (lastDot === -1) return null
  const value = signed.slice(0, lastDot)
  const expected = sign(value, secret)
  try {
    const a = Buffer.from(signed)
    const b = Buffer.from(expected)
    if (a.length !== b.length) return null
    if (!timingSafeEqual(a, b)) return null
    return value
  } catch {
    return null
  }
}

export function setOwnerSession(event: H3Event, secret: string): void {
  const signed = sign(SESSION_VALUE, secret)
  setCookie(event, COOKIE_NAME, signed, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: MAX_AGE,
    path: '/',
  })
}

export function clearOwnerSession(event: H3Event): void {
  deleteCookie(event, COOKIE_NAME, { path: '/' })
}

export function isOwnerAuthenticated(event: H3Event, secret: string): boolean {
  const cookie = getCookie(event, COOKIE_NAME)
  if (!cookie) return false
  const value = verify(cookie, secret)
  return value === SESSION_VALUE
}

export function requireOwnerAuth(event: H3Event, secret: string): void {
  if (!isOwnerAuthenticated(event, secret)) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }
}
