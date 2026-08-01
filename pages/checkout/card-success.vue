<template>
  <div class="min-h-screen bg-dark-950 flex items-center justify-center px-4">
    <div class="max-w-md w-full rounded-2xl border border-dark-700 bg-dark-900 p-8 text-center">
      <h1 class="text-xl font-semibold text-white mb-2">Continue to payment</h1>
      <p class="text-dark-400 text-sm mb-6 leading-relaxed">
        This page is no longer used. Card linking and payment happen on the secure payment screen.
      </p>
      <NuxtLink
        :to="orderId ? `/checkout/payment?orderId=${orderId}` : '/checkout'"
        class="inline-flex min-h-[44px] items-center justify-center px-5 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold"
      >
        {{ orderId ? 'Go to Payment' : 'Return to Checkout' }}
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const orderId = computed(() => {
  const raw = route.query.orderId
  return raw ? String(raw) : ''
})

useHead({ title: 'Payment — Quantum Bio Peptides' })
</script>
