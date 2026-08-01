<template>
  <div class="min-h-screen bg-dark-950 relative overflow-hidden">
    <div
      class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.12),_transparent_55%)]"
      aria-hidden="true"
    />

    <div class="relative mx-auto max-w-xl px-4 sm:px-6 py-12 lg:py-16">
      <div
        v-if="isLoading"
        class="rounded-2xl border border-slate-700/80 bg-dark-900/80 px-6 py-16 text-center"
      >
        <div class="mx-auto mb-4 h-10 w-10 rounded-full border-2 border-primary-500/30 border-t-primary-400 animate-spin" />
        <p class="text-dark-300 text-sm">Loading your confirmation…</p>
      </div>

      <div
        v-else-if="error"
        class="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-center"
      >
        <p class="text-red-400 text-sm mb-4">{{ error }}</p>
        <div class="flex flex-col sm:flex-row gap-3 justify-center">
          <NuxtLink
            v-if="orderId"
            :to="`/checkout/payment?orderId=${orderId}`"
            class="inline-flex min-h-[44px] items-center justify-center px-5 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium transition-colors"
          >
            Return to Payment
          </NuxtLink>
          <NuxtLink
            to="/"
            class="inline-flex min-h-[44px] items-center justify-center px-5 py-2.5 rounded-xl bg-dark-800 hover:bg-dark-700 border border-dark-600 text-white text-sm font-medium transition-colors"
          >
            Continue Shopping
          </NuxtLink>
        </div>
      </div>

      <div
        v-else
        class="rounded-2xl border border-slate-600/50 bg-gradient-to-b from-dark-900 to-dark-950 p-6 sm:p-9 shadow-xl shadow-black/25 animate-[fadeIn_0.45s_ease-out]"
      >
        <div class="text-center mb-8">
          <div
            class="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border"
            :class="isPaid
              ? 'bg-emerald-500/15 border-emerald-500/35'
              : 'bg-amber-500/15 border-amber-500/35'"
          >
            <svg
              v-if="isPaid"
              xmlns="http://www.w3.org/2000/svg"
              class="h-8 w-8 text-emerald-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <svg
              v-else
              xmlns="http://www.w3.org/2000/svg"
              class="h-8 w-8 text-amber-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <p class="text-xs uppercase tracking-[0.2em] text-dark-500 mb-2">
            Quantum Bio Peptides
          </p>
          <h1 class="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            {{ isPaid ? 'Order confirmed' : 'Confirming payment' }}
          </h1>
          <p class="text-dark-300 mt-3 text-sm sm:text-base leading-relaxed max-w-md mx-auto">
            <template v-if="isPaid">
              Thank you. Your payment went through and we’re preparing your order.
            </template>
            <template v-else>
              Your order was submitted. We’re waiting on final confirmation from Moov.
            </template>
          </p>
        </div>

        <div
          v-if="isTestMode"
          class="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-center"
        >
          <p class="text-amber-400 font-semibold text-sm">MOOV TEST MODE — NO REAL MONEY</p>
        </div>

        <div class="rounded-xl border border-dark-700/80 bg-dark-950/50 px-4 py-4 space-y-3 text-sm mb-6">
          <div class="flex justify-between gap-4">
            <span class="text-dark-400">Order number</span>
            <span class="text-white font-mono text-right">{{ orderNumber || '—' }}</span>
          </div>
          <div class="flex justify-between gap-4">
            <span class="text-dark-400">Payment</span>
            <span :class="isPaid ? 'text-emerald-400 font-medium' : 'text-amber-400 font-medium'">
              {{ displayPaymentStatus }}
            </span>
          </div>
          <div class="flex justify-between gap-4">
            <span class="text-dark-400">Shipping</span>
            <span class="text-white text-right">
              <template v-if="shippingCarrier || shippingService">
                {{ shippingCarrier }}{{ shippingCarrier && shippingService ? ' — ' : '' }}{{ shippingService }}
              </template>
              <template v-else>{{ displayShippingStatus }}</template>
            </span>
          </div>
        </div>

        <div class="pt-1 space-y-2.5 text-sm">
          <div class="flex justify-between text-dark-300">
            <span>Subtotal</span>
            <span>{{ formatCents(subtotalCents) }}</span>
          </div>
          <div class="flex justify-between text-dark-300">
            <span>Shipping</span>
            <span>{{ formatCents(shippingCostCents) }}</span>
          </div>
          <div class="flex justify-between text-dark-300">
            <span>Tax</span>
            <span>{{ formatCents(taxCents) }}</span>
          </div>
          <div class="flex justify-between items-baseline pt-3 mt-1 border-t border-dark-700">
            <span class="text-white font-semibold">Total</span>
            <span class="text-2xl font-bold text-primary-400 tracking-tight">{{ formatCents(totalCents) }}</span>
          </div>
        </div>

        <div
          v-if="isPaid"
          class="mt-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-dark-300 leading-relaxed"
        >
          A receipt was emailed to you. You’ll get tracking when your order ships.
        </div>

        <div class="mt-8 flex flex-col gap-3">
          <button
            v-if="!isPaid"
            type="button"
            @click="refreshStatus"
            :disabled="isRefreshing"
            class="min-h-[48px] px-8 py-3 bg-primary-500 hover:bg-primary-600 disabled:opacity-60 text-white font-semibold rounded-xl text-center transition-colors"
          >
            {{ isRefreshing ? 'Checking…' : 'Check payment status' }}
          </button>
          <NuxtLink
            to="/"
            class="min-h-[48px] inline-flex items-center justify-center px-8 py-3 bg-dark-800 hover:bg-dark-700 border border-dark-600 text-white font-semibold rounded-xl text-center transition-colors"
          >
            Continue Shopping
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CURRENCY } from '~/constants'

