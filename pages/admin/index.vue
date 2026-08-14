<template>
  <div class="p-6 lg:p-8">
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-white">Dashboard</h1>
      <p class="text-dark-400 mt-1">Welcome to the Quantum Bio Peptides admin panel</p>
    </div>

    <div v-if="pending" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div v-for="i in 8" :key="i" class="bg-dark-900 rounded-xl border border-dark-700 p-6 animate-pulse h-28" />
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div v-for="card in cards" :key="card.label" class="bg-dark-900 rounded-xl border border-dark-700 p-6">
        <p class="text-dark-400 text-sm">{{ card.label }}</p>
        <p class="text-2xl font-bold text-white mt-1">{{ card.value }}</p>
      </div>
    </div>

    <div class="mb-6 rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <p class="text-dark-300 text-sm">
        Enable owner push alerts in Settings so your phone pings on paid orders and low stock.
      </p>
      <NuxtLink
        to="/admin/settings"
        class="inline-flex min-h-[44px] items-center justify-center px-4 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-semibold shrink-0"
      >
        Notification settings
      </NuxtLink>
    </div>
      <div class="bg-dark-900 rounded-xl border border-dark-700 p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-white">Quick links</h2>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <NuxtLink to="/admin/orders" class="p-4 bg-dark-800 hover:bg-dark-700 rounded-lg border border-dark-600 text-center text-white text-sm font-medium">
            View Orders
          </NuxtLink>
          <NuxtLink to="/admin/products" class="p-4 bg-dark-800 hover:bg-dark-700 rounded-lg border border-dark-600 text-center text-white text-sm font-medium">
            Products & Stock
          </NuxtLink>
          <NuxtLink to="/admin/products/new" class="p-4 bg-dark-800 hover:bg-dark-700 rounded-lg border border-dark-600 text-center text-white text-sm font-medium">
            Add Product
          </NuxtLink>
          <NuxtLink to="/admin/settings" class="p-4 bg-dark-800 hover:bg-dark-700 rounded-lg border border-dark-600 text-center text-white text-sm font-medium">
            Settings
          </NuxtLink>
        </div>
      </div>

      <div class="bg-dark-900 rounded-xl border border-dark-700 p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-white">Recent paid / active orders</h2>
          <NuxtLink to="/admin/orders" class="text-cyan-400 hover:text-cyan-300 text-sm">View All →</NuxtLink>
        </div>
        <div v-if="!stats?.recentOrders?.length" class="text-dark-400 text-sm py-8 text-center">No orders yet</div>
        <div v-else class="space-y-3">
          <NuxtLink
            v-for="order in stats.recentOrders"
            :key="order.id"
            :to="`/admin/orders/${order.id}`"
            class="flex items-center justify-between py-3 border-b border-dark-700 last:border-0"
          >
            <div>
              <p class="text-white font-medium">#{{ order.id }}</p>
              <p class="text-dark-400 text-sm capitalize">{{ order.paymentStatus || order.status }}</p>
            </div>
            <span class="text-white text-sm">{{ formatCents(order.totalCents) }}</span>
          </NuxtLink>
        </div>
      </div>
    </div>

    <p v-if="error" class="mt-4 text-red-400 text-sm">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const pending = ref(true)
const error = ref('')
const stats = ref<any>(null)

const formatCents = (cents: number) => `$${((Number(cents) || 0) / 100).toFixed(2)}`

const cards = computed(() => {
  const s = stats.value || {}
  return [
    { label: 'Total orders', value: s.totalOrders ?? '—' },
    { label: 'Pending / processing', value: s.pendingProcessingOrders ?? '—' },
    { label: 'Paid orders', value: s.paidOrders ?? '—' },
    { label: 'Revenue (paid)', value: s.revenueCents != null ? formatCents(s.revenueCents) : '—' },
    { label: 'Low stock variants', value: s.lowStockVariants ?? '—' },
    { label: 'Out of stock variants', value: s.outOfStockVariants ?? '—' },
    { label: 'Manual sales today', value: s.manualSalesToday ?? '—' },
    { label: 'Online orders today', value: s.onlineOrdersToday ?? '—' },
  ]
})

onMounted(async () => {
  try {
    stats.value = await $fetch('/api/admin/dashboard', { credentials: 'include' })
  } catch (err: any) {
    error.value = err.data?.message || err.message || 'Could not load dashboard.'
  } finally {
    pending.value = false
  }
})
</script>
