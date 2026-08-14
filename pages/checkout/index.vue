<template>
  <div class="min-h-screen bg-dark-950 py-8">
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-white">Checkout</h1>
        <p class="text-dark-400 mt-2">Enter your details, select shipping, then continue to payment.</p>
      </div>

      <!-- Test mode notices -->
      <div v-if="isTestMode || isShippoTestMode" class="mb-6 space-y-3">
        <div
          v-if="isTestMode"
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

        <div
          v-if="isShippoTestMode"
          class="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 flex items-start gap-3"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p class="text-blue-400 font-semibold text-sm">SHIPPO TEST MODE — NO REAL POSTAGE</p>
            <p class="text-blue-200/70 text-xs mt-0.5">Test shipping rates only. No real shipping label will be purchased.</p>
          </div>
        </div>
      </div>

      <!-- Empty Cart (only when no pending checkout order) -->
      <div v-if="cartStore.isEmpty && !pendingOrderId" class="text-center py-16">
        <h2 class="text-xl font-semibold text-white mb-2">Your cart is empty</h2>
        <p class="text-dark-400 mb-8">Add some products before checking out.</p>
        <NuxtLink to="/" class="px-8 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors">
          Browse Products
        </NuxtLink>
      </div>

      <div v-else class="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8 pb-[max(1rem,env(safe-area-inset-bottom))]">

        <!-- Left: Form -->
        <div class="lg:col-span-3 space-y-5 sm:space-y-6 order-last lg:order-none">

          <!-- Contact Information -->
          <div class="bg-dark-900 rounded-xl border border-dark-700 p-6 space-y-4">
            <h2 class="text-lg font-semibold text-white">Contact Information</h2>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-dark-300 mb-1">First Name <span class="text-red-400">*</span></label>
                <input
                  v-model="form.firstName"
                  type="text"
                  placeholder="Jane"
                  :disabled="isBusy"
                  class="w-full min-h-[44px] px-4 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-base text-white placeholder-dark-500 focus:outline-none focus:border-primary-500 transition-colors disabled:opacity-60"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-dark-300 mb-1">Last Name <span class="text-red-400">*</span></label>
                <input
                  v-model="form.lastName"
                  type="text"
                  placeholder="Smith"
                  :disabled="isBusy"
                  class="w-full min-h-[44px] px-4 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-base text-white placeholder-dark-500 focus:outline-none focus:border-primary-500 transition-colors disabled:opacity-60"
                />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-dark-300 mb-1">Email <span class="text-red-400">*</span></label>
              <input
                v-model="form.email"
                type="email"
                placeholder="researcher@institution.edu"
                :disabled="isBusy"
                class="w-full min-h-[44px] px-4 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-base text-white placeholder-dark-500 focus:outline-none focus:border-primary-500 transition-colors disabled:opacity-60"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-dark-300 mb-1">Phone <span class="text-red-400">*</span></label>
              <input
                v-model="form.phone"
                type="tel"
                placeholder="(555) 123-4567"
                autocomplete="tel"
                :disabled="isBusy"
                class="w-full min-h-[44px] px-4 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-base text-white placeholder-dark-500 focus:outline-none focus:border-primary-500 transition-colors disabled:opacity-60"
              />
            </div>
          </div>

          <!-- Shipping Address -->
          <div class="bg-dark-900 rounded-xl border border-dark-700 p-6 space-y-4">
            <h2 class="text-lg font-semibold text-white">Shipping Address <span class="text-red-400">*</span></h2>

            <div>
              <label class="block text-sm font-medium text-dark-300 mb-1">Address Line 1</label>
              <input
                v-model="form.shippingAddress1"
                type="text"
                placeholder="123 Research Blvd"
                autocomplete="shipping address-line1"
                :disabled="isBusy"
                class="w-full min-h-[44px] px-4 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-base text-white placeholder-dark-500 focus:outline-none focus:border-primary-500 transition-colors disabled:opacity-60"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-dark-300 mb-1">Address Line 2 <span class="text-dark-500">(optional)</span></label>
              <input
                v-model="form.shippingAddress2"
                type="text"
                placeholder="Suite 100"
                autocomplete="shipping address-line2"
                :disabled="isBusy"
                class="w-full min-h-[44px] px-4 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-base text-white placeholder-dark-500 focus:outline-none focus:border-primary-500 transition-colors disabled:opacity-60"
              />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-dark-300 mb-1">City</label>
                <input
                  v-model="form.shippingCity"
                  type="text"
                  placeholder="Austin"
                  autocomplete="shipping locality"
                  :disabled="isBusy"
                  class="w-full min-h-[44px] px-4 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-base text-white placeholder-dark-500 focus:outline-none focus:border-primary-500 transition-colors disabled:opacity-60"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-dark-300 mb-1">State</label>
                <input
                  v-model="form.shippingState"
                  type="text"
                  placeholder="TX"
                  autocomplete="shipping region"
                  :disabled="isBusy"
                  class="w-full min-h-[44px] px-4 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-base text-white placeholder-dark-500 focus:outline-none focus:border-primary-500 transition-colors disabled:opacity-60"
                />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-dark-300 mb-1">ZIP Code</label>
                <input
                  v-model="form.shippingPostalCode"
                  type="text"
                  placeholder="78701"
                  autocomplete="shipping postal-code"
                  :disabled="isBusy"
                  class="w-full min-h-[44px] px-4 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-base text-white placeholder-dark-500 focus:outline-none focus:border-primary-500 transition-colors disabled:opacity-60"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-dark-300 mb-1">Country</label>
                <input
                  v-model="form.shippingCountry"
                  type="text"
                  placeholder="US"
                  disabled
                  class="w-full min-h-[44px] px-4 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-base text-white placeholder-dark-500 focus:outline-none focus:border-primary-500 transition-colors disabled:opacity-60"
                />
                <p class="text-dark-500 text-xs mt-1">US shipping only.</p>
              </div>
            </div>
          </div>

          <!-- Purchaser Confirmations -->
          <div class="bg-dark-900 rounded-xl border border-dark-700 p-6 space-y-4">
            <h2 class="text-lg font-semibold text-white">Purchaser Confirmations <span class="text-red-400">*</span></h2>

            <label class="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                v-model="form.ageConfirmed"
                :disabled="isBusy"
                class="mt-1 w-5 h-5 rounded border-dark-600 bg-dark-800 text-primary-500 focus:ring-primary-500 focus:ring-offset-dark-900 flex-shrink-0"
              />
              <span class="text-dark-300 group-hover:text-white transition-colors text-sm leading-relaxed">
                I confirm that I am at least 21 years old.
              </span>
            </label>

            <label class="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                v-model="form.researchUseConfirmed"
                :disabled="isBusy"
                class="mt-1 w-5 h-5 rounded border-dark-600 bg-dark-800 text-primary-500 focus:ring-primary-500 focus:ring-offset-dark-900 flex-shrink-0"
              />
              <span class="text-dark-300 group-hover:text-white transition-colors text-sm leading-relaxed">
                I understand that these products are supplied exclusively for laboratory research and are not intended for human or veterinary use.
              </span>
            </label>

            <label class="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                v-model="form.qualifiedPurchaserConfirmed"
                :disabled="isBusy"
                class="mt-1 w-5 h-5 rounded border-dark-600 bg-dark-800 text-primary-500 focus:ring-primary-500 focus:ring-offset-dark-900 flex-shrink-0"
              />
              <span class="text-dark-300 group-hover:text-white transition-colors text-sm leading-relaxed">
                I confirm that I am authorized and qualified to purchase and handle these materials for legitimate research purposes.
              </span>
            </label>

            <label class="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                v-model="form.termsAccepted"
                :disabled="isBusy"
                class="mt-1 w-5 h-5 rounded border-dark-600 bg-dark-800 text-primary-500 focus:ring-primary-500 focus:ring-offset-dark-900 flex-shrink-0"
              />
              <span class="text-dark-300 group-hover:text-white transition-colors text-sm leading-relaxed">
                I have reviewed and agree to the Terms of Sale, Shipping Policy, Refund Policy, and Privacy Policy.
              </span>
            </label>

            <label class="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                v-model="form.verificationAcknowledged"
                :disabled="isBusy"
                class="mt-1 w-5 h-5 rounded border-dark-600 bg-dark-800 text-primary-500 focus:ring-primary-500 focus:ring-offset-dark-900 flex-shrink-0"
              />
              <span class="text-dark-300 group-hover:text-white transition-colors text-sm leading-relaxed">
                I understand that an order may be refused or cancelled if the information provided cannot be verified.
              </span>
            </label>
          </div>

          <!-- Error -->
          <div v-if="error" class="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <p class="text-red-400 text-sm">{{ error }}</p>
          </div>

          <!-- Get Shipping Rates -->
          <button
            @click="getShippingRates"
            :disabled="!canGetRates || isBusy"
            class="w-full min-h-[48px] py-4 bg-primary-500 hover:bg-primary-600 disabled:bg-dark-700 disabled:text-dark-500 text-white font-semibold rounded-xl transition-all duration-200 text-lg flex items-center justify-center gap-2"
          >
            <svg v-if="isPreparing || isLoadingRates" class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ ratesButtonLabel }}
          </button>

          <p class="text-dark-500 text-xs text-center">
            Your order stays payment-pending. No charge and no shipping label on this step.
          </p>

          <!-- Shipping rates (inline) -->
          <div
            v-if="pendingOrderId || rates.length > 0 || isLoadingRates || rateError"
            class="bg-dark-900 rounded-xl border border-dark-700 p-6 space-y-4"
          >
            <div class="flex items-center justify-between gap-3">
              <h2 class="text-lg font-semibold text-white">Shipping Options</h2>
              <span
                v-if="orderNumber"
                class="text-dark-400 text-xs font-mono"
              >{{ orderNumber }}</span>
            </div>

            <div v-if="isLoadingRates" class="text-center py-6">
              <svg class="animate-spin h-5 w-5 text-primary-400 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p class="text-dark-400 text-sm">Loading shipping rates...</p>
            </div>

            <div v-else-if="rateError" class="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <p class="text-red-400 text-sm">{{ rateError }}</p>
            </div>

            <div v-else-if="rates.length === 0" class="text-dark-400 text-sm text-center py-4">
              No shipping rates available yet. Click “Get Shipping Rates” above.
            </div>

            <template v-else>
              <div class="space-y-2">
                <label
                  v-for="rate in rates"
                  :key="rate.rateId"
                  class="flex items-start sm:items-center gap-3 p-3.5 min-h-[56px] rounded-xl border cursor-pointer transition-colors"
                  :class="selectedRateId === rate.rateId ? 'border-primary-500 bg-primary-500/10' : 'border-dark-600 bg-dark-800 hover:bg-dark-700'"
                >
                  <input
                    v-model="selectedRateId"
                    type="radio"
                    name="shippingRate"
                    :value="rate.rateId"
                    :disabled="isBusy"
                    class="mt-1 sm:mt-0 h-5 w-5 shrink-0 text-primary-500 border-dark-600 bg-dark-900 focus:ring-primary-500"
                  />
                  <div class="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-3">
                    <div class="min-w-0">
                      <p class="text-white font-medium text-sm leading-snug">{{ rate.carrier }} — {{ rate.service }}</p>
                      <p class="text-dark-400 text-xs mt-0.5">
                        {{ rate.deliveryDays != null ? `${rate.deliveryDays} business days` : 'Delivery time varies' }}
                      </p>
                    </div>
                    <span class="text-white font-semibold text-sm tabular-nums shrink-0">{{ formatCents(rate.amountCents) }}</span>
                  </div>
                </label>
              </div>

              <button
                @click="selectShippingRate"
                :disabled="!selectedRateId || isBusy || (shippingStatus === 'selected' && selectedRateId === confirmedRateId)"
                class="w-full min-h-[48px] py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-dark-700 disabled:text-dark-500 text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
              >
                <svg v-if="isSelectingRate" class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {{ selectRateButtonLabel }}
              </button>
            </template>
          </div>

          <!-- Continue to Payment -->
          <button
            v-if="pendingOrderId"
            @click="continueToPayment"
            :disabled="!canContinueToPayment || isBusy"
            class="w-full min-h-[48px] py-4 bg-primary-500 hover:bg-primary-600 disabled:bg-dark-700 disabled:text-dark-500 text-white font-semibold rounded-xl transition-all duration-200 text-lg flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            Continue to Payment
          </button>

          <p v-if="pendingOrderId && !canContinueToPayment" class="text-dark-500 text-xs text-center">
            Select a shipping rate to enable payment.
          </p>

          <NuxtLink to="/cart" class="block text-center text-dark-400 hover:text-white transition-colors text-sm">
            ← Back to Cart
          </NuxtLink>
        </div>

        <!-- Right: Order Summary (first on mobile) -->
        <div class="lg:col-span-2 order-first lg:order-none">
          <div class="bg-dark-900 rounded-xl border border-dark-700 p-5 sm:p-6 lg:sticky lg:top-6">
            <h2 class="text-lg font-semibold text-white mb-4">Order Summary</h2>

            <div class="divide-y divide-dark-800">
              <div
                v-for="item in cartStore.items"
                :key="item.variantId"
                class="flex justify-between py-3 text-sm gap-3"
              >
                <div class="pr-2 min-w-0">
                  <p class="text-white font-medium leading-snug">{{ item.productName }}</p>
                  <p class="text-dark-400">{{ item.variantName }} × {{ item.quantity }}</p>
                </div>
                <p class="text-white whitespace-nowrap shrink-0">{{ formatPrice(item.unitPrice * item.quantity) }}</p>
              </div>
            </div>

            <div class="border-t border-dark-700 mt-4 pt-4 space-y-2 text-sm">
              <div class="flex justify-between text-dark-300">
                <span>Subtotal</span>
                <span>{{ formatCents(displaySubtotalCents) }}</span>
              </div>
              <div class="flex justify-between" :class="shippingStatus === 'selected' ? 'text-dark-300' : 'text-dark-500'">
                <span>Shipping</span>
                <span>{{ shippingStatus === 'selected' ? formatCents(shippingCents) : 'Select a rate' }}</span>
              </div>
              <div class="flex justify-between text-dark-500">
                <span>Tax</span>
                <span>{{ formatCents(taxCents) }}</span>
              </div>
              <div class="flex justify-between text-white font-semibold text-base pt-2 border-t border-dark-700">
                <span>Total</span>
                <span>{{ formatCents(displayTotalCents) }}</span>
              </div>
            </div>

            <p
              v-if="shippingStatus === 'selected'"
              class="text-green-400/80 text-xs mt-4 leading-relaxed"
            >
              Shipping selected. Total confirmed by the server.
            </p>
            <p
              v-else
              class="text-dark-500 text-xs mt-4 leading-relaxed"
            >
              Shipping and tax are calculated after you select a rate. Final total is confirmed by the server.
            </p>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, watch } from 'vue'
