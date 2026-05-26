import { SHIPPING, CURRENCY, CART } from '~/constants'
import { sendOrderRequestEmails } from '~/server/utils/sendOrderEmails'

interface CartItem {
  productId: number
  variantId: number
  productName: string
  variantName: string
  sku: string
  unitPrice: number
  quantity: number
}

interface RequestBody {
  cartItems: CartItem[]
  customerName: string
  email: string
  phone?: string
  companyName?: string
  customerNotes?: string
  shippingAddressLine1: string
  shippingAddressLine2?: string
  shippingCity: string
  shippingState: string
  shippingPostalCode: string
  confirmationAccepted: boolean
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody<RequestBody>(event)

  // ── Validate compliance ──────────────────────────────────────────────────
  if (!body.confirmationAccepted) {
    throw createError({ statusCode: 400, message: 'You must accept the research-use confirmation.' })
  }

  // ── Validate cart ────────────────────────────────────────────────────────
  if (!body.cartItems || body.cartItems.length === 0) {
    throw createError({ statusCode: 400, message: 'Your cart is empty.' })
  }

  // ── Validate required contact fields ─────────────────────────────────────
  if (!body.customerName?.trim()) throw createError({ statusCode: 400, message: 'Full name is required.' })
  if (!body.email?.trim()) throw createError({ statusCode: 400, message: 'Email is required.' })
  if (!body.shippingAddressLine1?.trim()) throw createError({ statusCode: 400, message: 'Address is required.' })
  if (!body.shippingCity?.trim()) throw createError({ statusCode: 400, message: 'City is required.' })
  if (!body.shippingState?.trim()) throw createError({ statusCode: 400, message: 'State is required.' })
  if (!body.shippingPostalCode?.trim()) throw createError({ statusCode: 400, message: 'Postal code is required.' })

  // ── Sanitize quantities ──────────────────────────────────────────────────
  const sanitizedItems = body.cartItems.map((item) => ({
    ...item,
    quantity: Math.min(Math.max(Math.floor(item.quantity), CART.MIN_QUANTITY), CART.MAX_QUANTITY),
  }))

  const strapiUrl = config.public.strapiUrl
  const strapiToken = config.strapiToken

  const authHeaders: Record<string, string> = strapiToken
    ? { Authorization: `Bearer ${strapiToken}` }
    : {}

  // ── Fetch variants server-side ───────────────────────────────────────────
  const variantIds = sanitizedItems.map((item) => item.variantId)
  const variantFilter = variantIds.map((id) => `filters[id][$in]=${id}`).join('&')

  const variantsResponse = await $fetch<{ data: any[] }>(
    `${strapiUrl}/api/variants?${variantFilter}&populate=product`,
    { headers: authHeaders }
  ).catch(() => {
    throw createError({ statusCode: 502, message: 'Could not reach product catalog. Please try again.' })
  })

  const strapiVariants = variantsResponse.data || []
  const variantMap = new Map(strapiVariants.map((v: any) => [v.id, v]))

  // ── Validate product/variant active status and inventory ─────────────────
  // Collect all errors up front so the user sees every problem, not just the first.
  const stockErrors: string[] = []

  for (const item of sanitizedItems) {
    const sv = variantMap.get(item.variantId) as any
    if (!sv) {
      stockErrors.push(`"${item.variantName}" could not be found in the catalog.`)
      continue
    }

    const product = sv.attributes.product?.data
    if (product && !product.attributes.active) {
      stockErrors.push(`"${item.productName}" is no longer available.`)
      continue
    }
    if (!sv.attributes.active) {
      stockErrors.push(`"${item.variantName}" is no longer available.`)
      continue
    }

    const inv: number | null = sv.attributes.inventory ?? null
    if (inv !== null && inv === 0) {
      stockErrors.push(`"${item.variantName}" is out of stock.`)
    } else if (inv !== null && inv < item.quantity) {
      stockErrors.push(
        `"${item.variantName}" only has ${inv} unit${inv === 1 ? '' : 's'} available (requested ${item.quantity}).`
      )
    }
  }

  if (stockErrors.length > 0) {
    throw createError({
      statusCode: 400,
      message: stockErrors.join(' '),
    })
  }

  // ── Determine if all items have trackable inventory (for auto-approve) ────
  // Items with inventory=null are treated as unlimited — always approvable.
  // Items with inventory>=quantity are approvable.
  // (Already validated above that none are insufficient.)
  const hasTrackedInventory = sanitizedItems.some((item) => {
    const sv = variantMap.get(item.variantId) as any
    return (sv.attributes.inventory ?? null) !== null
  })

  // ── Build line items with server-side prices ─────────────────────────────
  let subtotal = 0
  const lineItems = sanitizedItems.map((item) => {
    const sv = variantMap.get(item.variantId) as any
    const serverPrice: number = sv.attributes.price
    subtotal += serverPrice * item.quantity
    return {
      productNameSnapshot: sv.attributes.product?.data?.attributes?.name || item.productName,
      variantNameSnapshot: sv.attributes.name,
      skuSnapshot: sv.attributes.sku,
      unitPriceSnapshot: serverPrice,
      quantity: item.quantity,
      variantId: item.variantId,
      trackedInventory: (sv.attributes.inventory ?? null) as number | null,
    }
  })

  const shippingAmount = SHIPPING.FLAT_RATE_CENTS / 100
  const total = subtotal + shippingAmount

