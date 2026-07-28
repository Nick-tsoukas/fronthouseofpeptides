<template>
  <div class="payment-page min-h-screen bg-dark-950">
    <div class="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8 py-10 lg:py-12">

      <div class="mb-8 max-w-3xl">
        <h1 class="text-3xl sm:text-4xl font-bold text-white tracking-tight">Secure Payment</h1>
        <p class="text-dark-300 mt-2 text-base sm:text-lg leading-relaxed">
          Pay securely with a debit or credit card.
        </p>
      </div>

      <div
        v-if="needsHttps"
        class="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3.5"
      >
        <p class="text-red-400 font-semibold text-sm">HTTPS required for card payment</p>
        <p class="text-red-200/80 text-sm mt-1 leading-relaxed">
          Moov card fields only load on HTTPS pages. Use a tunnel or production HTTPS URL and set
          <code class="text-red-300">APP_URL</code> to that origin.
        </p>
      </div>

      <div
        v-if="isTestMode"
        class="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3.5 flex items-start gap-3"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <div>
          <p class="text-amber-400 font-semibold text-sm">MOOV TEST MODE — NO REAL MONEY</p>
          <p class="text-amber-100/70 text-xs mt-1 leading-relaxed">
            Use Moov test card 4111 1111 1111 1111, any future expiration, CVV 111, and ZIP 11111.
          </p>
        </div>
      </div>

      <div
        v-if="isLoading"
        class="rounded-2xl border border-slate-700/80 bg-dark-900/80 px-6 py-16 text-center shadow-xl shadow-black/20"
      >
        <div class="mx-auto mb-4 h-10 w-10 rounded-full border-2 border-primary-500/30 border-t-primary-400 animate-spin" />
        <p class="text-dark-300 text-sm">Loading secure payment form…</p>
      </div>

      <div
        v-else-if="error"
        class="rounded-2xl border border-red-500/30 bg-red-500/10 p-6"
      >
        <p class="text-red-400 text-sm leading-relaxed">{{ error }}</p>
        <div class="mt-4 flex flex-wrap gap-3">
          <button
            @click="loadSession"
            class="px-4 py-2.5 rounded-xl bg-dark-800 hover:bg-dark-700 border border-dark-600 text-white text-sm font-medium transition-colors"
          >
            Try Again
          </button>
          <NuxtLink
            to="/checkout"
            class="px-4 py-2.5 rounded-xl bg-dark-800 hover:bg-dark-700 border border-dark-600 text-white text-sm font-medium transition-colors"
          >
            Return to Checkout
          </NuxtLink>
        </div>
      </div>

      <div
        v-else-if="paymentBlocked"
        class="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6"
      >
        <p class="text-amber-400 text-sm font-semibold">Shipping must be selected first</p>
        <p class="text-amber-100/70 text-sm mt-1">{{ paymentBlocked }}</p>
        <NuxtLink
          to="/checkout"
          class="mt-4 inline-flex px-4 py-2.5 rounded-xl bg-dark-800 hover:bg-dark-700 border border-dark-600 text-white text-sm font-medium transition-colors"
        >
          Return to Checkout
        </NuxtLink>
      </div>

      <div
        v-else
        class="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start"
      >
        <section class="rounded-2xl border border-slate-600/50 bg-gradient-to-b from-dark-900 to-dark-950 p-6 sm:p-8 shadow-xl shadow-black/25">
          <div class="mb-6">
            <h2 class="text-xl font-semibold text-white">Card Payment</h2>
            <p class="mt-2 flex items-start gap-2 text-dark-400 text-sm leading-relaxed">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-primary-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Card details are encrypted and processed securely by Moov.
            </p>
          </div>

          <div
            v-if="invalidTotal"
            class="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3"
          >
            <p class="text-red-400 text-sm">
              Order total is missing or invalid. Return to checkout and select shipping again.
            </p>
          </div>

          <div
            v-if="paymentStage === 'paid'"
            class="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-4"
          >
            <p class="text-emerald-400 text-sm font-semibold">Payment confirmed</p>
            <p class="text-emerald-100/80 text-sm mt-1">Redirecting to your order confirmation…</p>
          </div>

          <div v-else class="relative">
            <div
              v-if="paymentStage === 'preparing' || paymentStage === 'processing_payment'"
              class="rounded-xl border border-primary-500/30 bg-primary-500/10 px-4 py-5 text-center mb-4"
            >
              <div class="mx-auto mb-3 h-8 w-8 rounded-full border-2 border-primary-500/30 border-t-primary-400 animate-spin" />
              <p class="text-primary-300 text-sm font-semibold">{{ busyMessage }}</p>
            </div>

            <!-- Keep Moov Drop mounted across retries — remounting loses accountID -->
            <div
              :class="{
                'opacity-0 pointer-events-none absolute inset-0 overflow-hidden h-0':
                  paymentStage === 'preparing' || paymentStage === 'processing_payment',
              }"
            >
            <!-- Contact / billing -->
            <div class="mb-6 space-y-4" :class="{ 'opacity-60 pointer-events-none': paymentStage === 'card_submitting' }">
              <h3 class="text-sm font-semibold text-white tracking-wide">Billing & contact</h3>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label class="block">
                  <span class="text-xs text-dark-400 mb-1.5 block">First name</span>
                  <input v-model="firstName" type="text" class="pay-input" autocomplete="given-name" />
                </label>
                <label class="block">
                  <span class="text-xs text-dark-400 mb-1.5 block">Last name</span>
                  <input v-model="lastName" type="text" class="pay-input" autocomplete="family-name" />
                </label>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label class="block">
                  <span class="text-xs text-dark-400 mb-1.5 block">Email</span>
                  <input v-model="email" type="email" class="pay-input" autocomplete="email" />
                </label>
                <label class="block">
                  <span class="text-xs text-dark-400 mb-1.5 block">Phone</span>
                  <input v-model="phone" type="tel" class="pay-input" autocomplete="tel" />
                </label>
              </div>

              <label class="block">
                <span class="text-xs text-dark-400 mb-1.5 block">Cardholder name</span>
                <input v-model="cardholderName" type="text" class="pay-input" autocomplete="cc-name" />
              </label>

              <label class="flex items-start gap-3 cursor-pointer select-none pt-1">
                <input
                  v-model="billingSameAsShipping"
                  type="checkbox"
                  class="mt-1 h-4 w-4 rounded border-dark-500 bg-dark-800 text-primary-500 focus:ring-primary-500"
                />
                <span class="text-sm text-dark-200 leading-snug">Billing address same as shipping</span>
              </label>

              <div v-if="billingSameAsShipping" class="rounded-xl border border-dark-700/80 bg-dark-950/60 px-4 py-3 text-sm text-dark-300 leading-relaxed">
                <p class="text-dark-500 text-xs uppercase tracking-wider mb-1.5">Shipping address</p>
                <p class="text-white">{{ firstName }} {{ lastName }}</p>
                <p>{{ shippingAddress1 }}</p>
                <p v-if="shippingAddress2">{{ shippingAddress2 }}</p>
                <p>{{ shippingCity }}, {{ shippingState }} {{ shippingPostalCode }}</p>
                <p>{{ shippingCountry }}</p>
              </div>

              <div v-else class="space-y-3">
                <label class="block">
                  <span class="text-xs text-dark-400 mb-1.5 block">Billing name</span>
                  <input v-model="billingName" type="text" class="pay-input" autocomplete="name" />
                </label>
                <label class="block">
                  <span class="text-xs text-dark-400 mb-1.5 block">Address line 1</span>
                  <input v-model="billingAddress1" type="text" class="pay-input" autocomplete="billing address-line1" />
                </label>
                <label class="block">
                  <span class="text-xs text-dark-400 mb-1.5 block">Address line 2</span>
                  <input v-model="billingAddress2" type="text" class="pay-input" autocomplete="billing address-line2" />
                </label>
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <label class="block col-span-2">
                    <span class="text-xs text-dark-400 mb-1.5 block">City</span>
                    <input v-model="billingCity" type="text" class="pay-input" autocomplete="billing address-level2" />
                  </label>
                  <label class="block">
                    <span class="text-xs text-dark-400 mb-1.5 block">State</span>
                    <input v-model="billingState" type="text" class="pay-input" autocomplete="billing address-level1" />
                  </label>
                  <label class="block">
                    <span class="text-xs text-dark-400 mb-1.5 block">ZIP</span>
                    <input v-model="billingPostalCode" type="text" class="pay-input" autocomplete="billing postal-code" />
                  </label>
                </div>
                <label class="block">
                  <span class="text-xs text-dark-400 mb-1.5 block">Country</span>
                  <input v-model="billingCountry" type="text" class="pay-input" autocomplete="billing country" />
                </label>
              </div>
            </div>

            <div class="mb-2" :class="{ 'opacity-60 pointer-events-none': paymentStage === 'card_submitting' }">
              <h3 class="text-sm font-semibold text-white tracking-wide mb-3">Card details</h3>
              <ClientOnly>
                <div class="payment-card-drop-shell">
                  <moov-card-link
                    v-if="showCardForm"
                    ref="cardLinkRef"
                  ></moov-card-link>
                  <div v-else class="py-8 text-center text-dark-400 text-sm">
                    Loading secure payment form…
                  </div>
                </div>
                <template #fallback>
                  <div class="payment-card-drop-shell py-8 text-center text-dark-400 text-sm">
                    Loading secure payment form…
                  </div>
                </template>
              </ClientOnly>
            </div>

            <div
              v-if="cardError"
              class="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3"
            >
              <p class="text-red-400 text-sm leading-relaxed">{{ cardError }}</p>
            </div>

            <p
              v-if="cardLinkedOnServer && paymentStage === 'ready'"
              class="mt-4 text-emerald-400/90 text-sm"
            >
              Card verified. Click Pay to submit the test payment.
            </p>

            <button
              @click="submitPayment"
              :disabled="!canPay"
              class="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-base font-semibold transition-all duration-200
                bg-primary-500 hover:bg-primary-600 text-white
                disabled:bg-dark-800 disabled:text-dark-500 disabled:border disabled:border-dark-700 disabled:cursor-not-allowed
                shadow-lg shadow-primary-500/10 disabled:shadow-none"
            >
              <svg v-if="paymentStage === 'card_submitting'" class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ payButtonLabel }}
            </button>
            </div>
          </div>

          <p class="mt-5 text-center text-dark-500 text-[11px] tracking-wide">
            Powered by Moov secure payment infrastructure.
          </p>
        </section>

        <aside class="lg:sticky lg:top-8 order-first lg:order-none">
          <div class="rounded-2xl border border-slate-600/50 bg-dark-900/95 p-6 shadow-xl shadow-black/20">
            <h2 class="text-lg font-semibold text-white mb-5">Order Summary</h2>

            <div class="space-y-3 text-sm">
              <div class="flex justify-between gap-4">
                <span class="text-dark-400">Order</span>
                <span class="text-white font-mono text-xs sm:text-sm text-right">{{ orderNumber || '—' }}</span>
              </div>
              <div class="flex justify-between gap-4">
                <span class="text-dark-400">Shipping method</span>
                <span class="text-white text-right">
                  <template v-if="shippingCarrier || shippingService">
                    {{ shippingCarrier }}{{ shippingCarrier && shippingService ? ' — ' : '' }}{{ shippingService }}
                  </template>
                  <template v-else>Selected</template>
                </span>
              </div>
              <div class="flex justify-between gap-4">
                <span class="text-dark-400">Shipping status</span>
                <span class="inline-flex items-center gap-1.5 text-emerald-400">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  {{ displayShippingStatus }}
                </span>
              </div>
              <div class="flex justify-between gap-4">
                <span class="text-dark-400">Payment status</span>
                <span class="inline-flex items-center gap-1.5" :class="paymentStatusClass">
                  <span class="w-1.5 h-1.5 rounded-full" :class="paymentStatusDotClass"></span>
                  {{ displayPaymentStatus }}
                </span>
              </div>
            </div>

            <div class="mt-5 pt-5 border-t border-dark-700 space-y-2.5 text-sm">
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

            <p class="text-dark-500 text-xs mt-5 leading-relaxed">
              Totals come from the pending order on the server. This page does not use cart localStorage.
            </p>
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { CURRENCY } from '~/constants'

