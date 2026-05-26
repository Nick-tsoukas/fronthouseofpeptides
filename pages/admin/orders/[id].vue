<template>
  <div class="p-6 lg:p-8">
    <!-- Header -->
    <div class="mb-8">
      <NuxtLink to="/admin/orders" class="inline-flex items-center text-dark-400 hover:text-white mb-4 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Orders
      </NuxtLink>
      <div class="flex items-center gap-4">
        <h1 class="text-2xl font-bold text-white">Order #{{ orderId }}</h1>
        <span 
          v-if="order"
          :class="[
            'px-3 py-1 text-sm font-medium rounded capitalize',
            getStatusClass(order.attributes.status)
          ]"
        >
          {{ order.attributes.status }}
        </span>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="pending" class="space-y-6 max-w-4xl">
      <div class="bg-dark-900 rounded-xl border border-dark-700 p-6 animate-pulse">
        <div class="h-6 bg-dark-800 rounded w-1/3 mb-4"></div>
        <div class="space-y-3">
          <div class="h-4 bg-dark-800 rounded w-full"></div>
          <div class="h-4 bg-dark-800 rounded w-2/3"></div>
        </div>
      </div>
    </div>

    <!-- Not Found -->
    <div v-else-if="!order" class="bg-dark-900 rounded-xl border border-dark-700 p-12 text-center max-w-4xl">
      <h2 class="text-xl font-semibold text-white mb-2">Order Not Found</h2>
      <p class="text-dark-400 mb-6">The order you're looking for doesn't exist.</p>
      <NuxtLink 
        to="/admin/orders"
        class="inline-flex items-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-medium rounded-lg transition-colors"
      >
        Back to Orders
      </NuxtLink>
    </div>

    <!-- Order Details -->
    <div v-else class="space-y-6 max-w-4xl">
      <!-- Order Info Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Customer Info -->
        <div class="bg-dark-900 rounded-xl border border-dark-700 p-6">
          <h2 class="text-lg font-semibold text-white mb-4">Customer Information</h2>
          <div class="space-y-3">
            <div>
              <p class="text-dark-400 text-sm">Email</p>
              <p class="text-white">{{ order.attributes.email }}</p>
            </div>
            <div>
              <p class="text-dark-400 text-sm">Name</p>
              <p class="text-white">{{ order.attributes.shippingName || 'N/A' }}</p>
            </div>
          </div>
        </div>

        <!-- Shipping Address -->
        <div class="bg-dark-900 rounded-xl border border-dark-700 p-6">
          <h2 class="text-lg font-semibold text-white mb-4">Shipping Address</h2>
          <div class="text-white">
            <p>{{ order.attributes.shippingName }}</p>
            <p>{{ order.attributes.shippingAddressLine1 }}</p>
            <p v-if="order.attributes.shippingAddressLine2">{{ order.attributes.shippingAddressLine2 }}</p>
            <p>{{ order.attributes.shippingCity }}, {{ order.attributes.shippingState }} {{ order.attributes.shippingPostalCode }}</p>
            <p>{{ order.attributes.shippingCountry }}</p>
          </div>
        </div>
      </div>

      <!-- Order Items -->
      <div class="bg-dark-900 rounded-xl border border-dark-700 p-6">
        <h2 class="text-lg font-semibold text-white mb-4">Order Items</h2>
        
        <div class="divide-y divide-dark-700">
          <div 
            v-for="item in orderItems" 
            :key="item.id"
            class="flex items-center justify-between py-4 first:pt-0 last:pb-0"
          >
            <div>
              <p class="text-white font-medium">{{ item.attributes.productNameSnapshot }}</p>
              <p class="text-dark-400 text-sm">
                {{ item.attributes.variantNameSnapshot }} • SKU: {{ item.attributes.skuSnapshot }}
              </p>
            </div>
            <div class="text-right">
              <p class="text-white">${{ item.attributes.unitPriceSnapshot.toFixed(2) }} × {{ item.attributes.quantity }}</p>
              <p class="text-dark-400 text-sm">${{ (item.attributes.unitPriceSnapshot * item.attributes.quantity).toFixed(2) }}</p>
            </div>
          </div>
        </div>

        <!-- Totals -->
        <div class="border-t border-dark-700 mt-4 pt-4 space-y-2">
          <div class="flex justify-between text-dark-300">
            <span>Subtotal</span>
            <span>${{ order.attributes.amountSubtotal.toFixed(2) }}</span>
          </div>
          <div class="flex justify-between text-dark-300">
            <span>Shipping</span>
            <span>${{ (order.attributes.shippingAmount || 0).toFixed(2) }}</span>
          </div>
          <div class="flex justify-between text-white font-semibold text-lg pt-2">
            <span>Total</span>
            <span>${{ order.attributes.amountTotal.toFixed(2) }}</span>
          </div>
        </div>
      </div>

      <!-- Order Status & Actions -->
      <div class="bg-dark-900 rounded-xl border border-dark-700 p-6">
        <h2 class="text-lg font-semibold text-white mb-4">Update Order</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Status Update -->
          <div>
            <label class="block text-sm font-medium text-dark-300 mb-2">Order Status</label>
            <select
              v-model="updateForm.status"
              class="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-cyan-500 transition-colors"
            >
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>

          <!-- Tracking Number -->
          <div>
            <label class="block text-sm font-medium text-dark-300 mb-2">
              Tracking Number
              <span class="text-dark-500">(requires schema update)</span>
            </label>
            <input
              v-model="updateForm.trackingNumber"
              type="text"
              placeholder="Enter tracking number"
              disabled
              class="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-lg text-dark-500 placeholder-dark-600 cursor-not-allowed"
            />
          </div>
        </div>

        <!-- Notes -->
        <div class="mt-4">
          <label class="block text-sm font-medium text-dark-300 mb-2">
            Internal Notes
            <span class="text-dark-500">(requires schema update)</span>
          </label>
          <textarea
            v-model="updateForm.notes"
            rows="3"
            placeholder="Add internal notes about this order"
            disabled
            class="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-lg text-dark-500 placeholder-dark-600 resize-none cursor-not-allowed"
          ></textarea>
        </div>

        <!-- Error/Success Messages -->
        <div v-if="error" class="mt-4 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
          <p class="text-red-400 text-sm">{{ error }}</p>
        </div>
        <div v-if="success" class="mt-4 bg-green-500/10 border border-green-500/30 rounded-lg p-3">
          <p class="text-green-400 text-sm">{{ success }}</p>
        </div>

        <!-- Save Button -->
        <div class="mt-6">
          <button
            @click="updateOrder"
            :disabled="isLoading"
            class="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 disabled:bg-dark-700 disabled:text-dark-500 text-white font-semibold rounded-lg transition-colors"
          >
            {{ isLoading ? 'Saving...' : 'Update Order' }}
          </button>
        </div>
      </div>

      <!-- Order Meta -->
      <div class="bg-dark-900 rounded-xl border border-dark-700 p-6">
        <h2 class="text-lg font-semibold text-white mb-4">Order Details</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p class="text-dark-400">Order ID</p>
            <p class="text-white font-mono">{{ order.id }}</p>
          </div>
          <div>
            <p class="text-dark-400">Stripe Session</p>
            <p class="text-white font-mono text-xs truncate" :title="order.attributes.stripeSessionId">
              {{ order.attributes.stripeSessionId.slice(0, 20) }}...
            </p>
          </div>
          <div>
            <p class="text-dark-400">Created</p>
            <p class="text-white">{{ formatDate(order.attributes.createdAt) }}</p>
          </div>
          <div>
            <p class="text-dark-400">Currency</p>
            <p class="text-white uppercase">{{ order.attributes.currency }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Order, StrapiResponse } from '~/types'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

