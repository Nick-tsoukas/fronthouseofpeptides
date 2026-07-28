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

export async function getPaymentMethod(
  config: MoovConfig,
  accountId: string,
  paymentMethodId: string
): Promise<any> {
  const methods = await getAccountPaymentMethods(config, accountId)
  return (
    methods.find(
      (pm) =>
        pm.paymentMethodID === paymentMethodId ||
        pm.paymentMethodId === paymentMethodId
    ) || null
  )
}

export function findMoovWalletPaymentMethod(methods: any[]): any | null {
  return (
    methods.find((pm) => pm.paymentMethodType === 'moov-wallet') || null
  )
}

export function isCardPaymentMethodAvailable(pm: any): boolean {
  if (!pm || pm.paymentMethodType !== 'card-payment') return false
  const status = String(pm.status || pm.card?.status || '').toLowerCase()
  if (status && ['disabled', 'failed', 'closed', 'errored'].includes(status)) {
    return false
  }
  return true
}

export async function getMoovTransfer(
  config: MoovConfig,
  transferId: string
): Promise<any> {
  const res = await fetch(
    `${MOOV_API_BASE}/accounts/${config.accountId}/transfers/${transferId}`,
    {
      method: 'GET',
      headers: moovHeaders(config),
    }
  )

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Moov get transfer failed ${res.status}: ${text}`)
  }

  return await res.json()
}

export async function createMoovTransfer(
  config: MoovConfig,
  body: {
    sourcePaymentMethodId: string
    destinationPaymentMethodId: string
    amountCents: number
    description: string
    metadata?: Record<string, string>
  },
  idempotencyKey: string
): Promise<any> {
  const res = await fetch(`${MOOV_API_BASE}/accounts/${config.accountId}/transfers`, {
    method: 'POST',
    headers: moovHeaders(config, {
      'X-Idempotency-Key': idempotencyKey,
    }),
    body: JSON.stringify({
      source: { paymentMethodID: body.sourcePaymentMethodId },
      destination: { paymentMethodID: body.destinationPaymentMethodId },
      amount: {
        currency: 'USD',
        value: body.amountCents,
      },
      description: body.description,
      metadata: body.metadata || {},
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Moov create transfer failed ${res.status}: ${text}`)
  }

  return await res.json()
}

export function mapMoovTransferToPaymentStatus(
  transferStatus: string
): 'processing' | 'paid' | 'failed' | 'refunded' | null {
  const status = String(transferStatus || '').toLowerCase()
  if (status === 'pending' || status === 'queued') return 'processing'
  if (status === 'completed') return 'paid'
  if (status === 'failed' || status === 'canceled' || status === 'cancelled') return 'failed'
  if (status === 'reversed') return 'refunded'
  return null
}

export function safeLog(label: string, data: Record<string, unknown>): void {
  console.log(label, data)
}
