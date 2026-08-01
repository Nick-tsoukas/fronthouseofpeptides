<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition name="fade">
      <div
        v-if="cartStore.isDrawerOpen"
        @click="cartStore.closeDrawer()"
        class="fixed inset-0 bg-black/60 z-[60]"
        aria-hidden="true"
      ></div>
    </Transition>

    <!-- Drawer -->
    <Transition name="slide">
      <div
        v-if="cartStore.isDrawerOpen"
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        class="fixed right-0 top-0 z-[70] flex w-full max-w-md flex-col bg-dark-900 shadow-2xl
          h-[100dvh] max-h-[100dvh]
          pt-[env(safe-area-inset-top)]"
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-4 py-3 border-b border-dark-700 shrink-0">
          <h2 class="text-lg font-semibold text-white">Your Cart</h2>
          <button
            type="button"
            @click="cartStore.closeDrawer()"
            class="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-dark-400 hover:text-white hover:bg-dark-800 transition-colors"
            aria-label="Close cart"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Cart Items -->
        <div class="flex-1 overflow-y-auto overscroll-contain p-4">
          <div v-if="cartStore.isEmpty" class="text-center py-12">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-dark-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <p class="text-dark-400">Your cart is empty</p>
            <NuxtLink
              to="/"
              @click="cartStore.closeDrawer()"
              class="inline-flex min-h-[44px] items-center mt-4 text-primary-400 hover:text-primary-300 transition-colors"
            >
              Continue Shopping
            </NuxtLink>
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="item in cartStore.items"
              :key="item.variantId"
              class="rounded-xl bg-dark-800/90 border border-dark-700/80 p-3.5 space-y-3"
            >
              <div class="flex gap-3">
                <div
                  class="w-14 h-14 sm:w-16 sm:h-16 rounded-lg flex-shrink-0"
                  :style="{ background: getGradient(item.productId) }"
                ></div>

                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between gap-2">
                    <div class="min-w-0">
                      <h3 class="text-white font-medium leading-snug">{{ item.productName }}</h3>
                      <p class="text-dark-400 text-sm mt-0.5">{{ item.variantName }}</p>
                      <p class="text-primary-400 font-medium mt-1">{{ formatPrice(item.unitPrice) }}</p>
                    </div>
                    <button
                      type="button"
                      @click="cartStore.removeItem(item.variantId)"
                      class="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg text-dark-500 hover:text-red-400 hover:bg-dark-700/80 transition-colors"
                      aria-label="Remove item"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <div class="flex items-center justify-between gap-3 pl-0 sm:pl-[4.25rem]">
                <span class="text-dark-500 text-xs uppercase tracking-wide">Qty</span>
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
        <div
          v-if="!cartStore.isEmpty"
          class="border-t border-dark-700 px-4 pt-4 space-y-3 shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))]"
        >
          <div class="flex items-center justify-between text-lg">
            <span class="text-dark-300">Subtotal</span>
            <span class="text-white font-semibold">{{ formatPrice(cartStore.subtotal) }}</span>
          </div>
          <p class="text-dark-500 text-xs">Shipping calculated at checkout</p>

          <div class="space-y-2.5">
            <NuxtLink
              to="/checkout"
              @click="cartStore.closeDrawer()"
              class="flex min-h-[48px] w-full items-center justify-center rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-semibold transition-colors"
            >
              Checkout
            </NuxtLink>
            <NuxtLink
              to="/cart"
              @click="cartStore.closeDrawer()"
              class="flex min-h-[44px] w-full items-center justify-center rounded-xl bg-dark-800 hover:bg-dark-700 text-white font-medium border border-dark-600 transition-colors"
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
import { watch, onBeforeUnmount } from 'vue'
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

function lockBodyScroll(lock: boolean) {
  if (!import.meta.client) return
  document.body.style.overflow = lock ? 'hidden' : ''
}

watch(
  () => cartStore.isDrawerOpen,
  (open) => lockBodyScroll(open),
  { immediate: true }
)

onBeforeUnmount(() => lockBodyScroll(false))
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
