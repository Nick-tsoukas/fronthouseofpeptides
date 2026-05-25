<template>
  <div class="p-6 lg:p-8">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
      <div>
        <h1 class="text-2xl font-bold text-white">Orders</h1>
        <p class="text-dark-400 mt-1">Manage customer orders</p>
      </div>
      
      <!-- Filter -->
      <div class="flex items-center gap-3">
        <select
          v-model="statusFilter"
          class="px-4 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-cyan-500 transition-colors"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="pending" class="space-y-4">
      <div v-for="i in 5" :key="i" class="bg-dark-900 rounded-xl border border-dark-700 p-6 animate-pulse">
        <div class="h-6 bg-dark-800 rounded w-1/3 mb-2"></div>
        <div class="h-4 bg-dark-800 rounded w-2/3"></div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredOrders.length === 0" class="bg-dark-900 rounded-xl border border-dark-700 p-12 text-center">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-dark-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
      <h2 class="text-xl font-semibold text-white mb-2">No orders found</h2>
      <p class="text-dark-400">
        {{ statusFilter ? `No orders with status "${statusFilter}"` : 'Orders will appear here when customers place them.' }}
      </p>
    </div>

    <!-- Orders Table -->
    <div v-else class="bg-dark-900 rounded-xl border border-dark-700 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-dark-700">
              <th class="text-left px-6 py-4 text-dark-400 font-medium text-sm">Order</th>
              <th class="text-left px-6 py-4 text-dark-400 font-medium text-sm">Customer</th>
              <th class="text-left px-6 py-4 text-dark-400 font-medium text-sm">Total</th>
              <th class="text-left px-6 py-4 text-dark-400 font-medium text-sm">Status</th>
              <th class="text-left px-6 py-4 text-dark-400 font-medium text-sm">Date</th>
              <th class="text-right px-6 py-4 text-dark-400 font-medium text-sm">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="order in filteredOrders" 
              :key="order.id"
              class="border-b border-dark-700 last:border-0 hover:bg-dark-800/50 transition-colors"
            >
              <td class="px-6 py-4">
                <span class="text-white font-medium">#{{ order.id }}</span>
              </td>
              <td class="px-6 py-4">
                <div>
                  <p class="text-white">{{ order.attributes.shippingName || 'N/A' }}</p>
                  <p class="text-dark-400 text-sm">{{ order.attributes.email }}</p>
                </div>
              </td>
              <td class="px-6 py-4">
                <span class="text-white font-medium">${{ order.attributes.amountTotal.toFixed(2) }}</span>
              </td>
              <td class="px-6 py-4">
                <span 
                  :class="[
                    'px-2 py-1 text-xs font-medium rounded capitalize',
                    getStatusClass(order.attributes.status)
                  ]"
                >
                  {{ order.attributes.status }}
                </span>
              </td>
              <td class="px-6 py-4">
                <span class="text-dark-300 text-sm">{{ formatDate(order.attributes.createdAt) }}</span>
              </td>
              <td class="px-6 py-4 text-right">
                <NuxtLink 
                  :to="`/admin/orders/${order.id}`"
                  class="inline-flex items-center gap-1 px-3 py-1.5 bg-dark-700 hover:bg-dark-600 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  View
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </NuxtLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Pagination Info -->
    <div v-if="orders.length > 0" class="mt-4 text-dark-400 text-sm text-center">
      Showing {{ filteredOrders.length }} of {{ orders.length }} orders
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Order, StrapiResponse } from '~/types'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const config = useRuntimeConfig()

const orders = ref<Order[]>([])
const pending = ref(true)
const statusFilter = ref('')

const filteredOrders = computed(() => {
  if (!statusFilter.value) return orders.value
  return orders.value.filter(o => o.attributes.status === statusFilter.value)
})

const getStatusClass = (status: string) => {
  switch (status) {
    case 'paid':
      return 'bg-green-500/10 text-green-400'
    case 'pending':
      return 'bg-yellow-500/10 text-yellow-400'
    case 'processing':
      return 'bg-blue-500/10 text-blue-400'
    case 'shipped':
      return 'bg-cyan-500/10 text-cyan-400'
    case 'failed':
      return 'bg-red-500/10 text-red-400'
    case 'refunded':
      return 'bg-dark-600 text-dark-300'
    default:
      return 'bg-dark-600 text-dark-300'
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const fetchOrders = async () => {
  pending.value = true
  try {
    const response = await $fetch<StrapiResponse<Order[]>>(
      `${config.public.strapiUrl}/api/orders?populate=orderItems&sort=createdAt:desc`
    )
    orders.value = response.data || []
  } catch (error) {
    console.error('Error fetching orders:', error)
  } finally {
    pending.value = false
  }
}

onMounted(fetchOrders)
</script>