interface OrderItem {
  id: number
  attributes: {
    productNameSnapshot: string
    variantNameSnapshot: string
    skuSnapshot: string
    unitPriceSnapshot: number
    quantity: number
  }
}

const route = useRoute()
const config = useRuntimeConfig()
const orderId = computed(() => route.params.id as string)

const order = ref<Order | null>(null)
const orderItems = ref<OrderItem[]>([])
const pending = ref(true)
const isLoading = ref(false)
const error = ref('')
const success = ref('')

const updateForm = ref({
  status: '',
  trackingNumber: '',
  notes: '',
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

const fetchOrder = async () => {
  pending.value = true
  try {
    const response = await $fetch<StrapiResponse<Order>>(
      `${config.public.strapiUrl}/api/orders/${orderId.value}?populate=orderItems`
    )
    order.value = response.data
    
    if (order.value) {
      updateForm.value.status = order.value.attributes.status
      orderItems.value = (order.value.attributes as any).orderItems?.data || []
    }
  } catch (err) {
    console.error('Error fetching order:', err)
  } finally {
    pending.value = false
  }
}

const updateOrder = async () => {
  if (!order.value) return
  
  error.value = ''
  success.value = ''
  isLoading.value = true

  try {
    await $fetch(`/api/admin/orders/${orderId.value}`, {
      method: 'PUT',
      body: {
        status: updateForm.value.status,
      },
    })
    
    // Update local state
    order.value.attributes.status = updateForm.value.status as any
    success.value = 'Order updated successfully!'
  } catch (err: any) {
    console.error('Error updating order:', err)
    error.value = err.data?.message || err.message || 'Failed to update order'
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchOrder)
</script>
