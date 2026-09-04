import { validateCheckoutSession } from '~/server/utils/checkout-session'
import { fetchStoreSettings } from '~/server/utils/storeSettings'
import {
  isCashAppConfigured,
  cashAppPaymentUrlFromCashtag,
  normalizeCashAppCashtag,
} from '~/utils/storeSettings'

/**
 * GET /api/checkout/payment-instructions?orderId=
 * Session-gated Cash App instructions for the customer checkout session.
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const orderId = Number(query.orderId)

  const { attributes: attrs } = await validateCheckoutSession(event, {
    orderId,
    requiredFields: [
      'totalCents',
      'amountTotal',
      'currency',
      'paymentProvider',
      'paymentMethod',
      'paymentStatus',
      'manualPaymentExpiresAt',
      'manualPaymentClaimedAt',
      'email',
      'customerName',
    ],
    skipStatusGate: true,
  })

  const { settings } = await fetchStoreSettings(event)
  const provider = String(attrs.paymentProvider || '')
  const isCashApp =
    provider === 'cashapp_manual' ||
    provider === 'manual' ||
    String(attrs.paymentMethod || '') === 'cashapp'

  if (!isCashApp) {
    throw createError({
      statusCode: 400,
      message: 'This order is not a Cash App manual payment order.',
    })
  }

  const configured = isCashAppConfigured(settings)
  const cashtag = normalizeCashAppCashtag(settings.cashAppCashtag)
  const paymentUrl =
    (settings.cashAppPaymentUrl || '').trim() || cashAppPaymentUrlFromCashtag(cashtag)
  const totalCents =
    Number(attrs.totalCents) >= 0
      ? Number(attrs.totalCents)
      : Math.round((Number(attrs.amountTotal) || 0) * 100)

  return {
    ok: true,
    orderId,
    orderNumber: attrs.orderNumber || String(orderId),
    paymentStatus: attrs.paymentStatus || 'pending',
    paymentProvider: attrs.paymentProvider || 'cashapp_manual',
    totalCents,
    currency: attrs.currency || 'USD',
    expiresAt: attrs.manualPaymentExpiresAt || null,
    claimedAt: attrs.manualPaymentClaimedAt || null,
    configured,
    incompleteMessage: configured
      ? null
      : 'Cash App payment details are not configured yet. Please contact support — do not send payment until instructions are available.',
    cashApp: {
      cashtag: configured ? cashtag : '',
      displayName: configured ? settings.cashAppDisplayName : '',
      paymentUrl: configured ? paymentUrl : '',
      qrImageUrl: configured ? settings.cashAppQrImageUrl || '' : '',
    },
    supportEmail:
      settings.manualPaymentSupportEmail ||
      settings.supportEmail ||
      'orders@quantumbiopeptides.com',
    storeName: settings.storeName,
    copy: {
      noCardCharged: 'No card was charged. Pay the exact total in Cash App using the details below.',
      awaitingVerification:
        'Your order is not confirmed until payment is verified. Tracking will be emailed when your order ships.',
      afterClaim:
        'Your payment submission was received and is awaiting verification. Once verified, you’ll receive order confirmation. Tracking will be emailed when your order ships.',
      afterPaid:
        'Payment received. Your order is confirmed. You’ll receive tracking by email when your order ships.',
    },
  }
})
