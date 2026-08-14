<template>
  <div>
    <HeroSection />
    <TrustBar />
    <ProductGrid id="products" :products="products" :loading="pending" :error="Boolean(productsError)" />
    <LabSection />
    <CategorySection />
    <QualityProcess />
    <WhyChooseUs />
    <ComplianceDisclaimer />
  </div>
</template>

<script setup lang="ts">
import { useProducts } from '~/composables/useProducts'
import { useCartStore } from '~/stores/cart'

const { fetchProducts } = useProducts()
const cartStore = useCartStore()

const { data: products, pending, error: productsError } = await useAsyncData(
  'storefront-products-v4',
  fetchProducts
)

if (import.meta.dev && productsError.value) {
  console.error('[index] products load error:', productsError.value)
}

// Load cart from localStorage on mount
onMounted(() => {
  cartStore.loadFromStorage()
})
</script>