interface CardSessionResponse {
  ok?: boolean
  paymentBlocked?: string
  accessToken?: string
  customerAccountId?: string
  merchantAccountId?: string
  mode?: string
  expiresIn?: number
  customerName?: string
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  shippingAddress1?: string
  shippingAddress2?: string
  shippingCity?: string
  shippingState?: string
  shippingPostalCode?: string
  shippingCountry?: string
  orderNumber?: string
  subtotalCents?: number
  shippingCostCents?: number
  taxCents?: number
  discountCents?: number
  totalCents?: number
  paymentStatus?: string
  shippingStatus?: string
  shippingCarrier?: string
  shippingService?: string
  shippingDeliveryDays?: number | null
}

type PaymentStage =
  | 'ready'
  | 'card_submitting'
  | 'preparing'
  | 'processing_payment'
  | 'paid'
  | 'failed'

const MOOV_INPUT_STYLE = {
  color: '#f8fafc',
  backgroundColor: 'transparent',
  fontSize: '16px',
  fontFamily: 'inherit',
  lineHeight: '1.4',
}

const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()

const orderId = Number(route.query.orderId)
const orderNumber = ref('')
const subtotalCents = ref(0)
const shippingCostCents = ref(0)
const taxCents = ref(0)
const totalCents = ref(0)
const paymentStatus = ref('pending')
const shippingStatus = ref('')
const shippingCarrier = ref('')
const shippingService = ref('')
const paymentBlocked = ref<string | null>(null)
const needsHttps = ref(false)
const paymentStage = ref<PaymentStage>('ready')

