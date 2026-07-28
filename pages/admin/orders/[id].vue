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
        <span
          v-if="order?.shippingStatus"
          class="px-3 py-1 text-sm font-medium rounded bg-dark-800 text-cyan-300 border border-cyan-500/20"
        >
          {{ order.shippingStatus }}
        </span>
      </div>
    </div>

    <div
      v-if="actionToast"
      class="mb-4 rounded-lg px-4 py-3 text-sm max-w-4xl"
      :class="actionToast.type === 'success'
        ? 'bg-green-500/10 border border-green-500/30 text-green-400'
        : 'bg-red-500/10 border border-red-500/30 text-red-400'"
    >
      {{ actionToast.message }}
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
            <span>Shipping (customer paid)</span>
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

      <!-- Shipping / Fulfillment panel -->
      <div class="bg-dark-900 rounded-xl border border-dark-700 p-6">
        <h2 class="text-lg font-semibold text-white mb-2">Shipping &amp; Fulfillment</h2>
        <p class="text-sm mb-5" :class="fulfillmentHintClass">{{ fulfillmentHint }}</p>

        <dl class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-5">
          <div class="flex gap-3">
            <dt class="text-dark-500 w-40">Shipping status</dt>
            <dd class="text-white">{{ order.shippingStatus || '—' }}</dd>
          </div>
          <div class="flex gap-3">
            <dt class="text-dark-500 w-40">Carrier / service</dt>
            <dd class="text-white">
              <template v-if="order.shippingCarrier || order.shippingService">
                {{ order.shippingCarrier }}{{ order.shippingCarrier && order.shippingService ? ' — ' : '' }}{{ order.shippingService }}
              </template>
              <template v-else>—</template>
            </dd>
          </div>
          <div class="flex gap-3">
            <dt class="text-dark-500 w-40">Customer shipping</dt>
            <dd class="text-white">{{ formatCents(order.shippingCostCents) }}</dd>
          </div>
          <div class="flex gap-3">
            <dt class="text-dark-500 w-40">Label cost</dt>
            <dd class="text-white">{{ order.labelCostCents != null ? formatCents(order.labelCostCents) : '—' }}</dd>
          </div>
          <div class="flex gap-3">
            <dt class="text-dark-500 w-40">Tracking #</dt>
            <dd class="text-white font-mono text-xs break-all">{{ order.trackingNumber || '—' }}</dd>
          </div>
          <div class="flex gap-3">
            <dt class="text-dark-500 w-40">Tracking email</dt>
            <dd class="text-white">{{ order.trackingEmailSentAt ? formatDate(order.trackingEmailSentAt) : 'Not sent' }}</dd>
          </div>
        </dl>

        <p v-if="order.labelErrorMessage" class="mb-4 text-sm text-red-400">{{ order.labelErrorMessage }}</p>

        <div class="flex flex-wrap gap-3">
          <button
            v-if="canBuyLabel"
            type="button"
            class="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-white text-sm font-semibold rounded-lg"
            :disabled="actionLoading"
            @click="buyLabel"
          >
            {{ actionLoading === 'buy' ? 'Purchasing…' : order.shippingStatus === 'label_failed' ? 'Retry Label Purchase' : 'Buy Shipping Label' }}
          </button>

          <button
            v-if="order.shippingStatus === 'label_purchasing'"
            type="button"
            class="px-4 py-2.5 bg-dark-700 hover:bg-dark-600 text-white text-sm font-medium rounded-lg"
            :disabled="!!actionLoading"
            @click="refreshOrder"
          >
            Refresh Order
          </button>

          <a
            v-if="order.shippingLabelUrl"
            :href="order.shippingLabelUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="px-4 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-sm font-semibold rounded-lg"
          >
            Print Label
          </a>

          <a
            v-if="order.trackingUrl"
            :href="order.trackingUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="px-4 py-2.5 bg-dark-700 hover:bg-dark-600 text-white text-sm font-medium rounded-lg"
          >
            Open Tracking
          </a>

          <button
            v-if="canEmailTracking"
            type="button"
            class="px-4 py-2.5 bg-dark-700 hover:bg-dark-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg"
            :disabled="actionLoading"
            @click="emailTracking"
          >
            {{ actionLoading === 'email' ? 'Sending…' : 'Email Tracking' }}
          </button>

          <button
            v-if="canMarkShipped"
            type="button"
            class="px-4 py-2.5 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white text-sm font-semibold rounded-lg"
            :disabled="actionLoading"
            @click="markShipped"
          >
            {{ actionLoading === 'ship' ? 'Saving…' : 'Mark as Shipped' }}
          </button>
        </div>
      </div>

      <div class="bg-dark-900 rounded-xl border border-dark-700 p-6">
        <h2 class="text-lg font-semibold text-white mb-4">Payment</h2>
        <dl class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div class="flex gap-3"><dt class="text-dark-500 w-36">Payment status</dt><dd class="text-white">{{ order.paymentStatus || '—' }}</dd></div>
          <div class="flex gap-3"><dt class="text-dark-500 w-36">Order status</dt><dd class="text-white">{{ order.status || '—' }}</dd></div>
          <div class="flex gap-3"><dt class="text-dark-500 w-36">Provider</dt><dd class="text-white">{{ order.paymentProvider || '—' }}</dd></div>
          <div class="flex gap-3"><dt class="text-dark-500 w-36">Method</dt><dd class="text-white">{{ order.paymentMethod || '—' }}</dd></div>
          <div class="flex gap-3"><dt class="text-dark-500 w-36">Moov transfer</dt><dd class="text-white font-mono text-xs break-all">{{ order.moovTransferId || '—' }}</dd></div>
          <div class="flex gap-3"><dt class="text-dark-500 w-36">Paid at</dt><dd class="text-white">{{ order.paidAt ? formatDate(order.paidAt) : '—' }}</dd></div>
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
const actionLoading = ref<'' | 'buy' | 'email' | 'ship'>('')
const actionToast = ref<{ type: 'success' | 'error'; message: string } | null>(null)

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

