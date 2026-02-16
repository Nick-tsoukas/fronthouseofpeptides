<template>
  <section class="relative py-24 bg-dark-950">
    <!-- Background -->
    <div class="absolute inset-0">
      <div class="absolute bottom-0 left-1/4 w-[600px] h-[400px] bg-primary-500/5 rounded-full blur-[120px]"></div>
      <div class="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px]"></div>
    </div>

    <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Section Header -->
      <div class="text-center mb-16">
        <span class="inline-block px-4 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-sm font-medium tracking-wide uppercase mb-4">
          Full Catalog
        </span>
        <h2 class="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
          All <span class="bg-gradient-to-r from-primary-400 to-emerald-400 bg-clip-text text-transparent">Research Peptides</span>
        </h2>
        <p class="text-lg text-dark-400 max-w-2xl mx-auto">
          Every compound in our collection is verified for 99%+ purity. For qualified researchers only.
        </p>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        <div v-for="i in 8" :key="i" class="bg-dark-900 rounded-2xl overflow-hidden animate-pulse border border-white/5">
          <div class="aspect-square bg-dark-800"></div>
          <div class="p-6 space-y-4">
            <div class="h-6 bg-dark-800 rounded-lg w-3/4"></div>
            <div class="h-4 bg-dark-800 rounded-lg w-full"></div>
            <div class="h-4 bg-dark-800 rounded-lg w-1/2"></div>
          </div>
        </div>
      </div>

      <!-- Products Grid -->
      <div v-else-if="displayProducts.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        <ProductCard
          v-for="product in displayProducts"
          :key="product.id"
          :product="product"
        />
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-16">
        <div class="w-16 h-16 mx-auto mb-6 rounded-full bg-dark-800 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-dark-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <p class="text-dark-400 text-lg">No products available at this time.</p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Product } from '~/types'
import { computed } from 'vue'

const props = defineProps<{
  products?: Product[] | null
  loading?: boolean
}>()

const displayProducts = computed(() => props.products ?? [])
</script>
