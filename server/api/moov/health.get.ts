import { type H3Event } from 'h3'

const MOOV_API_BASE = 'https://api.moov.io'
const MOOV_API_VERSION = 'v2026.04.00'

export default defineEventHandler(async (event: H3Event) => {
  const config = useRuntimeConfig(event)

  const moovPublicKey = config.moovPublicKey
  const moovSecretKey = config.moovSecretKey
  const moovAccountId = config.moovAccountId
  const moovMode = config.moovMode || 'test'

  // Validate required configuration
  const missing: string[] = []
  if (!moovPublicKey) missing.push('MOOV_PUBLIC_KEY')
  if (!moovSecretKey) missing.push('MOOV_SECRET_KEY')
  if (!moovAccountId) missing.push('MOOV_ACCOUNT_ID')

  if (missing.length > 0) {
    console.error(`Moov health check: missing server configuration: ${missing.join(', ')}`)
    throw createError({
      statusCode: 500,
      statusMessage: 'Server configuration incomplete',
      message: 'Moov integration is not configured on this server.',
    })
  }

  // Basic auth: public key as username, secret key as password
  const credentials = `${moovPublicKey}:${moovSecretKey}`
  const authHeader = `Basic ${Buffer.from(credentials).toString('base64')}`

  let moovResponse: Response
  try {
    moovResponse = await fetch(`${MOOV_API_BASE}/accounts/${moovAccountId}`, {
      method: 'GET',
      headers: {
        Authorization: authHeader,
        'X-Moov-Version': MOOV_API_VERSION,
        Accept: 'application/json',
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network error'
    console.error(`Moov health check: connection failed - ${message}`)
    throw createError({
      statusCode: 502,
      statusMessage: 'Moov API unreachable',
      message: 'Could not connect to Moov API.',
    })
  }

  if (!moovResponse.ok) {
    const status = moovResponse.status
    let safeMessage = `Moov API returned ${status}`
    try {
      const body = await moovResponse.json()
      if (body && typeof body === 'object' && 'error' in body && body.error) {
        safeMessage = `Moov API error ${status}: ${String(body.error)}`
      }
    } catch {
      // ignore body parse failure
    }

    console.error(`Moov health check: ${safeMessage}`)
    throw createError({
      statusCode: 502,
      statusMessage: 'Moov API error',
      message: safeMessage,
    })
  }

  return {
    ok: true,
    mode: moovMode,
    accountConnected: true,
  }
})
