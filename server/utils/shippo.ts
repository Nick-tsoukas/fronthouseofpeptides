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
    distanceUnit: string
    weight: string
    massUnit: string
  }
}

export function getShippoConfig(event: any): ShippoConfig {
  const config = useRuntimeConfig(event)

  return {
    apiToken: config.shippoApiToken as string,
    mode: (config.shippoMode as string) || 'test',
    from: {
      name: config.shippingFromName as string,
      company: config.shippingFromCompany as string,
      street1: config.shippingFromStreet1 as string,
      street2: config.shippingFromStreet2 as string,
      city: config.shippingFromCity as string,
      state: config.shippingFromState as string,
      zip: config.shippingFromZip as string,
      country: (config.shippingFromCountry as string) || 'US',
      phone: config.shippingFromPhone as string,
      email: config.shippingFromEmail as string,
    },
    parcel: {
      length: (config.defaultParcelLengthIn as string) || '6',
      width: (config.defaultParcelWidthIn as string) || '4',
      height: (config.defaultParcelHeightIn as string) || '2',
      distanceUnit: 'in',
      weight: (config.defaultParcelWeightOz as string) || '6',
      massUnit: 'oz',
    },
  }
}

export function shippoHeaders(config: ShippoConfig): Record<string, string> {
  return {
    Authorization: `ShippoToken ${config.apiToken}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }
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
    throw new Error(`Shippo request failed ${res.status}: ${text}`)
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
  carrier: string
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
    carrier: rate.carrier,
    service: rate.servicelevel?.name || '',
    serviceToken: rate.servicelevel?.token || '',
    amountCents: toCentsFromDecimal(rate.amount),
    currency: rate.currency,
    deliveryDays: rate.estimated_days ?? null,
    test: true,
  }
}