const firstName = ref('')
const lastName = ref('')
const email = ref('')
const phone = ref('')
const cardholderName = ref('')
const shippingAddress1 = ref('')
const shippingAddress2 = ref('')
const shippingCity = ref('')
const shippingState = ref('')
const shippingPostalCode = ref('')
const shippingCountry = ref('US')

const billingSameAsShipping = ref(true)
const billingName = ref('')
const billingAddress1 = ref('')
const billingAddress2 = ref('')
const billingCity = ref('')
const billingState = ref('')
const billingPostalCode = ref('')
const billingCountry = ref('US')

const isTestMode = computed(() => (config.public.moovMode as string || 'test') === 'test')
const invalidTotal = computed(() => !totalCents.value || totalCents.value <= 0)
const formatCents = (cents: number) => `${CURRENCY.SYMBOL}${((Number(cents) || 0) / 100).toFixed(2)}`

const isBusy = computed(() =>
  ['card_submitting', 'preparing', 'processing_payment'].includes(paymentStage.value)
)

const busyMessage = computed(() => {
  if (paymentStage.value === 'preparing') return 'Card verified. Preparing payment…'
  return 'Processing secure payment…'
})

const displayPaymentStatus = computed(() => {
  if (paymentStage.value === 'paid' || paymentStatus.value === 'paid') return 'Paid'
  if (isBusy.value || paymentStatus.value === 'processing') return 'Processing'
  if (paymentStatus.value === 'failed' || paymentStage.value === 'failed') return 'Failed'
  const status = paymentStatus.value || 'pending'
  return status.charAt(0).toUpperCase() + status.slice(1)
})

