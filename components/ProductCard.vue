<template>
  <div class="group relative bg-gradient-to-br from-dark-900 to-dark-950 rounded-2xl overflow-hidden border border-white/5 hover:border-primary-500/30 transition-all duration-500 hover:shadow-2xl hover:shadow-primary-500/10">
    <!-- Gradient Placeholder Image -->
    <div class="relative aspect-square overflow-hidden">
      <div 
        class="absolute inset-0 transition-all duration-700 group-hover:scale-110"
        :style="{ background: gradientStyle }"
      ></div>
      <!-- Overlay on hover -->
      <div class="absolute inset-0 bg-gradient-to-t from-dark-950 via-transparent to-transparent opacity-60"></div>
      <!-- Badge -->
      <div class="absolute top-4 left-4">
        <span class="px-3 py-1.5 bg-gradient-to-r from-primary-500/90 to-emerald-500/90 text-white text-xs font-semibold rounded-full backdrop-blur-sm shadow-lg">
          {{ product.attributes.badgeText || 'Research Use Only' }}
        </span>
      </div>
      <!-- Quick View Button -->
      <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <NuxtLink
          :to="`/product/${product.attributes.slug}`"
          class="px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-medium rounded-xl border border-white/20 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0"
        >
          View Details
        </NuxtLink>
      </div>
    </div>

    <!-- Content -->
    <div class="p-6">
      <h3 class="text-xl font-semibold text-white mb-2 group-hover:text-primary-300 transition-colors">
        {{ product.attributes.name }}
      </h3>
      <p class="text-dark-400 text-sm mb-4 line-clamp-2 leading-relaxed">
        {{ product.attributes.shortDescription }}
      </p>

      <!-- Price & Variants -->
      <div class="flex items-center justify-between mb-5">
        <span class="text-lg font-bold bg-gradient-to-r from-primary-400 to-emerald-400 bg-clip-text text-transparent">
          {{ priceRange }}
        </span>
        <span class="text-dark-500 text-xs px-2 py-1 rounded-full bg-dark-800">
          {{ variantCount }} variant{{ variantCount !== 1 ? 's' : '' }}
        </span>
      </div>

      <!-- Actions -->
      <div class="flex gap-3">
        <NuxtLink
          :to="`/product/${product.attributes.slug}`"
          class="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white text-sm font-medium rounded-xl text-center transition-all duration-300 border border-white/5 hover:border-white/10"
        >
          Details
        </NuxtLink>
        <button
          v-if="hasActiveVariants"
          @click="handleQuickAdd"
          class="flex-1 px-4 py-3 bg-gradient-to-r from-primary-500 to-emerald-500 hover:from-primary-600 hover:to-emerald-600 text-white text-sm font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-primary-500/20 hover:shadow-primary-500/30"
        >
          Quick Add
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Product, Variant } from '~/types'
import { useCartStore } from '~/stores/cart'
import { useCompliance } from '~/composables/useCompliance'
import { CURRENCY } from '~/constants'

const props = defineProps<{
  product: Product
}>()

const cartStore = useCartStore()
const { requireConfirmation } = useCompliance()

// Generate a consistent gradient based on product id
const gradientStyle = computed(() => {
  const hue1 = (props.product.id * 47) % 360
  const hue2 = (hue1 + 40) % 360
  return `linear-gradient(135deg, hsl(${hue1}, 70%, 30%) 0%, hsl(${hue2}, 60%, 20%) 100%)`
})

const activeVariants = computed(() => {
  return props.product.attributes.variants?.data.filter(v => v.attributes.active) || []
})

const hasActiveVariants = computed(() => activeVariants.value.length > 0)

const variantCount = computed(() => activeVariants.value.length)

const priceRange = computed(() => {
  if (activeVariants.value.length === 0) return 'N/A'
  
  const prices = activeVariants.value.map(v => v.attributes.price)
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  
  if (min === max) {
    return `${CURRENCY.SYMBOL}${min.toFixed(2)}`
  }
  return `${CURRENCY.SYMBOL}${min.toFixed(2)} - ${CURRENCY.SYMBOL}${max.toFixed(2)}`
})

const handleQuickAdd = () => {
  if (!hasActiveVariants.value) return
  
  // Quick add uses the first active variant
  const variant = activeVariants.value[0]
  
  requireConfirmation(() => {
    cartStore.addItem({
      productId: props.product.id,
      variantId: variant.id,
      productName: props.product.attributes.name,
      variantName: variant.attributes.name,
      sku: variant.attributes.sku,
      unitPrice: variant.attributes.price,
    })
  })
}
</script>
