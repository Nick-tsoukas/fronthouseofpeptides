import type { H3Event } from 'h3'
import { commitInventoryOnce, type InventoryCommitResult } from '~/server/utils/moov-reconcile'
import { sendPaidOrderEmails } from '~/server/utils/sendOrderEmails'
import { notifyOwnerPush } from '~/server/utils/ownerPush'
import { getEmailBrand } from '~/server/utils/storeSettings'

const FINALIZING_TTL_MS = 2 * 60 * 1000

export interface StockLineStatus {
  productName: string
  variantName: string
  variantId: number | null
  orderedQty: number
  currentStock: number | null
  insufficient: boolean
}

export interface FinalizePaidOrderResult {
  ok: boolean
  busy?: boolean
  alreadyPaid?: boolean
  paymentStatus: string
  inventoryCommitted: boolean
  paidAt: string | null
  paidReceiptSentAt: string | null
  stockLines?: StockLineStatus[]
  insufficientStock?: boolean
  message?: string
}

function isManualCashAppOrder(attrs: Record<string, any>): boolean {
  const provider = String(attrs.paymentProvider || '')
  const method = String(attrs.paymentMethod || '')
  return provider === 'cashapp_manual' || provider === 'manual' || method === 'cashapp'
}

export function isCashAppManualOrder(attrs: Record<string, any>): boolean {
  return isManualCashAppOrder(attrs)
}

export async function loadOrderStockLines(
  strapiUrl: string,
  authHeaders: Record<string, string>,
  orderId: number,
  attrs: Record<string, any>
): Promise<StockLineStatus[]> {
  let orderItems = attrs.orderItems?.data || []
  if (!orderItems.length) {
    const itemsResponse = await $fetch<{ data: any[] }>(
      `${strapiUrl}/api/order-items?filters[order][id][$eq]=${orderId}&populate[variant]=true&pagination[pageSize]=100`,
      { headers: authHeaders }
    )
    orderItems = itemsResponse.data || []
  }

  return orderItems.map((item: any) => {
    const a = item.attributes || {}
    const variant = a.variant?.data
    const orderedQty = Number(a.quantity) || 0
    const currentStock =
      variant?.attributes?.inventory === null || variant?.attributes?.inventory === undefined
        ? null
        : Number(variant.attributes.inventory)
    const insufficient =
      currentStock !== null && Number.isFinite(currentStock) && currentStock < orderedQty
    return {
      productName: a.productNameSnapshot || '',
      variantName: a.variantNameSnapshot || '',
      variantId: variant?.id || null,
      orderedQty,
      currentStock,
      insufficient,
    }
  })
}

async function patchOrder(
  strapiUrl: string,
  authHeaders: Record<string, string>,
  orderId: number,
  data: Record<string, any>
) {
  await $fetch(`${strapiUrl}/api/orders/${orderId}`, {
    method: 'PUT',
    headers: authHeaders,
    body: { data },
  })
}

async function refetchOrder(
  strapiUrl: string,
  authHeaders: Record<string, string>,
  orderId: number
): Promise<Record<string, any>> {
  const res = await $fetch<{ data: any }>(
    `${strapiUrl}/api/orders/${orderId}?populate[orderItems][populate][variant]=true`,
    { headers: authHeaders }
  )
  return res.data?.attributes || {}
}

/**
 * Single paid-order finalization path for manual Cash App (and reusable by Moov).
 * Claims paymentFinalizingAt before inventory side effects. Idempotent on retry.
 */