const paymentStatusClass = computed(() => {
  if (paymentStage.value === 'paid' || paymentStatus.value === 'paid') return 'text-emerald-400'
  if (paymentStatus.value === 'failed' || paymentStage.value === 'failed') return 'text-red-400'
  return 'text-amber-400'
})

const paymentStatusDotClass = computed(() => {
  if (paymentStage.value === 'paid' || paymentStatus.value === 'paid') return 'bg-emerald-400'
  if (paymentStatus.value === 'failed' || paymentStage.value === 'failed') return 'bg-red-400'
  return 'bg-amber-400'
})

const displayShippingStatus = computed(() => {
  const status = shippingStatus.value || 'selected'
  return status.split('_').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')
})

const isLoading = ref(true)
const error = ref<string | null>(null)
const cardError = ref<string | null>(null)

const accessToken = ref('')
const customerAccountId = ref('')
const merchantAccountId = ref('')

const cardReady = ref(false)
const showCardForm = ref(false)
const cardLinkRef = ref<any>(null)
const cardLinkedOnServer = ref(false)

const payButtonLabel = computed(() => {
  if (paymentStage.value === 'card_submitting') return 'Processing secure payment…'
  if (!cardReady.value && !cardLinkedOnServer.value) return 'Loading secure payment form…'
  if (cardLinkedOnServer.value) return `Pay ${formatCents(totalCents.value)}`
  return `Pay ${formatCents(totalCents.value)}`
})

