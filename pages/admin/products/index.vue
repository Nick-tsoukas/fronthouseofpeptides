<template>
  <div class="p-6 lg:p-8">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
      <div>
        <h1 class="text-2xl font-bold text-white">Products</h1>
        <p class="text-dark-400 mt-1">Manage your product catalog</p>
      </div>
      <NuxtLink 
        to="/admin/products/new"
        class="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-medium rounded-lg transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Add Product
      </NuxtLink>
    </div>

    <!-- Loading State -->
    <div v-if="pending" class="space-y-4">
      <div v-for="i in 5" :key="i" class="bg-dark-900 rounded-xl border border-dark-700 p-6 animate-pulse">
        <div class="h-6 bg-dark-800 rounded w-1/3 mb-2"></div>
        <div class="h-4 bg-dark-800 rounded w-2/3"></div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="products.length === 0" class="bg-dark-900 rounded-xl border border-dark-700 p-12 text-center">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-dark-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
      <h2 class="text-xl font-semibold text-white mb-2">No products yet</h2>
      <p class="text-dark-400 mb-6">Get started by adding your first product.</p>
      <NuxtLink 
        to="/admin/products/new"
        class="inline-flex items-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-medium rounded-lg transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Add Product
      </NuxtLink>
    </div>

    <!-- Products Table -->
    <div v-else class="bg-dark-900 rounded-xl border border-dark-700 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-dark-700">
              <th class="text-left px-6 py-4 text-dark-400 font-medium text-sm">Product</th>
              <th class="text-left px-6 py-4 text-dark-400 font-medium text-sm">Variants</th>
              <th class="text-left px-6 py-4 text-dark-400 font-medium text-sm">Price Range</th>
              <th class="text-left px-6 py-4 text-dark-400 font-medium text-sm">Status</th>
              <th class="text-right px-6 py-4 text-dark-400 font-medium text-sm">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="product in products" 
              :key="product.id"
              class="border-b border-dark-700 last:border-0 hover:bg-dark-800/50 transition-colors"
            >
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div 
                    class="w-12 h-12 rounded-lg flex-shrink-0"
                    :style="{ background: getGradient(product.id) }"
                  ></div>
                  <div>
                    <p class="text-white font-medium">{{ product.attributes.name }}</p>
                    <p class="text-dark-400 text-sm">{{ product.attributes.slug }}</p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4">
                <span class="text-white">{{ product.attributes.variants?.data.length || 0 }}</span>
              </td>
              <td class="px-6 py-4">
                <span class="text-white">{{ getPriceRange(product) }}</span>
              </td>
              <td class="px-6 py-4">
                <span 
                  :class="[
                    'px-2 py-1 text-xs font-medium rounded',
                    product.attributes.active 
                      ? 'bg-green-500/10 text-green-400' 
                      : 'bg-dark-600 text-dark-400'
                  ]"
                >
                  {{ product.attributes.active ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-2">
                  <NuxtLink 
                    :to="`/admin/products/${product.id}`"
                    class="p-2 text-dark-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </NuxtLink>
                  <button 
                    @click="confirmDelete(product)"
                    class="p-2 text-dark-400 hover:text-red-400 hover:bg-dark-700 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div 
      v-if="deleteModal.show" 
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      @click.self="deleteModal.show = false"
    >
      <div class="bg-dark-900 rounded-xl border border-dark-700 p-6 max-w-md w-full">
        <h3 class="text-lg font-semibold text-white mb-2">Delete Product</h3>
        <p class="text-dark-400 mb-6">
          Are you sure you want to delete <strong class="text-white">{{ deleteModal.product?.attributes.name }}</strong>? 
          This action cannot be undone.
        </p>
        <div class="flex gap-3">
          <button 
            @click="deleteModal.show = false"
            class="flex-1 px-4 py-2 bg-dark-700 hover:bg-dark-600 text-white font-medium rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button 
            @click="deleteProduct"
            :disabled="deleteModal.loading"
            class="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-dark-700 text-white font-medium rounded-lg transition-colors"
          >
            {{ deleteModal.loading ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Product, StrapiResponse } from '~/types'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const config = useRuntimeConfig()

const products = ref<Product[]>([])
const pending = ref(true)

const deleteModal = ref({
  show: false,
  product: null as Product | null,
  loading: false,
})

const getGradient = (productId: number) => {
  const hue1 = (productId * 47) % 360
  const hue2 = (hue1 + 40) % 360
  return `linear-gradient(135deg, hsl(${hue1}, 70%, 30%) 0%, hsl(${hue2}, 60%, 20%) 100%)`
}

const getPriceRange = (product: Product) => {
  const variants = product.attributes.variants?.data || []
  if (variants.length === 0) return 'N/A'
  
  const prices = variants.map(v => v.attributes.price)
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  
  if (min === max) return `$${min.toFixed(2)}`
  return `$${min.toFixed(2)} - $${max.toFixed(2)}`
}

const fetchProducts = async () => {
  pending.value = true
  try {
    const response = await $fetch<StrapiResponse<Product[]>>(
      `${config.public.strapiUrl}/api/products?populate=variants&sort=name:asc`
    )
    products.value = response.data || []
  } catch (error) {
    console.error('Error fetching products:', error)
  } finally {
    pending.value = false
  }
}

const confirmDelete = (product: Product) => {
  deleteModal.value.product = product
  deleteModal.value.show = true
}

const deleteProduct = async () => {
  if (!deleteModal.value.product) return
  
  deleteModal.value.loading = true
  try {
    await $fetch(`/api/admin/products/${deleteModal.value.product.id}`, {
      method: 'DELETE',
    })
    
    // Remove from local list
    products.value = products.value.filter(p => p.id !== deleteModal.value.product?.id)
    deleteModal.value.show = false
  } catch (error) {
    console.error('Error deleting product:', error)
    alert('Failed to delete product. Check console for details.')
  } finally {
    deleteModal.value.loading = false
  }
}

onMounted(fetchProducts)
</script>
