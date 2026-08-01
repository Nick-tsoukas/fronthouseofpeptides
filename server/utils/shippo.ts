export const SHIPPO_API_BASE = 'https://api.goshippo.com'

export interface ShippoConfig {
  apiToken: string
  mode: string
  from: {
    name: string
    company?: string
    street1: string
    street2?: string
    city: string
    state: string
    zip: string
    country: string
    phone?: string
    email?: string
  }
  parcel: {
    length: string
    width: string
    height: string
    distance_unit: string
    weight: string
    mass_unit: string
  }
}

export function getShippoConfig(event: any): ShippoConfig {
  const config = useRuntimeConfig(event)

  const from: ShippoConfig['from'] = {
    name: (config.shippingFromName as string) || '',
    street1: (config.shippingFromStreet1 as string) || '',
    city: (config.shippingFromCity as string) || '',
    state: (config.shippingFromState as string) || '',
    zip: (config.shippingFromZip as string) || '',
    country: ((config.shippingFromCountry as string) || 'US').toUpperCase(),
  }

  const company = (config.shippingFromCompany as string || '').trim()
  const street2 = (config.shippingFromStreet2 as string || '').trim()
  const phone = (config.shippingFromPhone as string || '').trim()
  const email = (config.shippingFromEmail as string || '').trim()
  if (company) from.company = company
  if (street2) from.street2 = street2
  if (phone) from.phone = phone
  if (email) from.email = email

  return {
    apiToken: config.shippoApiToken as string,
    mode: (config.shippoMode as string) || 'test',
    from,
    // Shippo requires snake_case parcel unit fields.
    parcel: {
      length: String((config.defaultParcelLengthIn as string) || '6'),
      width: String((config.defaultParcelWidthIn as string) || '4'),
      height: String((config.defaultParcelHeightIn as string) || '2'),
      distance_unit: 'in',
      weight: String((config.defaultParcelWeightOz as string) || '6'),
      mass_unit: 'oz',
    },
  }
}

export function assertShippoFromAddress(config: ShippoConfig): void {
  const missing: string[] = []
  if (!config.from.name) missing.push('SHIPPING_FROM_NAME')
  if (!config.from.street1) missing.push('SHIPPING_FROM_STREET1')
  if (!config.from.city) missing.push('SHIPPING_FROM_CITY')
  if (!config.from.state) missing.push('SHIPPING_FROM_STATE')
  if (!config.from.zip) missing.push('SHIPPING_FROM_ZIP')
  if (!config.from.country) missing.push('SHIPPING_FROM_COUNTRY')
  if (missing.length > 0) {
    throw new Error(`Ship-from address is incomplete: ${missing.join(', ')}`)
  }
}