const canPay = computed(() => {
  const sessionOk =
    !isBusy.value &&
    !needsHttps.value &&
    !invalidTotal.value &&
    paymentStage.value === 'ready' &&
    Boolean(cardholderName.value.trim()) &&
    Boolean(effectiveBillingAddress().postalCode)

  if (cardLinkedOnServer.value) return sessionOk
  return sessionOk && cardReady.value && showCardForm.value
})

let pollTimer: ReturnType<typeof setTimeout> | null = null
let pollAttempts = 0
let submitWatchdog: ReturnType<typeof setTimeout> | null = null
const MAX_POLL_ATTEMPTS = 40
const CARD_SUBMIT_TIMEOUT_MS = 45000

function effectiveBillingAddress() {
  if (billingSameAsShipping.value) {
    return {
      addressLine1: shippingAddress1.value,
      addressLine2: shippingAddress2.value || undefined,
      city: shippingCity.value,
      stateOrProvince: shippingState.value,
      postalCode: shippingPostalCode.value,
      country: shippingCountry.value || 'US',
    }
  }
  return {
    addressLine1: billingAddress1.value,
    addressLine2: billingAddress2.value || undefined,
    city: billingCity.value,
    stateOrProvince: billingState.value,
    postalCode: billingPostalCode.value,
    country: billingCountry.value || 'US',
  }
}

function stopPolling() {
  if (pollTimer) {
    clearTimeout(pollTimer)
    pollTimer = null
  }
}

function normalizeMoovSuccessPayload(payload: any): any {
  if (!payload) return null
  if (typeof payload === 'string') return { cardID: payload }
  if (typeof CustomEvent !== 'undefined' && payload instanceof CustomEvent) return payload.detail
  if (payload?.detail != null && typeof payload.detail === 'object') return payload.detail
  return payload
}

