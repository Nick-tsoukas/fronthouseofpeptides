import Stripe from 'stripe'
import { SHIPPING, CURRENCY, CART, ALLOWED_COUNTRIES } from '~/constants'

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
  confirmationAccepted: boolean
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody<RequestBody>(event)

  // Validate confirmation
  if (!body.confirmationAccepted) {
    throw createError({
      statusCode: 400,
      message: 'You must accept the terms and conditions to proceed.',
    })
  }

  // Validate cart items
  if (!body.cartItems || body.cartItems.length === 0) {
    throw createError({
      statusCode: 400,
      message: 'Your cart is empty.',
    })
  }

  // Sanitize and validate quantities
  const sanitizedItems = body.cartItems.map((item) => ({
    ...item,
    quantity: Math.min(Math.max(Math.floor(item.quantity), CART.MIN_QUANTITY), CART.MAX_QUANTITY),
  }))

  // Validate variant IDs exist and fetch server-side prices from Strapi
  const variantIds = sanitizedItems.map((item) => item.variantId)
  
  try {
    // Fetch variants from Strapi to validate prices
    const strapiUrl = config.public.strapiUrl
    const variantFilter = variantIds.map((id) => `filters[id][$in]=${id}`).join('&')
    const variantsResponse = await $fetch<{ data: any[] }>(
      `${strapiUrl}/api/variants?${variantFilter}&populate=product`
    )

    const strapiVariants = variantsResponse.data || []
    
    // Create a map of variant ID to Strapi variant data
    const variantMap = new Map(
      strapiVariants.map((v) => [v.id, v])
    )

    // Validate all variants exist and are active
    for (const item of sanitizedItems) {
      const strapiVariant = variantMap.get(item.variantId)
      if (!strapiVariant) {
        throw createError({
          statusCode: 400,
          message: `Variant ${item.variantId} not found.`,
        })
      }
      if (!strapiVariant.attributes.active) {
        throw createError({
          statusCode: 400,
          message: `Variant "${item.variantName}" is no longer available.`,
        })
      }
    }

    // Initialize Stripe
    const stripe = new Stripe(config.stripeSecretKey, {
      apiVersion: '2024-04-10',
    })

    // Build line items using server-side prices
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = sanitizedItems.map((item) => {
      const strapiVariant = variantMap.get(item.variantId)!
      const serverPrice = strapiVariant.attributes.price
      const productName = strapiVariant.attributes.product?.data?.attributes?.name || item.productName

      return {
        price_data: {
          currency: CURRENCY.CODE,
          product_data: {
            name: `${productName} — ${strapiVariant.attributes.name}`,
            description: `SKU: ${strapiVariant.attributes.sku}`,
          },
          unit_amount: Math.round(serverPrice * 100), // Convert to cents
        },
        quantity: item.quantity,
      }
    })

    // Create cart metadata for webhook
    const cartMetadata = sanitizedItems.map((item) => {
      const strapiVariant = variantMap.get(item.variantId)!
      return {
        productId: item.productId,
        variantId: item.variantId,
        productName: strapiVariant.attributes.product?.data?.attributes?.name || item.productName,
        variantName: strapiVariant.attributes.name,
        sku: strapiVariant.attributes.sku,
        unitPrice: strapiVariant.attributes.price,
        quantity: item.quantity,
      }
    })

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      shipping_address_collection: {
        allowed_countries: ALLOWED_COUNTRIES as unknown as Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[],
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: {
              amount: SHIPPING.FLAT_RATE_CENTS,
              currency: CURRENCY.CODE,
            },
            display_name: SHIPPING.LABEL,
            delivery_estimate: {
              minimum: {
                unit: 'business_day',
                value: 5,
              },
              maximum: {
                unit: 'business_day',
                value: 7,
              },
            },
          },
        },
      ],
      allow_promotion_codes: false,
      success_url: `${config.public.appUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${config.public.appUrl}/checkout?canceled=1`,
      metadata: {
        cartItems: JSON.stringify(cartMetadata),
        confirmationAccepted: 'true',
      },
    })

    return { url: session.url }
  } catch (error: any) {
    console.error('Stripe checkout error:', error)
    
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to create checkout session.',
    })
  }
})
