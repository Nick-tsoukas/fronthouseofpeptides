<template>
  <div>
    <HeroSection />
    <TrustBar />
    <ProductGrid id="products" :products="products" :loading="pending" />
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

const { data: products, pending } = await useAsyncData('products', fetchProducts)

// Load cart from localStorage on mount
onMounted(() => {
  cartStore.loadFromStorage()
})
</script>
