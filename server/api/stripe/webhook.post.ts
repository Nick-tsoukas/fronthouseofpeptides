import Stripe from 'stripe'

interface CartItemMetadata {
  productId: number
  variantId: number
  productName: string
  variantName: string
  sku: string
  unitPrice: number
  quantity: number
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  
  const stripe = new Stripe(config.stripeSecretKey, {
    apiVersion: '2024-04-10',
  })

  // Get raw body for signature verification
  const body = await readRawBody(event)
  const signature = getHeader(event, 'stripe-signature')

  if (!body || !signature) {
    throw createError({
      statusCode: 400,
      message: 'Missing body or signature',
    })
  }

  let stripeEvent: Stripe.Event

  try {
    stripeEvent = stripe.webhooks.constructEvent(
      body,
      signature,
      config.stripeWebhookSecret
    )
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    throw createError({
      statusCode: 400,
      message: `Webhook Error: ${err.message}`,
    })
  }

  // Handle the event
  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object as Stripe.Checkout.Session

    try {
      // Extract order data from session
      const cartItems: CartItemMetadata[] = JSON.parse(session.metadata?.cartItems || '[]')
      const confirmationAccepted = session.metadata?.confirmationAccepted === 'true'

      const shippingDetails = session.shipping_details
      const customerDetails = session.customer_details

      // Create order in Strapi
      const strapiUrl = config.public.strapiUrl
      const strapiToken = config.strapiToken

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      
      if (strapiToken) {
        headers['Authorization'] = `Bearer ${strapiToken}`
      }

      // Create the order
      const orderResponse = await $fetch<{ data: { id: number } }>(`${strapiUrl}/api/orders`, {
        method: 'POST',
        headers,
        body: {
          data: {
            stripeSessionId: session.id,
            stripePaymentIntentId: session.payment_intent as string,
            email: customerDetails?.email || '',
            amountSubtotal: (session.amount_subtotal || 0) / 100,
            amountTotal: (session.amount_total || 0) / 100,
            shippingAmount: (session.shipping_cost?.amount_total || 0) / 100,
            currency: session.currency || 'usd',
            shippingName: shippingDetails?.name || '',
            shippingAddressLine1: shippingDetails?.address?.line1 || '',
            shippingAddressLine2: shippingDetails?.address?.line2 || null,
            shippingCity: shippingDetails?.address?.city || '',
            shippingState: shippingDetails?.address?.state || '',
            shippingPostalCode: shippingDetails?.address?.postal_code || '',
            shippingCountry: shippingDetails?.address?.country || '',
            confirmationAccepted,
            status: 'paid',
          },
        },
      })

      const orderId = orderResponse.data.id

      // Create order items
      for (const item of cartItems) {
        await $fetch(`${strapiUrl}/api/order-items`, {
          method: 'POST',
          headers,
          body: {
            data: {
              order: orderId,
              productNameSnapshot: item.productName,
              variantNameSnapshot: item.variantName,
              skuSnapshot: item.sku,
              unitPriceSnapshot: item.unitPrice,
              quantity: item.quantity,
            },
          },
        })
      }

      console.log(`Order ${orderId} created successfully for session ${session.id}`)
    } catch (error: any) {
      console.error('Error creating order in Strapi:', error)
      // Don't throw - we still want to return 200 to Stripe
      // The order can be reconciled manually if needed
    }
  }

  return { received: true }
})
