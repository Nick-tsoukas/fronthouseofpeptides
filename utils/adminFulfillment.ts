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

export function paymentLabel(status: string | null | undefined): string {
  switch (String(status || '').toLowerCase()) {
    case 'paid':
      return 'Paid'
    case 'processing':
      return 'Processing'
    case 'failed':
      return 'Failed'
    case 'pending':
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

export function statusHeadline(order: {
  paymentStatus?: string | null
  shippingStatus?: string | null
}): string {
  const pay = paymentLabel(order.paymentStatus)
  const ship = shippingLabel(order.shippingStatus)
  if (order.paymentStatus !== 'paid') return pay
  if (order.shippingStatus === 'label_purchased') return 'Label Ready · Tracking Available'
  return `${pay} · ${ship}`
}

export function fulfillmentBadge(order: {
  paymentStatus?: string | null
  shippingStatus?: string | null
}): { label: string; kind: FulfillmentKind } {
  const pay = String(order.paymentStatus || '').toLowerCase()
  const ship = String(order.shippingStatus || '').toLowerCase()

  if (pay === 'failed' || ship === 'label_failed') {
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
  if (pay === 'processing') return { label: 'Processing', kind: 'processing' }
  if (pay === 'pending') return { label: 'Unpaid', kind: 'unpaid' }
  return { label: paymentLabel(pay), kind: 'neutral' }
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

export function paymentBadgeClass(status: string | null | undefined): string {
  const s = String(status || '').toLowerCase()
  if (s === 'paid') return badgeClass('paid')
  if (s === 'processing') return badgeClass('processing')
  if (s === 'failed') return badgeClass('failed')
  if (s === 'pending') return badgeClass('unpaid')
  return badgeClass('neutral')
}
