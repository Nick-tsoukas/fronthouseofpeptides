import nodemailer from 'nodemailer'

export interface OrderEmailItem {
  productName: string
  variantName: string
  skuSnapshot: string
  quantity: number
  unitPrice: number
}

export interface OrderEmailData {
  orderId: number
  status: string
  inventoryAdjusted: boolean
  customerName: string
  email: string
  phone?: string | null
  companyName?: string | null
  customerNotes?: string | null
  shippingAddressLine1: string
  shippingAddressLine2?: string | null
  shippingCity: string
  shippingState: string
  shippingPostalCode: string
  shippingCountry: string
  amountSubtotal: number
  shippingAmount: number
  amountTotal: number
  currency: string
  items: OrderEmailItem[]
}

function formatPrice(n: number): string {
  return `$${n.toFixed(2)}`
}

function formatAddress(data: OrderEmailData): string {
  const line2 = data.shippingAddressLine2 ? `\n${data.shippingAddressLine2}` : ''
  return `${data.shippingAddressLine1}${line2}\n${data.shippingCity}, ${data.shippingState} ${data.shippingPostalCode}\n${data.shippingCountry}`
}

function itemsTableHtml(items: OrderEmailItem[]): string {
  const rows = items
    .map(
      (item) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #2d2d2d;">${item.productName}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #2d2d2d;">${item.variantName}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #2d2d2d;font-family:monospace;">${item.skuSnapshot}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #2d2d2d;text-align:center;">${item.quantity}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #2d2d2d;text-align:right;">${formatPrice(item.unitPrice)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #2d2d2d;text-align:right;">${formatPrice(item.unitPrice * item.quantity)}</td>
      </tr>`
    )
    .join('')

  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:14px;">
    <thead>
      <tr style="background:#1a1a1a;">
        <th style="padding:8px 12px;text-align:left;color:#9ca3af;">Product</th>
        <th style="padding:8px 12px;text-align:left;color:#9ca3af;">Variant</th>
        <th style="padding:8px 12px;text-align:left;color:#9ca3af;">SKU</th>
        <th style="padding:8px 12px;text-align:center;color:#9ca3af;">Qty</th>
        <th style="padding:8px 12px;text-align:right;color:#9ca3af;">Unit Price</th>
        <th style="padding:8px 12px;text-align:right;color:#9ca3af;">Line Total</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>`
}

function totalsHtml(data: OrderEmailData): string {
  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin-top:12px;">
    <tr>
      <td style="padding:4px 12px;color:#9ca3af;">Subtotal</td>
      <td style="padding:4px 12px;text-align:right;">${formatPrice(data.amountSubtotal)}</td>
    </tr>
    <tr>
      <td style="padding:4px 12px;color:#9ca3af;">Est. Shipping</td>
      <td style="padding:4px 12px;text-align:right;">${formatPrice(data.shippingAmount)}</td>
    </tr>
    <tr style="font-weight:bold;">
      <td style="padding:8px 12px;border-top:1px solid #2d2d2d;">Est. Total</td>
      <td style="padding:8px 12px;border-top:1px solid #2d2d2d;text-align:right;">${formatPrice(data.amountTotal)}</td>
    </tr>
  </table>`
}

// ── Customer confirmation email ───────────────────────────────────────────────

function buildCustomerHtml(data: OrderEmailData): string {
  const statusLabel = data.status === 'approved' ? 'Approved — Availability Confirmed' : 'Received — Pending Review'
  const nextSteps =
    data.status === 'approved'
      ? 'Availability for your requested items has been confirmed. A member of our team will contact you shortly with next steps regarding payment and shipping arrangements.'
      : 'Your request has been received and is currently under review. A member of our team will confirm availability and contact you within 1–2 business days.'

  const itemRows = data.items
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #2d2d2d;">${item.productName} — ${item.variantName}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #2d2d2d;text-align:center;">${item.quantity}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #2d2d2d;text-align:right;">${formatPrice(item.unitPrice * item.quantity)}</td>
        </tr>`
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:system-ui,sans-serif;color:#e5e7eb;">
  <div style="max-width:600px;margin:40px auto;background:#111;border:1px solid #2d2d2d;border-radius:12px;overflow:hidden;">

    <!-- Header -->
    <div style="background:#0f172a;padding:32px;border-bottom:1px solid #2d2d2d;">
      <p style="margin:0 0 4px;font-size:12px;text-transform:uppercase;letter-spacing:2px;color:#6366f1;">Quantum Bio Peptides</p>
      <h1 style="margin:0;font-size:22px;font-weight:700;color:#fff;">Research Order Request</h1>
    </div>

    <!-- Body -->
    <div style="padding:32px;">
      <p style="margin:0 0 16px;">Hi ${data.customerName},</p>
      <p style="margin:0 0 24px;color:#9ca3af;">Thank you for submitting a research order request. Here is a summary of your request.</p>

      <!-- Status -->
      <div style="background:#1a1a1a;border:1px solid #2d2d2d;border-radius:8px;padding:16px;margin-bottom:24px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
          <tr>
            <td style="color:#9ca3af;padding:4px 0;">Request ID</td>
            <td style="text-align:right;font-family:monospace;color:#fff;">#${data.orderId}</td>
          </tr>
          <tr>
            <td style="color:#9ca3af;padding:4px 0;">Status</td>
            <td style="text-align:right;color:${data.status === 'approved' ? '#4ade80' : '#facc15'};">${statusLabel}</td>
          </tr>
        </table>
      </div>

      <!-- Items -->
      <h3 style="font-size:14px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px;">Items Requested</h3>
      <div style="background:#1a1a1a;border:1px solid #2d2d2d;border-radius:8px;overflow:hidden;margin-bottom:8px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
          <thead>
            <tr style="background:#0f172a;">
              <th style="padding:8px 12px;text-align:left;color:#9ca3af;font-weight:500;">Item</th>
              <th style="padding:8px 12px;text-align:center;color:#9ca3af;font-weight:500;">Qty</th>
              <th style="padding:8px 12px;text-align:right;color:#9ca3af;font-weight:500;">Total</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>
        <div style="padding:0 0 8px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
            <tr><td style="padding:6px 12px;color:#9ca3af;">Subtotal</td><td style="padding:6px 12px;text-align:right;">${formatPrice(data.amountSubtotal)}</td></tr>
            <tr><td style="padding:6px 12px;color:#9ca3af;">Est. Shipping</td><td style="padding:6px 12px;text-align:right;">${formatPrice(data.shippingAmount)}</td></tr>
            <tr style="font-weight:700;"><td style="padding:8px 12px;border-top:1px solid #2d2d2d;">Est. Total</td><td style="padding:8px 12px;border-top:1px solid #2d2d2d;text-align:right;">${formatPrice(data.amountTotal)}</td></tr>
          </table>
        </div>
      </div>
      <p style="margin:0 0 24px;font-size:12px;color:#6b7280;">Estimated total only. Final pricing confirmed after review.</p>

      <!-- Next Steps -->
      <h3 style="font-size:14px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px;">Next Steps</h3>
      <p style="margin:0 0 24px;color:#d1d5db;">${nextSteps}</p>

      <!-- Disclaimer -->
      <div style="background:#1a1a1a;border:1px solid #2d2d2d;border-radius:8px;padding:16px;margin-bottom:0;">
        <p style="margin:0;font-size:12px;color:#6b7280;line-height:1.6;">
          <strong style="color:#9ca3af;">Research Use Only Disclaimer:</strong> All products offered by Quantum Bio Peptides are strictly for laboratory and research purposes. These products are not intended for human consumption, veterinary use, or any use outside of a qualified research setting.
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#0f172a;padding:20px 32px;border-top:1px solid #2d2d2d;">
      <p style="margin:0;font-size:12px;color:#6b7280;text-align:center;">
        Quantum Bio Peptides &mdash; orders@quantumbiopeptides.com<br>
        This email was sent because a research order request was submitted using this address.
      </p>
    </div>
  </div>
</body>
</html>`
}

// ── Owner/admin notification email ────────────────────────────────────────────

function buildOwnerHtml(data: OrderEmailData): string {
  const statusColor = data.status === 'approved' ? '#4ade80' : '#facc15'

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:system-ui,sans-serif;color:#e5e7eb;">
  <div style="max-width:640px;margin:40px auto;background:#111;border:1px solid #2d2d2d;border-radius:12px;overflow:hidden;">

    <!-- Header -->
    <div style="background:#0f172a;padding:24px 32px;border-bottom:1px solid #2d2d2d;">
      <p style="margin:0 0 4px;font-size:12px;text-transform:uppercase;letter-spacing:2px;color:#6366f1;">Admin Notification</p>
      <h1 style="margin:0;font-size:20px;font-weight:700;color:#fff;">New Research Order Request #${data.orderId}</h1>
    </div>

    <div style="padding:32px;">

      <!-- Status + Inventory -->
      <div style="background:#1a1a1a;border:1px solid #2d2d2d;border-radius:8px;padding:16px;margin-bottom:24px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
          <tr>
            <td style="color:#9ca3af;padding:4px 0;">Status</td>
            <td style="text-align:right;color:${statusColor};font-weight:700;">${data.status.replace('_', ' ').toUpperCase()}</td>
          </tr>
          <tr>
            <td style="color:#9ca3af;padding:4px 0;">Inventory Adjusted</td>
            <td style="text-align:right;color:${data.inventoryAdjusted ? '#4ade80' : '#f87171'};">${data.inventoryAdjusted ? 'Yes — decremented' : 'No — check manually'}</td>
          </tr>
        </table>
      </div>

      <!-- Customer Info -->
      <h3 style="font-size:13px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;margin:0 0 10px;">Customer</h3>
      <div style="background:#1a1a1a;border:1px solid #2d2d2d;border-radius:8px;padding:16px;margin-bottom:24px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
          <tr><td style="color:#9ca3af;padding:3px 0;width:140px;">Name</td><td>${data.customerName}</td></tr>
          <tr><td style="color:#9ca3af;padding:3px 0;">Email</td><td><a href="mailto:${data.email}" style="color:#6366f1;">${data.email}</a></td></tr>
          ${data.phone ? `<tr><td style="color:#9ca3af;padding:3px 0;">Phone</td><td>${data.phone}</td></tr>` : ''}
          ${data.companyName ? `<tr><td style="color:#9ca3af;padding:3px 0;">Institution</td><td>${data.companyName}</td></tr>` : ''}
        </table>
      </div>

      <!-- Shipping Address -->
      <h3 style="font-size:13px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;margin:0 0 10px;">Ship To</h3>
      <div style="background:#1a1a1a;border:1px solid #2d2d2d;border-radius:8px;padding:16px;margin-bottom:24px;font-size:14px;line-height:1.7;white-space:pre-line;">${formatAddress(data)}</div>

      ${
        data.customerNotes
          ? `<!-- Customer Notes -->
      <h3 style="font-size:13px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;margin:0 0 10px;">Customer Notes</h3>
      <div style="background:#1a1a1a;border:1px solid #2d2d2d;border-radius:8px;padding:16px;margin-bottom:24px;font-size:14px;color:#d1d5db;">${data.customerNotes}</div>`
          : ''
      }

      <!-- Items -->
      <h3 style="font-size:13px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;margin:0 0 10px;">Items</h3>
      <div style="background:#1a1a1a;border:1px solid #2d2d2d;border-radius:8px;overflow:hidden;margin-bottom:8px;">
        ${itemsTableHtml(data.items)}
        ${totalsHtml(data)}
      </div>

    </div>

    <!-- Footer -->
    <div style="background:#0f172a;padding:16px 32px;border-top:1px solid #2d2d2d;">
      <p style="margin:0;font-size:12px;color:#6b7280;text-align:center;">
        Quantum Bio Peptides Admin &mdash; Internal notification, do not forward.
      </p>
    </div>
  </div>
</body>
</html>`
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function sendOrderRequestEmails(
  data: OrderEmailData,
  config: {
    smtpHost: string
    smtpPort: string
    smtpUser: string
    smtpPass: string
    orderFromEmail: string
    ownerOrderEmail: string
  }
): Promise<{ customerSent: boolean; ownerSent: boolean; errors: string[] }> {
  const errors: string[] = []

  if (!config.smtpHost || !config.smtpUser || !config.smtpPass) {
    errors.push('SMTP not configured — skipping email.')
    return { customerSent: false, ownerSent: false, errors }
  }

  const transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: parseInt(config.smtpPort, 10) || 587,
    secure: false,
    auth: {
      user: config.smtpUser,
      pass: config.smtpPass,
    },
  })

  let customerSent = false
  let ownerSent = false

  // ── Customer email ──────────────────────────────────────────────────────
  try {
    await transporter.sendMail({
      from: config.orderFromEmail,
      to: data.email,
      subject: `Your research order request was received — #${data.orderId}`,
      html: buildCustomerHtml(data),
    })
    customerSent = true
  } catch (err: any) {
    console.error(`[email] Customer email failed for order #${data.orderId}:`, err?.message || err)
    errors.push('Customer confirmation email failed to send.')
  }

  // ── Owner email ─────────────────────────────────────────────────────────
  if (config.ownerOrderEmail) {
    try {
      await transporter.sendMail({
        from: config.orderFromEmail,
        to: config.ownerOrderEmail,
        subject: `New research order request #${data.orderId} — ${data.status.replace('_', ' ')}`,
        html: buildOwnerHtml(data),
      })
      ownerSent = true
    } catch (err: any) {
      console.error(`[email] Owner notification failed for order #${data.orderId}:`, err?.message || err)
      errors.push('Owner notification email failed to send.')
    }
  }

  return { customerSent, ownerSent, errors }
}
