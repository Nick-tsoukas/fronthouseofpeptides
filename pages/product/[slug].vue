<template>
  <div class="min-h-screen bg-dark-950 py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Back Link -->
      <NuxtLink to="/" class="inline-flex items-center text-dark-400 hover:text-primary-400 transition-colors mb-8">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Shop
      </NuxtLink>

      <!-- Loading State -->
      <div v-if="pending" class="animate-pulse">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div class="aspect-square bg-dark-800 rounded-xl"></div>
          <div class="space-y-4">
            <div class="h-8 bg-dark-800 rounded w-3/4"></div>
            <div class="h-4 bg-dark-800 rounded w-full"></div>
            <div class="h-4 bg-dark-800 rounded w-2/3"></div>
          </div>
        </div>
      </div>

      <!-- Product Not Found / Inactive -->
      <div v-else-if="!product" class="text-center py-16">
        <h1 class="text-2xl font-bold text-white mb-4">Product Unavailable</h1>
        <p class="text-dark-400 mb-8">This product doesn't exist or is no longer available.</p>
        <NuxtLink to="/" class="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors">
          Back to Shop
        </NuxtLink>
      </div>

      <!-- Product Details -->
      <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <!-- Product Image -->
        <div class="relative aspect-square rounded-xl overflow-hidden">
          <img
            v-if="imageUrl"
            :src="imageUrl"
            :alt="product.attributes.name"
            class="absolute inset-0 w-full h-full object-cover"
          />
          <div
            v-else
            class="absolute inset-0"
            :style="{ background: gradientStyle }"
          ></div>
          <div class="absolute top-4 left-4">
            <span class="px-3 py-1.5 bg-primary-500/90 text-white text-sm font-medium rounded">
              {{ product.attributes.badgeText || 'Research Use Only' }}
            </span>
          </div>
        </div>

        <!-- Product Info -->
        <div class="space-y-6">
          <div>
            <h1 class="text-3xl md:text-4xl font-bold text-white mb-2">
              {{ product.attributes.name }}
            </h1>
            <p class="text-dark-400">
              {{ product.attributes.shortDescription }}
            </p>
          </div>

          <!-- Price Display -->
          <div class="text-2xl font-bold text-primary-400">
            {{ selectedVariant ? formatPrice(selectedVariant.attributes.price) : priceRange }}
          </div>

          <!-- Variant Selector -->
          <VariantSelector
            v-if="activeVariants.length > 0"
            :variants="activeVariants"
            :selected-id="selectedVariant?.id || null"
            @select="selectVariant"
          />

          <!-- No Variants Available -->
          <div v-else class="bg-dark-800 rounded-lg p-4 text-dark-400">
            No variants available for this product.
          </div>

          <!-- Stock status -->
          <div v-if="selectedVariant">
            <p v-if="isOutOfStock" class="text-red-400 text-sm font-medium">
              Out of stock
            </p>
            <p v-else-if="isLowStock" class="text-yellow-400 text-sm font-medium">
              Only {{ selectedVariantInventory }} left in stock
            </p>
          </div>

          <!-- Quantity Selector -->
          <div v-if="selectedVariant && !isOutOfStock">
            <QuantitySelector
              v-model="quantity"
              :max="quantityMax"
            />
          </div>

          <!-- Add to Cart Button -->
          <button
            @click="handleAddToCart"
            :disabled="!selectedVariant || isOutOfStock"
            class="w-full py-4 bg-primary-500 hover:bg-primary-600 disabled:bg-dark-700 disabled:text-dark-500 text-white font-semibold rounded-lg transition-all duration-200 text-lg"
          >
            <span v-if="!selectedVariant">Select a Variant</span>
            <span v-else-if="isOutOfStock">Out of Stock</span>
            <span v-else>Add to Cart</span>
          </button>

          <!-- Research Notice -->
          <div class="bg-dark-800/50 rounded-lg p-4 border border-dark-700">
            <p class="text-dark-400 text-sm">
              <span class="text-primary-400 font-semibold">Research Use Only</span> —
              This product is intended for laboratory research purposes only. Not for human or veterinary use.
            </p>
          </div>

          <!-- Description (rendered Markdown) -->
          <div v-if="product.attributes.description" class="prose prose-invert max-w-none">
            <h3 class="text-lg font-semibold text-white mb-3">Description</h3>
            <div
              class="text-dark-300 prose-headings:text-white prose-strong:text-white prose-a:text-primary-400"
              v-html="renderedDescription"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { marked } from 'marked'
