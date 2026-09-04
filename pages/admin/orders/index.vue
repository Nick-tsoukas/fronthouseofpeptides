<template>
  <div class="px-4 pt-5 pb-6 sm:px-6 lg:p-8">
    <div class="flex flex-col gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-white">Orders</h1>
        <p class="text-dark-400 mt-1 text-sm">Find what needs action, then fulfill from your phone.</p>
      </div>
      <input
        v-model="search"
        type="search"
        placeholder="Search name, email, order #"
        class="w-full min-h-[44px] px-4 bg-dark-800 border border-dark-600 rounded-xl text-white text-base sm:text-sm focus:outline-none focus:border-cyan-500"
      />
      <div class="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        <button
          v-for="f in filters"
          :key="f.value"
          type="button"
          class="shrink-0 min-h-[40px] px-3.5 rounded-full text-sm font-medium border transition-colors"
          :class="statusFilter === f.value
            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
            : 'bg-dark-900 text-dark-400 border-dark-700'"
          @click="statusFilter = f.value"
        >
          {{ f.label }}
        </button>
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
        {{ statusFilter !== 'all' ? 'No orders match this filter.' : 'Orders will appear here when customers checkout.' }}
      </p>
    </div>

    <div v-else class="space-y-3 md:space-y-0 md:bg-dark-900 md:rounded-xl md:border md:border-dark-700 md:overflow-hidden">
      <!-- Mobile: stacked cards -->
      <div class="md:hidden space-y-3">
        <article
          v-for="order in orders"
          :key="order.id"
          class="bg-dark-900 rounded-xl border border-dark-700 p-4"
        >
          <div class="flex items-start justify-between gap-3 mb-2">
            <div class="min-w-0">
              <p class="text-white font-medium font-mono text-sm truncate">{{ order.orderNumber || `#${order.id}` }}</p>
              <p class="text-dark-200 text-sm truncate">{{ order.customerName }}</p>
            </div>
            <p class="text-white font-semibold shrink-0">{{ formatCents(order.totalCents) }}</p>
          </div>
          <div class="flex flex-wrap gap-1.5 mb-3">
            <span :class="paymentBadgeClass(order.paymentStatus, order)">{{ paymentLabel(order.paymentStatus, order) }}</span>
            <span :class="badgeClass(fulfillmentBadge(order).kind)">{{ fulfillmentBadge(order).label }}</span>
          </div>
          <p class="text-cyan-300/90 text-xs mb-2">{{ nextActionHint(order) }}</p>
          <p class="text-dark-500 text-xs mb-3">{{ formatDate(order.createdAt) }}</p>
          <NuxtLink
            :to="`/admin/orders/${order.id}`"
            class="inline-flex w-full min-h-[44px] items-center justify-center px-4 rounded-xl bg-cyan-500 text-white text-sm font-semibold"
          >
            View Order
          </NuxtLink>
        </article>
      </div>

      <!-- Desktop: table -->
      <div class="hidden md:block overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-dark-700">
              <th class="text-left px-4 py-3 text-dark-400 font-medium">Order</th>
              <th class="text-left px-4 py-3 text-dark-400 font-medium">Customer</th>
              <th class="text-left px-4 py-3 text-dark-400 font-medium">Payment</th>
              <th class="text-left px-4 py-3 text-dark-400 font-medium">Fulfillment</th>
              <th class="text-right px-4 py-3 text-dark-400 font-medium">Total</th>
              <th class="text-left px-4 py-3 text-dark-400 font-medium">Created</th>
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
                <span :class="paymentBadgeClass(order.paymentStatus, order)">{{ paymentLabel(order.paymentStatus, order) }}</span>
              </td>
              <td class="px-4 py-3">
                <span :class="badgeClass(fulfillmentBadge(order).kind)">{{ fulfillmentBadge(order).label }}</span>
              </td>
              <td class="px-4 py-3 text-right text-white font-medium">{{ formatCents(order.totalCents) }}</td>
              <td class="px-4 py-3 text-dark-300 text-xs">{{ formatDate(order.createdAt) }}</td>
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

    <div class="mt-10 max-w-xl rounded-xl border border-red-500/25 bg-red-500/5 p-4 sm:p-5">
      <h2 class="text-white font-semibold mb-1">Clear all orders</h2>
      <p class="text-dark-400 text-sm mb-4">
        Permanently deletes every order and line item. Products and current stock are not changed. This cannot be undone.
      </p>
      <button
        type="button"
        class="min-h-[48px] px-4 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 font-semibold text-sm"
        @click="clearOpen = true"
      >
        Clear all orders
      </button>
    </div>

    <div
      v-if="clearOpen"
      class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/65 p-0 sm:p-4"
      @click.self="clearOpen = false"
    >
      <div class="w-full sm:max-w-md bg-dark-900 border border-dark-700 rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <h3 class="text-lg font-semibold text-white mb-2">Delete every order?</h3>
        <p class="text-dark-300 text-sm mb-4">
          Type <span class="text-white font-mono">DELETE ALL ORDERS</span> to confirm. Inventory will not be restored.
        </p>
        <input
          v-model="clearConfirm"
          type="text"
          autocomplete="off"
          class="w-full min-h-[48px] px-4 rounded-xl bg-dark-800 border border-dark-600 text-white mb-3 focus:outline-none focus:border-red-400"
          placeholder="DELETE ALL ORDERS"
        />
        <p v-if="clearError" class="text-red-400 text-sm mb-3">{{ clearError }}</p>
        <p v-if="clearSuccess" class="text-emerald-400 text-sm mb-3">{{ clearSuccess }}</p>
        <div class="flex flex-col-reverse sm:flex-row gap-3">
          <button
            type="button"
            class="flex-1 min-h-[48px] rounded-xl bg-dark-800 border border-dark-600 text-white"
            :disabled="clearLoading"
            @click="clearOpen = false"
          >
            Cancel
          </button>
          <button
            type="button"
            class="flex-1 min-h-[48px] rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-40 text-white font-semibold"
            :disabled="clearLoading || clearConfirm.trim() !== 'DELETE ALL ORDERS'"
            @click="clearAllOrders"
          >
            {{ clearLoading ? 'Deleting…' : 'Delete all' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { badgeClass, fulfillmentBadge, nextActionHint, paymentBadgeClass, paymentLabel } from '~/utils/adminFulfillment'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const statusFilter = ref('all')
const search = ref('')
const pending = ref(true)
const error = ref('')
const orders = ref<any[]>([])
const clearOpen = ref(false)
const clearConfirm = ref('')
const clearLoading = ref(false)
const clearError = ref('')
const clearSuccess = ref('')

const filters = [
  { value: 'all', label: 'All' },
  { value: 'needs_verification', label: 'Needs Payment Verification' },
  { value: 'awaiting_cashapp', label: 'Awaiting Cash App' },
  { value: 'ready_to_ship', label: 'Ready to Ship' },
  { value: 'label_purchased', label: 'Label Purchased' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'attention', label: 'Failed / Attention' },
]

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

async function clearAllOrders() {
  clearError.value = ''
  clearSuccess.value = ''
  if (clearConfirm.value.trim() !== 'DELETE ALL ORDERS') {
    clearError.value = 'Type DELETE ALL ORDERS to confirm.'
    return
  }
  clearLoading.value = true
  try {
    const res = await $fetch<{ ok: boolean; message: string }>(
      '/api/admin/orders/clear-all',
      {
        method: 'POST',
        credentials: 'include',
        body: { confirm: 'DELETE ALL ORDERS' },
      }
    )
    clearSuccess.value = res.message || 'Orders cleared.'
    clearConfirm.value = ''
    await fetchOrders()
  } catch (err: any) {
    clearError.value = err.data?.message || err.message || 'Could not clear orders.'
  } finally {
    clearLoading.value = false
  }
}

onMounted(fetchOrders)
</script>
