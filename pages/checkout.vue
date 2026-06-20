<template>
  <div class="min-h-screen bg-dark-950 py-8">
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-white">Checkout</h1>
        <p class="text-dark-400 mt-2">Review your order and continue to secure payment.</p>
      </div>

      <!-- Test mode notice -->
      <div
        v-if="isTestMode"
        class="mb-6 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex items-start gap-3"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <div>
          <p class="text-yellow-400 font-semibold text-sm">TEST PAYMENT MODE</p>
          <p class="text-yellow-200/70 text-xs mt-0.5">No real money will be charged. Use Moov test credentials only.</p>
        </div>
      </div>

      <!-- Empty Cart -->
      <div v-if="cartStore.isEmpty" class="text-center py-16">
        <h2 class="text-xl font-semibold text-white mb-2">Your cart is empty</h2>
        <p class="text-dark-400 mb-8">Add some products before checking out.</p>
        <NuxtLink to="/" class="px-8 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors">
          Browse Products
        </NuxtLink>
      </div>

      <div v-else class="grid grid-cols-1 lg:grid-cols-5 gap-8">

        <!-- Left: Form -->
        <div class="lg:col-span-3 space-y-6">

          <!-- Contact Information -->
          <div class="bg-dark-900 rounded-xl border border-dark-700 p-6 space-y-4">
            <h2 class="text-lg font-semibold text-white">Contact Information</h2>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-dark-300 mb-1">First Name <span class="text-red-400">*</span></label>
                <input
                  v-model="form.firstName"
                  type="text"
                  placeholder="Jane"
                  class="w-full px-4 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:border-primary-500 transition-colors"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-dark-300 mb-1">Last Name <span class="text-red-400">*</span></label>
                <input
                  v-model="form.lastName"
                  type="text"
                  placeholder="Smith"
                  class="w-full px-4 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:border-primary-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-dark-300 mb-1">Email <span class="text-red-400">*</span></label>
              <input
                v-model="form.email"
                type="email"
                placeholder="researcher@institution.edu"
                class="w-full px-4 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:border-primary-500 transition-colors"
              />
            </div>
          </div>

          <!-- Research-Use Confirmation -->
          <div class="bg-dark-900 rounded-xl border border-dark-700 p-6">
            <h2 class="text-lg font-semibold text-white mb-4">Research Use Confirmation <span class="text-red-400">*</span></h2>
            <label class="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                v-model="form.confirmationAccepted"
                class="mt-1 w-5 h-5 rounded border-dark-600 bg-dark-800 text-primary-500 focus:ring-primary-500 focus:ring-offset-dark-900 flex-shrink-0"
              />
              <span class="text-dark-300 group-hover:text-white transition-colors text-sm leading-relaxed">
                I confirm that I am 21 years of age or older, a qualified professional or researcher,
                and I understand that all products are for <strong class="text-primary-400">research use only</strong> —
                not for human or veterinary use.
              </span>
            </label>
          </div>

          <!-- Error -->
          <div v-if="error" class="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <p class="text-red-400 text-sm">{{ error }}</p>
          </div>

          <!-- Submit -->
          <button
            @click="handleSubmit"
            :disabled="!canSubmit || isLoading"
            class="w-full py-4 bg-primary-500 hover:bg-primary-600 disabled:bg-dark-700 disabled:text-dark-500 text-white font-semibold rounded-lg transition-all duration-200 text-lg flex items-center justify-center gap-2"
          >
            <svg v-if="isLoading" class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ isLoading ? 'Preparing Order...' : 'Continue to Payment' }}
          </button>

          <p class="text-dark-500 text-xs text-center">
            Your order will be created with payment status pending. No payment is processed on this step.
          </p>

          <NuxtLink to="/cart" class="block text-center text-dark-400 hover:text-white transition-colors text-sm">
            ← Back to Cart
          </NuxtLink>
        </div>

        <!-- Right: Order Summary -->
        <div class="lg:col-span-2">
          <div class="bg-dark-900 rounded-xl border border-dark-700 p-6 sticky top-6">
            <h2 class="text-lg font-semibold text-white mb-4">Order Summary</h2>

            <div class="divide-y divide-dark-800">
              <div
                v-for="item in cartStore.items"
                :key="item.variantId"
                class="flex justify-between py-3 text-sm"
              >
                <div class="pr-4">
                  <p class="text-white font-medium">{{ item.productName }}</p>
                  <p class="text-dark-400">{{ item.variantName }} × {{ item.quantity }}</p>
                </div>
                <p class="text-white whitespace-nowrap">{{ formatPrice(item.unitPrice * item.quantity) }}</p>
              </div>
            </div>

            <div class="border-t border-dark-700 mt-4 pt-4 space-y-2 text-sm">
              <div class="flex justify-between text-dark-300">
                <span>Subtotal</span>
                <span>{{ formatPrice(cartStore.subtotal) }}</span>
              </div>
              <div class="flex justify-between text-white font-semibold text-base pt-2 border-t border-dark-700">
                <span>Total</span>
                <span>{{ formatPrice(cartStore.subtotal) }}</span>
              </div>
            </div>

            <p class="text-dark-500 text-xs mt-4 leading-relaxed">
              Shipping and tax will be calculated before payment. Final total confirmed by the server.
            </p>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
import { useCartStore } from '~/stores/cart'
import { CURRENCY } from '~/constants'

const cartStore = useCartStore()
const isLoading = ref(false)
const error = ref<string | null>(null)

const config = useRuntimeConfig()
const isTestMode = computed(() => (config.public.moovMode as string || 'test') === 'test')

const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  confirmationAccepted: false,
})

const canSubmit = computed(() => {
  return (
    form.firstName.trim() &&
    form.lastName.trim() &&
    form.email.trim() &&
    form.confirmationAccepted &&
    !cartStore.isEmpty
  )
})

const formatPrice = (price: number) => `${CURRENCY.SYMBOL}${price.toFixed(2)}`

function generateIdempotencyKey(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

const handleSubmit = async () => {
  error.value = null

  if (!canSubmit.value) {
    error.value = 'Please fill in all required fields and accept the research-use confirmation.'
    return
  }

  isLoading.value = true

  try {
    const response = await $fetch<{
      ok: boolean
      orderId: number
      orderNumber: string
      currency: string
      subtotalCents: number
      shippingCents: number
      taxCents: number
      totalCents: number
      paymentStatus: string
      checkoutSessionToken: string
    }>('/api/checkout/prepare', {
      method: 'POST',
      body: {
        items: cartStore.items.map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
        })),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        idempotencyKey: generateIdempotencyKey(),
      },
    })

    cartStore.clearCart()
    navigateTo(
      `/checkout/success?orderId=${response.orderId}` +
      `&orderNumber=${encodeURIComponent(response.orderNumber)}` +
      `&email=${encodeURIComponent(form.email.trim())}` +
      `&totalCents=${response.totalCents}` +
      `&paymentStatus=${encodeURIComponent(response.paymentStatus)}` +
      `&t=${encodeURIComponent(response.checkoutSessionToken)}`
    )
  } catch (err: any) {
    console.error('Checkout prepare error:', err)
    error.value = err.data?.message || err.message || 'An error occurred. Please try again.'
  } finally {
    isLoading.value = false
  }
}
</script>