const route = useRoute()
const config = useRuntimeConfig()

const orderId = Number(route.query.orderId)
const isLoading = ref(true)
const isRefreshing = ref(false)
const error = ref<string | null>(null)

const orderNumber = ref('')
const paymentStatus = ref('')
const shippingStatus = ref('')
const shippingCarrier = ref('')
const shippingService = ref('')
const subtotalCents = ref(0)
const shippingCostCents = ref(0)
const taxCents = ref(0)
const totalCents = ref(0)

let autoPollTimer: ReturnType<typeof setTimeout> | null = null
let autoPollAttempts = 0

const isTestMode = computed(() => (config.public.moovMode as string || 'test') === 'test')
const isPaid = computed(() => paymentStatus.value === 'paid')
const formatCents = (cents: number) => `${CURRENCY.SYMBOL}${((Number(cents) || 0) / 100).toFixed(2)}`

const displayPaymentStatus = computed(() => {
  const status = paymentStatus.value || 'processing'
  return status.charAt(0).toUpperCase() + status.slice(1)
})

const displayShippingStatus = computed(() => {
  const status = shippingStatus.value || 'selected'
  return status.split('_').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')
})

function applyStatus(status: {
  orderNumber?: string | null
  paymentStatus?: string
  shippingStatus?: string | null
  shippingCarrier?: string | null
  shippingService?: string | null
  subtotalCents?: number
  shippingCostCents?: number
  taxCents?: number
  totalCents?: number
}) {
  orderNumber.value = status.orderNumber || ''
  paymentStatus.value = status.paymentStatus || 'processing'
  shippingStatus.value = status.shippingStatus || ''
  shippingCarrier.value = status.shippingCarrier || ''
  shippingService.value = status.shippingService || ''
  subtotalCents.value = Number(status.subtotalCents) || 0
  shippingCostCents.value = Number(status.shippingCostCents) || 0
  taxCents.value = Number(status.taxCents) || 0
  totalCents.value = Number(status.totalCents) || 0
}

function stopAutoPoll() {
  if (autoPollTimer) {
    clearTimeout(autoPollTimer)
    autoPollTimer = null
  }
}

async function loadStatus() {
  const status = await $fetch<{
    ok?: boolean
    orderNumber?: string
    paymentStatus?: string
    shippingStatus?: string
    shippingCarrier?: string | null
    shippingService?: string | null
    subtotalCents?: number
    shippingCostCents?: number
    taxCents?: number
    totalCents?: number
  }>('/api/checkout/status', {
    query: { orderId },
    credentials: 'include',
  })
  applyStatus(status)
}

function scheduleAutoPoll() {
  stopAutoPoll()
  if (isPaid.value || paymentStatus.value === 'failed' || paymentStatus.value === 'cancelled') return
  if (autoPollAttempts >= 15) return
  autoPollTimer = setTimeout(async () => {
    autoPollAttempts += 1
    try {
      await loadStatus()
    } catch {
      // keep current UI
    }
    scheduleAutoPoll()
  }, 2000)
}

async function refreshStatus() {
  isRefreshing.value = true
  error.value = null
  try {
    await loadStatus()
    scheduleAutoPoll()
  } catch (err: any) {
    error.value = err.data?.message || err.message || 'Could not refresh order status.'
  } finally {
    isRefreshing.value = false
  }
}

onMounted(async () => {
  if (!orderId) {
    error.value = 'Missing order information.'
    isLoading.value = false
    return
  }

  try {
    await loadStatus()
    scheduleAutoPoll()
  } catch (err: any) {
    console.error('Success page status load failed:', err)
    error.value = err.data?.message || err.message || 'Could not load order confirmation.'
  } finally {
    isLoading.value = false
  }
})

onBeforeUnmount(() => {
  stopAutoPoll()
})

useHead({
  title: 'Order Confirmation — Quantum Bio Peptides',
})
</script>

<style scoped>
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