export function shippoHeaders(config: ShippoConfig): Record<string, string> {
  return {
    Authorization: `ShippoToken ${config.apiToken}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }
}

/** Strip tokens / oversized payloads from Shippo error text before logging or returning. */
export function sanitizeShippoErrorText(raw: unknown, maxLen = 400): string {
  let text = typeof raw === 'string' ? raw : String(raw || 'Unknown Shippo error')
  text = text
    .replace(/ShippoToken\s+\S+/gi, 'ShippoToken [redacted]')
    .replace(/Bearer\s+\S+/gi, 'Bearer [redacted]')
    .replace(/"(api_?key|token|password|secret)"\s*:\s*"[^"]*"/gi, '"$1":"[redacted]"')
  // Prefer JSON message/detail fields when present
  try {
    const parsed = JSON.parse(text)
    const parts: string[] = []
    if (parsed?.detail) parts.push(String(parsed.detail))
    if (Array.isArray(parsed?.messages)) {
      for (const m of parsed.messages.slice(0, 3)) {
        if (m?.text) parts.push(String(m.text))
        else if (typeof m === 'string') parts.push(m)
      }
    }
    if (parsed?.message && !parts.length) parts.push(String(parsed.message))
    if (parts.length) text = parts.join('; ')
  } catch {
    // not JSON — keep sanitized text
  }
  return text.replace(/\s+/g, ' ').trim().slice(0, maxLen)
}

export function isShippoRateExpiredError(message: string): boolean {
  const m = message.toLowerCase()
  return (
    m.includes('rate has expired') ||
    m.includes('rate expired') ||
    m.includes('expired rate') ||
    m.includes('invalid rate') ||
    m.includes('does not exist') ||
    m.includes('object does not exist')
  )
}

export async function shippoFetch<T>(
  config: ShippoConfig,
  path: string,
  opts: { method?: string; body?: any } = {}
): Promise<T> {
  const url = `${SHIPPO_API_BASE}${path}`
  const res = await fetch(url, {
    method: opts.method || 'GET',
    headers: shippoHeaders(config),
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  })

  if (!res.ok) {
    const text = await res.text().catch(() => 'Unknown error')
    const safe = sanitizeShippoErrorText(text)
    const err = new Error(`Shippo request failed ${res.status}: ${safe}`) as Error & {
      statusCode?: number
      shippoSafeDetail?: string
    }
    err.statusCode = res.status
    err.shippoSafeDetail = safe
    throw err
  }

  return (await res.json()) as T
}

export interface ShippoAddress {
  name: string
  company?: string
  street1: string
  street2?: string
  city: string
  state: string
  zip: string
  country: string
  phone?: string
  email?: string
  is_residential?: boolean
}

export interface ShippoParcel {
  length: string
  width: string
  height: string
  distance_unit: string
  weight: string
  mass_unit: string
}

export interface ShippoShipment {
  object_id: string
  address_to?: { object_id: string }
  rates: ShippoRate[]
}

export interface ShippoRate {
  object_id: string
  provider?: string
  carrier?: string
  servicelevel: {
    name: string
    token: string
  }
  amount: string
  currency: string
  estimated_days?: number
  duration_terms?: string
}

export function toCentsFromDecimal(amount: string): number {
  const match = amount.match(/^\d+(?:\.\d+)?$/)
  if (!match) {
    throw new Error(`Invalid amount: ${amount}`)
  }

  const [dollars, cents = '00'] = amount.split('.')
  const normalizedCents = (cents + '00').slice(0, 2)
  return Number(dollars) * 100 + Number(normalizedCents)
}

export function sanitizeRate(rate: ShippoRate): {
  rateId: string
  carrier: string
  service: string
  serviceToken: string
  amountCents: number
  currency: string
  deliveryDays: number | null
  test: boolean
} {
  return {
    rateId: rate.object_id,
    carrier: rate.provider || rate.carrier || '',
    service: rate.servicelevel?.name || '',
    serviceToken: rate.servicelevel?.token || '',
    amountCents: toCentsFromDecimal(rate.amount),
    currency: rate.currency,
    deliveryDays: rate.estimated_days ?? null,
    test: true,
  }
}

export interface ShippoTransaction {
  object_id: string
  status: string
  label_url?: string | null
  tracking_number?: string | null
  tracking_url_provider?: string | null
  rate?: string | { object_id?: string; amount?: string; currency?: string } | null
  messages?: Array<{ text?: string; source?: string; code?: string }>
}

export interface PurchaseLabelResult {
  transactionId: string
  status: 'SUCCESS' | 'ERROR' | 'WAITING' | 'QUEUED' | string
  labelUrl: string | null
  trackingNumber: string | null
  trackingUrl: string | null
  labelCostCents: number | null
  errorMessage: string | null
}

/**
 * Purchase a shipping label from an existing Shippo rate (sync when possible).
 * Uses PDF_4x6 by default for thermal label printers.
 */
export async function purchaseShippoLabelFromRate(
  config: ShippoConfig,
  rateId: string,
  options: { labelFileType?: string; async?: boolean } = {}
): Promise<PurchaseLabelResult> {
  if (!config.apiToken) {
    throw new Error('Shippo API token is not configured.')
  }
  if (!rateId) {
    throw new Error('Shippo rate ID is required.')
  }

  // Default sync (async:false) so checkout fulfillment gets label URL immediately when possible.
  const useAsync = options.async === true

  const transaction = await shippoFetch<ShippoTransaction>(config, '/transactions/', {
    method: 'POST',
    body: {
      rate: rateId,
      label_file_type: options.labelFileType || 'PDF_4x6',
      async: useAsync,
    },
  })

  const status = String(transaction.status || '').toUpperCase()
  let labelCostCents: number | null = null
  if (transaction.rate && typeof transaction.rate === 'object' && transaction.rate.amount) {
    try {
      labelCostCents = toCentsFromDecimal(String(transaction.rate.amount))
    } catch {
      labelCostCents = null
    }
  }

  const errorMessage =
    status === 'ERROR'
      ? (transaction.messages || [])
          .map((m) => m?.text)
          .filter(Boolean)
          .slice(0, 3)
          .join('; ') || 'Shippo returned an error creating the label.'
      : null

  return {
    transactionId: transaction.object_id,
    status,
    labelUrl: transaction.label_url || null,
    trackingNumber: transaction.tracking_number || null,
    trackingUrl: transaction.tracking_url_provider || null,
    labelCostCents,
    errorMessage,
  }
}

export async function getShippoTransaction(
  config: ShippoConfig,
  transactionId: string
): Promise<ShippoTransaction> {
  return await shippoFetch<ShippoTransaction>(config, `/transactions/${transactionId}`)
}
