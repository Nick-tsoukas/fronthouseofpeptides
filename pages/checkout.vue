<template>
  <div class="min-h-screen bg-dark-950 py-8">
    <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 class="text-3xl font-bold text-white mb-8">Checkout</h1>

      <!-- Canceled Notice -->
      <div v-if="route.query.canceled" class="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
        <p class="text-yellow-400">Your checkout was canceled. You can try again below.</p>
      </div>

      <!-- Empty Cart -->
      <div v-if="cartStore.isEmpty" class="text-center py-16">
        <h2 class="text-xl font-semibold text-white mb-2">Your cart is empty</h2>
        <p class="text-dark-400 mb-8">Add some products before checking out.</p>
        <NuxtLink to="/" class="px-8 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors">
          Continue Shopping
        </NuxtLink>
      </div>

      <!-- Checkout Form -->
      <div v-else class="space-y-6">
        <!-- Order Summary -->
        <div class="bg-dark-900 rounded-xl border border-dark-700 p-6">
          <h2 class="text-lg font-semibold text-white mb-4">Order Summary</h2>
          
          <div class="divide-y divide-dark-700">
            <div
              v-for="item in cartStore.items"
              :key="item.variantId"
              class="flex justify-between py-3"
            >
              <div>
                <p class="text-white">{{ item.productName }}</p>
                <p class="text-dark-400 text-sm">{{ item.variantName }} × {{ item.quantity }}</p>
              </div>
              <p class="text-white">{{ formatPrice(item.unitPrice * item.quantity) }}</p>
            </div>
          </div>

          <div class="border-t border-dark-700 mt-4 pt-4 space-y-2">
            <div class="flex justify-between text-dark-300">
              <span>Subtotal</span>
              <span>{{ formatPrice(cartStore.subtotal) }}</span>
            </div>
            <div class="flex justify-between text-dark-300">
              <span>Shipping ({{ SHIPPING.LABEL }})</span>
              <span>{{ SHIPPING.FLAT_RATE_DISPLAY }}</span>
            </div>
            <div class="flex justify-between text-white font-semibold text-lg pt-2">
              <span>Total</span>
              <span>{{ formatPrice(cartStore.subtotal + SHIPPING.FLAT_RATE_CENTS / 100) }}</span>
            </div>
          </div>
        </div>

        <!-- Shipping Notice -->
        <div class="bg-dark-800/50 rounded-lg p-4 border border-dark-700">
          <div class="flex items-start gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <div>
              <p class="text-white font-medium">US Shipping Only</p>
              <p class="text-dark-400 text-sm">We currently only ship to addresses within the United States.</p>
            </div>
          </div>
        </div>

        <!-- Final Confirmation Checkbox -->
        <div class="bg-dark-900 rounded-xl border border-dark-700 p-6">
          <h2 class="text-lg font-semibold text-white mb-4">Final Confirmation</h2>
          
          <label class="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              v-model="finalConfirmation"
              class="mt-1 w-5 h-5 rounded border-dark-600 bg-dark-800 text-primary-500 focus:ring-primary-500 focus:ring-offset-dark-900"
            />
            <span class="text-dark-300 group-hover:text-white transition-colors">
              I confirm that I am 21 years of age or older, a qualified professional or researcher, 
              and I understand that all products are for <strong class="text-primary-400">research use only</strong>. 
              I agree to the terms and conditions.
            </span>
          </label>
        </div>

        <!-- Error Message -->
        <div v-if="error" class="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <p class="text-red-400">{{ error }}</p>
        </div>

        <!-- Checkout Button -->
        <button
          @click="handleCheckout"
          :disabled="!finalConfirmation || isLoading"
          class="w-full py-4 bg-primary-500 hover:bg-primary-600 disabled:bg-dark-700 disabled:text-dark-500 text-white font-semibold rounded-lg transition-all duration-200 text-lg flex items-center justify-center gap-2"
        >
          <svg v-if="isLoading" class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ isLoading ? 'Processing...' : 'Proceed to Payment' }}
        </button>

        <p class="text-dark-500 text-xs text-center">
          You will be redirected to Stripe for secure payment processing.
        </p>

        <NuxtLink
          to="/cart"
          class="block text-center text-dark-400 hover:text-white transition-colors"
        >
          ← Back to Cart
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useCartStore } from '~/stores/cart'
import { CURRENCY, SHIPPING } from '~/constants'

const route = useRoute()
const cartStore = useCartStore()

const finalConfirmation = ref(false)
const isLoading = ref(false)
const error = ref<string | null>(null)

const formatPrice = (price: number) => {
  return `${CURRENCY.SYMBOL}${price.toFixed(2)}`
}

// Demo mode - set to false when Stripe is configured
const DEMO_MODE = true

const handleCheckout = async () => {
  if (!finalConfirmation.value) {
    error.value = 'Please confirm the terms before proceeding.'
    return
  }

  if (cartStore.isEmpty) {
    error.value = 'Your cart is empty.'
    return
  }

  isLoading.value = true
  error.value = null

  // Demo mode - simulate checkout success
  if (DEMO_MODE) {
    await new Promise(resolve => setTimeout(resolve, 1500))
    cartStore.clearCart()
    navigateTo(`/success?session_id=demo_${Date.now()}`)
    return
  }

  try {
    const response = await $fetch<{ url: string }>('/api/stripe/create-checkout-session', {
      method: 'POST',
      body: {
        cartItems: cartStore.items,
        confirmationAccepted: finalConfirmation.value,
      },
    })

    if (response.url) {
      // Clear cart before redirecting
      cartStore.clearCart()
      // Redirect to Stripe Checkout
      window.location.href = response.url
    } else {
      throw new Error('No checkout URL returned')
    }
  } catch (err: any) {
    console.error('Checkout error:', err)
    error.value = err.data?.message || err.message || 'An error occurred during checkout. Please try again.'
  } finally {
    isLoading.value = false
  }
}
</script>