function extractMoovCardId(payload: any): string | null {
  const normalized = normalizeMoovSuccessPayload(payload)
  const candidates = [
    normalized?.cardID,
    normalized?.cardId,
    normalized?.id,
    normalized?.result?.cardID,
    normalized?.result?.cardId,
    normalized?.data?.cardID,
    normalized?.data?.cardId,
    normalized?.card?.cardID,
    normalized?.card?.cardId,
    payload?.cardID,
    payload?.cardId,
    payload?.detail?.cardID,
    payload?.detail?.cardId,
    payload?.detail?.result?.cardID,
    payload?.detail?.data?.cardID,
  ]

  for (const value of candidates) {
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return null
}

function getCardLinkElement(): any {
  if (!import.meta.client) return null
  const refVal = cardLinkRef.value as any
  if (refVal && typeof refVal.submit === 'function') return refVal
  if (refVal?.$el && typeof refVal.$el.submit === 'function') return refVal.$el
  return document.querySelector('moov-card-link') as any
}

function applyBillingToDrop(drop: any) {
  const name = cardholderName.value.trim() || `${firstName.value} ${lastName.value}`.trim()
  if (name) drop.holderName = name

  const billing = effectiveBillingAddress()
  // Only send clean string fields — undefined keys can break the Drop iframe.
  const clean: Record<string, string> = {
    postalCode: String(billing.postalCode || '').trim(),
    country: String(billing.country || 'US').trim() || 'US',
  }
  if (billing.addressLine1) clean.addressLine1 = String(billing.addressLine1).trim()
  if (billing.addressLine2) clean.addressLine2 = String(billing.addressLine2).trim()
  if (billing.city) clean.city = String(billing.city).trim()
  if (billing.stateOrProvince) clean.stateOrProvince = String(billing.stateOrProvince).trim()
  drop.billingAddress = clean
}

function clearSubmitWatchdog() {
  if (submitWatchdog) {
    clearTimeout(submitWatchdog)
    submitWatchdog = null
  }
}

function armSubmitWatchdog() {
  clearSubmitWatchdog()
  submitWatchdog = setTimeout(() => {
    if (paymentStage.value !== 'card_submitting') return
    console.error('Moov card submit timed out without success/error callback')
    cardError.value =
      'Payment form timed out. Please check your card details and try again.'
    paymentStage.value = 'ready'
  }, CARD_SUBMIT_TIMEOUT_MS)
}

function configureCardLinkDrop(retries = 0) {
  const drop = getCardLinkElement()
  if (drop && typeof drop.submit === 'function') {
    drop.oauthToken = accessToken.value
    drop.accountID = customerAccountId.value
    drop.merchantAccountID = merchantAccountId.value
    drop.cardOnFile = true
    drop.inputStyle = { ...MOOV_INPUT_STYLE }
    applyBillingToDrop(drop)
    drop.onSuccess = handleCardSuccess
    drop.onError = handleCardError

    if (typeof drop.addEventListener === 'function' && !drop.__qbpSuccessBound) {
      drop.addEventListener('success', (event: any) => handleCardSuccess(event))
      drop.__qbpSuccessBound = true
    }

    cardReady.value = true
    return
  }

  if (retries < 20) {
    setTimeout(() => configureCardLinkDrop(retries + 1), 100)
  } else {
    cardReady.value = false
    error.value = 'Secure payment form could not be initialized.'
  }
}

function applyOrderSummary(session: CardSessionResponse) {
  orderNumber.value = session.orderNumber || ''
  subtotalCents.value = Number(session.subtotalCents) || 0
  shippingCostCents.value = Number(session.shippingCostCents) || 0
  taxCents.value = Number(session.taxCents) || 0
  totalCents.value = Number(session.totalCents) || 0
  paymentStatus.value = session.paymentStatus || 'pending'
  shippingStatus.value = session.shippingStatus || ''
  shippingCarrier.value = session.shippingCarrier || ''
  shippingService.value = session.shippingService || ''

  firstName.value = session.firstName || ''
  lastName.value = session.lastName || ''
  email.value = session.email || ''
  phone.value = session.phone || ''
  cardholderName.value =
    session.customerName ||
    `${session.firstName || ''} ${session.lastName || ''}`.trim()

  shippingAddress1.value = session.shippingAddress1 || ''
  shippingAddress2.value = session.shippingAddress2 || ''
  shippingCity.value = session.shippingCity || ''
  shippingState.value = session.shippingState || ''
  shippingPostalCode.value = session.shippingPostalCode || ''
  shippingCountry.value = session.shippingCountry || 'US'

  billingName.value = cardholderName.value
  billingAddress1.value = shippingAddress1.value
  billingAddress2.value = shippingAddress2.value
  billingCity.value = shippingCity.value
  billingState.value = shippingState.value
  billingPostalCode.value = shippingPostalCode.value
  billingCountry.value = shippingCountry.value
}

function loadMoovScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (import.meta.server) {
      resolve()
      return
    }
    if (customElements.get('moov-card-link') || customElements.get('moov-form')) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.src = 'https://js.moov.io/v1'
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Moov.js'))
    document.head.appendChild(script)
  })
}

async function loadSession() {
  isLoading.value = true
  error.value = null
  cardError.value = null
  paymentBlocked.value = null
  paymentStage.value = 'ready'
  stopPolling()

  try {
    if (!orderId) throw new Error('Missing order information.')

    const session = await $fetch<CardSessionResponse>('/api/moov/card-session', {
      method: 'POST',
      body: { orderId },
      credentials: 'include',
    })

    applyOrderSummary(session)

    if (session?.paymentBlocked) {
      paymentBlocked.value = session.paymentBlocked
      isLoading.value = false
      return
    }

    if (session.shippingStatus !== 'selected') {
      paymentBlocked.value = 'Shipping must be selected before payment.'
      isLoading.value = false
      return
    }

    if (!session.totalCents || Number(session.totalCents) <= 0) {
      error.value = 'Order total is missing from the server. Return to checkout and select a shipping rate.'
      isLoading.value = false
      return
    }

    if (session.paymentStatus === 'paid') {
      paymentStage.value = 'paid'
      await router.push(`/checkout/success?orderId=${orderId}`)
      return
    }

    if (session.paymentStatus === 'processing') {
      paymentStage.value = 'processing_payment'
      isLoading.value = false
      startPaymentStatusPolling()
      return
    }

    accessToken.value = session.accessToken || ''
    customerAccountId.value = session.customerAccountId || ''
    merchantAccountId.value = session.merchantAccountId || ''
    cardLinkedOnServer.value = Boolean(
      (session as any).hasMoovCardId && (session as any).hasMoovPaymentMethodId
    )
    showCardForm.value = true

    await nextTick()
    configureCardLinkDrop()
  } catch (err: any) {
    console.error('Card session error:', err)
    error.value = err.data?.message || err.message || 'Could not initialize payment form.'
  } finally {
    isLoading.value = false
  }
}

