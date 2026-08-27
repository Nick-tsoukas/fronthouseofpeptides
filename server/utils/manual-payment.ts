import type { H3Event } from 'h3'
import { fetchStoreSettings, getEmailBrand } from '~/server/utils/storeSettings'
import { commitInventoryOnce, type InventoryCommitResult } from '~/server/utils/moov-reconcile'
import { sendPaidOrderEmails } from '~/server/utils/sendOrderEmails'
import { notifyOwnerPush } from '~/server/utils/ownerPush'
import {
  getManualPaymentMethodConfig,
  isManualPaymentMode,
  resolveManualPaymentMethod,
  type ManualPaymentMethod,
  type ManualPaymentMethodConfig,
  type PaymentMode,
  type StoreSettings,
} from '~/utils/storeSettings'

export const MANUAL_PAYMENT_STATUSES = [
  'awaiting_manual_payment',
  'payment_claimed_by_customer',
  'manual_review',
  'manual_payment_rejected',
] as const

export type ManualPaymentStatus = (typeof MANUAL_PAYMENT_STATUSES)[number]

/** Statuses an admin still has to act on before the order can ship. */
export const NEEDS_VERIFICATION_STATUSES = ['payment_claimed_by_customer', 'manual_review'] as const

/** Order fields the manual payment flow reads from Strapi. */
export const MANUAL_ORDER_FIELDS = [
  'orderNumber',
  'status',
  'paymentStatus',
  'paymentProvider',
  'manualPaymentMethod',
  'manualPaymentReference',
  'manualPaymentInstructionsSentAt',
  'manualPaymentExpiresAt',
  'customerPaymentClaimedAt',
  'customerPaymentSenderName',
  'customerPaymentSenderHandle',
  'customerPaymentNote',
  'manualPaymentVerifiedAt',
  'manualPaymentVerifiedBy',
  'manualPaymentRejectedAt',
  'manualPaymentRejectionReason',
  'customerName',
  'email',
  'currency',
  'subtotalCents',
  'shippingCostCents',
  'taxCents',
  'totalCents',
  'shippingStatus',
  'shippoRateId',
  'shippoTransactionId',
  'inventoryCommitted',
  'inventoryAdjusted',
  'paidAt',
  'ownerNotes',
]

export function isManualPaymentOrder(attrs: Record<string, any>): boolean {
  if (attrs?.manualPaymentMethod) return true
  return ['cashapp', 'zelle', 'manual'].includes(String(attrs?.paymentProvider || ''))
}

export interface ManualPaymentSetup {
  settings: StoreSettings
  mode: PaymentMode
  manualEnabled: boolean
  method: ManualPaymentMethod | null
  config: ManualPaymentMethodConfig | null
}

export async function getManualPaymentSetup(event: H3Event): Promise<ManualPaymentSetup> {
  const { settings } = await fetchStoreSettings(event)
  const method = resolveManualPaymentMethod(settings)
  return {
    settings,
    mode: settings.paymentMode,
    manualEnabled: isManualPaymentMode(settings.paymentMode),
    method,
    config: method ? getManualPaymentMethodConfig(settings, method) : null,
  }
}

/** Public-safe view of the payment instructions shown to a customer. */
export function toPublicManualPaymentConfig(config: ManualPaymentMethodConfig) {
  return {
    method: config.method,
    label: config.label,
    displayName: config.displayName,
    handle: config.handle,
    secondaryHandle: config.secondaryHandle,
    paymentUrl: config.paymentUrl,
    qrImageUrl: config.qrImageUrl,
    instructions: config.instructions,
    supportEmail: config.supportEmail,
    expirationHours: config.expirationHours,
    configured: config.configured,
  }
}

export function manualPaymentReference(orderNumber: string): string {
  return orderNumber || ''
}

export function formatCents(cents: number): string {
  return `$${((Number(cents) || 0) / 100).toFixed(2)}`
}

export interface ManualPaidResult {
  alreadyPaid: boolean
  paymentStatus: string
  inventoryCommitted: boolean
  paidAt: string | null
}

/**
 * Shared paid-order finalization for any manual payment method (Cash App, Zelle).
 * Only ever called from admin-authenticated verification.
 */