import { useCartStore } from '~/stores/cart'
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

const cartStore = useCartStore()
const router = useRouter()

const config = useRuntimeConfig()
const isTestMode = computed(() => (config.public.moovMode as string || 'test') === 'test')
const isShippoTestMode = computed(() => {
  const mode = String(config.public.shippoMode || 'test').toLowerCase()
  return mode !== 'live' && mode !== 'production'
})

const isPreparing = ref(false)
const isLoadingRates = ref(false)
const isSelectingRate = ref(false)
const error = ref<string | null>(null)
const rateError = ref<string | null>(null)

const pendingOrderId = ref<number | null>(null)
const orderNumber = ref('')
const idempotencyKey = ref('')
const checkoutSessionToken = ref('')

const rates = ref<ShippingRate[]>([])
const selectedRateId = ref('')
const confirmedRateId = ref('')
const shippingStatus = ref('not_quoted')

const subtotalCents = ref(0)
const shippingCents = ref(0)
const taxCents = ref(0)
const totalCents = ref(0)

const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  shippingAddress1: '',
  shippingAddress2: '',
  shippingCity: '',
  shippingState: '',
  shippingPostalCode: '',
  shippingCountry: 'US',
  ageConfirmed: false,
  researchUseConfirmed: false,
  qualifiedPurchaserConfirmed: false,
  termsAccepted: false,
  verificationAcknowledged: false,
})

