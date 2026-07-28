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
          <div class="mb-5">
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

          <div
            v-else-if="paymentStage === 'transferring' || paymentStage === 'processing_payment'"
            class="rounded-xl border border-primary-500/30 bg-primary-500/10 px-4 py-5 text-center"
          >
            <div class="mx-auto mb-3 h-8 w-8 rounded-full border-2 border-primary-500/30 border-t-primary-400 animate-spin" />
            <p class="text-primary-300 text-sm font-semibold">Processing test payment…</p>
            <p class="text-dark-400 text-xs mt-2">Confirming transfer status with the payment provider.</p>
          </div>

          <div
            v-else-if="paymentStage === 'verified'"
            class="space-y-4"
          >
            <div class="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-4">
              <p class="text-emerald-400 text-sm font-semibold">Card verified</p>
              <p class="text-emerald-100/80 text-sm mt-1 leading-relaxed">
                Card verified. Ready to submit test payment.
              </p>
            </div>

            <div
              v-if="transferError"
              class="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3"
            >
              <p class="text-red-400 text-sm leading-relaxed">{{ transferError }}</p>
            </div>

            <button
              @click="submitTransfer"
              :disabled="isTransferring"
              class="w-full inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-base font-semibold transition-all duration-200
                bg-primary-500 hover:bg-primary-600 text-white
                disabled:bg-dark-800 disabled:text-dark-500 disabled:border disabled:border-dark-700 disabled:cursor-not-allowed
                shadow-lg shadow-primary-500/10 disabled:shadow-none"
            >
              <svg v-if="isTransferring" class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ isTransferring ? 'Processing test payment…' : 'Submit Test Payment' }}
            </button>
          </div>

          <template v-else>
            <p class="mb-3 text-dark-400 text-sm">Enter your card details to continue.</p>

            <ClientOnly>
              <div class="payment-card-drop-shell">
                <moov-card-link
                  v-if="showCardForm"
                  ref="cardLinkRef"
                ></moov-card-link>
                <div
                  v-else
                  class="py-8 text-center text-dark-400 text-sm"
                >
                  Loading secure payment form…
                </div>
              </div>
              <template #fallback>
                <div class="payment-card-drop-shell py-8 text-center text-dark-400 text-sm">
                  Loading secure payment form…
                </div>
              </template>
            </ClientOnly>

            <div
              v-if="cardError"
              class="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3"
            >
              <p class="text-red-400 text-sm leading-relaxed">{{ cardError }}</p>
            </div>

            <button
              @click="submitPayment"
              :disabled="!canPay"
              class="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-base font-semibold transition-all duration-200
                bg-primary-500 hover:bg-primary-600 text-white
                disabled:bg-dark-800 disabled:text-dark-500 disabled:border disabled:border-dark-700 disabled:cursor-not-allowed
                shadow-lg shadow-primary-500/10 disabled:shadow-none"
            >
              <svg v-if="isProcessing" class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ payButtonLabel }}
            </button>
          </template>

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
                <span
                  class="inline-flex items-center gap-1.5"
                  :class="paymentStatusClass"
                >
                  <span
                    class="w-1.5 h-1.5 rounded-full"
                    :class="paymentStatusDotClass"
                  ></span>
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
  email?: string
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
  | 'processing'
  | 'verified'
  | 'transferring'
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
const customerName = ref('')
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

const isTestMode = computed(() => (config.public.moovMode as string || 'test') === 'test')
const invalidTotal = computed(() => !totalCents.value || totalCents.value <= 0)

const formatCents = (cents: number) => `${CURRENCY.SYMBOL}${((Number(cents) || 0) / 100).toFixed(2)}`

