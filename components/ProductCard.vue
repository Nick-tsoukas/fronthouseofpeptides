<template>
  <div class="group relative bg-dark-900/50 rounded-xl overflow-hidden border border-white/5 hover:border-cyan-500/20 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/5 hover:scale-[1.01]">
    <!-- Product Image -->
    <NuxtLink :to="`/product/${product.attributes.slug}`" class="relative aspect-[4/3] overflow-hidden block">
      <!-- Real / generated image -->
      <img
        v-if="imageUrl && !imageBroken"
        :src="imageUrl"
        :alt="product.attributes.name"
        class="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        @error="imageBroken = true"
      />
      <!-- Gradient fallback -->
      <div
        v-if="!imageUrl || imageBroken"
        class="absolute inset-0 transition-transform duration-500 group-hover:scale-105"
        :style="{ background: gradientStyle }"
      ></div>
      <!-- Overlay: lighter on generated art so the label stays readable -->
      <div
        class="absolute inset-0"
        :class="imageSource === 'generated'
          ? 'bg-gradient-to-t from-dark-950/55 via-transparent to-transparent'
          : 'bg-gradient-to-t from-dark-950 via-dark-950/20 to-transparent'"
      ></div>
      <!-- Badge -->
      <div class="absolute top-3 left-3">
        <span class="px-2.5 py-1 bg-cyan-500/90 text-white text-xs font-medium rounded backdrop-blur-sm">
          {{ product.attributes.badgeText || 'Research Use Only' }}
        </span>
      </div>
      <!-- Purity / stock Badge -->
      <div class="absolute top-3 right-3">
        <span
          v-if="allOutOfStock"
          class="px-2 py-1 bg-dark-950/80 text-red-400 text-xs font-medium rounded backdrop-blur-sm border border-red-500/20"
        >
          Out of stock
        </span>
        <span
          v-else
          class="px-2 py-1 bg-dark-950/80 text-cyan-400 text-xs font-medium rounded backdrop-blur-sm border border-cyan-500/20"
        >
          99%+ Pure
        </span>
      </div>
    </NuxtLink>

    <!-- Content -->
    <div class="p-5">
      <h3 class="text-lg font-semibold text-white mb-1.5 group-hover:text-cyan-300 transition-colors duration-200">
        <NuxtLink :to="`/product/${product.attributes.slug}`">
          {{ product.attributes.name }}
        </NuxtLink>
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
      <div class="flex">
        <NuxtLink
          :to="`/product/${product.attributes.slug}`"
          class="w-full min-h-[44px] px-4 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-semibold rounded-xl text-center transition-colors duration-200 inline-flex items-center justify-center"
        >
          View Details
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Product } from '~/types'
import { getProductImage } from '~/utils/getProductImage'
import { CURRENCY } from '~/constants'

const props = defineProps<{
  product: Product
}>()

const resolvedImage = computed(() => getProductImage(props.product))
const imageUrl = computed(() => resolvedImage.value.url)
const imageSource = computed(() => resolvedImage.value.source)
const imageBroken = ref(false)

watch(imageUrl, () => {
  imageBroken.value = false
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
</script>
