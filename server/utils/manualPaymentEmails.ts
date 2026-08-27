import nodemailer from 'nodemailer'
import type { EmailBrand } from '~/server/utils/sendOrderEmails'

export interface ManualPaymentEmailConfig {
  smtpHost: string
  smtpPort: string
  smtpUser: string
  smtpPass: string
  orderFromEmail: string
  ownerOrderEmail?: string
  brand?: EmailBrand
}

export interface ManualPaymentEmailOrder {
  orderId: number
  orderNumber: string
  customerName: string
  email: string
  totalCents: number
  methodLabel: string
  /** $Cashtag or Zelle email/phone. */
  handle: string
  recipientDisplayName: string
  paymentUrl: string
  instructions: string
  supportEmail: string
  expirationHours: number
}

const RUO_DISCLAIMER =
  'Research Use Only: all products are strictly for laboratory and research purposes. They are not for human or animal consumption.'

function brandName(config: ManualPaymentEmailConfig): string {
  return (config.brand?.storeName || '').trim() || 'Quantum Bio Peptides'
}

function money(cents: number): string {
  return `$${((Number(cents) || 0) / 100).toFixed(2)}`
}

function transport(config: ManualPaymentEmailConfig) {
  if (!config.smtpHost || !config.smtpUser || !config.smtpPass || !config.orderFromEmail) return null
  return nodemailer.createTransport({
    host: config.smtpHost,
    port: parseInt(config.smtpPort, 10) || 587,
    secure: false,
    auth: { user: config.smtpUser, pass: config.smtpPass },
  })
}

