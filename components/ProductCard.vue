<template>
  <div class="group relative bg-dark-900/50 rounded-xl overflow-hidden border border-white/5 hover:border-cyan-500/20 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/5 hover:scale-[1.01]">
    <!-- Product Image -->
    <div class="relative aspect-[4/3] overflow-hidden">
      <!-- Real image -->
      <img
        v-if="imageUrl"
        :src="imageUrl"
        :alt="product.attributes.name"
        class="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <!-- Gradient fallback -->
      <div
        v-else
        class="absolute inset-0 transition-transform duration-500 group-hover:scale-105"
        :style="{ background: gradientStyle }"
      ></div>
      <!-- Overlay -->
      <div class="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/20 to-transparent"></div>
      <!-- Badge -->
      <div class="absolute top-3 left-3">
        <span class="px-2.5 py-1 bg-cyan-500/90 text-white text-xs font-medium rounded backdrop-blur-sm">
          {{ product.attributes.badgeText || 'Research Use Only' }}
        </span>
      </div>
      <!-- Purity Badge -->
      <div class="absolute top-3 right-3">
        <span class="px-2 py-1 bg-dark-950/80 text-cyan-400 text-xs font-medium rounded backdrop-blur-sm border border-cyan-500/20">
          99%+ Pure
        </span>
      </div>
    </div>

    <!-- Content -->
    <div class="p-5">
      <h3 class="text-lg font-semibold text-white mb-1.5 group-hover:text-cyan-300 transition-colors duration-200">
        {{ product.attributes.name }}
      </h3>
      <p class="text-dark-400 text-sm mb-4 line-clamp-2 leading-relaxed">
        {{ product.attributes.shortDescription }}
      </p>

      <!-- Price & Variants -->
      <div class="flex items-center justify-between mb-4">
        <span class="text-lg font-bold text-cyan-400">
          {{ priceRange }}
        </span>
        <span class="text-dark-500 text-xs">
          {{ variantCount }} variant{{ variantCount !== 1 ? 's' : '' }}
        </span>
      </div>

      <!-- Actions -->
      <div class="flex gap-2">
        <NuxtLink
          :to="`/product/${product.attributes.slug}`"
          class="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white text-sm font-medium rounded-lg text-center transition-all duration-200 border border-white/5 hover:border-white/10"
        >
          View Details
        </NuxtLink>
        <button
          v-if="hasActiveVariants"
          @click="handleQuickAdd"
          :disabled="allOutOfStock"
          class="flex-1 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-600 disabled:bg-dark-700 disabled:text-dark-500 text-white text-sm font-semibold rounded-lg transition-colors duration-200"
        >
          {{ allOutOfStock ? 'Out of Stock' : 'Quick Add' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Product } from '~/types'
import { useCartStore } from '~/stores/cart'
import { useCompliance } from '~/composables/useCompliance'
import { useStrapiMedia } from '~/composables/useStrapiMedia'
import { CURRENCY } from '~/constants'

const props = defineProps<{
  product: Product
}>()

const cartStore = useCartStore()
const { requireConfirmation } = useCompliance()
const { getStrapiMediaUrl } = useStrapiMedia()

const imageUrl = computed(() => {
  const raw = props.product.attributes.image?.data?.attributes
  const url = raw?.formats?.medium?.url || raw?.formats?.small?.url || raw?.url
  return getStrapiMediaUrl(url)
})

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

const firstAvailableVariant = computed(() =>
  activeVariants.value.find(v => {
    const inv = v.attributes.inventory
    return inv === null || inv === undefined || inv > 0
  }) ?? null
)

const allOutOfStock = computed(() =>
  hasActiveVariants.value && firstAvailableVariant.value === null
)

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
  if (!firstAvailableVariant.value) return
  
  const variant = firstAvailableVariant.value
  
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
