<template>
  <div>
    <!-- Back -->
    <NuxtLink to="/owner/orders" class="inline-flex items-center gap-1 text-dark-400 hover:text-white text-sm mb-6 transition-colors">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
      Back to Orders
    </NuxtLink>

    <!-- Loading -->
    <div v-if="pending" class="space-y-4">
      <div v-for="i in 5" :key="i" class="bg-dark-900 border border-dark-700 rounded-xl p-5 animate-pulse">
        <div class="h-4 bg-dark-700 rounded w-1/3 mb-3"></div>
        <div class="h-3 bg-dark-700 rounded w-2/3"></div>
      </div>
    </div>

    <!-- Error / not found -->
    <div v-else-if="fetchError || !order" class="text-center py-16">
      <p class="text-red-400 mb-2">{{ fetchError?.statusCode === 401 ? 'Session expired.' : 'Order not found.' }}</p>
      <NuxtLink v-if="fetchError?.statusCode === 401" to="/owner/login" class="text-primary-400 text-sm underline">Sign in again</NuxtLink>
      <NuxtLink v-else to="/owner/orders" class="text-primary-400 text-sm">← Back to orders</NuxtLink>
    </div>

    <div v-else class="space-y-5">

      <!-- ── Header ─────────────────────────────────────────────── -->
      <div class="bg-dark-900 border border-dark-700 rounded-xl p-5">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div class="flex flex-wrap items-center gap-2 mb-1">
              <h1 class="text-2xl font-bold text-white">Request #{{ order.id }}</h1>
              <StatusBadge :status="order.status" size="lg" />
            </div>
            <p class="text-dark-400 text-sm">Submitted {{ formatDate(order.createdAt) }}</p>
            <p v-if="order.reviewedAt" class="text-dark-500 text-xs mt-0.5">Reviewed {{ formatDate(order.reviewedAt) }}</p>
          </div>
          <div class="text-right">
            <p class="text-2xl font-bold text-white">${{ order.amountTotal.toFixed(2) }}</p>
            <p class="text-dark-400 text-xs mt-0.5">{{ order.currency?.toUpperCase() }}</p>
            <div class="mt-2">
              <span v-if="order.inventoryAdjusted" class="text-xs text-green-400 bg-green-400/10 border border-green-400/20 px-2.5 py-1 rounded-full">Inventory Adjusted</span>
              <span v-else class="text-xs text-dark-500 bg-dark-800 border border-dark-700 px-2.5 py-1 rounded-full">Inventory Not Adjusted</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Customer ───────────────────────────────────────────── -->
      <div class="bg-dark-900 border border-dark-700 rounded-xl p-5">
        <h2 class="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-4">Customer</h2>
        <dl class="space-y-2.5 text-sm mb-4">
          <div class="flex gap-3">
            <dt class="text-dark-500 w-28 flex-shrink-0">Name</dt>
            <dd class="text-white font-medium">{{ order.customerName }}</dd>
          </div>
          <div class="flex gap-3">
            <dt class="text-dark-500 w-28 flex-shrink-0">Email</dt>
            <dd class="text-white break-all">{{ order.email }}</dd>
          </div>
          <div v-if="order.phone" class="flex gap-3">
            <dt class="text-dark-500 w-28 flex-shrink-0">Phone</dt>
            <dd class="text-white">{{ order.phone }}</dd>
          </div>
          <div v-if="order.companyName" class="flex gap-3">
            <dt class="text-dark-500 w-28 flex-shrink-0">Institution</dt>
            <dd class="text-white">{{ order.companyName }}</dd>
          </div>
        </dl>
        <div class="flex flex-wrap gap-2 pt-3 border-t border-dark-800">
          <a
            :href="`mailto:${order.email}`"
            class="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-500/15 hover:bg-primary-500/25 text-primary-300 border border-primary-500/30 rounded-lg text-sm font-medium transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Email Customer
          </a>
          <a
            v-if="order.phone"
            :href="`tel:${order.phone}`"
            class="inline-flex items-center gap-2 px-4 py-2.5 bg-dark-800 hover:bg-dark-700 text-dark-200 border border-dark-600 rounded-lg text-sm font-medium transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            Call Customer
          </a>
        </div>
      </div>

      <!-- ── Shipping ───────────────────────────────────────────── -->
      <div class="bg-dark-900 border border-dark-700 rounded-xl p-5">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xs font-semibold text-dark-400 uppercase tracking-wider">Ship To</h2>
          <button
            class="inline-flex items-center gap-1.5 text-xs text-dark-400 hover:text-white bg-dark-800 hover:bg-dark-700 border border-dark-600 px-3 py-1.5 rounded-lg transition-colors"
            @click="copyAddress"
          >
            <svg v-if="!addressCopied" xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            {{ addressCopied ? 'Copied!' : 'Copy Address' }}
          </button>
        </div>
        <address class="text-white text-sm not-italic leading-relaxed">
          {{ order.shippingName }}<br />
          {{ order.shippingAddressLine1 }}<br />
          <span v-if="order.shippingAddressLine2">{{ order.shippingAddressLine2 }}<br /></span>
          {{ order.shippingCity }}, {{ order.shippingState }} {{ order.shippingPostalCode }}<br />
          {{ order.shippingCountry }}
        </address>
      </div>

      <!-- ── Items ─────────────────────────────────────────────── -->
      <div class="bg-dark-900 border border-dark-700 rounded-xl p-5">
        <h2 class="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-4">Items Requested</h2>

        <!-- Mobile cards -->
        <div class="space-y-3 sm:hidden mb-4">
          <div
            v-for="item in order.items"
            :key="item.id"
            class="bg-dark-800 rounded-lg p-3 border border-dark-700"
          >
            <div class="flex justify-between items-start gap-2 mb-2">
              <div>
                <p class="text-white text-sm font-medium">{{ item.productName }}</p>
                <p class="text-dark-400 text-xs">{{ item.variantName }}</p>
              </div>
              <p class="text-white text-sm font-semibold whitespace-nowrap">${{ (item.unitPrice * item.quantity).toFixed(2) }}</p>
            </div>
            <div class="flex items-center justify-between text-xs text-dark-500">
              <span class="font-mono">{{ item.sku }}</span>
              <span>${{ item.unitPrice.toFixed(2) }} × {{ item.quantity }}</span>
            </div>
          </div>
        </div>

        <!-- Desktop table -->
        <table class="hidden sm:table w-full text-sm mb-4">
          <thead>
            <tr class="border-b border-dark-700">
              <th class="text-left text-dark-400 font-medium pb-2 pr-4">Product</th>
              <th class="text-left text-dark-400 font-medium pb-2 pr-4">Variant</th>
              <th class="text-left text-dark-400 font-medium pb-2 pr-4">SKU</th>
              <th class="text-center text-dark-400 font-medium pb-2 pr-4">Qty</th>
              <th class="text-right text-dark-400 font-medium pb-2 pr-4">Unit</th>
              <th class="text-right text-dark-400 font-medium pb-2">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in order.items" :key="item.id" class="border-b border-dark-800 last:border-0">
              <td class="py-2.5 pr-4 text-white">{{ item.productName }}</td>
              <td class="py-2.5 pr-4 text-dark-300">{{ item.variantName }}</td>
              <td class="py-2.5 pr-4 font-mono text-dark-500 text-xs">{{ item.sku }}</td>
              <td class="py-2.5 pr-4 text-center text-white">{{ item.quantity }}</td>
              <td class="py-2.5 pr-4 text-right text-dark-300">${{ item.unitPrice.toFixed(2) }}</td>
              <td class="py-2.5 text-right text-white font-medium">${{ (item.unitPrice * item.quantity).toFixed(2) }}</td>
            </tr>
          </tbody>
        </table>

        <!-- Totals -->
        <div class="border-t border-dark-700 pt-3 space-y-1.5 text-sm">
          <div class="flex justify-between text-dark-300">
            <span>Subtotal</span>
            <span>${{ order.amountSubtotal.toFixed(2) }}</span>
          </div>
          <div class="flex justify-between text-dark-300">
            <span>Shipping</span>
            <span>${{ order.shippingAmount.toFixed(2) }}</span>
          </div>
          <div class="flex justify-between text-white font-bold pt-1 text-base">
            <span>Total</span>
            <span>${{ order.amountTotal.toFixed(2) }}</span>
          </div>
        </div>
      </div>

      <!-- ── Notes ─────────────────────────────────────────────── -->
      <div class="bg-dark-900 border border-dark-700 rounded-xl p-5">
        <h2 class="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-4">Notes</h2>

        <div v-if="order.customerNotes" class="mb-4">
          <p class="text-dark-500 text-xs mb-1.5">Customer notes</p>
          <p class="text-dark-200 text-sm leading-relaxed whitespace-pre-wrap bg-dark-800 rounded-lg px-4 py-3 border border-dark-700">{{ order.customerNotes }}</p>
        </div>

        <div>
          <p class="text-dark-500 text-xs mb-1.5">Owner notes (internal)</p>
          <textarea
            v-model="ownerNotesDraft"
            rows="3"
            placeholder="Add internal notes visible only to you…"
            class="w-full bg-dark-800 border border-dark-600 rounded-lg px-4 py-3 text-white placeholder-dark-500 focus:outline-none focus:border-primary-500 transition-colors text-sm resize-none"
          ></textarea>
          <div class="flex items-center gap-3 mt-2">
            <button
              :disabled="ownerNotesDraft === (order.ownerNotes || '') || isSavingNotes"
              class="px-5 py-2 bg-dark-700 hover:bg-dark-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
              @click="saveNotes"
            >
              {{ isSavingNotes ? 'Saving…' : 'Save Notes' }}
            </button>
            <span v-if="notesSaved" class="text-green-400 text-sm">Saved ✓</span>
          </div>
        </div>
      </div>

      <!-- ── Status Actions ─────────────────────────────────────── -->
      <div class="bg-dark-900 border border-dark-700 rounded-xl p-5">
        <h2 class="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-4">Update Status</h2>

        <!-- Inventory warning -->
        <div
          v-if="order.inventoryAdjusted && (pendingStatus === 'cancelled' || pendingStatus === 'rejected')"
          class="flex items-start gap-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-4"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <p class="text-yellow-300 text-sm">
            <strong class="text-yellow-200">Inventory was already adjusted for this request.</strong>
            Restore stock manually in Strapi admin for the affected variants before confirming cancellation.
          </p>
        </div>

        <div class="flex flex-wrap gap-2 mb-4">
          <button
            v-for="action in statusActions"
            :key="action.value"
            :disabled="order.status === action.value || isSaving"
            :class="[
              'px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border',
              pendingStatus === action.value
                ? `${action.activeClass}`
                : 'bg-dark-800 border-dark-600 text-dark-300 hover:text-white hover:border-dark-400',
              order.status === action.value ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
            ]"
            @click="pendingStatus = action.value"
          >
            {{ action.label }}
          </button>
        </div>

        <div v-if="pendingStatus && pendingStatus !== order.status" class="flex flex-wrap items-center gap-3">
          <button
            :disabled="isSaving"
            class="px-6 py-3 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white font-semibold rounded-lg text-sm transition-colors"
            @click="saveStatus"
          >
            {{ isSaving ? 'Saving…' : `Confirm: Set to "${pendingStatus.replace(/_/g, ' ')}"` }}
          </button>
          <button class="text-sm text-dark-400 hover:text-white transition-colors py-3" @click="pendingStatus = ''">
            Cancel
          </button>
        </div>

        <p v-if="!pendingStatus" class="text-dark-600 text-xs mt-1">Select a status above to update this order.</p>

        <div v-if="actionSuccess" class="mt-3 text-green-400 text-sm bg-green-400/10 border border-green-400/20 rounded-lg px-4 py-2.5">{{ actionSuccess }}</div>
        <div v-if="actionError" class="mt-3 text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-2.5">{{ actionError }}</div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'owner', middleware: 'owner' })

