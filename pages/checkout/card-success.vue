<template>
  <div class="min-h-screen bg-dark-950 py-16">
    <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">

      <div class="text-center mb-8">
        <div class="w-20 h-20 mx-auto mb-6 bg-green-500/10 rounded-full flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 class="text-3xl font-bold text-white mb-3">Test Card Linked</h1>
        <p class="text-dark-400 max-w-md mx-auto">
          Your card is ready for payment. No payment has been processed yet.
        </p>
      </div>

      <div class="bg-dark-900 rounded-xl border border-dark-700 p-6 mb-6">
        <h2 class="text-lg font-semibold text-white mb-4">Order Details</h2>

        <div class="space-y-3 text-sm">
          <div class="flex justify-between">
            <span class="text-dark-400">Order Number</span>
            <span class="text-white font-mono">{{ orderNumber || '—' }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-dark-400">Payment Status</span>
            <span class="inline-flex items-center gap-1.5 text-yellow-400">
              <span class="w-1.5 h-1.5 rounded-full bg-yellow-400"></span>
              {{ displayPaymentStatus }}
            </span>
          </div>
        </div>

        <div class="border-t border-dark-700 mt-6 pt-6">
          <button
            disabled
            class="w-full py-4 bg-primary-500/50 text-white/70 font-semibold rounded-lg cursor-not-allowed"
          >
            Pay with linked card
          </button>
          <p class="text-dark-500 text-xs text-center mt-3">
            Payment processing will be enabled in the next stage.
          </p>
        </div>
      </div>

      <div class="flex justify-center">
        <NuxtLink to="/" class="px-8 py-3 bg-dark-800 hover:bg-dark-700 text-white font-semibold rounded-lg transition-colors text-center">
          Continue Shopping
        </NuxtLink>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const route = useRoute()

const orderNumber = computed(() => route.query.orderNumber as string || '')
const paymentStatus = computed(() => route.query.paymentStatus as string || 'pending')

const displayPaymentStatus = computed(() => {
  const status = paymentStatus.value
  return status.charAt(0).toUpperCase() + status.slice(1)
})

useHead({
  title: 'Card Linked — Quantum Bio Peptides',
})
</script>