const displayPaymentStatus = computed(() => {
  if (paymentStage.value === 'paid' || paymentStatus.value === 'paid') return 'Paid'
  if (paymentStage.value === 'transferring' || paymentStage.value === 'processing_payment' || paymentStatus.value === 'processing') {
    return 'Processing'
  }
  if (paymentStatus.value === 'failed' || paymentStage.value === 'failed') return 'Failed'
  if (paymentStage.value === 'verified') return 'Pending'
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
const isProcessing = ref(false)
const isTransferring = ref(false)
const error = ref<string | null>(null)
const cardError = ref<string | null>(null)
const transferError = ref<string | null>(null)

const accessToken = ref('')
const customerAccountId = ref('')
const merchantAccountId = ref('')

const cardReady = ref(false)
const showCardForm = ref(false)
const cardLinkRef = ref<any>(null)

let pollTimer: ReturnType<typeof setTimeout> | null = null
let pollAttempts = 0
const MAX_POLL_ATTEMPTS = 40

const canPay = computed(() => {
  return (
    cardReady.value &&
    !isProcessing.value &&
    !needsHttps.value &&
    !invalidTotal.value &&
    showCardForm.value &&
    paymentStage.value === 'ready'
  )
})

const payButtonLabel = computed(() => {
  if (isProcessing.value) return 'Verifying card…'
  if (!cardReady.value) return 'Loading secure payment form…'
  return 'Verify Card'
})

function stopPolling() {
  if (pollTimer) {
    clearTimeout(pollTimer)
    pollTimer = null
  }
}

function normalizeMoovSuccessPayload(payload: any): any {
  if (!payload) return null

  if (typeof payload === 'string') {
    return { cardID: payload }
  }

  if (typeof CustomEvent !== 'undefined' && payload instanceof CustomEvent) {
    return payload.detail
  }

  if (payload?.detail != null && typeof payload.detail === 'object') {
    return payload.detail
  }

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
    normalized?.detail?.cardID,
    normalized?.detail?.cardId,
    normalized?.detail?.result?.cardID,
    normalized?.detail?.result?.cardId,
    normalized?.detail?.data?.cardID,
    normalized?.detail?.data?.cardId,
    payload?.cardID,
    payload?.cardId,
    payload?.id,
    payload?.detail?.cardID,
    payload?.detail?.cardId,
    payload?.detail?.result?.cardID,
    payload?.detail?.result?.cardId,
    payload?.detail?.data?.cardID,
    payload?.detail?.data?.cardId,
    payload?.card?.cardID,
    payload?.card?.cardId,
  ]

  for (const value of candidates) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }

  return null
}

function collectIdCardKeyPaths(value: any, path = '', depth = 0, out: string[] = []): string[] {
  if (!value || typeof value !== 'object' || depth > 4) return out

  for (const key of Object.keys(value)) {
    const nextPath = path ? `${path}.${key}` : key
    const lower = key.toLowerCase()
    if (lower.includes('card') || lower.includes('id')) {
      out.push(nextPath)
    }
    collectIdCardKeyPaths(value[key], nextPath, depth + 1, out)
  }

  return out
}

function logSafeMoovPayloadShape(payload: any, label = 'success') {
  if (!isTestMode.value) return

  try {
    const normalized = normalizeMoovSuccessPayload(payload)
    const topKeys = payload && typeof payload === 'object' ? Object.keys(payload) : []
    const detailKeys =
      payload?.detail && typeof payload.detail === 'object' ? Object.keys(payload.detail) : []
    const normalizedKeys =
      normalized && typeof normalized === 'object' ? Object.keys(normalized) : []
    const interestingPaths = collectIdCardKeyPaths(normalized || payload).slice(0, 40)

    console.info(`[moov-payment] ${label} payload shape`, {
      typeofPayload: typeof payload,
      constructorName: payload?.constructor?.name || null,
      topKeys,
      detailKeys,
      normalizedKeys,
      interestingPaths,
      extractedCardIdPresent: Boolean(extractMoovCardId(payload)),
    })
  } catch {
    // ignore logging failures
  }
}

function getCardLinkElement(): any {
  if (!import.meta.client) return null

  const refVal = cardLinkRef.value as any

  if (refVal && typeof refVal.submit === 'function') {
    return refVal
  }

  if (refVal?.$el && typeof refVal.$el.submit === 'function') {
    return refVal.$el
  }

  return document.querySelector('moov-card-link') as any
}

