<template>
  <div class="min-h-screen bg-dark-950 py-10 lg:py-14">
    <div class="mx-auto max-w-xl px-4 sm:px-6">
      <div
        v-if="isLoading"
        class="rounded-2xl border border-slate-700/80 bg-dark-900/80 px-6 py-16 text-center"
      >
        <div class="mx-auto mb-4 h-10 w-10 rounded-full border-2 border-primary-500/30 border-t-primary-400 animate-spin" />
        <p class="text-dark-300 text-sm">Loading order confirmation…</p>
      </div>

      <div
        v-else-if="error"
        class="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-center"
      >
        <p class="text-red-400 text-sm mb-4">{{ error }}</p>
        <NuxtLink
          to="/"
          class="inline-flex px-5 py-2.5 rounded-xl bg-dark-800 hover:bg-dark-700 border border-dark-600 text-white text-sm font-medium transition-colors"
        >
          Continue Shopping
        </NuxtLink>
      </div>

      <div
        v-else
        class="rounded-2xl border border-slate-600/50 bg-gradient-to-b from-dark-900 to-dark-950 p-6 sm:p-8 shadow-xl shadow-black/25"
      >
        <div class="text-center mb-8">
          <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/30">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 class="text-2xl sm:text-3xl font-bold text-white tracking-tight">Payment confirmed</h1>
          <p class="text-dark-300 mt-2 text-sm sm:text-base">
            Thank you. Your order payment was received.
          </p>
        </div>

        <div
          v-if="isTestMode"
          class="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3"
        >
          <p class="text-amber-400 font-semibold text-sm">MOOV TEST MODE — NO REAL MONEY</p>
        </div>

        <div class="space-y-3 text-sm mb-6">
          <div class="flex justify-between gap-4">
            <span class="text-dark-400">Order</span>
            <span class="text-white font-mono">{{ orderNumber || '—' }}</span>
          </div>
          <div class="flex justify-between gap-4">
            <span class="text-dark-400">Payment status</span>
            <span class="text-emerald-400">{{ displayPaymentStatus }}</span>
          </div>
          <div class="flex justify-between gap-4">
            <span class="text-dark-400">Shipping method</span>
            <span class="text-white text-right">
              <template v-if="shippingCarrier || shippingService">
                {{ shippingCarrier }}{{ shippingCarrier && shippingService ? ' — ' : '' }}{{ shippingService }}
              </template>
              <template v-else>{{ displayShippingStatus }}</template>
            </span>
          </div>
        </div>

        <div class="pt-5 border-t border-dark-700 space-y-2.5 text-sm">
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

        <div class="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <NuxtLink
            to="/"
            class="px-8 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl text-center transition-colors"
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

const isTestMode = computed(() => (config.public.moovMode as string || 'test') === 'test')
const formatCents = (cents: number) => `${CURRENCY.SYMBOL}${((Number(cents) || 0) / 100).toFixed(2)}`

const displayPaymentStatus = computed(() => {
  const status = paymentStatus.value || 'paid'
  return status.charAt(0).toUpperCase() + status.slice(1)
})

const displayShippingStatus = computed(() => {
  const status = shippingStatus.value || 'selected'
  return status.split('_').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')
})

onMounted(async () => {
  if (!orderId) {
    error.value = 'Missing order information.'
    isLoading.value = false
    return
  }

  try {
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

    if (status.paymentStatus !== 'paid') {
      error.value = 'This order is not marked paid yet. Return to payment if checkout is still in progress.'
      isLoading.value = false
      return
    }

    orderNumber.value = status.orderNumber || ''
    paymentStatus.value = status.paymentStatus || 'paid'
    shippingStatus.value = status.shippingStatus || ''
    shippingCarrier.value = status.shippingCarrier || ''
    shippingService.value = status.shippingService || ''
    subtotalCents.value = Number(status.subtotalCents) || 0
    shippingCostCents.value = Number(status.shippingCostCents) || 0
    taxCents.value = Number(status.taxCents) || 0
    totalCents.value = Number(status.totalCents) || 0
  } catch (err: any) {
    console.error('Success page status load failed:', err)
    error.value = err.data?.message || err.message || 'Could not load order confirmation.'
  } finally {
    isLoading.value = false
  }
})

useHead({
  title: 'Payment Confirmed — Quantum Bio Peptides',
})
</script>
