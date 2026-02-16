<template>
  <div class="min-h-screen bg-dark-950 py-8">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 class="text-3xl font-bold text-white mb-8">Your Cart</h1>

      <!-- Empty Cart -->
      <div v-if="cartStore.isEmpty" class="text-center py-16">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-24 w-24 mx-auto text-dark-600 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
        <h2 class="text-xl font-semibold text-white mb-2">Your cart is empty</h2>
        <p class="text-dark-400 mb-8">Add some products to get started.</p>
        <NuxtLink to="/" class="px-8 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors">
          Continue Shopping
        </NuxtLink>
      </div>

      <!-- Cart Items -->
      <div v-else class="space-y-8">
        <div class="bg-dark-900 rounded-xl border border-dark-700 overflow-hidden">
          <div class="divide-y divide-dark-700">
            <div
              v-for="item in cartStore.items"
              :key="item.variantId"
              class="flex gap-4 p-4 sm:p-6"
            >
              <!-- Gradient Placeholder -->
              <div
                class="w-20 h-20 sm:w-24 sm:h-24 rounded-lg flex-shrink-0"
                :style="{ background: getGradient(item.productId) }"
              ></div>

              <!-- Item Details -->
              <div class="flex-1 min-w-0">
                <h3 class="text-white font-semibold text-lg">{{ item.productName }}</h3>
                <p class="text-dark-400">{{ item.variantName }}</p>
                <p class="text-dark-500 text-sm">SKU: {{ item.sku }}</p>
                <p class="text-primary-400 font-semibold mt-2">{{ formatPrice(item.unitPrice) }}</p>
              </div>

              <!-- Quantity & Actions -->
              <div class="flex flex-col items-end justify-between">
                <button
                  @click="cartStore.removeItem(item.variantId)"
                  class="text-dark-500 hover:text-red-400 transition-colors p-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
                <QuantitySelector
                  :model-value="item.quantity"
                  @update:model-value="(qty) => cartStore.updateQuantity(item.variantId, qty)"
                  :show-label="false"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Order Summary -->
        <div class="bg-dark-900 rounded-xl border border-dark-700 p-6">
          <h2 class="text-lg font-semibold text-white mb-4">Order Summary</h2>
          
          <div class="space-y-3 mb-6">
            <div class="flex justify-between text-dark-300">
              <span>Subtotal</span>
              <span>{{ formatPrice(cartStore.subtotal) }}</span>
            </div>
            <div class="flex justify-between text-dark-300">
              <span>Shipping</span>
              <span>{{ SHIPPING.FLAT_RATE_DISPLAY }}</span>
            </div>
            <div class="border-t border-dark-700 pt-3 flex justify-between text-white font-semibold text-lg">
              <span>Total</span>
              <span>{{ formatPrice(cartStore.subtotal + SHIPPING.FLAT_RATE_CENTS / 100) }}</span>
            </div>
          </div>

          <p class="text-dark-500 text-xs mb-4">
            {{ SHIPPING.LABEL }} — {{ SHIPPING.DELIVERY_ESTIMATE }}
          </p>

          <NuxtLink
            to="/checkout"
            class="block w-full py-4 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg text-center transition-colors text-lg"
          >
            Proceed to Checkout
          </NuxtLink>

          <NuxtLink
            to="/"
            class="block w-full py-3 mt-3 text-dark-400 hover:text-white text-center transition-colors"
          >
            Continue Shopping
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCartStore } from '~/stores/cart'
import { CURRENCY, SHIPPING } from '~/constants'

const cartStore = useCartStore()

const formatPrice = (price: number) => {
  return `${CURRENCY.SYMBOL}${price.toFixed(2)}`
}

const getGradient = (productId: number) => {
  const hue1 = (productId * 47) % 360
  const hue2 = (hue1 + 40) % 360
  return `linear-gradient(135deg, hsl(${hue1}, 70%, 30%) 0%, hsl(${hue2}, 60%, 20%) 100%)`
}
</script>