function applyOrderSummary(session: CardSessionResponse) {
  orderNumber.value = session.orderNumber || ''
  customerName.value = session.customerName || ''
  subtotalCents.value = Number(session.subtotalCents) || 0
  shippingCostCents.value = Number(session.shippingCostCents) || 0
  taxCents.value = Number(session.taxCents) || 0
  totalCents.value = Number(session.totalCents) || 0
  paymentStatus.value = session.paymentStatus || 'pending'
  shippingStatus.value = session.shippingStatus || ''
  shippingCarrier.value = session.shippingCarrier || ''
  shippingService.value = session.shippingService || ''
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

function configureCardLinkDrop(retries = 0) {
  const drop = getCardLinkElement()
  if (drop && typeof drop.submit === 'function') {
    drop.oauthToken = accessToken.value
    drop.accountID = customerAccountId.value
    drop.merchantAccountID = merchantAccountId.value
    drop.cardOnFile = true
    drop.inputStyle = { ...MOOV_INPUT_STYLE }
    if (customerName.value) drop.holderName = customerName.value
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

async function loadSession() {
  isLoading.value = true
  error.value = null
  cardError.value = null
  transferError.value = null
  paymentBlocked.value = null
  paymentStage.value = 'ready'
  stopPolling()

  try {
    if (!orderId) {
      throw new Error('Missing order information.')
    }

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

  isProcessing.value = true
  paymentStage.value = 'processing'

  try {
    const drop = getCardLinkElement()
    if (!drop || typeof drop.submit !== 'function') {
      throw new Error('Payment form is not ready.')
    }

    drop.oauthToken = accessToken.value
    drop.accountID = customerAccountId.value
    drop.merchantAccountID = merchantAccountId.value
    drop.cardOnFile = true
    drop.inputStyle = { ...MOOV_INPUT_STYLE }
    if (customerName.value) drop.holderName = customerName.value
    drop.onSuccess = handleCardSuccess
    drop.onError = handleCardError
    drop.submit()
  } catch (err: any) {
    console.error('Payment submit error:', err)
    cardError.value = err.message || 'Could not verify card.'
    isProcessing.value = false
    paymentStage.value = 'ready'
  }
}

async function handleCardSuccess(payload: any) {
  try {
    logSafeMoovPayloadShape(payload, 'success')

    const cardId = extractMoovCardId(payload)
    if (!cardId) {
      if (isTestMode.value) {
        console.warn('[moov-payment] cardID extraction failed after normalize')
      }
      throw new Error('Payment provider did not return a usable card reference. Please try again.')
    }

    const result = await $fetch('/api/moov/card-linked', {
      method: 'POST',
      body: { orderId, cardId },
      credentials: 'include',
    })

    paymentStatus.value = (result as any).paymentStatus || 'pending'
    paymentStage.value = 'verified'
    isProcessing.value = false
  } catch (err: any) {
    console.error('Payment confirmation error:', err)
    cardError.value = err.data?.message || err.message || 'Card could not be verified. Please try again.'
    isProcessing.value = false
    paymentStage.value = 'ready'
  }
}

async function handleCardError(clientError: any, apiError?: any) {
  console.error('Moov payment form error:', clientError, apiError)
  isProcessing.value = false
  paymentStage.value = 'ready'

  if (isTestMode.value) {
    logSafeMoovPayloadShape(clientError, 'client-error')
    logSafeMoovPayloadShape(apiError, 'api-error')
  }

  let message = 'Card verification failed. Please check your card details and try again.'

  try {
    const sources = [apiError, clientError]
    for (const source of sources) {
      if (!source) continue

      let data = source
      if (typeof source.json === 'function') {
        data = await source.json()
      } else if (typeof source.clone === 'function') {
        data = await source.clone().json()
      }

      if (typeof data === 'string' && data.trim()) {
        message = data
        break
      }

      if (data && typeof data === 'object') {
        const parts: string[] = []
        if (typeof data.error === 'string') parts.push(data.error)
        if (typeof data.message === 'string') parts.push(data.message)
        if (typeof data.clientError === 'string') parts.push(data.clientError)
        if (parts.length) {
          message = parts.join(' ')
          break
        }
        if (source?.status === 422) {
          message = 'Card was declined or failed verification. Check the test card details and try again.'
          break
        }
      }
    }
  } catch {
    // keep fallback message
  }

  cardError.value = message
}

async function submitTransfer() {
  transferError.value = null
  isTransferring.value = true
  paymentStage.value = 'transferring'

  try {
    const result = await $fetch<{
      ok?: boolean
      orderNumber?: string
      paymentStatus?: string
      transferCreated?: boolean
    }>('/api/moov/create-transfer', {
      method: 'POST',
      body: { orderId },
      credentials: 'include',
    })

    paymentStatus.value = result.paymentStatus || 'processing'
    paymentStage.value = 'processing_payment'
    startPaymentStatusPolling()
  } catch (err: any) {
    console.error('Create transfer error:', err)
    transferError.value =
      err.data?.message ||
      err.message ||
      'Test payment could not be submitted. You can safely try again.'
    isTransferring.value = false
    paymentStage.value = 'verified'
  }
}

function startPaymentStatusPolling() {
  stopPolling()
  pollAttempts = 0
  isTransferring.value = true
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
      isTransferring.value = false
      stopPolling()
      await router.push(`/checkout/success?orderId=${orderId}`)
      return
    }

    if (status.paymentStatus === 'failed' || status.paymentStatus === 'cancelled') {
      paymentStage.value = 'failed'
      isTransferring.value = false
      transferError.value =
        'Payment failed. Your card was not charged again automatically — you can retry Submit Test Payment.'
      paymentStage.value = 'verified'
      stopPolling()
      return
    }

    paymentStage.value = 'processing_payment'
  } catch (err: any) {
    console.error('Payment status poll error:', err)
  }

  if (pollAttempts >= MAX_POLL_ATTEMPTS) {
    isTransferring.value = false
    paymentStage.value = 'verified'
    transferError.value =
      'Payment is still processing. Refresh this page in a moment, or retry Submit Test Payment if needed.'
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
})

useHead({
  title: 'Secure Payment — Quantum Bio Peptides',
})
</script>

<style scoped>
.payment-card-drop-shell {
  border-radius: 0.75rem;
  border: 1px solid rgba(100, 116, 139, 0.55);
  background:
    linear-gradient(180deg, rgba(30, 41, 59, 0.55) 0%, rgba(15, 23, 42, 0.95) 100%);
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
