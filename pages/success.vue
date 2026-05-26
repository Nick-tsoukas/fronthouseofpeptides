<template>
  <div class="min-h-screen bg-dark-950 py-16">
    <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">

      <!-- Icon + Heading (branches on status) -->
      <div class="text-center mb-8">
        <!-- Approved -->
        <div
          v-if="isApproved"
          class="w-20 h-20 mx-auto mb-6 bg-green-500/10 rounded-full flex items-center justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <!-- Pending Review -->
        <div
          v-else
          class="w-20 h-20 mx-auto mb-6 bg-yellow-500/10 rounded-full flex items-center justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <h1 class="text-3xl font-bold text-white mb-3">
          {{ isApproved ? 'Request Approved' : 'Request Received' }}
        </h1>
        <p class="text-dark-400 max-w-md mx-auto">
          <span v-if="isApproved">
            Availability has been confirmed. We'll contact you at
            <span class="text-white">{{ email }}</span> with payment and shipping next steps.
          </span>
          <span v-else>
            Your request is pending review. We'll confirm availability and contact you at
            <span class="text-white">{{ email }}</span> within 1–2 business days.
          </span>
        </p>
      </div>

      <!-- Request Summary -->
      <div class="bg-dark-900 rounded-xl border border-dark-700 p-6 mb-6">
        <h2 class="text-lg font-semibold text-white mb-4">Request Summary</h2>

        <!-- Meta row -->
        <div class="space-y-3 text-sm mb-4">
          <div class="flex justify-between">
            <span class="text-dark-400">Request ID</span>
            <span class="text-white font-mono">#{{ orderId || '—' }}</span>
          </div>
          <div v-if="email" class="flex justify-between">
            <span class="text-dark-400">Contact email</span>
            <span class="text-white">{{ email }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-dark-400">Status</span>
            <span
              :class="isApproved
                ? 'inline-flex items-center gap-1.5 text-green-400'
                : 'inline-flex items-center gap-1.5 text-yellow-400'"
            >
              <span
                :class="isApproved ? 'w-1.5 h-1.5 rounded-full bg-green-400' : 'w-1.5 h-1.5 rounded-full bg-yellow-400'"
              ></span>
              {{ isApproved ? 'Approved' : 'Pending Review' }}
            </span>
          </div>
        </div>

        <!-- Items -->
        <div v-if="parsedItems.length > 0" class="border-t border-dark-700 pt-4 space-y-2">
          <div
            v-for="(item, i) in parsedItems"
            :key="i"
            class="flex justify-between text-sm"
          >
            <div>
              <span class="text-white">{{ item.productName }}</span>
              <span class="text-dark-400 ml-2">{{ item.variantName }} × {{ item.quantity }}</span>
            </div>
            <span class="text-white whitespace-nowrap">{{ formatPrice(item.unitPrice * item.quantity) }}</span>
          </div>

          <div class="border-t border-dark-700 pt-3 mt-3 space-y-1">
            <div class="flex justify-between text-sm text-dark-300">
              <span>Subtotal</span>
              <span>{{ formatPrice(parsedTotal - shippingFlat) }}</span>
            </div>
            <div class="flex justify-between text-sm text-dark-300">
              <span>Est. Shipping</span>
              <span>{{ formatPrice(shippingFlat) }}</span>
            </div>
            <div class="flex justify-between text-sm font-semibold text-white pt-1">
              <span>Est. Total</span>
              <span>{{ formatPrice(parsedTotal) }}</span>
            </div>
          </div>
        </div>

        <p class="text-dark-500 text-xs mt-4">
          Estimated total only. Final pricing confirmed after review.
        </p>
      </div>

      <!-- What Happens Next -->
      <div class="bg-dark-800/50 rounded-xl border border-dark-700 p-6 mb-6">
        <h3 class="text-white font-semibold mb-4">What Happens Next?</h3>
        <ul class="space-y-4">
          <!-- Approved path -->
          <template v-if="isApproved">
            <li class="flex items-start gap-3">
              <div class="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span class="text-green-400 text-xs font-bold">1</span>
              </div>
              <div>
                <p class="text-white text-sm font-medium">Availability Confirmed</p>
                <p class="text-dark-400 text-sm">Your requested items are in stock and reserved for this order.</p>
              </div>
            </li>
            <li class="flex items-start gap-3">
              <div class="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span class="text-green-400 text-xs font-bold">2</span>
              </div>
              <div>
                <p class="text-white text-sm font-medium">We'll Contact You</p>
                <p class="text-dark-400 text-sm">Expect an email at <span class="text-white">{{ email }}</span> with payment and shipping instructions.</p>
              </div>
            </li>
            <li class="flex items-start gap-3">
              <div class="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span class="text-green-400 text-xs font-bold">3</span>
              </div>
              <div>
                <p class="text-white text-sm font-medium">Fulfillment</p>
                <p class="text-dark-400 text-sm">Once payment is arranged, your order ships within 1–2 business days.</p>
              </div>
            </li>
          </template>

          <!-- Pending review path -->
          <template v-else>
            <li class="flex items-start gap-3">
              <div class="w-6 h-6 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span class="text-primary-400 text-xs font-bold">1</span>
              </div>
              <div>
                <p class="text-white text-sm font-medium">Availability Review</p>
                <p class="text-dark-400 text-sm">Our team will confirm product availability for your request.</p>
              </div>
            </li>
            <li class="flex items-start gap-3">
              <div class="w-6 h-6 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span class="text-primary-400 text-xs font-bold">2</span>
              </div>
              <div>
                <p class="text-white text-sm font-medium">We'll Contact You</p>
                <p class="text-dark-400 text-sm">Expect a reply at <span class="text-white">{{ email }}</span> within 1–2 business days.</p>
              </div>
            </li>
            <li class="flex items-start gap-3">
              <div class="w-6 h-6 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span class="text-primary-400 text-xs font-bold">3</span>
              </div>
              <div>
                <p class="text-white text-sm font-medium">Fulfillment</p>
                <p class="text-dark-400 text-sm">Once approved and payment arranged, your order ships within 1–2 business days.</p>
              </div>
            </li>
          </template>
        </ul>
      </div>

      <!-- Email Notice -->
      <div
        v-if="!emailWarning"
        class="flex items-start gap-3 bg-primary-500/10 border border-primary-500/30 rounded-lg p-4 mb-6"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <p class="text-primary-300 text-sm">A confirmation email has been sent to <span class="text-white font-medium">{{ email }}</span>.</p>
      </div>
      <div
        v-else
        class="flex items-start gap-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
        <p class="text-yellow-300 text-sm">Your request was received. If you do not receive a confirmation email, we will still review your request and contact you directly.</p>
      </div>

      <!-- Research Notice -->
      <div class="bg-dark-800/30 rounded-lg p-4 mb-8 border border-dark-700">
        <p class="text-dark-400 text-xs text-center">
          All products are for <strong class="text-primary-400">research purposes only</strong>. Not for human or veterinary use.
        </p>
      </div>

      <NuxtLink
        to="/"
        class="block w-full py-4 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors text-center"
      >
        Browse More Products
      </NuxtLink>

    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { CURRENCY, SHIPPING } from '~/constants'

const route = useRoute()

const orderId = computed(() => route.query.orderId as string | undefined)
const email = computed(() => route.query.email as string | undefined)
const status = computed(() => (route.query.status as string | undefined) || 'pending_review')
const parsedTotal = computed(() => parseFloat((route.query.total as string) || '0'))
const shippingFlat = SHIPPING.FLAT_RATE_CENTS / 100
const emailWarning = computed(() => route.query.emailWarning === '1')

const isApproved = computed(() => status.value === 'approved')

interface OrderItem {
  productName: string
  variantName: string
  quantity: number
  unitPrice: number
}

const parsedItems = computed<OrderItem[]>(() => {
  try {
    const raw = route.query.items as string | undefined
    if (!raw) return []
    return JSON.parse(decodeURIComponent(raw)) as OrderItem[]
  } catch {
    return []
  }
})

const formatPrice = (n: number) => `${CURRENCY.SYMBOL}${n.toFixed(2)}`
</script>