function shell(title: string, storeName: string, inner: string, footer: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:system-ui,sans-serif;color:#e5e7eb;">
  <div style="max-width:600px;margin:40px auto;background:#111;border:1px solid #2d2d2d;border-radius:12px;overflow:hidden;">
    <div style="background:#0f172a;padding:28px 32px;border-bottom:1px solid #2d2d2d;">
      <p style="margin:0 0 4px;font-size:12px;text-transform:uppercase;letter-spacing:2px;color:#67e8f9;">${storeName}</p>
      <h1 style="margin:0;font-size:22px;font-weight:700;color:#fff;">${title}</h1>
    </div>
    <div style="padding:32px;">${inner}</div>
    <div style="background:#0f172a;padding:18px 32px;border-top:1px solid #2d2d2d;">
      <p style="margin:0;font-size:12px;color:#6b7280;text-align:center;">${footer}</p>
    </div>
  </div>
</body>
</html>`
}

/** Sent right after a manual-payment order is created. Never says the order is paid. */
export async function sendManualPaymentInstructionsEmail(
  order: ManualPaymentEmailOrder,
  config: ManualPaymentEmailConfig
): Promise<{ sent: boolean; error?: string }> {
  const mailer = transport(config)
  if (!mailer) return { sent: false, error: 'SMTP not configured.' }

  const storeName = brandName(config)
  const support = order.supportEmail || config.brand?.supportEmail || ''
  const inner = `
    <p style="margin:0 0 16px;">Hi ${order.customerName},</p>
    <p style="margin:0 0 24px;color:#9ca3af;">
      We received your order. To complete it, send the exact amount below with ${order.methodLabel} and include your order number in the payment note.
    </p>
    <div style="background:#1a1a1a;border:1px solid #2d2d2d;border-radius:8px;padding:16px;margin-bottom:20px;font-size:14px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
        <tr><td style="color:#9ca3af;padding:5px 0;">Order number</td><td style="text-align:right;font-family:monospace;color:#fff;">${order.orderNumber}</td></tr>
        <tr><td style="color:#9ca3af;padding:5px 0;">Amount to send</td><td style="text-align:right;color:#fff;font-weight:700;">${money(order.totalCents)}</td></tr>
        <tr><td style="color:#9ca3af;padding:5px 0;">Send to</td><td style="text-align:right;color:#fff;font-family:monospace;">${order.handle}</td></tr>
        ${order.recipientDisplayName ? `<tr><td style="color:#9ca3af;padding:5px 0;">Recipient name</td><td style="text-align:right;color:#fff;">${order.recipientDisplayName}</td></tr>` : ''}
        <tr><td style="color:#9ca3af;padding:5px 0;">Payment note</td><td style="text-align:right;font-family:monospace;color:#fff;">${order.orderNumber}</td></tr>
      </table>
    </div>
    ${
      order.paymentUrl
        ? `<p style="margin:0 0 20px;"><a href="${order.paymentUrl}" style="display:inline-block;background:#00d54b;color:#04140a;text-decoration:none;font-weight:700;padding:12px 18px;border-radius:10px;">Open ${order.methodLabel}</a></p>`
        : ''
    }
    ${order.instructions ? `<p style="margin:0 0 20px;color:#d1d5db;white-space:pre-line;">${order.instructions}</p>` : ''}
    <div style="background:#1a1a1a;border:1px solid #f59e0b40;border-radius:8px;padding:16px;margin-bottom:20px;">
      <p style="margin:0;font-size:13px;color:#fbbf24;">
        Your order is not confirmed until payment is verified. No card has been charged on this website.
        Please send payment within ${order.expirationHours} hours so we can hold your items.
      </p>
    </div>
    ${support ? `<p style="margin:0 0 12px;font-size:13px;color:#9ca3af;">Questions? Contact ${support}</p>` : ''}
    <p style="margin:0;font-size:12px;color:#6b7280;">${RUO_DISCLAIMER}</p>`

  try {
    await mailer.sendMail({
      from: config.orderFromEmail,
      to: order.email,
      subject: `Order received — ${order.methodLabel} payment instructions (${order.orderNumber})`,
      html: shell(`${order.methodLabel} payment instructions`, storeName, inner, `${storeName}${support ? ` — ${support}` : ''}`),
    })
    return { sent: true }
  } catch (err: any) {
    console.error(`[email] Manual payment instructions failed for ${order.orderNumber}:`, err?.message || err)
    return { sent: false, error: 'Could not send payment instructions email.' }
  }
}

/** Customer acknowledgement + owner verification alert after "I sent payment". */
export async function sendManualPaymentClaimEmails(
  order: ManualPaymentEmailOrder & {
    senderName: string
    senderHandle: string
    note: string
    claimedAt: string
  },
  config: ManualPaymentEmailConfig
): Promise<{ customerSent: boolean; ownerSent: boolean }> {
  const mailer = transport(config)
  if (!mailer) return { customerSent: false, ownerSent: false }

  const storeName = brandName(config)
  const support = order.supportEmail || config.brand?.supportEmail || ''
  let customerSent = false
  let ownerSent = false

  const customerInner = `
    <p style="margin:0 0 16px;">Hi ${order.customerName},</p>
    <p style="margin:0 0 20px;color:#9ca3af;">
      Thanks — we noted that you sent ${money(order.totalCents)} for order
      <strong style="color:#fff;font-family:monospace;">${order.orderNumber}</strong> via ${order.methodLabel}.
    </p>
    <p style="margin:0 0 20px;color:#d1d5db;">
      Your payment is awaiting verification. We will email you a receipt as soon as we confirm it. Your order is not confirmed until then.
    </p>
    ${support ? `<p style="margin:0 0 12px;font-size:13px;color:#9ca3af;">Questions? Contact ${support}</p>` : ''}
    <p style="margin:0;font-size:12px;color:#6b7280;">${RUO_DISCLAIMER}</p>`

  try {
    await mailer.sendMail({
      from: config.orderFromEmail,
      to: order.email,
      subject: `Thanks — your payment is awaiting verification (${order.orderNumber})`,
      html: shell('Awaiting payment verification', storeName, customerInner, `${storeName}${support ? ` — ${support}` : ''}`),
    })
    customerSent = true
  } catch (err: any) {
    console.error(`[email] Manual payment claim ack failed for ${order.orderNumber}:`, err?.message || err)
  }

  if (config.ownerOrderEmail) {
    const ownerInner = `
      <p style="margin:0 0 20px;color:#9ca3af;">A customer says they sent a ${order.methodLabel} payment. Verify it in ${order.methodLabel} before marking the order paid.</p>
      <div style="background:#1a1a1a;border:1px solid #2d2d2d;border-radius:8px;padding:16px;font-size:14px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
          <tr><td style="color:#9ca3af;padding:4px 0;">Order</td><td style="text-align:right;font-family:monospace;color:#fff;">${order.orderNumber}</td></tr>
          <tr><td style="color:#9ca3af;padding:4px 0;">Amount due</td><td style="text-align:right;color:#fff;font-weight:700;">${money(order.totalCents)}</td></tr>
          <tr><td style="color:#9ca3af;padding:4px 0;">Customer</td><td style="text-align:right;color:#fff;">${order.customerName} &lt;${order.email}&gt;</td></tr>
          <tr><td style="color:#9ca3af;padding:4px 0;">Claimed sender</td><td style="text-align:right;color:#fff;">${order.senderName || '—'}</td></tr>
          <tr><td style="color:#9ca3af;padding:4px 0;">Claimed handle</td><td style="text-align:right;font-family:monospace;color:#fff;">${order.senderHandle || '—'}</td></tr>
          <tr><td style="color:#9ca3af;padding:4px 0;">Claimed at</td><td style="text-align:right;color:#fff;">${order.claimedAt}</td></tr>
        </table>
        ${order.note ? `<p style="margin:12px 0 0;color:#d1d5db;font-size:13px;white-space:pre-line;">Note: ${order.note}</p>` : ''}
      </div>
      <p style="margin:20px 0 0;font-size:13px;color:#fbbf24;">Customer claims are not proof of payment. Confirm the exact amount and order number in ${order.methodLabel} first.</p>`

    try {
      await mailer.sendMail({
        from: config.orderFromEmail,
        to: config.ownerOrderEmail,
        subject: `Payment needs verification — ${order.orderNumber}`,
        html: shell('Payment needs verification', storeName, ownerInner, `${storeName} Admin — internal notification.`),
      })
      ownerSent = true
    } catch (err: any) {
      console.error(`[email] Manual payment owner alert failed for ${order.orderNumber}:`, err?.message || err)
    }
  }

  return { customerSent, ownerSent }
}

/** Sent when the owner rejects a claimed manual payment. */
export async function sendManualPaymentRejectedEmail(
  order: ManualPaymentEmailOrder & { reason: string },
  config: ManualPaymentEmailConfig
): Promise<{ sent: boolean; error?: string }> {
  const mailer = transport(config)
  if (!mailer) return { sent: false, error: 'SMTP not configured.' }

  const storeName = brandName(config)
  const support = order.supportEmail || config.brand?.supportEmail || ''
  const inner = `
    <p style="margin:0 0 16px;">Hi ${order.customerName},</p>
    <p style="margin:0 0 20px;color:#9ca3af;">
      We could not verify a ${order.methodLabel} payment for order
      <strong style="color:#fff;font-family:monospace;">${order.orderNumber}</strong>.
    </p>
    ${order.reason ? `<div style="background:#1a1a1a;border:1px solid #ef444440;border-radius:8px;padding:16px;margin-bottom:20px;"><p style="margin:0;color:#fca5a5;font-size:14px;white-space:pre-line;">${order.reason}</p></div>` : ''}
    <p style="margin:0 0 16px;color:#d1d5db;">How to fix it:</p>
    <ul style="margin:0 0 20px;padding-left:20px;color:#d1d5db;font-size:14px;line-height:1.7;">
      <li>Send exactly <strong style="color:#fff;">${money(order.totalCents)}</strong> to <span style="font-family:monospace;color:#fff;">${order.handle}</span>${order.recipientDisplayName ? ` (${order.recipientDisplayName})` : ''}.</li>
      <li>Include <span style="font-family:monospace;color:#fff;">${order.orderNumber}</span> in the payment note.</li>
      <li>Then reply to this email or use your order page to tell us it was sent.</li>
    </ul>
    ${
      order.paymentUrl
        ? `<p style="margin:0 0 20px;"><a href="${order.paymentUrl}" style="display:inline-block;background:#00d54b;color:#04140a;text-decoration:none;font-weight:700;padding:12px 18px;border-radius:10px;">Open ${order.methodLabel}</a></p>`
        : ''
    }
    <p style="margin:0 0 12px;font-size:13px;color:#9ca3af;">No card has been charged on this website. Your order is not confirmed until payment is verified.</p>
    ${support ? `<p style="margin:0 0 12px;font-size:13px;color:#9ca3af;">Need help? Contact ${support}</p>` : ''}
    <p style="margin:0;font-size:12px;color:#6b7280;">${RUO_DISCLAIMER}</p>`

  try {
    await mailer.sendMail({
      from: config.orderFromEmail,
      to: order.email,
      subject: `Action needed — payment could not be verified (${order.orderNumber})`,
      html: shell('Payment could not be verified', storeName, inner, `${storeName}${support ? ` — ${support}` : ''}`),
    })
    return { sent: true }
  } catch (err: any) {
    console.error(`[email] Manual payment rejection email failed for ${order.orderNumber}:`, err?.message || err)
    return { sent: false, error: 'Could not send rejection email.' }
  }
}
