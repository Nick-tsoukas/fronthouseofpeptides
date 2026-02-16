export interface Product {
  id: number
  attributes: {
    name: string
    slug: string
    shortDescription: string
    description: string
    active: boolean
    requiresConfirmation: boolean
    badgeText: string
    createdAt: string
    updatedAt: string
    variants?: {
      data: Variant[]
    }
  }
}

export interface Variant {
  id: number
  attributes: {
    name: string
    sku: string
    price: number
    active: boolean
    inventory: number | null
    createdAt: string
    updatedAt: string
  }
}

export interface CartItem {
  productId: number
  variantId: number
  productName: string
  variantName: string
  sku: string
  unitPrice: number
  quantity: number
}

export interface Order {
  id: number
  attributes: {
    stripeSessionId: string
    stripePaymentIntentId: string
    email: string
    amountSubtotal: number
    amountTotal: number
    shippingAmount: number
    currency: string
    shippingName: string
    shippingAddressLine1: string
    shippingAddressLine2: string | null
    shippingCity: string
    shippingState: string
    shippingPostalCode: string
    shippingCountry: string
    confirmationAccepted: boolean
    status: 'pending' | 'paid' | 'failed' | 'refunded'
    createdAt: string
    updatedAt: string
  }
}

export interface StrapiResponse<T> {
  data: T
  meta?: {
    pagination?: {
      page: number
      pageSize: number
      pageCount: number
      total: number
    }
  }
}
