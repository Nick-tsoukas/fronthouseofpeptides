<template>
  <div class="min-h-screen bg-dark-950 py-16">
    <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">

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
          <p class="text-yellow-200/70 text-xs mt-0.5">No real money will be charged. This is a pending order only.</p>
        </div>
      </div>

      <div class="text-center mb-8">
        <div class="w-20 h-20 mx-auto mb-6 bg-primary-500/10 rounded-full flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <h1 class="text-3xl font-bold text-white mb-3">Pending Order Created</h1>
        <p class="text-dark-400 max-w-md mx-auto">
          Your order is reserved. Complete payment below to finalize the purchase.
        </p>
      </div>

      <div class="bg-dark-900 rounded-xl border border-dark-700 p-6 mb-6">
        <h2 class="text-lg font-semibold text-white mb-4">Order Details</h2>

        <div class="space-y-3 text-sm mb-6">
          <div class="flex justify-between">
            <span class="text-dark-400">Order Number</span>
            <span class="text-white font-mono">{{ orderNumber || '—' }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-dark-400">Contact email</span>
            <span class="text-white">{{ email || '—' }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-dark-400">Total</span>
            <span class="text-white font-semibold">{{ formatTotal }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-dark-400">Payment Status</span>
            <span class="inline-flex items-center gap-1.5 text-yellow-400">
              <span class="w-1.5 h-1.5 rounded-full bg-yellow-400"></span>
              {{ displayPaymentStatus }}
            </span>
          </div>
        </div>

        <div class="border-t border-dark-700 pt-6">
          <button
            disabled
            class="w-full py-4 bg-primary-500/50 text-white/70 font-semibold rounded-lg cursor-not-allowed flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            Continue to test payment
          </button>
          <p class="text-dark-500 text-xs text-center mt-3">
            Payment collection will be enabled after the pending order test succeeds.
          </p>
        </div>
      </div>

      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <NuxtLink to="/" class="px-8 py-3 bg-dark-800 hover:bg-dark-700 text-white font-semibold rounded-lg transition-colors text-center">
          Continue Shopping
        </NuxtLink>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { CURRENCY } from '~/constants'

const route = useRoute()
const config = useRuntimeConfig()

const isTestMode = computed(() => (config.public.moovMode as string || 'test') === 'test')

const orderNumber = computed(() => route.query.orderNumber as string || '')
const email = computed(() => route.query.email as string || '')
const totalCents = computed(() => Number(route.query.totalCents) || 0)
const paymentStatus = computed(() => route.query.paymentStatus as string || 'pending')

const displayPaymentStatus = computed(() => {
  const status = paymentStatus.value
  return status.charAt(0).toUpperCase() + status.slice(1)
})

const formatTotal = computed(() => {
  const dollars = totalCents.value / 100
  return `${CURRENCY.SYMBOL}${dollars.toFixed(2)}`
})

useHead({
  title: 'Pending Order Created — Quantum Bio Peptides',
})
</script>
