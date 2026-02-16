// MVP Constants - Easy to modify for production

export const SHIPPING = {
  FLAT_RATE_CENTS: 1000, // $10.00
  FLAT_RATE_DISPLAY: '$10.00',
  LABEL: 'Standard Shipping (US Only)',
  DELIVERY_ESTIMATE: '5-7 business days',
} as const

export const CURRENCY = {
  CODE: 'usd',
  SYMBOL: '$',
} as const

export const COMPLIANCE = {
  STORAGE_KEY: 'peptideConfirmedV1',
  REQUIREMENTS: [
    'I am 21 years of age or older',
    'I am a qualified professional or researcher',
    'I understand these products are for research use only',
  ],
} as const

export const CART = {
  MIN_QUANTITY: 1,
  MAX_QUANTITY: 99,
} as const

export const ALLOWED_COUNTRIES = ['US'] as const