import type { Variant } from '~/types'
import { useProducts } from '~/composables/useProducts'
import { useCartStore } from '~/stores/cart'
import { useCompliance } from '~/composables/useCompliance'
import { useStrapiMedia } from '~/composables/useStrapiMedia'
import { CURRENCY, CART } from '~/constants'

const route = useRoute()
const { fetchProductBySlug } = useProducts()
const cartStore = useCartStore()
const { requireConfirmation } = useCompliance()
const { getStrapiMediaUrl } = useStrapiMedia()

const slug = computed(() => route.params.slug as string)

const { data: product, pending } = await useAsyncData(
  `product-${slug.value}`,
  () => fetchProductBySlug(slug.value)
)

const selectedVariant = ref<Variant | null>(null)
const quantity = ref(1)

// ── Image ────────────────────────────────────────────────────────────────────
const imageUrl = computed(() => {
  const raw = product.value?.attributes.image?.data?.attributes
  const url = raw?.formats?.large?.url || raw?.formats?.medium?.url || raw?.url
  return getStrapiMediaUrl(url)
})

const gradientStyle = computed(() => {
  if (!product.value) return ''
  const hue1 = (product.value.id * 47) % 360
  const hue2 = (hue1 + 40) % 360
  return `linear-gradient(135deg, hsl(${hue1}, 70%, 30%) 0%, hsl(${hue2}, 60%, 20%) 100%)`
})

// ── Variants & inventory ─────────────────────────────────────────────────────
const activeVariants = computed(() =>
  product.value?.attributes.variants?.data.filter(v => v.attributes.active) || []
)

const selectedVariantInventory = computed<number | null>(() =>
  selectedVariant.value?.attributes.inventory ?? null
)

const isOutOfStock = computed(() =>
  selectedVariantInventory.value !== null && selectedVariantInventory.value <= 0
)

const isLowStock = computed(() =>
  selectedVariantInventory.value !== null && selectedVariantInventory.value > 0 && selectedVariantInventory.value <= 5
)

const quantityMax = computed(() => {
  if (selectedVariantInventory.value === null) return CART.MAX_QUANTITY
  return Math.min(selectedVariantInventory.value, CART.MAX_QUANTITY)
})

// ── Price ────────────────────────────────────────────────────────────────────
const formatPrice = (price: number) => `${CURRENCY.SYMBOL}${price.toFixed(2)}`

const priceRange = computed(() => {
  if (activeVariants.value.length === 0) return 'N/A'
  const prices = activeVariants.value.map(v => v.attributes.price)
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  return min === max ? formatPrice(min) : `${formatPrice(min)} – ${formatPrice(max)}`
})

// ── Description (Markdown) ───────────────────────────────────────────────────
const renderedDescription = computed(() => {
  const raw = product.value?.attributes.description
  if (!raw) return ''
  return marked.parse(raw) as string
})

// ── Actions ──────────────────────────────────────────────────────────────────
const selectVariant = (variant: Variant) => {
  selectedVariant.value = variant
  quantity.value = 1
}

const handleAddToCart = () => {
  if (!product.value || !selectedVariant.value || isOutOfStock.value) return

  requireConfirmation(() => {
    cartStore.addItem({
      productId: product.value!.id,
      variantId: selectedVariant.value!.id,
      productName: product.value!.attributes.name,
      variantName: selectedVariant.value!.attributes.name,
      sku: selectedVariant.value!.attributes.sku,
      unitPrice: selectedVariant.value!.attributes.price,
    }, quantity.value)
  })
}

// Auto-select first active variant when only one exists
watch(activeVariants, (variants) => {
  if (variants.length === 1 && !selectedVariant.value) {
    selectedVariant.value = variants[0]
  }
}, { immediate: true })

// Reset quantity when variant changes to avoid exceeding new stock
watch(selectedVariant, () => {
  quantity.value = 1
})

// ── SEO ──────────────────────────────────────────────────────────────────────
const ogImage = computed(() => imageUrl.value || '')
const seoTitle = computed(() =>
  product.value ? `${product.value.attributes.name} | House of Peptides` : 'House of Peptides'
)
const seoDescription = computed(() =>
  product.value?.attributes.shortDescription || 'Research-grade peptide for laboratory use.'
)

useSeoMeta({
  title: seoTitle,
  description: seoDescription,
  ogTitle: seoTitle,
  ogDescription: seoDescription,
  ogImage: ogImage,
  ogType: 'website',
})
</script>
