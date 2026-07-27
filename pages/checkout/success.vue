<template>
  <div class="min-h-screen bg-dark-950 py-16">
    <div class="max-w-xl mx-auto px-4 text-center">
      <h1 class="text-2xl font-bold text-white mb-3">Checkout Moved</h1>
      <p class="text-dark-400 mb-8">
        Shipping rates are selected on the checkout page before payment.
        This page is reserved for completed payments.
      </p>
      <div class="flex flex-col sm:flex-row gap-3 justify-center">
        <NuxtLink
          to="/checkout"
          class="px-8 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors"
        >
          Go to Checkout
        </NuxtLink>
        <NuxtLink
          to="/"
          class="px-8 py-3 bg-dark-800 hover:bg-dark-700 text-white font-semibold rounded-lg transition-colors"
        >
          Continue Shopping
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'Checkout — Quantum Bio Peptides',
})
</script>
