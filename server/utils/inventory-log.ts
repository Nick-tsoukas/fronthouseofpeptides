/**
 * Soft inventory adjustment logger.
 * Creates a Strapi inventory-adjustment entry when the collection exists.
 * Never throws — logging must not break sales/checkout.
 */
export async function createInventoryAdjustmentLog(opts: {
  strapiUrl: string
  authHeaders: Record<string, string>
  variantId: number
  productId?: number | null
  adjustmentType: 'add' | 'remove' | 'set'
  quantity: number
  previousInventory: number
  newInventory: number
  reason: string
  note?: string | null
  source: 'admin' | 'manual_sale' | 'online_order' | 'correction'
  relatedOrderId?: number | null
  createdByAdmin?: string | null
  paymentMethod?: string | null
}): Promise<boolean> {
  const data: Record<string, any> = {
    adjustmentType: opts.adjustmentType,
    quantity: opts.quantity,
    previousInventory: opts.previousInventory,
    newInventory: opts.newInventory,
    reason: opts.reason,
    note: opts.note || null,
    source: opts.source,
    createdByAdmin: opts.createdByAdmin || null,
    variant: opts.variantId,
  }

  if (opts.productId) data.product = opts.productId
  if (opts.relatedOrderId) data.relatedOrder = opts.relatedOrderId
  if (opts.paymentMethod) data.paymentMethod = opts.paymentMethod

  try {
    await $fetch(`${opts.strapiUrl}/api/inventory-adjustments`, {
      method: 'POST',
      headers: opts.authHeaders,
      body: { data },
    })
    return true
  } catch (err: any) {
    // Retry without paymentMethod if schema not yet redeployed
    if (opts.paymentMethod && data.paymentMethod) {
      try {
        const { paymentMethod: _pm, ...fallback } = data
        await $fetch(`${opts.strapiUrl}/api/inventory-adjustments`, {
          method: 'POST',
          headers: opts.authHeaders,
          body: { data: fallback },
        })
        return true
      } catch (err2: any) {
        console.error('Inventory adjustment log failed:', err2?.message || err2)
        return false
      }
    }
    console.error('Inventory adjustment log failed:', err?.message || err)
    return false
  }
}