const isBusy = computed(() => isPreparing.value || isLoadingRates.value || isSelectingRate.value)

const allConfirmationsAccepted = computed(() => {
  return (
    form.ageConfirmed === true &&
    form.researchUseConfirmed === true &&
    form.qualifiedPurchaserConfirmed === true &&
    form.termsAccepted === true &&
    form.verificationAcknowledged === true
  )
})

const canGetRates = computed(() => {
  return (
    form.firstName.trim() &&
    form.lastName.trim() &&
    form.email.trim() &&
    form.phone.trim() &&
    form.shippingAddress1.trim() &&
    form.shippingCity.trim() &&
    form.shippingState.trim() &&
    form.shippingPostalCode.trim() &&
    form.shippingCountry.trim() &&
    allConfirmationsAccepted.value &&
    (!cartStore.isEmpty || !!pendingOrderId.value)
  )
})

const canContinueToPayment = computed(() => {
  return (
    !!pendingOrderId.value &&
    shippingStatus.value === 'selected' &&
    totalCents.value > 0 &&
    !isBusy.value
  )
})

const displaySubtotalCents = computed(() => {
  if (subtotalCents.value > 0) return subtotalCents.value
  return Math.round(cartStore.subtotal * 100)
})

const displayTotalCents = computed(() => {
  if (shippingStatus.value === 'selected' && totalCents.value > 0) return totalCents.value
  if (subtotalCents.value > 0) return subtotalCents.value + shippingCents.value + taxCents.value
  return Math.round(cartStore.subtotal * 100)
})

