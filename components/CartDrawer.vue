<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition name="fade">
      <div
        v-if="cartStore.isDrawerOpen"
        @click="cartStore.closeDrawer()"
        class="fixed inset-0 bg-black/50 z-40"
      ></div>
    </Transition>

    <!-- Drawer -->
    <Transition name="slide">
      <div
        v-if="cartStore.isDrawerOpen"
        class="fixed right-0 top-0 h-full w-full max-w-md bg-dark-900 shadow-2xl z-50 flex flex-col"
      >
        <!-- Header -->
        <div class="flex items-center justify-between p-4 border-b border-dark-700">
          <h2 class="text-lg font-semibold text-white">Your Cart</h2>
          <button
            @click="cartStore.closeDrawer()"
            class="p-2 text-dark-400 hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Cart Items -->
        <div class="flex-1 overflow-y-auto p-4">
          <div v-if="cartStore.isEmpty" class="text-center py-12">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-dark-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <p class="text-dark-400">Your cart is empty</p>
            <NuxtLink
              to="/"
              @click="cartStore.closeDrawer()"
              class="inline-block mt-4 text-primary-400 hover:text-primary-300 transition-colors"
            >
              Continue Shopping
            </NuxtLink>
          </div>

          <div v-else class="space-y-4">
            <div
              v-for="item in cartStore.items"
              :key="item.variantId"
              class="flex gap-4 bg-dark-800 rounded-lg p-3"
            >
              <!-- Gradient Placeholder -->
              <div
                class="w-16 h-16 rounded-lg flex-shrink-0"
                :style="{ background: getGradient(item.productId) }"
              ></div>

              <!-- Item Details -->
              <div class="flex-1 min-w-0">
                <h3 class="text-white font-medium truncate">{{ item.productName }}</h3>
                <p class="text-dark-400 text-sm">{{ item.variantName }}</p>
                <p class="text-primary-400 font-medium">{{ formatPrice(item.unitPrice) }}</p>
              </div>

              <!-- Quantity & Remove -->
              <div class="flex flex-col items-end justify-between">
                <button
                  @click="cartStore.removeItem(item.variantId)"
                  class="text-dark-500 hover:text-red-400 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
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

        <!-- Footer -->
        <div v-if="!cartStore.isEmpty" class="border-t border-dark-700 p-4 space-y-4">
          <div class="flex items-center justify-between text-lg">
            <span class="text-dark-300">Subtotal</span>
            <span class="text-white font-semibold">{{ formatPrice(cartStore.subtotal) }}</span>
          </div>
          <p class="text-dark-500 text-xs">Shipping calculated at checkout</p>
          
          <div class="space-y-2">
            <NuxtLink
              to="/checkout"
              @click="cartStore.closeDrawer()"
              class="block w-full py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg text-center transition-colors"
            >
              Checkout
            </NuxtLink>
            <NuxtLink
              to="/cart"
              @click="cartStore.closeDrawer()"
              class="block w-full py-3 bg-dark-800 hover:bg-dark-700 text-white font-medium rounded-lg text-center border border-dark-600 transition-colors"
            >
              View Cart
            </NuxtLink>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { useCartStore } from '~/stores/cart'
import { CURRENCY } from '~/constants'

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

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}
</style>
