export interface StrapiMediaFormat {
  url: string
  width: number
  height: number
  size: number
  mime: string
}

export interface StrapiMedia {
  id: number
  attributes: {
    url: string
    alternativeText: string | null
    width: number
    height: number
    formats: {
      thumbnail?: StrapiMediaFormat
      small?: StrapiMediaFormat
      medium?: StrapiMediaFormat
      large?: StrapiMediaFormat
    } | null
  }
}

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
    image?: {
      data: StrapiMedia | null
    }
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
    stripeSessionId?: string | null
    stripePaymentIntentId?: string | null
    customerName: string
    email: string
    phone?: string | null
    companyName?: string | null
    customerNotes?: string | null
    amountSubtotal: number
    amountTotal: number
    shippingAmount: number
    currency: string
    shippingName?: string | null
    shippingAddressLine1?: string | null
    shippingAddressLine2?: string | null
    shippingCity?: string | null
    shippingState?: string | null
    shippingPostalCode?: string | null
    shippingCountry: string
    confirmationAccepted: boolean
    status: 'pending_review' | 'approved' | 'rejected' | 'awaiting_payment' | 'fulfilled' | 'cancelled'
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