export async function finalizeManualPaymentPaid(opts: {
  event: H3Event
  strapiUrl: string
  authHeaders: Record<string, string>
  orderId: number
  attrs: Record<string, any>
  verifiedBy: string
}): Promise<ManualPaidResult> {
  const { event, strapiUrl, authHeaders, orderId, attrs, verifiedBy } = opts
  const now = new Date().toISOString()

  if (attrs.paymentStatus === 'paid') {
    return {
      alreadyPaid: true,
      paymentStatus: 'paid',
      inventoryCommitted: Boolean(attrs.inventoryCommitted),
      paidAt: attrs.paidAt || null,
    }
  }

  const updateData: Record<string, any> = {
    paymentStatus: 'paid',
    paidAt: now,
    manualPaymentVerifiedAt: now,
    manualPaymentVerifiedBy: verifiedBy,
    manualPaymentRejectedAt: null,
    manualPaymentRejectionReason: null,
    paymentProvider: attrs.paymentProvider || attrs.manualPaymentMethod || 'manual',
    paymentMethod: 'external',
  }

  if (attrs.status === 'awaiting_manual_payment' || attrs.status === 'awaiting_payment') {
    updateData.status = 'approved'
  }

  if (
    attrs.shippoRateId &&
    !attrs.shippoTransactionId &&
    (attrs.shippingStatus === 'selected' || attrs.shippingStatus === 'quoted')
  ) {
    updateData.shippingStatus = 'ready_to_ship'
  }

  const alreadyCommitted = Boolean(attrs.inventoryCommitted)
  let stockAlerts: InventoryCommitResult['alerts'] = []
  let orderItems: any[] = []

  try {
    const itemsResponse = await $fetch<{ data: any[] }>(
      `${strapiUrl}/api/order-items?filters[order][id][$eq]=${orderId}&populate[variant]=true&pagination[pageSize]=100`,
      { headers: authHeaders }
    )
    orderItems = itemsResponse.data || []
  } catch (err: any) {
    console.error('[manual-payment] order item load failed:', err?.message || err)
  }

  if (!alreadyCommitted) {
    updateData.inventoryCommitted = true
    updateData.inventoryAdjusted = true
    try {
      const commit = await commitInventoryOnce(strapiUrl, authHeaders, orderId, orderItems)
      stockAlerts = commit.alerts
    } catch (err: any) {
      console.error('[manual-payment] inventory commit failed:', err?.message || err)
      updateData.inventoryCommitted = false
      updateData.inventoryAdjusted = false
      updateData.ownerNotes = [
        attrs.ownerNotes,
        'Inventory decrement failed after manual payment verification. Manual inventory check required.',
      ]
        .filter(Boolean)
        .join('\n')
      void notifyOwnerPush({
        title: 'Inventory update failed',
        body: `${attrs.orderNumber || `Order #${orderId}`} is paid, but stock was not updated. Check inventory.`,
        url: `/admin/orders/${orderId}`,
        tag: `order-${orderId}-inventory`,
      })
    }
  }

  await $fetch(`${strapiUrl}/api/orders/${orderId}`, {
    method: 'PUT',
    headers: authHeaders,
    body: { data: updateData },
  })

  const config = useRuntimeConfig(event)
  const items = orderItems.map((item: any) => ({
    productName: item.attributes?.productNameSnapshot || '',
    variantName: item.attributes?.variantNameSnapshot || '',
    skuSnapshot: item.attributes?.skuSnapshot || '',
    quantity: item.attributes?.quantity || 0,
    unitPrice: Number(item.attributes?.unitPriceSnapshot) || 0,
  }))

  await sendPaidOrderEmails(
    {
      orderId,
      orderNumber: attrs.orderNumber || String(orderId),
      status: 'paid',
      inventoryAdjusted: Boolean(updateData.inventoryAdjusted),
      customerName: attrs.customerName || '',
      email: attrs.email || '',
      phone: attrs.phone || null,
      companyName: attrs.companyName || null,
      customerNotes: attrs.customerNotes || null,
      shippingAddressLine1: attrs.shippingAddressLine1 || attrs.shippingAddress1 || '',
      shippingAddressLine2: attrs.shippingAddressLine2 || attrs.shippingAddress2 || null,
      shippingCity: attrs.shippingCity || '',
      shippingState: attrs.shippingState || '',
      shippingPostalCode: attrs.shippingPostalCode || '',
      shippingCountry: attrs.shippingCountry || 'US',
      amountSubtotal: (Number(attrs.subtotalCents) || 0) / 100,
      shippingAmount: (Number(attrs.shippingCostCents) || Number(attrs.shippingCents) || 0) / 100,
      amountTotal: (Number(attrs.totalCents) || 0) / 100,
      currency: attrs.currency || 'USD',
      items,
    },
    {
      smtpHost: config.smtpHost as string,
      smtpPort: config.smtpPort as string,
      smtpUser: config.smtpUser as string,
      smtpPass: config.smtpPass as string,
      orderFromEmail: config.orderFromEmail as string,
      ownerOrderEmail: config.ownerOrderEmail as string,
      brand: await getEmailBrand(event),
      customerSubject: `Payment received — order confirmed (${attrs.orderNumber || `#${orderId}`})`,
    }
  ).catch((err: any) => {
    console.error('[manual-payment] paid email failed:', err?.message || err)
  })

  for (const alert of stockAlerts) {
    void notifyOwnerPush({
      title: alert.newInventory <= 0 ? 'Out of stock' : 'Low stock',
      body:
        alert.newInventory <= 0
          ? `${alert.label} is now at 0.`
          : `${alert.label} is running low.`,
      url: '/admin/products',
      tag: `stock-${alert.label}`.slice(0, 48),
    })
  }

  return {
    alreadyPaid: false,
    paymentStatus: 'paid',
    inventoryCommitted: Boolean(updateData.inventoryCommitted),
    paidAt: now,
  }
}
