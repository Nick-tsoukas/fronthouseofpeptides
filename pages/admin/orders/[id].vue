<template>
  <div class="p-6 lg:p-8">
    <div class="mb-8">
      <NuxtLink to="/admin/orders" class="inline-flex items-center text-dark-400 hover:text-white mb-4 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Orders
      </NuxtLink>
      <div class="flex flex-wrap items-center gap-3">
        <h1 class="text-2xl font-bold text-white font-mono">
          {{ order?.orderNumber || `Order #${orderId}` }}
        </h1>
        <span
          v-if="order?.paymentStatus"
          class="px-3 py-1 text-sm font-medium rounded capitalize bg-dark-800 text-dark-200 border border-dark-600"
        >
          {{ order.paymentStatus }}
        </span>
      </div>
    </div>

    <div v-if="pending" class="space-y-6 max-w-4xl">
      <div class="bg-dark-900 rounded-xl border border-dark-700 p-6 animate-pulse">
        <div class="h-6 bg-dark-800 rounded w-1/3 mb-4"></div>
        <div class="h-4 bg-dark-800 rounded w-2/3"></div>
      </div>
    </div>

    <div v-else-if="error || !order" class="bg-dark-900 rounded-xl border border-dark-700 p-12 text-center max-w-4xl">
      <h2 class="text-xl font-semibold text-white mb-2">{{ error || 'Order Not Found' }}</h2>
      <NuxtLink to="/admin/orders" class="text-cyan-400 text-sm">Back to Orders</NuxtLink>
    </div>

    <div v-else class="space-y-6 max-w-4xl">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-dark-900 rounded-xl border border-dark-700 p-6">
          <h2 class="text-lg font-semibold text-white mb-4">Customer</h2>
          <div class="space-y-3 text-sm">
            <div>
              <p class="text-dark-400">Name</p>
              <p class="text-white">{{ order.customerName || '—' }}</p>
            </div>
            <div>
              <p class="text-dark-400">Email</p>
              <p class="text-white break-all">{{ order.email || '—' }}</p>
            </div>
            <div>
              <p class="text-dark-400">Phone</p>
              <p class="text-white">{{ order.phone || '—' }}</p>
            </div>
          </div>
        </div>

        <div class="bg-dark-900 rounded-xl border border-dark-700 p-6">
          <h2 class="text-lg font-semibold text-white mb-4">Shipping Address</h2>
          <div class="text-white text-sm space-y-1">
            <p>{{ order.shippingName || order.customerName }}</p>
            <p>{{ order.shippingAddressLine1 || '—' }}</p>
            <p v-if="order.shippingAddressLine2">{{ order.shippingAddressLine2 }}</p>
            <p>
              {{ order.shippingCity }}{{ order.shippingCity && order.shippingState ? ', ' : '' }}{{ order.shippingState }}
              {{ order.shippingPostalCode }}
            </p>
            <p>{{ order.shippingCountry || 'US' }}</p>
          </div>
        </div>
      </div>

      <div class="bg-dark-900 rounded-xl border border-dark-700 p-6">
        <h2 class="text-lg font-semibold text-white mb-4">Items</h2>
        <div class="divide-y divide-dark-700">
          <div
            v-for="item in order.items"
            :key="item.id"
            class="flex items-center justify-between py-4 first:pt-0 last:pb-0 gap-4"
          >
            <div>
              <p class="text-white font-medium">{{ item.productName }}</p>
              <p class="text-dark-400 text-sm">
                {{ item.variantName }}
                <span v-if="item.sku"> · SKU {{ item.sku }}</span>
              </p>
            </div>
            <div class="text-right text-sm">
              <p class="text-white">${{ Number(item.unitPrice).toFixed(2) }} × {{ item.quantity }}</p>
              <p class="text-dark-400">${{ (Number(item.unitPrice) * item.quantity).toFixed(2) }}</p>
            </div>
          </div>
        </div>

        <div class="border-t border-dark-700 mt-4 pt-4 space-y-2 text-sm">
          <div class="flex justify-between text-dark-300">
            <span>Subtotal</span>
            <span>{{ formatCents(order.subtotalCents) }}</span>
          </div>
          <div class="flex justify-between text-dark-300">
            <span>Shipping</span>
            <span>{{ formatCents(order.shippingCostCents) }}</span>
          </div>
          <div class="flex justify-between text-dark-300">
            <span>Tax</span>
            <span>{{ formatCents(order.taxCents) }}</span>
          </div>
          <div class="flex justify-between text-white font-semibold text-lg pt-2">
            <span>Total</span>
            <span>{{ formatCents(order.totalCents) }}</span>
          </div>
        </div>
      </div>

      <div class="bg-dark-900 rounded-xl border border-dark-700 p-6">
        <h2 class="text-lg font-semibold text-white mb-4">Payment & Shipping</h2>
        <dl class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div class="flex gap-3"><dt class="text-dark-500 w-36">Payment status</dt><dd class="text-white">{{ order.paymentStatus || '—' }}</dd></div>
          <div class="flex gap-3"><dt class="text-dark-500 w-36">Order status</dt><dd class="text-white">{{ order.status || '—' }}</dd></div>
          <div class="flex gap-3"><dt class="text-dark-500 w-36">Provider</dt><dd class="text-white">{{ order.paymentProvider || '—' }}</dd></div>
          <div class="flex gap-3"><dt class="text-dark-500 w-36">Method</dt><dd class="text-white">{{ order.paymentMethod || '—' }}</dd></div>
          <div class="flex gap-3"><dt class="text-dark-500 w-36">Moov transfer</dt><dd class="text-white font-mono text-xs break-all">{{ order.moovTransferId || '—' }}</dd></div>
          <div class="flex gap-3"><dt class="text-dark-500 w-36">Paid at</dt><dd class="text-white">{{ order.paidAt ? formatDate(order.paidAt) : '—' }}</dd></div>
          <div class="flex gap-3"><dt class="text-dark-500 w-36">Shipping status</dt><dd class="text-white">{{ order.shippingStatus || '—' }}</dd></div>
          <div class="flex gap-3"><dt class="text-dark-500 w-36">Shippo rate</dt><dd class="text-white">
            <template v-if="order.shippingCarrier || order.shippingService">
              {{ order.shippingCarrier }}{{ order.shippingCarrier && order.shippingService ? ' — ' : '' }}{{ order.shippingService }}
            </template>
            <template v-else>—</template>
          </dd></div>
          <div class="flex gap-3"><dt class="text-dark-500 w-36">Inventory committed</dt><dd class="text-white">{{ order.inventoryCommitted ? 'Yes' : 'No' }}</dd></div>
          <div class="flex gap-3"><dt class="text-dark-500 w-36">Created</dt><dd class="text-white">{{ formatDate(order.createdAt) }}</dd></div>
        </dl>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const route = useRoute()
const orderId = computed(() => route.params.id as string)
const pending = ref(true)
const error = ref('')
const order = ref<any>(null)

const formatCents = (cents: number) => `$${((Number(cents) || 0) / 100).toFixed(2)}`
const formatDate = (dateString: string | null) => {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

onMounted(async () => {
  pending.value = true
  try {
    order.value = await $fetch(`/api/admin/orders/${orderId.value}`, { credentials: 'include' })
  } catch (err: any) {
    error.value = err.data?.message || err.message || 'Order not found.'
  } finally {
    pending.value = false
  }
})
</script>
