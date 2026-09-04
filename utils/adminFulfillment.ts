export type FulfillmentKind =
  | 'paid'
  | 'processing'
  | 'failed'
  | 'ready'
  | 'label'
  | 'purchasing'
  | 'shipped'
  | 'delivered'
  | 'attention'
  | 'unpaid'
  | 'neutral'

export type OrderPaymentContext = {
  paymentStatus?: string | null
  shippingStatus?: string | null
  paymentProvider?: string | null
  paymentMethod?: string | null
}

function isManualCashApp(order: OrderPaymentContext): boolean {
  const provider = String(order.paymentProvider || '').toLowerCase()
  const method = String(order.paymentMethod || '').toLowerCase()
  return provider === 'cashapp_manual' || provider === 'manual' || method === 'cashapp'
}

function isMoov(order: OrderPaymentContext): boolean {
  return String(order.paymentProvider || '').toLowerCase() === 'moov'
}

export function paymentLabel(
  status: string | null | undefined,
  order?: OrderPaymentContext
): string {
  const pay = String(status || '').toLowerCase()
  const ctx = order || { paymentStatus: status }

  switch (pay) {
    case 'paid':
      return 'Paid'
    case 'processing':
      if (isManualCashApp(ctx) && !isMoov(ctx)) return 'Customer says paid'
      return 'Processing'
    case 'failed':
      if (isManualCashApp(ctx)) return 'Payment rejected'
      return 'Failed'
    case 'pending':
      if (isManualCashApp(ctx)) return 'Awaiting Cash App'
      return 'Pending'
    case 'cancelled':
    case 'canceled':
      return 'Cancelled'
    case 'refunded':
      return 'Refunded'
    default:
      return status ? String(status) : '—'
  }
}

export function shippingLabel(status: string | null | undefined): string {
  switch (String(status || '').toLowerCase()) {
    case 'selected':
    case 'ready_to_ship':
      return 'Ready to ship'
    case 'label_purchasing':
      return 'Generating label'
    case 'label_purchased':
      return 'Label purchased'
    case 'shipped':
    case 'in_transit':
      return 'Shipped'
    case 'delivered':
      return 'Delivered'
    case 'label_failed':
      return 'Attention needed'
    default:
      return status ? String(status).replace(/_/g, ' ') : '—'
  }
}

export function statusHeadline(order: OrderPaymentContext): string {
  const pay = paymentLabel(order.paymentStatus, order)
  const ship = shippingLabel(order.shippingStatus)
  if (order.paymentStatus !== 'paid') return pay
  if (order.shippingStatus === 'label_purchased') return 'Label Ready · Tracking Available'
  return `${pay} · ${ship}`
}

export function fulfillmentBadge(order: OrderPaymentContext): {
  label: string
  kind: FulfillmentKind
} {
  const pay = String(order.paymentStatus || '').toLowerCase()
  const ship = String(order.shippingStatus || '').toLowerCase()
  const manual = isManualCashApp(order)
  const moov = isMoov(order)

  if (pay === 'failed' || ship === 'label_failed') {
    if (pay === 'failed' && manual) {
      return { label: 'Payment rejected', kind: 'attention' }
    }
    return { label: 'Attention needed', kind: 'attention' }
  }
  if (ship === 'delivered') return { label: 'Delivered', kind: 'delivered' }
  if (ship === 'shipped' || ship === 'in_transit') return { label: 'Shipped', kind: 'shipped' }
  if (ship === 'label_purchased') return { label: 'Label purchased', kind: 'label' }
  if (ship === 'label_purchasing') return { label: 'Generating label', kind: 'purchasing' }
  if (pay === 'paid' && (ship === 'selected' || ship === 'ready_to_ship' || !ship)) {
    return { label: 'Ready to ship', kind: 'ready' }
  }
  if (pay === 'paid') return { label: 'Paid', kind: 'paid' }
  if (pay === 'processing') {
    if (manual && !moov) return { label: 'Needs verification', kind: 'processing' }
    return { label: 'Processing', kind: 'processing' }
  }
  if (pay === 'pending') {
    if (manual) return { label: 'Awaiting Cash App', kind: 'unpaid' }
    return { label: 'Unpaid', kind: 'unpaid' }
  }
  return { label: paymentLabel(pay, order), kind: 'neutral' }
}

export function nextActionHint(order: OrderPaymentContext): string {
  const pay = String(order.paymentStatus || '').toLowerCase()
  const ship = String(order.shippingStatus || '').toLowerCase()
  const manual = isManualCashApp(order)

  if (pay === 'failed') return manual ? 'Reject reason sent — await correction' : 'Review failed payment'
  if (pay === 'processing' && manual) return 'Verify Cash App payment'
  if (pay === 'pending' && manual) return 'Waiting for Cash App payment'
  if (pay !== 'paid') return 'Waiting for payment'
  if (ship === 'label_failed') return 'Retry label purchase'
  if (ship === 'label_purchasing') return 'Refresh label status'
  if (ship === 'label_purchased') return 'Print label · Mark shipped'
  if (ship === 'shipped' || ship === 'in_transit' || ship === 'delivered') return 'Shipped'
  if (ship === 'selected' || ship === 'ready_to_ship' || !ship) return 'Buy shipping label'
  return 'View order'
}

export function badgeClass(kind: FulfillmentKind | string): string {
  const base = 'inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full capitalize '
  switch (kind) {
    case 'paid':
    case 'ready':
      return base + 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
    case 'label':
      return base + 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
    case 'purchasing':
    case 'processing':
      return base + 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
    case 'shipped':
    case 'delivered':
      return base + 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
    case 'failed':
    case 'attention':
      return base + 'bg-red-500/15 text-red-300 border border-red-500/30'
    case 'unpaid':
      return base + 'bg-yellow-500/15 text-yellow-300 border border-yellow-500/30'
    default:
      return base + 'bg-dark-700 text-dark-300 border border-dark-600'
  }
}

export function paymentBadgeClass(
  status: string | null | undefined,
  order?: OrderPaymentContext
): string {
  const s = String(status || '').toLowerCase()
  if (s === 'paid') return badgeClass('paid')
  if (s === 'processing') return badgeClass('processing')
  if (s === 'failed') return badgeClass('failed')
  if (s === 'pending') {
    if (order && isManualCashApp(order)) return badgeClass('unpaid')
    return badgeClass('unpaid')
  }
  return badgeClass('neutral')
}
