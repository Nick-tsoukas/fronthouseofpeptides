<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-white">Orders</h1>
    </div>

    <!-- Filters -->
    <div class="flex flex-col sm:flex-row gap-3 mb-6">
      <input
        v-model="search"
        type="search"
        placeholder="Search by name, email, or ID…"
        class="flex-1 bg-dark-900 border border-dark-700 rounded-lg px-4 py-3 text-white placeholder-dark-500 focus:outline-none focus:border-primary-500 transition-colors text-sm"
      />
      <select
        v-model="selectedStatus"
        class="bg-dark-900 border border-dark-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary-500 transition-colors text-sm"
      >
        <option value="all">All Statuses</option>
        <option value="approved">Approved</option>
        <option value="pending_review">Pending Review</option>
        <option value="awaiting_payment">Awaiting Payment</option>
        <option value="fulfilled">Fulfilled</option>
        <option value="cancelled">Cancelled</option>
        <option value="rejected">Rejected</option>
      </select>
    </div>

    <!-- Loading -->
    <div v-if="pending" class="space-y-3">
      <div v-for="i in 8" :key="i" class="bg-dark-900 border border-dark-700 rounded-xl p-4 animate-pulse">
        <div class="h-4 bg-dark-700 rounded w-1/3 mb-2"></div>
        <div class="h-3 bg-dark-700 rounded w-1/2"></div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="bg-red-500/10 border border-red-500/30 rounded-xl p-12 text-center">
      <p class="text-red-400 mb-3">Session expired or could not load orders.</p>
      <NuxtLink to="/owner/login" class="text-primary-400 text-sm underline">Sign in again</NuxtLink>
    </div>

    <!-- Empty -->
    <div v-else-if="filteredOrders.length === 0" class="bg-dark-900 border border-dark-700 rounded-xl p-12 text-center">
      <p class="text-dark-400">No orders found.</p>
    </div>

    <!-- Order cards -->
    <div v-else class="space-y-3">
      <NuxtLink
        v-for="order in filteredOrders"
        :key="order.id"
        :to="`/owner/orders/${order.id}`"
        class="block bg-dark-900 border border-dark-700 rounded-xl p-4 hover:border-dark-500 transition-colors"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2 mb-1">
              <span class="text-white font-semibold">#{{ order.id }}</span>
              <StatusBadge :status="order.status" />
              <span v-if="order.inventoryAdjusted" class="text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">inv. adjusted</span>
            </div>
            <p class="text-dark-200 text-sm font-medium">{{ order.customerName }}</p>
            <p class="text-dark-400 text-xs">{{ order.email }}</p>
            <p v-if="order.phone" class="text-dark-500 text-xs">{{ order.phone }}</p>
          </div>
          <div class="text-right flex-shrink-0">
            <p class="text-white font-semibold">${{ order.amountTotal.toFixed(2) }}</p>
            <p class="text-dark-500 text-xs mt-1">{{ order.itemCount }} item{{ order.itemCount !== 1 ? 's' : '' }}</p>
            <p class="text-dark-600 text-xs mt-1">{{ formatDate(order.createdAt) }}</p>
          </div>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'owner', middleware: 'owner' })

const route = useRoute()
const selectedStatus = ref((route.query.status as string) || 'all')
const search = ref('')

const { data, pending, error, refresh } = await useFetch<{ orders: any[] }>(
  () => `/api/owner/orders?status=${selectedStatus.value}`,
  { headers: useRequestHeaders(['cookie']), watch: [selectedStatus] }
)

const allOrders = computed(() => data.value?.orders || [])

const filteredOrders = computed(() => {
  const q = search.value.toLowerCase().trim()
  if (!q) return allOrders.value
  return allOrders.value.filter(
    (o) =>
      o.customerName?.toLowerCase().includes(q) ||
      o.email?.toLowerCase().includes(q) ||
      String(o.id).includes(q)
  )
})

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
</script>
