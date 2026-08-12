<template>
  <div class="p-6 lg:p-8">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
      <div>
        <h1 class="text-2xl font-bold text-white">Orders</h1>
        <p class="text-dark-400 mt-1">Manage customer and manual orders</p>
      </div>
      <div class="flex flex-col sm:flex-row gap-3">
        <input
          v-model="search"
          type="search"
          placeholder="Search name, email, order #"
          class="px-4 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
        />
        <select
          v-model="statusFilter"
          class="px-4 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-cyan-500 transition-colors"
        >
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="paid">Paid</option>
          <option value="failed">Failed</option>
          <option value="cancelled">Cancelled</option>
          <option value="shipped">Shipped</option>
        </select>
      </div>
    </div>

    <div v-if="pending" class="space-y-4">
      <div v-for="i in 5" :key="i" class="bg-dark-900 rounded-xl border border-dark-700 p-6 animate-pulse">
        <div class="h-6 bg-dark-800 rounded w-1/3 mb-2"></div>
        <div class="h-4 bg-dark-800 rounded w-2/3"></div>
      </div>
    </div>

    <div v-else-if="error" class="bg-red-500/10 border border-red-500/30 rounded-xl p-8 text-center">
      <p class="text-red-400 mb-3">{{ error }}</p>
      <NuxtLink to="/admin/login" class="text-cyan-400 text-sm underline">Sign in again</NuxtLink>
    </div>

    <div v-else-if="orders.length === 0" class="bg-dark-900 rounded-xl border border-dark-700 p-12 text-center">
      <h2 class="text-xl font-semibold text-white mb-2">No orders found</h2>
      <p class="text-dark-400">
        {{ statusFilter !== 'all' ? `No orders for filter "${statusFilter}"` : 'Orders will appear here when customers checkout.' }}
      </p>
    </div>

    <div v-else class="space-y-3 md:space-y-0 md:bg-dark-900 md:rounded-xl md:border md:border-dark-700 md:overflow-hidden">
      <!-- Mobile: stacked cards -->
      <div class="md:hidden space-y-3">
        <NuxtLink
          v-for="order in orders"
          :key="order.id"
          :to="`/admin/orders/${order.id}`"
          class="block bg-dark-900 rounded-xl border border-dark-700 p-4 active:bg-dark-800 transition-colors"
        >
          <div class="flex items-start justify-between gap-3 mb-2">
            <div class="min-w-0">
              <p class="text-white font-medium font-mono text-sm truncate">{{ order.orderNumber || `#${order.id}` }}</p>
              <p class="text-dark-400 text-sm truncate">{{ order.customerName }}</p>
              <p class="text-dark-500 text-xs truncate">{{ order.email }}</p>
            </div>
            <span :class="badgeClass(order.paymentStatus)">{{ order.paymentStatus || '—' }}</span>
          </div>
          <div class="flex items-center justify-between gap-3 text-sm">
            <div class="text-dark-400">
              <p>{{ order.shippingStatus || '—' }}</p>
              <p class="text-xs mt-0.5">{{ formatDate(order.createdAt) }}</p>
            </div>
            <p class="text-white font-semibold shrink-0">{{ formatCents(order.totalCents) }}</p>
          </div>
          <div class="mt-3">
            <span class="inline-flex min-h-[44px] items-center justify-center px-4 rounded-xl bg-dark-700 text-white text-sm font-medium">
              View order
            </span>
          </div>
        </NuxtLink>
      </div>

      <!-- Desktop: table -->
      <div class="hidden md:block overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-dark-700">
              <th class="text-left px-4 py-3 text-dark-400 font-medium">Order</th>
              <th class="text-left px-4 py-3 text-dark-400 font-medium">Customer</th>
              <th class="text-left px-4 py-3 text-dark-400 font-medium">Payment</th>
              <th class="text-left px-4 py-3 text-dark-400 font-medium">Shipping</th>
              <th class="text-left px-4 py-3 text-dark-400 font-medium">Status</th>
              <th class="text-right px-4 py-3 text-dark-400 font-medium">Total</th>
              <th class="text-left px-4 py-3 text-dark-400 font-medium">Created</th>
              <th class="text-left px-4 py-3 text-dark-400 font-medium">Paid</th>
              <th class="text-right px-4 py-3 text-dark-400 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="order in orders"
              :key="order.id"
              class="border-b border-dark-700 last:border-0 hover:bg-dark-800/50 transition-colors"
            >
              <td class="px-4 py-3">
                <p class="text-white font-medium font-mono text-xs">{{ order.orderNumber || `#${order.id}` }}</p>
                <p class="text-dark-500 text-xs">#{{ order.id }}</p>
              </td>
              <td class="px-4 py-3">
                <p class="text-white">{{ order.customerName }}</p>
                <p class="text-dark-400 text-xs">{{ order.email }}</p>
              </td>
              <td class="px-4 py-3">
                <span :class="badgeClass(order.paymentStatus)">{{ order.paymentStatus || '—' }}</span>
              </td>
              <td class="px-4 py-3 text-dark-300">{{ order.shippingStatus || '—' }}</td>
              <td class="px-4 py-3 text-dark-300">{{ order.status || '—' }}</td>
              <td class="px-4 py-3 text-right text-white font-medium">{{ formatCents(order.totalCents) }}</td>
              <td class="px-4 py-3 text-dark-300 text-xs">{{ formatDate(order.createdAt) }}</td>
              <td class="px-4 py-3 text-dark-300 text-xs">{{ order.paidAt ? formatDate(order.paidAt) : '—' }}</td>
              <td class="px-4 py-3 text-right">
                <NuxtLink
                  :to="`/admin/orders/${order.id}`"
                  class="inline-flex min-h-[44px] items-center gap-1 px-3 py-2 bg-dark-700 hover:bg-dark-600 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  View
                </NuxtLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="orders.length > 0" class="mt-4 text-dark-400 text-sm text-center">
      Showing {{ orders.length }} order{{ orders.length === 1 ? '' : 's' }}
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const statusFilter = ref('all')
const search = ref('')
const pending = ref(true)
const error = ref('')
const orders = ref<any[]>([])

const formatCents = (cents: number) => `$${((Number(cents) || 0) / 100).toFixed(2)}`

const formatDate = (dateString: string | null) => {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const badgeClass = (status: string | null) => {
  const base = 'px-2 py-1 text-xs font-medium rounded capitalize '
  switch (status) {
    case 'paid':
      return base + 'bg-green-500/10 text-green-400'
    case 'pending':
      return base + 'bg-yellow-500/10 text-yellow-400'
    case 'processing':
      return base + 'bg-blue-500/10 text-blue-400'
    case 'failed':
      return base + 'bg-red-500/10 text-red-400'
    case 'cancelled':
      return base + 'bg-dark-600 text-dark-300'
    default:
      return base + 'bg-dark-600 text-dark-300'
  }
}

let searchTimer: ReturnType<typeof setTimeout> | null = null

async function fetchOrders() {
  pending.value = true
  error.value = ''
  try {
    const res = await $fetch<{ orders: any[] }>('/api/admin/orders', {
      query: {
        filter: statusFilter.value,
        search: search.value || undefined,
      },
      credentials: 'include',
    })
    orders.value = res.orders || []
  } catch (err: any) {
    console.error('Admin orders fetch failed:', err)
    error.value = err.data?.message || err.message || 'Could not load orders.'
    orders.value = []
  } finally {
    pending.value = false
  }
}

watch(statusFilter, () => {
  fetchOrders()
})

watch(search, () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(fetchOrders, 300)
})

onMounted(fetchOrders)
</script>
