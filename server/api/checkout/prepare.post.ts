import { type H3Event } from 'h3'

const CURRENCY_CODE = 'USD'
const SHIPPING_CENTS = 0
const TAX_CENTS = 0

interface RequestBody {
  variantId?: number
  quantity?: number
  firstName?: string
  lastName?: string
  email?: string
  idempotencyKey?: string
}

function toCents(dollars: number): number {
  return Math.round(dollars * 100)
}

function generateOrderNumber(): string {
  const now = new Date()
  const yyyymmdd = now.toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `QBP-${yyyymmdd}-${random}`
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export default defineEventHandler(async (event: H3Event) => {
  const config = useRuntimeConfig(event)
  const strapiUrl = config.public.strapiUrl as string
  const strapiToken = config.strapiToken as string

  const authHeaders: Record<string, string> = strapiToken
    ? { Authorization: `Bearer ${strapiToken}` }
    : {}

  const body = await readBody<RequestBody>(event)

  // ── Validate required input ────────────────────────────────────────────────
  const errors: string[] = []

  const variantId = Number(body?.variantId)
  if (!Number.isInteger(variantId) || variantId <= 0) {
    errors.push('A valid variant ID is required.')
  }

  const quantity = Number(body?.quantity)
  if (!Number.isInteger(quantity) || quantity <= 0) {
    errors.push('Quantity must be a positive integer.')
  }

  const firstName = (body?.firstName || '').trim()
  const lastName = (body?.lastName || '').trim()
  const email = (body?.email || '').trim()

  if (!firstName) errors.push('First name is required.')
  if (!lastName) errors.push('Last name is required.')
  if (!email) {
    errors.push('Email is required.')
  } else if (!isValidEmail(email)) {
    errors.push('Email is invalid.')
  }

  const idempotencyKey = (body?.idempotencyKey || '').trim()
  if (!idempotencyKey) {
    errors.push('Idempotency key is required.')
  }

  if (errors.length > 0) {
    throw createError({ statusCode: 400, message: errors.join(' ') })
  }

  // ── Check for existing order with same idempotency key ───────────────────
  try {
    const existingResponse = await $fetch<{ data: any[] }>(
      `${strapiUrl}/api/orders?filters[idempotencyKey][$eq]=${encodeURIComponent(idempotencyKey)}`,
      { headers: authHeaders }
    )
    const existing = existingResponse.data?.[0]
    if (existing) {
      return {
        ok: true,
        orderId: existing.id,
        orderNumber: existing.attributes.orderNumber,
        currency: existing.attributes.currency || CURRENCY_CODE,
        subtotalCents: existing.attributes.subtotalCents,
        shippingCents: existing.attributes.shippingCents ?? SHIPPING_CENTS,
        taxCents: existing.attributes.taxCents ?? TAX_CENTS,
        totalCents: existing.attributes.totalCents,
        paymentStatus: existing.attributes.paymentStatus || 'pending',
      }
    }
  } catch (err: any) {
    console.error('Idempotency lookup failed:', err?.message || err)
  }

  // ── Load variant and associated product from Strapi ───────────────────────
  let variant: any
  let product: any

  try {
    const variantResponse = await $fetch<{ data: any }>(
      `${strapiUrl}/api/variants/${variantId}?populate=product`,
      { headers: authHeaders }
    )
    variant = variantResponse.data
    product = variant?.attributes?.product?.data
  } catch (err: any) {
    console.error('Variant load failed:', err?.message || err)
    throw createError({ statusCode: 502, message: 'Could not reach product catalog. Please try again.' })
  }

  if (!variant) {
    throw createError({ statusCode: 400, message: 'Selected variant could not be found.' })
  }

  if (!product?.attributes?.active) {
    throw createError({ statusCode: 400, message: 'This product is no longer available.' })
  }

  if (!variant.attributes?.active) {
    throw createError({ statusCode: 400, message: 'Selected variant is no longer available.' })
  }

  // ── Validate inventory ───────────────────────────────────────────────────
  const inventory: number | null = variant.attributes?.inventory ?? null
  if (inventory !== null && inventory < quantity) {
    throw createError({
      statusCode: 400,
      message: `Only ${inventory} unit${inventory === 1 ? '' : 's'} available (requested ${quantity}).`,
    })
  }

  // ── Calculate server-side totals in integer cents ─────────────────────────
  const unitPrice = Number(variant.attributes?.price)
  if (!unitPrice || unitPrice <= 0) {
    throw createError({ statusCode: 400, message: 'Variant price is invalid.' })
  }

  const unitPriceCents = toCents(unitPrice)
  const subtotalCents = unitPriceCents * quantity
  const totalCents = subtotalCents + SHIPPING_CENTS + TAX_CENTS

  const orderNumber = generateOrderNumber()

  // ── Create pending Order in Strapi ──────────────────────────────────────
  let orderId: number
  let createdOrderNumber: string

  try {
    const orderResponse = await $fetch<{ data: { id: number; attributes: any } }>(
      `${strapiUrl}/api/orders`,
      {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: {
          data: {
            orderNumber,
            customerName: `${firstName} ${lastName}`,
            email,
            amountSubtotal: subtotalCents / 100,
            amountTotal: totalCents / 100,
            shippingAmount: SHIPPING_CENTS / 100,
            currency: CURRENCY_CODE,
            subtotalCents,
            shippingCents: SHIPPING_CENTS,
            taxCents: TAX_CENTS,
            totalCents,
            paymentProvider: 'moov',
            paymentStatus: 'pending',
            idempotencyKey,
            inventoryCommitted: false,
            status: 'awaiting_payment',
          },
        },
      }
    )
    orderId = orderResponse.data.id
    createdOrderNumber = orderResponse.data.attributes.orderNumber
  } catch (err: any) {
    console.error('Order creation failed:', err?.message || err)
    // Detect duplicate idempotency key race condition
    if (err?.response?.status === 400 && err?.data?.error?.message?.toLowerCase().includes('unique')) {
      throw createError({ statusCode: 409, message: 'Duplicate order request. Please try again.' })
    }
    throw createError({ statusCode: 502, message: 'Failed to create order. Please try again.' })
  }

  // ── Create Order Item record ────────────────────────────────────────────
  try {
    await $fetch(`${strapiUrl}/api/order-items`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: {
        data: {
          productNameSnapshot: product.attributes?.name || '',
          variantNameSnapshot: variant.attributes?.name || '',
          skuSnapshot: variant.attributes?.sku || '',
          unitPriceSnapshot: unitPrice,
          unitPriceCents,
          lineTotalCents: subtotalCents,
          quantity,
          order: orderId,
          product: product.id,
          variant: variant.id,
        },
      },
    })
  } catch (err: any) {
    console.error('Order item creation failed:', err?.message || err)
    // Best-effort: order exists without order item; owner will see it
  }

  return {
    ok: true,
    orderId,
    orderNumber: createdOrderNumber,
    currency: CURRENCY_CODE,
    subtotalCents,
    shippingCents: SHIPPING_CENTS,
    taxCents: TAX_CENTS,
    totalCents,
    paymentStatus: 'pending',
  }
})