async function submitPayment() {
  cardError.value = null

  if (invalidTotal.value) {
    cardError.value = 'Cannot process payment without a valid server order total.'
    return
  }

  if (!cardholderName.value.trim()) {
    cardError.value = 'Enter the cardholder name to continue.'
    return
  }

  const billing = effectiveBillingAddress()
  if (!billing.postalCode) {
    cardError.value = 'Billing ZIP is required.'
    return
  }

  if (!customerAccountId.value || !accessToken.value) {
    cardError.value = 'Payment session expired. Refresh the page and try again.'
    return
  }

  // Card already saved from a prior attempt — charge only.
  if (cardLinkedOnServer.value) {
    paymentStage.value = 'processing_payment'
    try {
      await runCreateTransfer()
    } catch (err: any) {
      console.error('Create transfer retry error:', err)
      cardError.value =
        err.data?.message || err.message || 'Payment could not be completed. Please try again.'
      paymentStage.value = 'ready'
    }
    return
  }

  try {
    const drop = getCardLinkElement()
    if (!drop || typeof drop.submit !== 'function') {
      throw new Error('Payment form is not ready.')
    }

    // Re-bind required Drop props every submit. A remounted Drop has accountID=undefined.
    drop.oauthToken = accessToken.value
    drop.accountID = customerAccountId.value
    drop.merchantAccountID = merchantAccountId.value
    drop.cardOnFile = true
    drop.inputStyle = { ...MOOV_INPUT_STYLE }
    applyBillingToDrop(drop)
    drop.onSuccess = handleCardSuccess
    drop.onError = handleCardError

    paymentStage.value = 'card_submitting'
    armSubmitWatchdog()
    drop.submit()
  } catch (err: any) {
    clearSubmitWatchdog()
    console.error('Payment submit error:', err)
    cardError.value = err.message || 'Could not submit payment.'
    paymentStage.value = 'ready'
  }
}

async function runCreateTransfer() {
  const transfer = await $fetch<{
    ok?: boolean
    orderNumber?: string
    paymentStatus?: string
    transferCreated?: boolean
  }>('/api/moov/create-transfer', {
    method: 'POST',
    body: { orderId },
    credentials: 'include',
  })

  paymentStatus.value = transfer.paymentStatus || 'processing'
  cardLinkedOnServer.value = true
  startPaymentStatusPolling()
}

async function handleCardSuccess(payload: any) {
  clearSubmitWatchdog()
  try {
    const cardId = extractMoovCardId(payload)
    if (!cardId) {
      throw new Error('Payment provider did not return a usable card reference. Please try again.')
    }

    paymentStage.value = 'preparing'

    const linked = await $fetch('/api/moov/card-linked', {
      method: 'POST',
      body: { orderId, cardId },
      credentials: 'include',
    })

    if (!(linked as any)?.ok) {
      throw new Error('Card could not be saved on the order. Please try again.')
    }

    paymentStatus.value = (linked as any).paymentStatus || 'pending'
    cardLinkedOnServer.value = true
    paymentStage.value = 'processing_payment'

    await runCreateTransfer()
  } catch (err: any) {
    console.error('Payment confirmation error:', err)
    cardError.value =
      err.data?.message || err.message || 'Payment could not be completed. Please try again.'
    paymentStage.value = 'ready'
  }
}

async function handleCardError(clientError: any, apiError?: any) {
  clearSubmitWatchdog()
  console.error('Moov payment form error:', clientError, apiError)
  paymentStage.value = 'ready'

  let message = 'Payment failed. Please check your card details and try again.'
  try {
    const sources = [apiError, clientError]
    for (const source of sources) {
      if (!source) continue
      let data = source
      if (typeof source.json === 'function') data = await source.json()
      else if (typeof source.clone === 'function') data = await source.clone().json()

      if (typeof data === 'string' && data.trim()) {
        message = data
        break
      }
      if (data && typeof data === 'object') {
        const parts: string[] = []
        if (typeof data.error === 'string') parts.push(data.error)
        if (typeof data.message === 'string') parts.push(data.message)
        if (parts.length) {
          message = parts.join(' ')
          break
        }
      }
    }
  } catch {
    // keep fallback
  }
  cardError.value = message
}