const ratesButtonLabel = computed(() => {
  if (isPreparing.value) return 'Preparing Order...'
  if (isLoadingRates.value) return 'Getting Rates...'
  if (rates.value.length > 0) return 'Refresh Shipping Rates'
  return 'Get Shipping Rates'
})

const selectRateButtonLabel = computed(() => {
  if (isSelectingRate.value) return 'Selecting...'
  if (shippingStatus.value === 'selected' && selectedRateId.value === confirmedRateId.value) {
    return 'Shipping Rate Selected'
  }
  return 'Select Shipping Rate'
})

const formatPrice = (price: number) => `${CURRENCY.SYMBOL}${price.toFixed(2)}`
const formatCents = (cents: number) => `${CURRENCY.SYMBOL}${(cents / 100).toFixed(2)}`

function generateIdempotencyKey(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function resetShippingQuoteState() {
  rates.value = []
  selectedRateId.value = ''
  confirmedRateId.value = ''
  shippingStatus.value = pendingOrderId.value ? 'not_quoted' : 'not_quoted'
  shippingCents.value = 0
  if (subtotalCents.value > 0) {
    totalCents.value = subtotalCents.value + taxCents.value
  }
}

// If contact/address/attestations change after a quote, require a fresh quote.
watch(
  () => [
    form.firstName,
    form.lastName,
    form.email,
    form.phone,
    form.shippingAddress1,
    form.shippingAddress2,
    form.shippingCity,
    form.shippingState,
    form.shippingPostalCode,
    form.ageConfirmed,
    form.researchUseConfirmed,
    form.qualifiedPurchaserConfirmed,
    form.termsAccepted,
    form.verificationAcknowledged,
  ],
  () => {
    // Changing contact/address after prepare means rates must be re-quoted on a fresh pending order.
    if (!pendingOrderId.value && rates.value.length === 0) return

    pendingOrderId.value = null
    orderNumber.value = ''
    checkoutSessionToken.value = ''
    idempotencyKey.value = ''
    subtotalCents.value = 0
    taxCents.value = 0
    totalCents.value = 0
    resetShippingQuoteState()
    rateError.value = null
  }
)

async function prepareOrder() {
  if (!idempotencyKey.value) {
    idempotencyKey.value = generateIdempotencyKey()
  }

  const response = await $fetch<{
    ok: boolean
    orderId: number
    orderNumber: string
    currency: string
    subtotalCents: number
    shippingCents: number
    taxCents: number
    totalCents: number
    paymentStatus: string
    shippingStatus: string
    checkoutSessionToken: string
  }>('/api/checkout/prepare', {
    method: 'POST',
    credentials: 'include',
    body: {
      items: cartStore.items.map((item) => ({
        variantId: item.variantId,
        quantity: item.quantity,
      })),
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      shippingAddress1: form.shippingAddress1.trim(),
      shippingAddress2: form.shippingAddress2.trim(),
      shippingCity: form.shippingCity.trim(),
      shippingState: form.shippingState.trim(),
      shippingPostalCode: form.shippingPostalCode.trim(),
      shippingCountry: form.shippingCountry.trim().toUpperCase(),
      ageConfirmed: form.ageConfirmed === true,
      researchUseConfirmed: form.researchUseConfirmed === true,
      qualifiedPurchaserConfirmed: form.qualifiedPurchaserConfirmed === true,
      termsAccepted: form.termsAccepted === true,
      verificationAcknowledged: form.verificationAcknowledged === true,
      idempotencyKey: idempotencyKey.value,
    },
  })

  pendingOrderId.value = response.orderId
  orderNumber.value = response.orderNumber
  checkoutSessionToken.value = response.checkoutSessionToken
  subtotalCents.value = response.subtotalCents || 0
  shippingCents.value = response.shippingCents || 0
  taxCents.value = response.taxCents || 0
  totalCents.value = response.totalCents || 0
  shippingStatus.value = response.shippingStatus || 'not_quoted'

  return response
}

async function loadRates(orderId: number) {
  const result = await $fetch<{
    ok: boolean
    rates: ShippingRate[]
    shippingStatus: string
    totals?: {
      subtotalCents?: number
      shippingCostCents?: number
      taxCents?: number
      totalCents?: number
    }
  }>('/api/shipping/rates', {
    method: 'POST',
    credentials: 'include',
    body: {
      orderId,
      // Cookie is primary; token is a same-page fallback right after prepare.
      checkoutSessionToken: checkoutSessionToken.value || undefined,
    },
  })

  rates.value = result.rates || []
  shippingStatus.value = result.shippingStatus || 'quoted'
  selectedRateId.value = ''
  confirmedRateId.value = ''
  shippingCents.value = 0

  if (result.totals) {
    subtotalCents.value = result.totals.subtotalCents || subtotalCents.value
    taxCents.value = result.totals.taxCents || taxCents.value
    totalCents.value = result.totals.totalCents || totalCents.value
  } else if (subtotalCents.value > 0) {
    totalCents.value = subtotalCents.value + taxCents.value
  }
}

async function getShippingRates() {
  error.value = null
  rateError.value = null

  if (!canGetRates.value) {
    error.value = 'Please fill in all required fields and accept every purchaser confirmation.'
    return
  }

  if (isBusy.value) return

  isPreparing.value = true

  try {
    let orderId = pendingOrderId.value

    if (!orderId) {
      if (cartStore.isEmpty) {
        error.value = 'Your cart is empty.'
        return
      }
      const prepared = await prepareOrder()
      orderId = prepared.orderId
    }

    isPreparing.value = false
    isLoadingRates.value = true

    await loadRates(orderId)
  } catch (err: any) {
    console.error('Get shipping rates error:', err)
    const message = err.data?.message || err.message || 'An error occurred. Please try again.'
    if (pendingOrderId.value) {
      rateError.value = message
    } else {
      error.value = message
    }
  } finally {
    isPreparing.value = false
    isLoadingRates.value = false
  }
}

async function selectShippingRate() {
  if (!selectedRateId.value || !pendingOrderId.value || isBusy.value) return

  isSelectingRate.value = true
  rateError.value = null
  error.value = null

  try {
    const result = await $fetch<{
      ok: boolean
      rate: ShippingRate
      totals: {
        subtotalCents: number
        shippingCostCents: number
        taxCents: number
        discountCents: number
        totalCents: number
      }
      shippingStatus: string
    }>('/api/shipping/select-rate', {
      method: 'POST',
      credentials: 'include',
      body: {
        orderId: pendingOrderId.value,
        checkoutSessionToken: checkoutSessionToken.value || undefined,
        rateId: selectedRateId.value,
      },
    })

    const totals = result.totals || ({} as any)
    subtotalCents.value = totals.subtotalCents || subtotalCents.value
    shippingCents.value = totals.shippingCostCents || 0
    taxCents.value = totals.taxCents || 0
    totalCents.value = totals.totalCents || 0
    shippingStatus.value = result.shippingStatus || 'selected'
    confirmedRateId.value = selectedRateId.value
  } catch (err: any) {
    console.error('Select rate error:', err)
    rateError.value = err.data?.message || err.message || 'Could not select shipping rate.'
  } finally {
    isSelectingRate.value = false
  }
}

function continueToPayment() {
  if (!canContinueToPayment.value || !pendingOrderId.value) return

  // Keep cart until payment succeeds so back-navigation from payment still works.
  // Prefer cookie-backed session; only pass orderId (no plaintext token in URL).
  router.push(`/checkout/payment?orderId=${pendingOrderId.value}`)
}

useHead({
  title: 'Checkout — Quantum Bio Peptides',
})
</script>
