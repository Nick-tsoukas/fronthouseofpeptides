/**
 * Safe hostname-only logging for Strapi base URL.
 * Never logs tokens or full URLs with credentials.
 */
export function strapiHostname(strapiUrl: string): string {
  try {
    return new URL(strapiUrl).hostname || 'unknown'
  } catch {
    return 'invalid'
  }
}

export function checkoutTrace(
  label: string,
  data: {
    orderId?: number | string
    orderNumber?: string | null
    strapiHost?: string
    paymentStatus?: string | null
    shippingStatus?: string | null
    hasMoovCardId?: boolean
    hasMoovPaymentMethodId?: boolean
    hasMoovTransferId?: boolean
    [key: string]: unknown
  }
): void {
  console.log(`[checkout-trace] ${label}`, data)
}