function startPaymentStatusPolling() {
  stopPolling()
  pollAttempts = 0
  paymentStage.value = 'processing_payment'
  pollPaymentStatus()
}

async function pollPaymentStatus() {
  pollAttempts += 1

  try {
    const status = await $fetch<{
      ok?: boolean
      paymentStatus?: string
      orderNumber?: string
      subtotalCents?: number
      shippingCostCents?: number
      taxCents?: number
      totalCents?: number
      shippingStatus?: string
      shippingCarrier?: string | null
      shippingService?: string | null
    }>('/api/checkout/status', {
      query: { orderId },
      credentials: 'include',
    })

    paymentStatus.value = status.paymentStatus || paymentStatus.value
    if (status.orderNumber) orderNumber.value = status.orderNumber
    if (status.subtotalCents != null) subtotalCents.value = Number(status.subtotalCents) || 0
    if (status.shippingCostCents != null) shippingCostCents.value = Number(status.shippingCostCents) || 0
    if (status.taxCents != null) taxCents.value = Number(status.taxCents) || 0
    if (status.totalCents != null) totalCents.value = Number(status.totalCents) || 0
    if (status.shippingStatus) shippingStatus.value = status.shippingStatus
    if (status.shippingCarrier) shippingCarrier.value = status.shippingCarrier
    if (status.shippingService) shippingService.value = status.shippingService

    if (status.paymentStatus === 'paid') {
      paymentStage.value = 'paid'
      stopPolling()
      await router.push(`/checkout/success?orderId=${orderId}`)
      return
    }

    if (status.paymentStatus === 'failed' || status.paymentStatus === 'cancelled') {
      paymentStage.value = 'ready'
      cardError.value =
        'Payment failed. You can safely try again — a new charge will not be created until you click Pay.'
      stopPolling()
      return
    }
  } catch (err: any) {
    console.error('Payment status poll error:', err)
  }

  if (pollAttempts >= MAX_POLL_ATTEMPTS) {
    paymentStage.value = 'ready'
    cardError.value =
      'Payment is still processing. Refresh this page in a moment, or click Pay again if needed.'
    stopPolling()
    return
  }

  pollTimer = setTimeout(pollPaymentStatus, 2000)
}

onMounted(async () => {
  if (import.meta.client) {
    needsHttps.value = window.location.protocol !== 'https:'
    try {
      await loadMoovScript()
    } catch (err: any) {
      console.error('Moov.js load failed:', err)
      error.value = 'Could not load the secure payment library.'
      isLoading.value = false
      return
    }
  }
  await loadSession()
})

onBeforeUnmount(() => {
  stopPolling()
  clearSubmitWatchdog()
})

useHead({
  title: 'Secure Payment — Quantum Bio Peptides',
})
</script>

<style scoped>
.pay-input {
  width: 100%;
  border-radius: 0.75rem;
  border: 1px solid rgba(100, 116, 139, 0.45);
  background: rgba(15, 23, 42, 0.85);
  color: #f8fafc;
  padding: 0.625rem 0.875rem;
  font-size: 0.875rem;
  line-height: 1.4;
  outline: none;
  transition: border-color 0.15s ease;
}

.pay-input:focus {
  border-color: rgba(45, 212, 191, 0.55);
}

.payment-card-drop-shell {
  border-radius: 0.75rem;
  border: 1px solid rgba(100, 116, 139, 0.55);
  background: linear-gradient(180deg, rgba(30, 41, 59, 0.55) 0%, rgba(15, 23, 42, 0.95) 100%);
  box-shadow: inset 0 1px 0 rgba(148, 163, 184, 0.08);
  padding: 0.75rem 0.875rem;
  min-height: 0;
  overflow: hidden;
}

.payment-card-drop-shell :deep(moov-card-link) {
  display: block;
  width: 100%;
  min-height: 120px;
  max-height: 200px;
  overflow: hidden;
  color: #f8fafc;
  font-size: 16px;
  line-height: 1.4;
}
</style>
