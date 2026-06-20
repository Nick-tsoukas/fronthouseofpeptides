import { type H3Event } from 'h3'
import { generateCheckoutSessionToken, hashToken } from '~/server/utils/moov'

const CURRENCY_CODE = 'USD'
const SHIPPING_CENTS = 0
const TAX_CENTS = 0

interface CartLine {
  variantId?: number
  quantity?: number
}

interface RequestBody {
  items?: CartLine[]
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

  const rawItems = Array.isArray(body?.items) ? body.items : []
  if (rawItems.length === 0) {
    errors.push('Your cart is empty.')
  }

  const items = rawItems
    .map((item) => ({
      variantId: Number(item?.variantId),
      quantity: Number(item?.quantity),
    }))
    .filter((item) => Number.isInteger(item.variantId) && item.variantId > 0)

  if (items.length === 0 && rawItems.length > 0) {
    errors.push('All cart items are invalid.')
  }

  for (const item of items) {
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      errors.push('Quantity must be a positive integer for every item.')
      break
    }
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
      const existingCheckoutSessionToken = generateCheckoutSessionToken()
      const existingCheckoutSessionTokenHash = hashToken(existingCheckoutSessionToken)

      try {
        await $fetch(`${strapiUrl}/api/orders/${existing.id}`, {
          method: 'PUT',
          headers: authHeaders,
          body: {
            data: { checkoutSessionTokenHash: existingCheckoutSessionTokenHash },
          },
        })
      } catch (err: any) {
        console.error('Failed to refresh checkout session token hash:', err?.message || err)
      }

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
        checkoutSessionToken: existingCheckoutSessionToken,
      }
    }
  } catch (err: any) {
    console.error('Idempotency lookup failed:', err?.message || err)
  }

  // ── Load variants and associated products from Strapi ────────────────────
  const variantIds = items.map((item) => item.variantId)
  const variantFilter = variantIds.map((id) => `filters[id][$in]=${id}`).join('&')

  let strapiVariants: any[] = []

  try {
    const variantsResponse = await $fetch<{ data: any[] }>(
      `${strapiUrl}/api/variants?${variantFilter}&populate=product`,
      { headers: authHeaders }
    )
    strapiVariants = variantsResponse.data || []
  } catch (err: any) {
    console.error('Variant load failed:', err?.message || err)
    throw createError({ statusCode: 502, message: 'Could not reach product catalog. Please try again.' })
  }

  const variantMap = new Map(strapiVariants.map((v) => [v.id, v]))

  // ── Validate every item against server-loaded data ───────────────────────
  const stockErrors: string[] = []
  const lineItems: any[] = []
  let subtotalCents = 0

  for (const item of items) {
    const variant = variantMap.get(item.variantId)
    if (!variant) {
      stockErrors.push('One or more selected items could not be found in the catalog.')
      continue
    }

    const product = variant.attributes?.product?.data
    if (!product?.attributes?.active) {
      stockErrors.push(`"${variant.attributes?.name || 'Selected item'}" is no longer available.`)
      continue
    }

    if (!variant.attributes?.active) {
      stockErrors.push(`"${variant.attributes?.name || 'Selected item'}" is no longer available.`)
      continue
    }

    const inventory: number | null = variant.attributes?.inventory ?? null
    if (inventory !== null && inventory < item.quantity) {
      stockErrors.push(
        `"${variant.attributes?.name || 'Selected item'}" only has ${inventory} unit${inventory === 1 ? '' : 's'} available (requested ${item.quantity}).`
      )
      continue
    }

    const unitPrice = Number(variant.attributes?.price)
    if (!unitPrice || unitPrice <= 0) {
      stockErrors.push(`"${variant.attributes?.name || 'Selected item'}" has an invalid price.`)
      continue
    }

    const unitPriceCents = toCents(unitPrice)
    const lineTotalCents = unitPriceCents * item.quantity
    subtotalCents += lineTotalCents

    lineItems.push({
      variant,
      product,
      quantity: item.quantity,
      unitPrice,
      unitPriceCents,
      lineTotalCents,
    })
  }

  if (stockErrors.length > 0) {
    throw createError({ statusCode: 400, message: stockErrors.join(' ') })
  }

  const totalCents = subtotalCents + SHIPPING_CENTS + TAX_CENTS
  const orderNumber = generateOrderNumber()
  const checkoutSessionToken = generateCheckoutSessionToken()
  const checkoutSessionTokenHash = hashToken(checkoutSessionToken)

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
            checkoutSessionTokenHash,
          },
        },
      }
    )
    orderId = orderResponse.data.id
    createdOrderNumber = orderResponse.data.attributes.orderNumber
  } catch (err: any) {
    console.error('Order creation failed:', err?.message || err)
    if (err?.response?.status === 400 && err?.data?.error?.message?.toLowerCase().includes('unique')) {
      throw createError({ statusCode: 409, message: 'Duplicate order request. Please try again.' })
    }
    throw createError({ statusCode: 502, message: 'Failed to create order. Please try again.' })
  }

  // ── Create Order Item records ───────────────────────────────────────────
  await Promise.all(
    lineItems.map((item) =>
      $fetch(`${strapiUrl}/api/order-items`, {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: {
          data: {
            productNameSnapshot: item.product.attributes?.name || '',
            variantNameSnapshot: item.variant.attributes?.name || '',
            skuSnapshot: item.variant.attributes?.sku || '',
            unitPriceSnapshot: item.unitPrice,
            unitPriceCents: item.unitPriceCents,
            lineTotalCents: item.lineTotalCents,
            quantity: item.quantity,
            order: orderId,
            product: item.product.id,
            variant: item.variant.id,
          },
        },
      }).catch((err: any) => {
        console.error('Order item creation failed:', err?.message || err)
      })
    )
  )

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
    checkoutSessionToken,
  }
})
