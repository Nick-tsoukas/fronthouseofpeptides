<template>
  <div class="p-6 lg:p-8">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-white">Dashboard</h1>
      <p class="text-dark-400 mt-1">Welcome to the House of Peptides admin panel</p>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <!-- Total Products -->
      <div class="bg-dark-900 rounded-xl border border-dark-700 p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-dark-400 text-sm">Total Products</p>
            <p class="text-2xl font-bold text-white mt-1">{{ stats.products }}</p>
          </div>
          <div class="w-12 h-12 bg-cyan-500/10 rounded-lg flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
        </div>
      </div>

      <!-- Total Orders -->
      <div class="bg-dark-900 rounded-xl border border-dark-700 p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-dark-400 text-sm">Total Orders</p>
            <p class="text-2xl font-bold text-white mt-1">{{ stats.orders }}</p>
          </div>
          <div class="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
        </div>
      </div>

      <!-- Pending Orders -->
      <div class="bg-dark-900 rounded-xl border border-dark-700 p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-dark-400 text-sm">Pending Orders</p>
            <p class="text-2xl font-bold text-white mt-1">{{ stats.pendingOrders }}</p>
          </div>
          <div class="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      <!-- Low Stock Items -->
      <div class="bg-dark-900 rounded-xl border border-dark-700 p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-dark-400 text-sm">Low Stock Items</p>
            <p class="text-2xl font-bold text-white mt-1">{{ stats.lowStock }}</p>
          </div>
          <div class="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Recent Orders -->
      <div class="bg-dark-900 rounded-xl border border-dark-700 p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-white">Recent Orders</h2>
          <NuxtLink to="/admin/orders" class="text-cyan-400 hover:text-cyan-300 text-sm">
            View All →
          </NuxtLink>
        </div>
        
        <div v-if="recentOrders.length === 0" class="text-dark-400 text-sm py-8 text-center">
          No orders yet
        </div>
        
        <div v-else class="space-y-3">
          <div 
            v-for="order in recentOrders" 
            :key="order.id"
            class="flex items-center justify-between py-3 border-b border-dark-700 last:border-0"
          >
            <div>
              <p class="text-white font-medium">{{ order.attributes.email }}</p>
              <p class="text-dark-400 text-sm">${{ order.attributes.amountTotal.toFixed(2) }}</p>
            </div>
            <span 
              :class="[
                'px-2 py-1 text-xs font-medium rounded',
                getStatusClass(order.attributes.status)
              ]"
            >
              {{ order.attributes.status }}
            </span>
          </div>
        </div>
      </div>

      <!-- Quick Links -->
      <div class="bg-dark-900 rounded-xl border border-dark-700 p-6">
        <h2 class="text-lg font-semibold text-white mb-4">Quick Actions</h2>
        
        <div class="grid grid-cols-2 gap-4">
          <NuxtLink 
            to="/admin/products/new"
            class="flex flex-col items-center justify-center p-4 bg-dark-800 hover:bg-dark-700 rounded-lg border border-dark-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-cyan-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span class="text-white text-sm font-medium">Add Product</span>
          </NuxtLink>

          <NuxtLink 
            to="/admin/orders"
            class="flex flex-col items-center justify-center p-4 bg-dark-800 hover:bg-dark-700 rounded-lg border border-dark-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-green-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span class="text-white text-sm font-medium">View Orders</span>
          </NuxtLink>

          <NuxtLink 
            to="/admin/products"
            class="flex flex-col items-center justify-center p-4 bg-dark-800 hover:bg-dark-700 rounded-lg border border-dark-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-purple-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            <span class="text-white text-sm font-medium">All Products</span>
          </NuxtLink>

          <NuxtLink 
            to="/admin/settings"
            class="flex flex-col items-center justify-center p-4 bg-dark-800 hover:bg-dark-700 rounded-lg border border-dark-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-dark-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span class="text-white text-sm font-medium">Settings</span>
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Product, Order, StrapiResponse } from '~/types'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const config = useRuntimeConfig()

// Fetch stats
const stats = ref({
  products: 0,
  orders: 0,
  pendingOrders: 0,
  lowStock: 0,
})

const recentOrders = ref<Order[]>([])

const getStatusClass = (status: string) => {
  switch (status) {
    case 'paid':
      return 'bg-green-500/10 text-green-400'
    case 'pending':
      return 'bg-yellow-500/10 text-yellow-400'
    case 'failed':
      return 'bg-red-500/10 text-red-400'
    case 'refunded':
      return 'bg-dark-600 text-dark-300'
    default:
      return 'bg-dark-600 text-dark-300'
  }
}

// Fetch dashboard data
onMounted(async () => {
  try {
    // Fetch products
    const productsRes = await $fetch<StrapiResponse<Product[]>>(
      `${config.public.strapiUrl}/api/products?populate=variants`
    )
    const products = productsRes.data || []
    stats.value.products = products.length

    // Count low stock variants
    let lowStockCount = 0
    products.forEach(product => {
      product.attributes.variants?.data.forEach(variant => {
        if (variant.attributes.inventory !== null && variant.attributes.inventory < 10) {
          lowStockCount++
        }
      })
    })
    stats.value.lowStock = lowStockCount

    // Fetch orders
    const ordersRes = await $fetch<StrapiResponse<Order[]>>(
      `${config.public.strapiUrl}/api/orders?sort=createdAt:desc&pagination[limit]=5`
    )
    const orders = ordersRes.data || []
    stats.value.orders = ordersRes.meta?.pagination?.total || orders.length
    stats.value.pendingOrders = orders.filter(o => o.attributes.status === 'pending' || o.attributes.status === 'paid').length
    recentOrders.value = orders.slice(0, 5)
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
  }
})
</script>
