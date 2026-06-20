import { randomBytes, createHash } from 'crypto'
import { getRequestHeaders } from 'h3'

export const MOOV_API_BASE = 'https://api.moov.io'
export const MOOV_API_VERSION = 'v2026.04.00'

export interface MoovConfig {
  publicKey: string
  secretKey: string
  accountId: string
  mode: string
}

export function getMoovConfig(event: any): MoovConfig {
  const config = useRuntimeConfig(event)
  return {
    publicKey: config.moovPublicKey as string,
    secretKey: config.moovSecretKey as string,
    accountId: config.moovAccountId as string,
    mode: (config.moovMode as string) || 'test',
  }
}

export function getSiteOrigin(event: any): string {
  const config = useRuntimeConfig(event)
  const publicUrl = config.public.appUrl as string
  if (publicUrl) {
    try {
      const url = new URL(publicUrl)
      return `${url.protocol}//${url.host}`
    } catch {
      // fall through
    }
  }
  const headers = getRequestHeaders(event)
  const host = headers['x-forwarded-host'] || headers.host || 'localhost'
  const protocol = (headers['x-forwarded-proto'] || 'http') + ':'
  return `${protocol}//${host}`
}

export function basicAuthHeader(config: MoovConfig): string {
  const credentials = `${config.publicKey}:${config.secretKey}`
  return `Basic ${Buffer.from(credentials).toString('base64')}`
}

export function moovHeaders(config: MoovConfig, extra: Record<string, string> = {}): Record<string, string> {
  return {
    Authorization: basicAuthHeader(config),
    'X-Moov-Version': MOOV_API_VERSION,
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...extra,
  }
}

export function generateCheckoutSessionToken(): string {
  return randomBytes(32).toString('hex')
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export async function createMoovIndividualAccount(
  config: MoovConfig,
  account: {
    firstName: string
    lastName: string
    email: string
  }
): Promise<{ accountID: string }> {
  const body = {
    accountType: 'individual',
    profile: {
      individual: {
        name: {
          firstName: account.firstName,
          lastName: account.lastName,
        },
        email: account.email,
      },
    },
  }

  const res = await fetch(`${MOOV_API_BASE}/accounts`, {
    method: 'POST',
    headers: moovHeaders(config),
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Moov create account failed ${res.status}: ${text}`)
  }

  const data = await res.json()
  return { accountID: data.accountID }
}

export async function createMoovAccessToken(
  config: MoovConfig,
  scope: string,
  origin: string
): Promise<{ accessToken: string; expiresIn: number }> {
  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    scope,
  })

  const res = await fetch(`${MOOV_API_BASE}/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: basicAuthHeader(config),
      'X-Moov-Version': MOOV_API_VERSION,
      Origin: origin,
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Moov OAuth token failed ${res.status}: ${text}`)
  }

  const data = await res.json()
  return { accessToken: data.access_token, expiresIn: data.expires_in }
}

export async function getAccountPaymentMethods(
  config: MoovConfig,
  accountId: string
): Promise<any[]> {
  const res = await fetch(`${MOOV_API_BASE}/accounts/${accountId}/payment-methods`, {
    method: 'GET',
    headers: moovHeaders(config),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Moov payment methods failed ${res.status}: ${text}`)
  }

  const data = await res.json()
  return data || []
}

export async function getAccountCards(
  config: MoovConfig,
  accountId: string
): Promise<any[]> {
  const res = await fetch(`${MOOV_API_BASE}/accounts/${accountId}/cards`, {
    method: 'GET',
    headers: moovHeaders(config),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Moov cards failed ${res.status}: ${text}`)
  }

  const data = await res.json()
  return data || []
}

export function safeLog(label: string, data: Record<string, unknown>): void {
  console.log(label, data)
}