const route = useRoute()
const id = route.params.id as string

const { data: order, pending, error: fetchError, refresh } = await useFetch<any>(
  `/api/owner/orders/${id}`,
  { headers: useRequestHeaders(['cookie']) }
)

const pendingStatus = ref('')
const isSaving = ref(false)
const actionSuccess = ref('')
const actionError = ref('')

const ownerNotesDraft = ref(order.value?.ownerNotes || '')
const isSavingNotes = ref(false)
const notesSaved = ref(false)
const addressCopied = ref(false)

watch(() => order.value?.ownerNotes, (v) => {
  ownerNotesDraft.value = v || ''
})

const statusActions = [
  { value: 'approved',         label: 'Approved',         activeClass: 'bg-green-500/20 text-green-300 border-green-500/40' },
  { value: 'awaiting_payment', label: 'Awaiting Payment', activeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
  { value: 'fulfilled',        label: 'Fulfilled',        activeClass: 'bg-primary-500/20 text-primary-300 border-primary-500/40' },
  { value: 'pending_review',   label: 'Pending Review',   activeClass: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40' },
  { value: 'cancelled',        label: 'Cancelled',        activeClass: 'bg-dark-600 text-dark-200 border-dark-500' },
  { value: 'rejected',         label: 'Rejected',         activeClass: 'bg-red-500/20 text-red-300 border-red-500/40' },
]

async function saveStatus() {
  if (!pendingStatus.value) return
  isSaving.value = true
  actionSuccess.value = ''
  actionError.value = ''
  try {
    await $fetch(`/api/owner/orders/${id}`, {
      method: 'PATCH',
      credentials: 'include',
      body: { status: pendingStatus.value },
    })
    actionSuccess.value = `Status updated to "${pendingStatus.value.replace(/_/g, ' ')}".`
    await refresh()
    pendingStatus.value = ''
  } catch (err: any) {
    actionError.value = err.data?.message || 'Failed to update status.'
  } finally {
    isSaving.value = false
  }
}

async function saveNotes() {
  isSavingNotes.value = true
  notesSaved.value = false
  try {
    await $fetch(`/api/owner/orders/${id}`, {
      method: 'PATCH',
      credentials: 'include',
      body: { ownerNotes: ownerNotesDraft.value },
    })
    notesSaved.value = true
    await refresh()
    setTimeout(() => { notesSaved.value = false }, 3000)
  } catch (err: any) {
    console.error('Failed to save notes:', err)
  } finally {
    isSavingNotes.value = false
  }
}

function copyAddress() {
  if (!order.value) return
  const o = order.value
  const parts = [
    o.shippingName,
    o.shippingAddressLine1,
    o.shippingAddressLine2,
    `${o.shippingCity}, ${o.shippingState} ${o.shippingPostalCode}`,
    o.shippingCountry,
  ].filter(Boolean)
  navigator.clipboard.writeText(parts.join('\n')).then(() => {
    addressCopied.value = true
    setTimeout(() => { addressCopied.value = false }, 2500)
  }).catch(() => {})
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}
</script>
