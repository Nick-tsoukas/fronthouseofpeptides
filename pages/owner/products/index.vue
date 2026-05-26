<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-white">Products</h1>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap gap-2 mb-6">
      <button
        v-for="f in filters"
        :key="f.value"
        :class="[
          'px-4 py-2 rounded-lg text-sm font-medium border transition-colors',
          activeFilter === f.value
            ? 'bg-primary-500/20 text-primary-300 border-primary-500/40'
            : 'bg-dark-900 text-dark-400 border-dark-700 hover:text-white hover:border-dark-500'
        ]"
        @click="activeFilter = f.value"
      >
        {{ f.label }}
      </button>
    </div>

    <!-- Loading -->
    <div v-if="pending" class="space-y-3">
      <div v-for="i in 6" :key="i" class="bg-dark-900 border border-dark-700 rounded-xl p-5 animate-pulse">
        <div class="flex gap-4">
          <div class="w-16 h-16 bg-dark-700 rounded-lg flex-shrink-0"></div>
          <div class="flex-1">
            <div class="h-4 bg-dark-700 rounded w-1/3 mb-2"></div>
            <div class="h-3 bg-dark-700 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="bg-red-500/10 border border-red-500/30 rounded-xl p-12 text-center">
      <p class="text-red-400 mb-3">Could not load products.</p>
      <NuxtLink to="/owner/login" class="text-primary-400 text-sm underline">Sign in again</NuxtLink>
    </div>

    <!-- Empty -->
    <div v-else-if="filteredProducts.length === 0" class="bg-dark-900 border border-dark-700 rounded-xl p-12 text-center">
      <p class="text-dark-400">No products found.</p>
    </div>

    <!-- Product cards -->
    <div v-else class="space-y-3">
      <NuxtLink
        v-for="product in filteredProducts"
        :key="product.id"
        :to="`/owner/products/${product.id}`"
        class="flex items-center gap-4 bg-dark-900 border border-dark-700 rounded-xl p-4 hover:border-dark-500 transition-colors"
      >
        <!-- Image -->
        <div class="w-16 h-16 rounded-lg bg-dark-800 flex-shrink-0 overflow-hidden border border-dark-700">
          <img
            v-if="product.imageUrl"
            :src="imageUrl(product.imageUrl)"
            :alt="product.name"
            class="w-full h-full object-cover"
          />
          <div v-else class="w-full h-full flex items-center justify-center text-dark-600 text-xs">No img</div>
        </div>

        <!-- Info -->
        <div class="flex-1 min-w-0">
          <div class="flex flex-wrap items-center gap-2 mb-1">
            <span class="text-white font-semibold text-sm">{{ product.name }}</span>
            <span
              :class="product.active
                ? 'bg-green-500/15 text-green-300 border border-green-500/20'
                : 'bg-dark-700 text-dark-400 border border-dark-600'"
              class="text-xs px-2 py-0.5 rounded-full"
            >
              {{ product.active ? 'Active' : 'Inactive' }}
            </span>
            <span
              v-if="product.isLowStock"
              class="text-xs bg-yellow-500/15 text-yellow-300 border border-yellow-500/20 px-2 py-0.5 rounded-full"
            >
              Low Stock
            </span>
          </div>
          <p class="text-dark-400 text-xs">{{ product.variantCount }} variant{{ product.variantCount !== 1 ? 's' : '' }}</p>
          <p class="text-dark-500 text-xs mt-0.5">
            <span v-if="product.hasUntracked">Stock not tracked</span>
            <span v-else>{{ product.totalStock }} units total</span>
          </p>
        </div>

        <!-- Arrow -->
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-dark-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'owner', middleware: 'owner' })

const config = useRuntimeConfig()

const { data, pending, error } = await useFetch<{ products: any[] }>(
  '/api/owner/products',
  { headers: useRequestHeaders(['cookie']) }
)

const allProducts = computed(() => data.value?.products || [])

const activeFilter = ref('all')

const filters = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'low_stock', label: 'Low Stock' },
]

const filteredProducts = computed(() => {
  switch (activeFilter.value) {
    case 'active': return allProducts.value.filter(p => p.active)
    case 'inactive': return allProducts.value.filter(p => !p.active)
    case 'low_stock': return allProducts.value.filter(p => p.isLowStock)
    default: return allProducts.value
  }
})

function imageUrl(url: string) {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return `${config.public.strapiUrl}${url}`
}
</script>
