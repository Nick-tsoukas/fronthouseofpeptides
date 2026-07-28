import {
  getMoovConfig,
  getMoovTransfer,
  getAccountPaymentMethods,
  findMoovWalletPaymentMethod,
  mapMoovTransferToPaymentStatus,
  extractCardDetailsStatus,
  safeLog,
  type MoovConfig,
} from '~/server/utils/moov'
import { sendPaidOrderEmails } from '~/server/utils/sendOrderEmails'

export async function commitInventoryOnce(
  strapiUrl: string,
  authHeaders: Record<string, string>,
  orderId: number,
  orderItems: any[]
): Promise<boolean> {
  let anyTracked = false

  for (const item of orderItems) {
    const attrs = item.attributes || {}
    const quantity = Number(attrs.quantity) || 0
    const variant = attrs.variant?.data
    if (!variant?.id || quantity <= 0) continue

    const inventory = variant.attributes?.inventory
    if (inventory === null || inventory === undefined) continue

    anyTracked = true
    const newInventory = Math.max(0, Number(inventory) - quantity)
    await $fetch(`${strapiUrl}/api/variants/${variant.id}`, {
      method: 'PUT',
      headers: authHeaders,
      body: { data: { inventory: newInventory } },
    })

    safeLog('Inventory decremented', {
      orderId,
      variantId: variant.id,
      from: inventory,
      to: newInventory,
    })
  }

  return anyTracked
}