export async function finalizePaidOrder(opts: {
  event: H3Event
  strapiUrl: string
  authHeaders: Record<string, string>
  orderId: number
  attrs: Record<string, any>
  allowInsufficientStock?: boolean
  sendEmailsOnPaid?: boolean
  paymentProvider?: string
  paymentMethod?: string
}): Promise<FinalizePaidOrderResult> {
  const {
    event,
    strapiUrl,
    authHeaders,
    orderId,
    allowInsufficientStock = false,
    sendEmailsOnPaid = true,
  } = opts
  let attrs = opts.attrs || {}

  if (attrs.paymentStatus === 'paid' && attrs.inventoryCommitted) {
    return {
      ok: true,
      alreadyPaid: true,
      paymentStatus: 'paid',
      inventoryCommitted: true,
      paidAt: attrs.paidAt || null,
      paidReceiptSentAt: attrs.paidReceiptSentAt || null,
      message: 'Order already paid.',
    }
  }

  if (attrs.paymentStatus === 'cancelled' || attrs.paymentStatus === 'refunded') {
    return {
      ok: false,
      paymentStatus: attrs.paymentStatus,
      inventoryCommitted: Boolean(attrs.inventoryCommitted),
      paidAt: attrs.paidAt || null,
      paidReceiptSentAt: attrs.paidReceiptSentAt || null,
      message: `Cannot finalize a ${attrs.paymentStatus} order.`,
    }
  }

  const finalizingAt = attrs.paymentFinalizingAt ? Date.parse(attrs.paymentFinalizingAt) : NaN
  if (
    Number.isFinite(finalizingAt) &&
    Date.now() - finalizingAt < FINALIZING_TTL_MS &&
    attrs.paymentStatus !== 'paid'
  ) {
    return {
      ok: false,
      busy: true,
      paymentStatus: attrs.paymentStatus || 'processing',
      inventoryCommitted: Boolean(attrs.inventoryCommitted),
      paidAt: attrs.paidAt || null,
      paidReceiptSentAt: attrs.paidReceiptSentAt || null,
      message: 'Payment finalization already in progress. Retry shortly.',
    }
  }

  const stockLines = await loadOrderStockLines(strapiUrl, authHeaders, orderId, attrs)
  const insufficient = stockLines.filter((l) => l.insufficient)
  if (insufficient.length && !allowInsufficientStock) {
    return {
      ok: false,
      insufficientStock: true,
      stockLines,
      paymentStatus: attrs.paymentStatus || 'processing',
      inventoryCommitted: Boolean(attrs.inventoryCommitted),
      paidAt: attrs.paidAt || null,
      paidReceiptSentAt: attrs.paidReceiptSentAt || null,
      message:
        'One or more items have insufficient stock. Confirm oversell explicitly to continue.',
    }
  }

  const claimAt = new Date().toISOString()
  let claimSupported = true
  try {
    await patchOrder(strapiUrl, authHeaders, orderId, { paymentFinalizingAt: claimAt })
  } catch (err: any) {
    // Field may not exist until Strapi redeploy — continue with inventoryCommitted guard only.
    console.warn('[finalizePaidOrder] paymentFinalizingAt claim unsupported:', err?.message || err)
    claimSupported = false
  }

  // Re-fetch after claim to detect concurrent winner
  attrs = await refetchOrder(strapiUrl, authHeaders, orderId)
  if (attrs.paymentStatus === 'paid' && attrs.inventoryCommitted) {
    return {
      ok: true,
      alreadyPaid: true,
      paymentStatus: 'paid',
      inventoryCommitted: true,
      paidAt: attrs.paidAt || null,
      paidReceiptSentAt: attrs.paidReceiptSentAt || null,
      stockLines,
      message: 'Order already paid.',
    }
  }
  if (
    claimSupported &&
    attrs.paymentFinalizingAt &&
    attrs.paymentFinalizingAt !== claimAt
  ) {
    const other = Date.parse(attrs.paymentFinalizingAt)
    if (Number.isFinite(other) && Date.now() - other < FINALIZING_TTL_MS) {
      return {
        ok: false,
        busy: true,
        paymentStatus: attrs.paymentStatus || 'processing',
        inventoryCommitted: Boolean(attrs.inventoryCommitted),
        paidAt: attrs.paidAt || null,
        paidReceiptSentAt: attrs.paidReceiptSentAt || null,
        message: 'Payment finalization already in progress. Retry shortly.',
      }
    }
  }

  const alreadyCommitted = Boolean(attrs.inventoryCommitted)
  let stockAlerts: InventoryCommitResult['alerts'] = []
  let inventoryOk = alreadyCommitted

  if (!alreadyCommitted) {
    try {
      let orderItems = attrs.orderItems?.data || []
      if (!orderItems.length) {
        const itemsResponse = await $fetch<{ data: any[] }>(
          `${strapiUrl}/api/order-items?filters[order][id][$eq]=${orderId}&populate[variant]=true&pagination[pageSize]=100`,
          { headers: authHeaders }
        )
        orderItems = itemsResponse.data || []
      }
      const commit = await commitInventoryOnce(strapiUrl, authHeaders, orderId, orderItems)
      stockAlerts = commit.alerts
      inventoryOk = true
    } catch (err: any) {
      console.error('[finalizePaidOrder] inventory failed:', err?.message || err)
      await patchOrder(strapiUrl, authHeaders, orderId, {
        paymentFinalizingAt: null,
        ownerNotes: [attrs.ownerNotes, 'Inventory decrement failed during payment finalization. Manual check required.']
          .filter(Boolean)
          .join('\n'),
      }).catch(() => {})
      void notifyOwnerPush({
        title: 'Inventory update failed',
        body: `${attrs.orderNumber || `Order #${orderId}`} payment finalize needs inventory review.`,
        url: `/admin/orders/${orderId}`,
        tag: `order-${orderId}-inventory`,
      })
      return {
        ok: false,
        paymentStatus: attrs.paymentStatus || 'processing',
        inventoryCommitted: false,
        paidAt: attrs.paidAt || null,
        paidReceiptSentAt: attrs.paidReceiptSentAt || null,
        stockLines,
        message: 'Inventory update failed. Payment was not marked paid.',
      }
    }
  }

  const paidAt = attrs.paidAt || new Date().toISOString()
  const updateData: Record<string, any> = {
    paymentStatus: 'paid',
    paidAt,
    inventoryCommitted: true,
    inventoryAdjusted: true,
  }
  if (claimSupported) {
    updateData.paymentFinalizingAt = null
  }

  // Prefer cashapp_manual; fall back handled below if Strapi rejects enum
  updateData.paymentProvider = opts.paymentProvider || attrs.paymentProvider || 'cashapp_manual'
  updateData.paymentMethod = opts.paymentMethod || attrs.paymentMethod || 'cashapp'

  if (attrs.status === 'awaiting_payment') {
    updateData.status = 'approved'
  }

  if (
    attrs.shippoRateId &&
    !attrs.shippoTransactionId &&
    (attrs.shippingStatus === 'selected' || attrs.shippingStatus === 'quoted')
  ) {
    updateData.shippingStatus = 'ready_to_ship'
  }

  if (insufficient.length) {
    updateData.ownerNotes = [
      attrs.ownerNotes,
      `Owner confirmed payment with insufficient stock: ${insufficient
        .map((l) => `${l.productName} ${l.variantName} ordered ${l.orderedQty} / stock ${l.currentStock}`)
        .join('; ')}`,
    ]
      .filter(Boolean)
      .join('\n')
  }

  try {
    await patchOrder(strapiUrl, authHeaders, orderId, updateData)
  } catch (err: any) {
    console.warn('[finalizePaidOrder] full paid patch failed, retrying minimal:', err?.message || err)
    await patchOrder(strapiUrl, authHeaders, orderId, {
      paymentStatus: 'paid',
      paidAt,
      inventoryCommitted: true,
      inventoryAdjusted: true,
      paymentProvider: attrs.paymentProvider === 'moov' ? 'moov' : 'manual',
      ...(attrs.status === 'awaiting_payment' ? { status: 'approved' } : {}),
      ...(updateData.shippingStatus ? { shippingStatus: updateData.shippingStatus } : {}),
    })
  }

  let paidReceiptSentAt = attrs.paidReceiptSentAt || null
  if (sendEmailsOnPaid && !paidReceiptSentAt) {
    const config = useRuntimeConfig(event)
    let orderItems = attrs.orderItems?.data || []
    if (!orderItems.length) {
      try {
        const itemsResponse = await $fetch<{ data: any[] }>(
          `${strapiUrl}/api/order-items?filters[order][id][$eq]=${orderId}&pagination[pageSize]=100`,
          { headers: authHeaders }
        )
        orderItems = itemsResponse.data || []
      } catch {
        orderItems = []
      }
    }

    const items = orderItems.map((item: any) => ({
      productName: item.attributes?.productNameSnapshot || '',
      variantName: item.attributes?.variantNameSnapshot || '',
      skuSnapshot: item.attributes?.skuSnapshot || '',
      quantity: item.attributes?.quantity || 0,
      unitPrice: Number(item.attributes?.unitPriceSnapshot) || 0,
    }))

    try {
      await sendPaidOrderEmails(
        {
          orderId,
          orderNumber: attrs.orderNumber || String(orderId),
          status: 'paid',
          inventoryAdjusted: true,
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
        }
      )
      paidReceiptSentAt = new Date().toISOString()
      await patchOrder(strapiUrl, authHeaders, orderId, { paidReceiptSentAt })
    } catch (err: any) {
      console.error('[finalizePaidOrder] receipt email failed:', err?.message || err)
    }
  }

  const orderLabel = attrs.orderNumber || `Order #${orderId}`
  void notifyOwnerPush({
    title: 'Payment verified',
    body: `${orderLabel} is paid and ready to ship.`,
    url: `/admin/orders/${orderId}`,
    tag: `order-${orderId}-paid`,
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
    ok: true,
    paymentStatus: 'paid',
    inventoryCommitted: inventoryOk,
    paidAt,
    paidReceiptSentAt,
    stockLines,
    insufficientStock: insufficient.length > 0,
    message: 'Payment marked received.',
  }
}
