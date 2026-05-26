<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-white">Dashboard</h1>
      <p class="text-dark-400 text-sm mt-1">Overview of recent order activity</p>
    </div>

    <!-- Stats grid -->
    <div v-if="pending" class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
      <div v-for="i in 6" :key="i" class="bg-dark-900 border border-dark-700 rounded-xl p-5 animate-pulse">
        <div class="h-3 bg-dark-700 rounded w-1/2 mb-3"></div>
        <div class="h-8 bg-dark-700 rounded w-1/3"></div>
      </div>
    </div>

    <div v-else class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
      <NuxtLink
        v-for="card in statCards"
        :key="card.label"
        :to="`/owner/orders?status=${card.status}`"
        class="bg-dark-900 border border-dark-700 rounded-xl p-5 hover:border-dark-500 transition-colors block"
      >
        <p class="text-dark-400 text-xs font-medium uppercase tracking-wider mb-2">{{ card.label }}</p>
        <p class="text-3xl font-bold" :class="card.color">{{ card.count }}</p>
      </NuxtLink>
    </div>

    <!-- Recent orders -->
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold text-white">Recent Orders</h2>
      <NuxtLink to="/owner/orders" class="text-primary-400 text-sm hover:text-primary-300 transition-colors">
        View all →
      </NuxtLink>
    </div>

    <div v-if="pending" class="space-y-3">
      <div v-for="i in 5" :key="i" class="bg-dark-900 border border-dark-700 rounded-xl p-4 animate-pulse">
        <div class="h-4 bg-dark-700 rounded w-1/3 mb-2"></div>
        <div class="h-3 bg-dark-700 rounded w-1/2"></div>
      </div>
    </div>

    <div v-else-if="error" class="bg-red-500/10 border border-red-500/30 rounded-xl p-8 text-center">
      <p class="text-red-400 mb-3">Session expired or could not load orders.</p>
      <NuxtLink to="/owner/login" class="text-primary-400 text-sm underline">Sign in again</NuxtLink>
    </div>

    <div v-else-if="recentOrders.length === 0" class="bg-dark-900 border border-dark-700 rounded-xl p-8 text-center">
      <p class="text-dark-400">No orders yet.</p>
    </div>

    <div v-else class="space-y-3">
      <NuxtLink
        v-for="order in recentOrders"
        :key="order.id"
        :to="`/owner/orders/${order.id}`"
        class="block bg-dark-900 border border-dark-700 rounded-xl p-4 hover:border-dark-500 transition-colors"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-white font-medium">#{{ order.id }}</span>
              <StatusBadge :status="order.status" />
            </div>
            <p class="text-dark-300 text-sm truncate">{{ order.customerName }}</p>
            <p class="text-dark-500 text-xs">{{ order.email }}</p>
          </div>
          <div class="text-right flex-shrink-0">
            <p class="text-white font-semibold">${{ order.amountTotal.toFixed(2) }}</p>
            <p class="text-dark-500 text-xs">{{ formatDate(order.createdAt) }}</p>
          </div>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'owner', middleware: 'owner' })

const { data, pending, error } = await useFetch<{ orders: any[] }>(
  '/api/owner/orders?pageSize=50',
  { headers: useRequestHeaders(['cookie']) }
)

const allOrders = computed(() => data.value?.orders || [])
const recentOrders = computed(() => allOrders.value.slice(0, 10))

function countByStatus(status: string) {
  return allOrders.value.filter((o) => o.status === status).length
}

const statCards = computed(() => [
  { label: 'Approved', status: 'approved', count: countByStatus('approved'), color: 'text-green-400' },
  { label: 'Pending Review', status: 'pending_review', count: countByStatus('pending_review'), color: 'text-yellow-400' },
  { label: 'Awaiting Payment', status: 'awaiting_payment', count: countByStatus('awaiting_payment'), color: 'text-blue-400' },
  { label: 'Fulfilled', status: 'fulfilled', count: countByStatus('fulfilled'), color: 'text-primary-400' },
  { label: 'Cancelled', status: 'cancelled', count: countByStatus('cancelled'), color: 'text-dark-400' },
  { label: 'Rejected', status: 'rejected', count: countByStatus('rejected'), color: 'text-red-400' },
])

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
</script>
