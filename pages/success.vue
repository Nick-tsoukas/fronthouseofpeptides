<template>
  <div class="min-h-screen bg-dark-950 py-16">
    <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <!-- Success Icon -->
      <div class="w-20 h-20 mx-auto mb-6 bg-green-500/10 rounded-full flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h1 class="text-3xl font-bold text-white mb-4">Order Confirmed!</h1>
      <p class="text-dark-400 mb-8">
        Thank you for your order. You will receive a confirmation email shortly.
      </p>

      <!-- Order Details -->
      <div v-if="sessionId" class="bg-dark-900 rounded-xl border border-dark-700 p-6 mb-8 text-left">
        <h2 class="text-lg font-semibold text-white mb-4">Order Details</h2>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-dark-400">Session ID</span>
            <span class="text-white font-mono text-xs">{{ sessionId.slice(0, 20) }}...</span>
          </div>
        </div>
      </div>

      <!-- What's Next -->
      <div class="bg-dark-800/50 rounded-lg p-6 mb-8 text-left">
        <h3 class="text-white font-semibold mb-3">What's Next?</h3>
        <ul class="space-y-2 text-dark-400 text-sm">
          <li class="flex items-start gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span>Check your email for order confirmation and tracking information.</span>
          </li>
          <li class="flex items-start gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            <span>Your order will be processed and shipped within 1-2 business days.</span>
          </li>
          <li class="flex items-start gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Estimated delivery: 5-7 business days (US only).</span>
          </li>
        </ul>
      </div>

      <!-- Actions -->
      <div class="space-y-4">
        <NuxtLink
          to="/"
          class="block w-full py-4 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors"
        >
          Continue Shopping
        </NuxtLink>
      </div>

      <!-- Research Notice -->
      <p class="text-dark-500 text-xs mt-8">
        Remember: All products are for research purposes only. Not for human or veterinary use.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const route = useRoute()

const sessionId = computed(() => route.query.session_id as string | undefined)
</script>