function showToast(type: 'success' | 'error', message: string) {
  actionToast.value = { type, message }
  setTimeout(() => {
    actionToast.value = null
  }, 5000)
}

const canBuyLabel = computed(() => {
  if (!order.value) return false
  if (order.value.paymentStatus !== 'paid') return false
  if (order.value.shippoTransactionId && order.value.shippingLabelUrl) return false
  if (!order.value.shippoRateId) return false
  if (['cancelled', 'refunded'].includes(order.value.paymentStatus) || order.value.status === 'cancelled') return false
  return ['selected', 'ready_to_ship', 'label_failed'].includes(order.value.shippingStatus)
})

const canEmailTracking = computed(() => {
  if (!order.value) return false
  return (
    Boolean(order.value.trackingNumber && order.value.trackingUrl && order.value.email) &&
    ['label_purchased', 'shipped', 'in_transit'].includes(order.value.shippingStatus)
  )
})

const canMarkShipped = computed(() => {
  if (!order.value) return false
  return (
    order.value.paymentStatus === 'paid' &&
    Boolean(order.value.shippoTransactionId && order.value.trackingNumber) &&
    order.value.shippingStatus !== 'shipped' &&
    order.value.shippingStatus !== 'delivered'
  )
})

const fulfillmentHint = computed(() => {
  if (!order.value) return ''
  if (order.value.paymentStatus !== 'paid') {
    return 'Label can be purchased after payment is confirmed.'
  }
  switch (order.value.shippingStatus) {
    case 'selected':
    case 'ready_to_ship':
      return 'Payment received. Buy a shipping label when the package is ready.'
    case 'label_purchasing':
      return 'Label is being generated. Check again shortly.'
    case 'label_purchased':
      return 'Shipping label ready.'
    case 'shipped':
      return 'Order marked as shipped.'
    case 'label_failed':
      return 'Label purchase failed. Review the address, package details, and Shippo error.'
    default:
      return `Shipping status: ${order.value.shippingStatus || 'unknown'}`
  }
})

const fulfillmentHintClass = computed(() => {
  const s = order.value?.shippingStatus
  if (s === 'label_failed') return 'text-red-400'
  if (s === 'label_purchased' || s === 'shipped') return 'text-emerald-400'
  if (s === 'label_purchasing') return 'text-amber-400'
  return 'text-dark-400'
})

async function refreshOrder() {
  const data = await $fetch(`/api/admin/orders/${orderId.value}`, { credentials: 'include' })
  order.value = data
}

async function buyLabel() {
  actionLoading.value = 'buy'
  try {
    const res = await $fetch<any>(`/api/admin/orders/${orderId.value}/buy-label`, {
      method: 'POST',
      credentials: 'include',
    })
    await refreshOrder()
    if (res.shippingStatus === 'label_purchasing') {
      showToast('success', res.message || 'Label is being generated. Check again shortly.')
    } else {
      showToast('success', res.alreadyPurchased ? 'Label already purchased.' : 'Shipping label purchased.')
    }
  } catch (err: any) {
    showToast('error', err.data?.message || err.message || 'Label purchase failed.')
    await refreshOrder().catch(() => {})
  } finally {
    actionLoading.value = ''
  }
}

async function emailTracking() {
  actionLoading.value = 'email'
  try {
    await $fetch(`/api/admin/orders/${orderId.value}/email-tracking`, {
      method: 'POST',
      credentials: 'include',
    })
    await refreshOrder()
    showToast('success', 'Tracking email sent.')
  } catch (err: any) {
    showToast('error', err.data?.message || err.message || 'Could not send tracking email.')
  } finally {
    actionLoading.value = ''
  }
}

async function markShipped() {
  if (!confirm('Mark this order as shipped?')) return
  actionLoading.value = 'ship'
  try {
    await $fetch(`/api/admin/orders/${orderId.value}/mark-shipped`, {
      method: 'POST',
      credentials: 'include',
    })
    await refreshOrder()
    showToast('success', 'Order marked as shipped.')
  } catch (err: any) {
    showToast('error', err.data?.message || err.message || 'Could not mark as shipped.')
  } finally {
    actionLoading.value = ''
  }
}

onMounted(async () => {
  pending.value = true
  try {
    await refreshOrder()
  } catch (err: any) {
    error.value = err.data?.message || err.message || 'Order not found.'
  } finally {
    pending.value = false
  }
})
</script>
