<template>
  <div class="min-h-screen bg-dark-950 py-16">
    <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">

      <!-- Test mode notices -->
      <div class="mb-6 space-y-3">
        <div
          v-if="isMoovTestMode"
          class="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex items-start gap-3"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p class="text-yellow-400 font-semibold text-sm">MOOV TEST MODE — NO REAL MONEY</p>
            <p class="text-yellow-200/70 text-xs mt-0.5">No real money will be charged. Use Moov test credentials only.</p>
          </div>
        </div>

        <div class="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 flex items-start gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p class="text-blue-400 font-semibold text-sm">SHIPPO TEST MODE — NO REAL POSTAGE OR LABEL</p>
            <p class="text-blue-200/70 text-xs mt-0.5">Test shipping rates only. No real shipping label will be purchased.</p>
          </div>
        </div>
      </div>

      <div class="text-center mb-8">
        <div class="w-20 h-20 mx-auto mb-6 bg-primary-500/10 rounded-full flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <h1 class="text-3xl font-bold text-white mb-3">Pending Order Created</h1>
        <p class="text-dark-400 max-w-md mx-auto">
          Select a shipping option to continue. Final total is confirmed by the server.
        </p>
      </div>

      <div class="bg-dark-900 rounded-xl border border-dark-700 p-6 mb-6">
        <h2 class="text-lg font-semibold text-white mb-4">Order Details</h2>

        <div class="space-y-3 text-sm mb-6">
          <div class="flex justify-between">
            <span class="text-dark-400">Order Number</span>
            <span class="text-white font-mono">{{ orderNumber || '—' }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-dark-400">Contact email</span>
            <span class="text-white">{{ email || '—' }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-dark-400">Subtotal</span>
            <span class="text-white">{{ formatSubtotal }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-dark-400">Shipping</span>
            <span class="text-white">{{ formatShipping }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-dark-400">Tax</span>
            <span class="text-white">{{ formatTax }}</span>
          </div>
          <div class="flex justify-between text-white font-semibold text-base pt-2 border-t border-dark-700">
            <span>Total</span>
            <span>{{ formatTotal }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-dark-400">Shipping Status</span>
            <span class="inline-flex items-center gap-1.5" :class="shippingStatusColor">
              <span class="w-1.5 h-1.5 rounded-full" :class="shippingStatusDot"></span>
              {{ displayShippingStatus }}
            </span>
          </div>
          <div class="flex justify-between">
            <span class="text-dark-400">Payment Status</span>
            <span class="inline-flex items-center gap-1.5 text-yellow-400">
              <span class="w-1.5 h-1.5 rounded-full bg-yellow-400"></span>
              {{ displayPaymentStatus }}
            </span>
          </div>
        </div>

        <!-- Shipping rates -->
        <div class="border-t border-dark-700 pt-6">
          <h3 class="text-base font-semibold text-white mb-3">Shipping Options</h3>

          <div v-if="isLoadingRates" class="text-center py-4">
            <svg class="animate-spin h-5 w-5 text-primary-400 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p class="text-dark-400 text-sm">Loading shipping rates...</p>
          </div>

          <div v-else-if="rateError" class="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
            <p class="text-red-400 text-sm">{{ rateError }}</p>
          </div>

          <div v-else-if="rates.length === 0" class="text-dark-400 text-sm text-center py-4">
            No shipping rates available.
          </div>

          <div v-else class="space-y-2 mb-4">
            <label
              v-for="rate in rates"
              :key="rate.rateId"
              class="flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors"
              :class="selectedRateId === rate.rateId ? 'border-primary-500 bg-primary-500/10' : 'border-dark-600 bg-dark-800 hover:bg-dark-700'"
            >
              <div class="flex items-center gap-3">
                <input
                  v-model="selectedRateId"
                  type="radio"
                  name="shippingRate"
                  :value="rate.rateId"
                  class="w-4 h-4 text-primary-500 border-dark-600 bg-dark-900 focus:ring-primary-500"
                />
                <div class="text-sm">
                  <p class="text-white font-medium">{{ rate.carrier }} {{ rate.service }}</p>
                  <p class="text-dark-400 text-xs">
                    {{ rate.deliveryDays ? `${rate.deliveryDays} business days` : 'Delivery time varies' }}
                  </p>
                </div>
              </div>
              <span class="text-white font-semibold text-sm">{{ formatPrice(rate.amountCents) }}</span>
            </label>
          </div>

          <button
            @click="selectRate"
            :disabled="!selectedRateId || isSelectingRate || isLoadingRates || rates.length === 0"
            class="w-full mb-4 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-dark-700 disabled:text-dark-500 text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
          >
            <svg v-if="isSelectingRate" class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ isSelectingRate ? 'Selecting...' : 'Select Shipping Rate' }}
          </button>
        </div>

        <!-- Payment button -->
        <div class="border-t border-dark-700 pt-6">
          <button
            @click="goToPayment"
            :disabled="!canPay"
            class="w-full block py-4 bg-primary-500 hover:bg-primary-600 disabled:bg-dark-700 disabled:text-dark-500 text-white font-semibold rounded-lg text-center transition-colors flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            Continue to test payment
          </button>
          <p class="text-dark-500 text-xs text-center mt-3">
            {{ paymentButtonHint }}
          </p>
        </div>
      </div>

      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <NuxtLink to="/" class="px-8 py-3 bg-dark-800 hover:bg-dark-700 text-white font-semibold rounded-lg transition-colors text-center">
          Continue Shopping
        </NuxtLink>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { CURRENCY } from '~/constants'

interface ShippingRate {
  rateId: string
  carrier: string
  service: string
  serviceToken: string
  amountCents: number
  currency: string
  deliveryDays: number | null
  test: boolean
}

const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()

const isMoovTestMode = computed(() => (config.public.moovMode as string || 'test') === 'test')

const orderNumber = computed(() => (route.query.orderNumber as string) || '')
const email = computed(() => (route.query.email as string) || '')
const paymentStatus = computed(() => (route.query.paymentStatus as string) || 'pending')
const orderId = computed(() => Number(route.query.orderId) || 0)
const checkoutSessionToken = computed(() => (route.query.t as string) || '')

const subtotalCents = ref(0)
const shippingCents = ref(0)
const taxCents = ref(0)
const totalCents = ref(0)
const shippingStatus = ref('not_quoted')
const sessionExchanged = ref(false)
const exchangeError = ref<string | null>(null)

const isLoadingRates = ref(false)
const isSelectingRate = ref(false)
const rateError = ref<string | null>(null)
const rates = ref<ShippingRate[]>([])
const selectedRateId = ref('')

const displayPaymentStatus = computed(() => {
  const status = paymentStatus.value
  return status.charAt(0).toUpperCase() + status.slice(1)
})

const displayShippingStatus = computed(() => {
  const status = shippingStatus.value
  return status.split('_').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')
})

const shippingStatusColor = computed(() => {
  return shippingStatus.value === 'selected' ? 'text-green-400' : 'text-yellow-400'
})

const shippingStatusDot = computed(() => {
  return shippingStatus.value === 'selected' ? 'bg-green-400' : 'bg-yellow-400'
})

const formatPrice = (cents: number) => `${CURRENCY.SYMBOL}${(cents / 100).toFixed(2)}`
const formatSubtotal = computed(() => formatPrice(subtotalCents.value))
const formatShipping = computed(() => formatPrice(shippingCents.value))
const formatTax = computed(() => formatPrice(taxCents.value))
const formatTotal = computed(() => formatPrice(totalCents.value))

const canPay = computed(() => {
  return shippingStatus.value === 'selected' && totalCents.value > 0 && !isLoadingRates.value && !isSelectingRate.value
})

const paymentButtonHint = computed(() => {
  if (shippingStatus.value === 'selected') {
    return 'Payment collection will proceed with the server-confirmed total.'
  }
  return 'Select a shipping rate to continue to payment.'
})

async function exchangeSession() {
  const token = checkoutSessionToken.value
  if (!token || !orderId.value) return

  try {
    const result = await $fetch('/api/checkout/session', {
      method: 'POST',
      body: {
        orderId: orderId.value,
        checkoutSessionToken: token,
      },
      credentials: 'include',
    })

    sessionExchanged.value = true
    subtotalCents.value = (result as any).subtotalCents || 0
    shippingCents.value = (result as any).shippingCents || 0
    taxCents.value = (result as any).taxCents || 0
    totalCents.value = (result as any).totalCents || 0
    shippingStatus.value = (result as any).shippingStatus || 'not_quoted'

    // Replace URL to remove the plaintext token
    await router.replace({
      path: '/checkout/success',
      query: {
        orderId: orderId.value,
        orderNumber: orderNumber.value,
        email: email.value,
        totalCents: totalCents.value,
        paymentStatus: paymentStatus.value,
        shippingStatus: shippingStatus.value,
      },
    })
  } catch (err: any) {
    console.error('Session exchange error:', err)
    exchangeError.value = err.data?.message || err.message || 'Could not secure checkout session.'
  }
}

async function loadRates() {
  if (!orderId.value) return
  isLoadingRates.value = true
  rateError.value = null

  try {
    const result = await $fetch('/api/shipping/rates', {
      method: 'POST',
      body: {
        orderId: orderId.value,
        checkoutSessionToken: sessionExchanged.value ? undefined : checkoutSessionToken.value,
      },
      credentials: 'include',
    })
    rates.value = (result as any).rates || []
    shippingStatus.value = (result as any).shippingStatus || 'quoted'
    if (rates.value.length === 1 && shippingStatus.value === 'selected') {
      selectedRateId.value = rates.value[0].rateId
    }
    if ((result as any).totals) {
      const t = (result as any).totals
      subtotalCents.value = t.subtotalCents || 0
      shippingCents.value = t.shippingCostCents || 0
      taxCents.value = t.taxCents || 0
      totalCents.value = t.totalCents || 0
    }
  } catch (err: any) {
    console.error('Shipping rates error:', err)
    rateError.value = err.data?.message || err.message || 'Could not load shipping rates.'
  } finally {
    isLoadingRates.value = false
  }
}

async function selectRate() {
  if (!selectedRateId.value || !orderId.value) return
  isSelectingRate.value = true
  rateError.value = null

  try {
    const result = await $fetch('/api/shipping/select-rate', {
      method: 'POST',
      body: {
        orderId: orderId.value,
        checkoutSessionToken: sessionExchanged.value ? undefined : checkoutSessionToken.value,
        rateId: selectedRateId.value,
      },
      credentials: 'include',
    })

    const totals = (result as any).totals || {}
    shippingCents.value = totals.shippingCostCents || 0
    taxCents.value = totals.taxCents || 0
    totalCents.value = totals.totalCents || 0
    shippingStatus.value = (result as any).shippingStatus || 'selected'
  } catch (err: any) {
    console.error('Select rate error:', err)
    rateError.value = err.data?.message || err.message || 'Could not select shipping rate.'
  } finally {
    isSelectingRate.value = false
  }
}

function goToPayment() {
  router.push(`/checkout/payment?orderId=${orderId.value}`)
}

onMounted(async () => {
  if (import.meta.client && orderId.value && checkoutSessionToken.value) {
    await exchangeSession()
  }
  if (import.meta.client && orderId.value && shippingStatus.value !== 'selected' && shippingStatus.value !== 'label_purchased') {
    await loadRates()
  }
})

useHead({
  title: 'Select Shipping — Quantum Bio Peptides',
})
</script>
