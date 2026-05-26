<template>
  <div class="min-h-screen bg-dark-950 py-8">
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-white">Submit Research Order Request</h1>
        <p class="text-dark-400 mt-2">No payment is collected at this step. We'll review availability and contact you with next steps.</p>
      </div>

      <!-- Empty Cart -->
      <div v-if="cartStore.isEmpty" class="text-center py-16">
        <h2 class="text-xl font-semibold text-white mb-2">Your cart is empty</h2>
        <p class="text-dark-400 mb-8">Add some products before submitting a request.</p>
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
                <label class="block text-sm font-medium text-dark-300 mb-1">Full Name <span class="text-red-400">*</span></label>
                <input
                  v-model="form.customerName"
                  type="text"
                  placeholder="Dr. Jane Smith"
                  class="w-full px-4 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:border-primary-500 transition-colors"
                />
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

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-dark-300 mb-1">Phone</label>
                <input
                  v-model="form.phone"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  class="w-full px-4 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:border-primary-500 transition-colors"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-dark-300 mb-1">Institution / Company</label>
                <input
                  v-model="form.companyName"
                  type="text"
                  placeholder="University of Research"
                  class="w-full px-4 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:border-primary-500 transition-colors"
                />
              </div>
            </div>
          </div>

          <!-- Shipping Address -->
          <div class="bg-dark-900 rounded-xl border border-dark-700 p-6 space-y-4">
            <h2 class="text-lg font-semibold text-white">Shipping Address <span class="text-dark-500 text-sm font-normal">(US Only)</span></h2>

            <div>
              <label class="block text-sm font-medium text-dark-300 mb-1">Address Line 1 <span class="text-red-400">*</span></label>
              <input
                v-model="form.shippingAddressLine1"
                type="text"
                placeholder="123 Research Blvd"
                class="w-full px-4 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:border-primary-500 transition-colors"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-dark-300 mb-1">Address Line 2</label>
              <input
                v-model="form.shippingAddressLine2"
                type="text"
                placeholder="Suite 200, Lab Building B"
                class="w-full px-4 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:border-primary-500 transition-colors"
              />
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div class="col-span-2 sm:col-span-1">
                <label class="block text-sm font-medium text-dark-300 mb-1">City <span class="text-red-400">*</span></label>
                <input
                  v-model="form.shippingCity"
                  type="text"
                  placeholder="Boston"
                  class="w-full px-4 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:border-primary-500 transition-colors"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-dark-300 mb-1">State <span class="text-red-400">*</span></label>
                <input
                  v-model="form.shippingState"
                  type="text"
                  placeholder="MA"
                  maxlength="2"
                  class="w-full px-4 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:border-primary-500 transition-colors uppercase"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-dark-300 mb-1">ZIP <span class="text-red-400">*</span></label>
                <input
                  v-model="form.shippingPostalCode"
                  type="text"
                  placeholder="02101"
                  class="w-full px-4 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:border-primary-500 transition-colors"
                />
              </div>
            </div>
          </div>

          <!-- Notes -->
          <div class="bg-dark-900 rounded-xl border border-dark-700 p-6">
            <label class="block text-sm font-medium text-dark-300 mb-1">Additional Notes</label>
            <textarea
              v-model="form.customerNotes"
              rows="3"
              placeholder="Research application, special handling requirements, etc."
              class="w-full px-4 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:border-primary-500 transition-colors resize-none"
            ></textarea>
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
                not for human or veterinary use. I agree to the terms and conditions of this order request.
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
            :disabled="!form.confirmationAccepted || isLoading"
            class="w-full py-4 bg-primary-500 hover:bg-primary-600 disabled:bg-dark-700 disabled:text-dark-500 text-white font-semibold rounded-lg transition-all duration-200 text-lg flex items-center justify-center gap-2"
          >
            <svg v-if="isLoading" class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ isLoading ? 'Submitting Request...' : 'Submit Research Order Request' }}
          </button>

          <p class="text-dark-500 text-xs text-center">
            No payment is collected at this step. We'll review your request and contact you within 1–2 business days.
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
              <div class="flex justify-between text-dark-300">
                <span>Est. Shipping</span>
                <span>{{ SHIPPING.FLAT_RATE_DISPLAY }}</span>
              </div>
              <div class="flex justify-between text-white font-semibold text-base pt-2 border-t border-dark-700">
                <span>Est. Total</span>
                <span>{{ formatPrice(cartStore.subtotal + SHIPPING.FLAT_RATE_CENTS / 100) }}</span>
              </div>
            </div>

            <p class="text-dark-500 text-xs mt-4 leading-relaxed">
              Estimated total is for reference only. Final pricing confirmed after review.
            </p>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useCartStore } from '~/stores/cart'
import { CURRENCY, SHIPPING } from '~/constants'

const cartStore = useCartStore()
const isLoading = ref(false)
const error = ref<string | null>(null)

const form = reactive({
  customerName: '',
  email: '',
  phone: '',
  companyName: '',
  customerNotes: '',
  shippingAddressLine1: '',
  shippingAddressLine2: '',
  shippingCity: '',
  shippingState: '',
  shippingPostalCode: '',
  confirmationAccepted: false,
})

const formatPrice = (price: number) => `${CURRENCY.SYMBOL}${price.toFixed(2)}`

const handleSubmit = async () => {
  error.value = null

  if (!form.confirmationAccepted) {
    error.value = 'You must accept the research-use confirmation.'
    return
  }
  if (cartStore.isEmpty) {
    error.value = 'Your cart is empty.'
    return
  }

  isLoading.value = true

  try {
    const response = await $fetch<{
      orderId: number
      email: string
      customerName: string
      amountSubtotal: number
      shippingAmount: number
      amountTotal: number
      currency: string
      status: string
      inventoryAdjusted: boolean
      emailWarning: boolean
      items: { productName: string; variantName: string; quantity: number; unitPrice: number }[]
    }>('/api/order/request', {
      method: 'POST',
      body: {
        cartItems: cartStore.items,
        customerName: form.customerName,
        email: form.email,
        phone: form.phone,
        companyName: form.companyName,
        customerNotes: form.customerNotes,
        shippingAddressLine1: form.shippingAddressLine1,
        shippingAddressLine2: form.shippingAddressLine2,
        shippingCity: form.shippingCity,
        shippingState: form.shippingState,
        shippingPostalCode: form.shippingPostalCode,
        confirmationAccepted: form.confirmationAccepted,
      },
    })

    cartStore.clearCart()
    navigateTo(
      `/success?orderId=${response.orderId}` +
      `&email=${encodeURIComponent(response.email)}` +
      `&status=${encodeURIComponent(response.status)}` +
      `&total=${response.amountTotal}` +
      `&emailWarning=${response.emailWarning ? '1' : '0'}` +
      `&items=${encodeURIComponent(JSON.stringify(response.items))}`
    )
  } catch (err: any) {
    console.error('Order request error:', err)
    error.value = err.data?.message || err.message || 'An error occurred. Please try again.'
  } finally {
    isLoading.value = false
  }
}
</script>