export function extractTransferIdFromWebhookPayload(payload: any): string | undefined {
  const candidates = [
    payload?.transferID,
    payload?.transferId,
    payload?.data?.transferID,
    payload?.data?.transferId,
    payload?.resource?.transferID,
    payload?.resource?.transferId,
    payload?.data?.id,
    payload?.resource?.id,
  ]
  for (const value of candidates) {
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return undefined
}

export interface TransferVerification {
  ok: boolean
  reason?: string
  transfer?: any
  transferStatus?: string
  cardDetailsStatus?: string | null
  mappedPaymentStatus?: 'processing' | 'paid' | 'failed' | 'refunded' | null
  amountMatches?: boolean
  sourceMatches?: boolean
  destinationMatches?: boolean
  currency?: string
}

export async function verifyMoovTransferAgainstOrder(
  moovConfig: MoovConfig,
  attrs: Record<string, any>,
  transferId: string
): Promise<TransferVerification> {
  let transfer: any
  try {
    transfer = await getMoovTransfer(moovConfig, transferId)
  } catch (err: any) {
    return { ok: false, reason: 'transfer_retrieve_failed' }
  }

  const verifiedTransferId = transfer?.transferID || transfer?.transferId
  const amountValue = Number(transfer?.amount?.value)
  const currency = String(transfer?.amount?.currency || '').toUpperCase()
  const sourcePm =
    transfer?.source?.paymentMethodID || transfer?.source?.paymentMethodId
  const destinationPm =
    transfer?.destination?.paymentMethodID || transfer?.destination?.paymentMethodId
  const verifiedStatus = String(transfer?.status || '').toLowerCase()
  const cardDetailsStatus = extractCardDetailsStatus(transfer)

  if (verifiedTransferId !== attrs.moovTransferId) {
    return {
      ok: false,
      reason: 'transfer_id_mismatch',
      transfer,
      transferStatus: verifiedStatus,
      cardDetailsStatus,
    }
  }

  const amountMatches = amountValue === Number(attrs.totalCents)
  if (!amountMatches) {
    return {
      ok: false,
      reason: 'amount_mismatch',
      transfer,
      transferStatus: verifiedStatus,
      cardDetailsStatus,
      amountMatches: false,
      currency,
    }
  }

  if (currency !== 'USD') {
    return {
      ok: false,
      reason: 'currency_mismatch',
      transfer,
      transferStatus: verifiedStatus,
      cardDetailsStatus,
      amountMatches: true,
      currency,
    }
  }

  const sourceMatches = sourcePm === attrs.moovPaymentMethodId
  if (!sourceMatches) {
    return {
      ok: false,
      reason: 'source_mismatch',
      transfer,
      transferStatus: verifiedStatus,
      cardDetailsStatus,
      amountMatches: true,
      sourceMatches: false,
      currency,
    }
  }

  let destinationMatches = true
  try {
    const merchantMethods = await getAccountPaymentMethods(moovConfig, moovConfig.accountId)
    const merchantWalletId = findMoovWalletPaymentMethod(merchantMethods)?.paymentMethodID || null
    destinationMatches = Boolean(merchantWalletId && destinationPm === merchantWalletId)
    if (!destinationMatches) {
      return {
        ok: false,
        reason: 'destination_mismatch',
        transfer,
        transferStatus: verifiedStatus,
        cardDetailsStatus,
        amountMatches: true,
        sourceMatches: true,
        destinationMatches: false,
        currency,
      }
    }
  } catch {
    // If merchant wallet lookup fails, skip destination check but continue mapping
    destinationMatches = false
  }

  return {
    ok: true,
    transfer,
    transferStatus: verifiedStatus,
    cardDetailsStatus,
    mappedPaymentStatus: mapMoovTransferToPaymentStatus(verifiedStatus, cardDetailsStatus),
    amountMatches: true,
    sourceMatches: true,
    destinationMatches,
    currency,
  }
}

export async function applyVerifiedTransferToOrder(opts: {
  event: any
  strapiUrl: string
  authHeaders: Record<string, string>
  orderId: number
  attrs: Record<string, any>
  mappedPaymentStatus: 'processing' | 'paid' | 'failed' | 'refunded'
  processedWebhookIds?: string[]
  eventId?: string
  sendEmailsOnPaid?: boolean
}): Promise<{ paymentStatus: string; inventoryCommitted: boolean; paidAt: string | null }> {
  const {
    event,
    strapiUrl,
    authHeaders,
    orderId,
    attrs,
    mappedPaymentStatus,
    sendEmailsOnPaid = false,
  } = opts

  const alreadyPaid = attrs.paymentStatus === 'paid'
  const alreadyCommitted = Boolean(attrs.inventoryCommitted)
  const updateData: Record<string, any> = {}

  if (opts.eventId) {
    const existing = Array.isArray(opts.processedWebhookIds) ? opts.processedWebhookIds : []
    if (!existing.includes(opts.eventId)) {
      updateData.processedWebhookIds = [...existing, opts.eventId]
    }
  }

  if (!alreadyPaid) {
    updateData.paymentStatus = mappedPaymentStatus
  } else if (mappedPaymentStatus === 'refunded') {
    updateData.paymentStatus = 'refunded'
  }

  let shouldCommitInventory = false
  let shouldSendEmails = false

  if (mappedPaymentStatus === 'paid' && !alreadyPaid) {
    updateData.paymentStatus = 'paid'
    updateData.paidAt = new Date().toISOString()
    updateData.paymentProvider = 'moov'
    updateData.paymentMethod = 'card'
    shouldSendEmails = sendEmailsOnPaid

    if (!alreadyCommitted) {
      shouldCommitInventory = true
      updateData.inventoryCommitted = true
      updateData.inventoryAdjusted = true
    }
  }

  if (shouldCommitInventory) {
    try {
      // Load items with variants if not already populated
      let orderItems = attrs.orderItems?.data || []
      if (!orderItems.length) {
        const itemsResponse = await $fetch<{ data: any[] }>(
          `${strapiUrl}/api/order-items?filters[order][id][$eq]=${orderId}&populate[variant]=true&pagination[pageSize]=100`,
          { headers: authHeaders }
        )
        orderItems = itemsResponse.data || []
      }
      await commitInventoryOnce(strapiUrl, authHeaders, orderId, orderItems)
    } catch (err: any) {
      console.error('Inventory commit failed:', err?.message || err)
      updateData.inventoryCommitted = false
      updateData.inventoryAdjusted = false
      updateData.ownerNotes = [
        attrs.ownerNotes,
        'Inventory decrement failed after paid Moov transfer. Manual inventory check required.',
      ]
        .filter(Boolean)
        .join('\n')
    }
  }

  if (Object.keys(updateData).length > 0) {
    await $fetch(`${strapiUrl}/api/orders/${orderId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: { data: updateData },
    })
  }

  if (shouldSendEmails) {
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

    await sendPaidOrderEmails(
      {
        orderId,
        orderNumber: attrs.orderNumber || String(orderId),
        status: 'paid',
        inventoryAdjusted: Boolean(updateData.inventoryAdjusted ?? attrs.inventoryAdjusted),
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
      }
    ).catch((err: any) => {
      console.error('Paid order email failed:', err?.message || err)
    })
  }

  return {
    paymentStatus: updateData.paymentStatus || attrs.paymentStatus || 'pending',
    inventoryCommitted: Boolean(
      updateData.inventoryCommitted ?? attrs.inventoryCommitted
    ),
    paidAt: updateData.paidAt || attrs.paidAt || null,
  }
}

/**
 * Reconcile a processing order against Moov transfer status.
 * Used by checkout status polling as a webhook backup.
 */
export async function reconcileProcessingOrder(opts: {
  event: any
  orderId: number
  attrs: Record<string, any>
  strapiUrl: string
  authHeaders: Record<string, string>
}): Promise<{
  paymentStatus: string
  inventoryCommitted: boolean
  paidAt: string | null
  transferStatus: string | null
  cardDetailsStatus: string | null
}> {
  const { event, orderId, attrs, strapiUrl, authHeaders } = opts
  const currentStatus = attrs.paymentStatus || 'pending'

  if (currentStatus !== 'processing' || !attrs.moovTransferId) {
    return {
      paymentStatus: currentStatus,
      inventoryCommitted: Boolean(attrs.inventoryCommitted),
      paidAt: attrs.paidAt || null,
      transferStatus: null,
      cardDetailsStatus: null,
    }
  }

  const moovConfig = getMoovConfig(event)
  if (!moovConfig.publicKey || !moovConfig.secretKey || !moovConfig.accountId) {
    return {
      paymentStatus: currentStatus,
      inventoryCommitted: Boolean(attrs.inventoryCommitted),
      paidAt: attrs.paidAt || null,
      transferStatus: null,
      cardDetailsStatus: null,
    }
  }

  const verified = await verifyMoovTransferAgainstOrder(
    moovConfig,
    attrs,
    attrs.moovTransferId
  )

  if (!verified.ok || !verified.mappedPaymentStatus) {
    safeLog('Moov reconcile skipped/unverified', {
      orderId,
      orderNumber: attrs.orderNumber,
      reason: verified.reason || 'unmapped',
      transferStatus: verified.transferStatus || null,
      cardDetailsStatus: verified.cardDetailsStatus || null,
    })
    return {
      paymentStatus: currentStatus,
      inventoryCommitted: Boolean(attrs.inventoryCommitted),
      paidAt: attrs.paidAt || null,
      transferStatus: verified.transferStatus || null,
      cardDetailsStatus: verified.cardDetailsStatus || null,
    }
  }

  // Only apply state changes when mapped status differs or becoming paid
  if (
    verified.mappedPaymentStatus === currentStatus &&
    verified.mappedPaymentStatus !== 'paid'
  ) {
    return {
      paymentStatus: currentStatus,
      inventoryCommitted: Boolean(attrs.inventoryCommitted),
      paidAt: attrs.paidAt || null,
      transferStatus: verified.transferStatus || null,
      cardDetailsStatus: verified.cardDetailsStatus || null,
    }
  }

  const applied = await applyVerifiedTransferToOrder({
    event,
    strapiUrl,
    authHeaders,
    orderId,
    attrs,
    mappedPaymentStatus: verified.mappedPaymentStatus,
    sendEmailsOnPaid: true,
  })

  safeLog('Moov reconcile applied', {
    orderId,
    orderNumber: attrs.orderNumber,
    transferStatus: verified.transferStatus,
    cardDetailsStatus: verified.cardDetailsStatus,
    paymentStatus: applied.paymentStatus,
  })

  return {
    ...applied,
    transferStatus: verified.transferStatus || null,
    cardDetailsStatus: verified.cardDetailsStatus || null,
  }
}