  // ── Step 1: Create Order with status=approved ─────────────────────────────
  // We create the order first. If order creation fails, nothing is decremented.
  const orderResponse = await $fetch<{ data: { id: number } }>(
    `${strapiUrl}/api/orders`,
    {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: {
        data: {
          customerName: body.customerName.trim(),
          email: body.email.trim(),
          phone: body.phone?.trim() || null,
          companyName: body.companyName?.trim() || null,
          customerNotes: body.customerNotes?.trim() || null,
          shippingName: body.customerName.trim(),
          shippingAddressLine1: body.shippingAddressLine1.trim(),
          shippingAddressLine2: body.shippingAddressLine2?.trim() || null,
          shippingCity: body.shippingCity.trim(),
          shippingState: body.shippingState.trim(),
          shippingPostalCode: body.shippingPostalCode.trim(),
          shippingCountry: 'US',
          amountSubtotal: subtotal,
          shippingAmount,
          amountTotal: total,
          currency: CURRENCY.CODE,
          confirmationAccepted: true,
          status: 'approved',
          inventoryAdjusted: false,
        },
      },
    }
  ).catch((err) => {
    console.error('Strapi order create error:', err)
    throw createError({ statusCode: 502, message: 'Failed to submit order request. Please try again.' })
  })

  const orderId = orderResponse.data.id

  // ── Step 2: Create OrderItems ─────────────────────────────────────────────
  await Promise.all(
    lineItems.map((item) =>
      $fetch(`${strapiUrl}/api/order-items`, {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: {
          data: {
            productNameSnapshot: item.productNameSnapshot,
            variantNameSnapshot: item.variantNameSnapshot,
            skuSnapshot: item.skuSnapshot,
            unitPriceSnapshot: item.unitPriceSnapshot,
            quantity: item.quantity,
            order: orderId,
          },
        },
      }).catch((err) => {
        console.error(`Strapi order-item create error for variant ${item.variantId}:`, err)
      })
    )
  )

  // ── Step 3: Decrement inventory for tracked variants ─────────────────────
  // Order and order-items already exist at this point.
  // If a decrement fails, we degrade the order to pending_review and warn — we do NOT roll back the order.
  let inventoryAdjusted = false
  let inventoryWarning = false

  if (hasTrackedInventory) {
    const decrementResults = await Promise.allSettled(
      lineItems
        .filter((item) => item.trackedInventory !== null)
        .map(async (item) => {
          const currentInv = item.trackedInventory as number
          const newInv = Math.max(0, currentInv - item.quantity)
          await $fetch(`${strapiUrl}/api/variants/${item.variantId}`, {
            method: 'PUT',
            headers: { ...authHeaders, 'Content-Type': 'application/json' },
            body: { data: { inventory: newInv } },
          })
        })
    )

    const anyFailed = decrementResults.some((r) => r.status === 'rejected')

    if (anyFailed) {
      // Decrement failed — degrade order status to pending_review so owner can handle manually
      console.error(`Inventory decrement partial failure for order #${orderId}`)
      inventoryWarning = true
      await $fetch(`${strapiUrl}/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: {
          data: {
            status: 'pending_review',
            ownerNotes: 'Inventory decrement failed at submission. Manual inventory check required.',
          },
        },
      }).catch((e) => console.error('Failed to degrade order status:', e))
    } else {
      inventoryAdjusted = true
      await $fetch(`${strapiUrl}/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: { data: { inventoryAdjusted: true } },
      }).catch((e) => console.error('Failed to mark inventoryAdjusted:', e))
    }
  }

  const finalStatus = inventoryWarning ? 'pending_review' : 'approved'

  // ── Step 4: Send transactional emails ────────────────────────────────────
  // Emails are best-effort — a failure here never fails the order request.
  let emailWarning = false

  const emailResult = await sendOrderRequestEmails(
    {
      orderId,
      status: finalStatus,
      inventoryAdjusted,
      customerName: body.customerName.trim(),
      email: body.email.trim(),
      phone: body.phone?.trim() || null,
      companyName: body.companyName?.trim() || null,
      customerNotes: body.customerNotes?.trim() || null,
      shippingAddressLine1: body.shippingAddressLine1.trim(),
      shippingAddressLine2: body.shippingAddressLine2?.trim() || null,
      shippingCity: body.shippingCity.trim(),
      shippingState: body.shippingState.trim(),
      shippingPostalCode: body.shippingPostalCode.trim(),
      shippingCountry: 'US',
      amountSubtotal: subtotal,
      shippingAmount,
      amountTotal: total,
      currency: CURRENCY.CODE,
      items: lineItems.map((item) => ({
        productName: item.productNameSnapshot,
        variantName: item.variantNameSnapshot,
        skuSnapshot: item.skuSnapshot,
        quantity: item.quantity,
        unitPrice: item.unitPriceSnapshot,
      })),
    },
    {
      smtpHost: config.smtpHost as string,
      smtpPort: config.smtpPort as string,
      smtpUser: config.smtpUser as string,
      smtpPass: config.smtpPass as string,
      orderFromEmail: config.orderFromEmail as string,
      ownerOrderEmail: config.ownerOrderEmail as string,
    }
  ).catch((err) => {
    console.error(`[email] Unexpected error for order #${orderId}:`, err)
    return { customerSent: false, ownerSent: false, errors: ['Unexpected email error.'] }
  })

  if (emailResult.errors.length > 0) {
    emailWarning = true
  }

  return {
    orderId,
    email: body.email.trim(),
    customerName: body.customerName.trim(),
    amountSubtotal: subtotal,
    shippingAmount,
    amountTotal: total,
    currency: CURRENCY.CODE,
    status: finalStatus,
    inventoryAdjusted,
    emailWarning,
    items: lineItems.map((item) => ({
      productName: item.productNameSnapshot,
      variantName: item.variantNameSnapshot,
      quantity: item.quantity,
      unitPrice: item.unitPriceSnapshot,
    })),
  }
})
