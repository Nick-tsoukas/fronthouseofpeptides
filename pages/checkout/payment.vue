<template>
  <div class="payment-page min-h-screen bg-dark-950">
    <div class="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8 py-10 lg:py-12">

      <!-- Header -->
      <div class="mb-8 max-w-3xl">
        <p class="text-primary-400/90 text-xs font-semibold tracking-[0.18em] uppercase mb-3">
          Encrypted checkout
        </p>
        <h1 class="text-3xl sm:text-4xl font-bold text-white tracking-tight">Secure Payment</h1>
        <p class="text-dark-300 mt-2 text-base sm:text-lg leading-relaxed">
          Complete your order using a secure encrypted test card.
        </p>
      </div>

      <!-- HTTPS required -->
      <div
        v-if="needsHttps"
        class="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3.5"
      >
        <p class="text-red-400 font-semibold text-sm">HTTPS required for Moov card form</p>
        <p class="text-red-200/80 text-sm mt-1 leading-relaxed">
          Moov card fields only load on HTTPS pages. Use a tunnel or production HTTPS URL and set
          <code class="text-red-300">APP_URL</code> to that origin.
        </p>
      </div>

      <!-- Test mode -->
      <div
        v-if="isTestMode"
        class="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3.5 flex items-start gap-3"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <div>
          <p class="text-amber-400 font-semibold text-sm">MOOV TEST MODE — NO REAL MONEY</p>
          <p class="text-amber-100/70 text-xs mt-0.5">Use Moov test card numbers only. No real money will be charged.</p>
        </div>
      </div>

      <!-- Loading -->
      <div
        v-if="isLoading"
        class="rounded-2xl border border-slate-700/80 bg-dark-900/80 px-6 py-16 text-center shadow-xl shadow-black/20"
      >
        <div class="mx-auto mb-4 h-10 w-10 rounded-full border-2 border-primary-500/30 border-t-primary-400 animate-spin" />
        <p class="text-dark-300 text-sm">Loading secure card form…</p>
        <div class="mt-8 mx-auto max-w-md space-y-3">
          <div class="h-12 rounded-xl bg-dark-800/80 animate-pulse" />
          <div class="h-12 rounded-xl bg-dark-800/80 animate-pulse" />
          <div class="grid grid-cols-2 gap-3">
            <div class="h-12 rounded-xl bg-dark-800/80 animate-pulse" />
            <div class="h-12 rounded-xl bg-dark-800/80 animate-pulse" />
          </div>
        </div>
      </div>

      <!-- Error -->
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

      <!-- Shipping blocked -->
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

      <!-- Main layout -->
      <div
        v-else
        class="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start"
      >
        <!-- Card form column -->
        <section class="rounded-2xl border border-slate-600/50 bg-gradient-to-b from-dark-900 to-dark-950 p-6 sm:p-8 shadow-xl shadow-black/25">
          <div class="mb-6">
            <h2 class="text-xl font-semibold text-white">Card Information</h2>
            <p class="mt-2 flex items-center gap-2 text-dark-400 text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-primary-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Card details are entered securely through Moov.
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

          <ClientOnly>
            <div ref="cardFormContainer" class="payment-moov-form">
              <moov-form
                v-if="showCardLink"
                ref="cardFormRef"
                name="card-link-form"
                method="POST"
              ></moov-form>

              <template v-if="showCardLink">
                <div class="payment-field">
                  <label class="payment-label">Name on card</label>
                  <div class="payment-moov-shell">
                    <moov-text-input
                      formname="card-link-form"
                      name="holderName"
                      autocomplete="cc-name"
                      required
                    ></moov-text-input>
                  </div>
                </div>

                <div class="payment-field">
                  <label class="payment-label">Card number</label>
                  <div class="payment-moov-shell">
                    <moov-card-number-input
                      formname="card-link-form"
                      name="cardNumber"
                      required
                    ></moov-card-number-input>
                  </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div class="payment-field">
                    <label class="payment-label">Expiration</label>
                    <div class="payment-moov-shell">
                      <moov-expiration-date-input
                        formname="card-link-form"
                        name="expiration"
                        required
                      ></moov-expiration-date-input>
                    </div>
                  </div>
                  <div class="payment-field">
                    <label class="payment-label">CVV</label>
                    <div class="payment-moov-shell">
                      <moov-card-security-code-input
                        formname="card-link-form"
                        name="cardCvv"
                        required
                      ></moov-card-security-code-input>
                    </div>
                  </div>
                </div>

                <div class="payment-field">
                  <label class="payment-label">Billing ZIP</label>
                  <div class="payment-moov-shell">
                    <moov-text-input
                      formname="card-link-form"
                      name="billingAddress.postalCode"
                      autocomplete="postal-code"
                      required
                    ></moov-text-input>
                  </div>
                </div>
              </template>

              <div
                v-else-if="!cardReady"
                class="space-y-4"
              >
                <div class="h-12 rounded-xl bg-dark-800/70 animate-pulse" />
                <div class="h-12 rounded-xl bg-dark-800/70 animate-pulse" />
                <div class="grid grid-cols-2 gap-4">
                  <div class="h-12 rounded-xl bg-dark-800/70 animate-pulse" />
                  <div class="h-12 rounded-xl bg-dark-800/70 animate-pulse" />
                </div>
                <p class="text-center text-dark-400 text-sm pt-1">Loading secure card form…</p>
              </div>
            </div>
            <template #fallback>
              <div class="space-y-4 py-2">
                <div class="h-12 rounded-xl bg-dark-800/70 animate-pulse" />
                <div class="h-12 rounded-xl bg-dark-800/70 animate-pulse" />
                <p class="text-center text-dark-400 text-sm">Loading secure card form…</p>
              </div>
            </template>
          </ClientOnly>

          <div
            v-if="cardError"
            class="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3"
          >
            <p class="text-red-400 text-sm leading-relaxed">{{ cardError }}</p>
          </div>

          <div
            v-if="isTestMode"
            class="mt-5 rounded-xl border border-slate-600/40 bg-dark-950/60 px-4 py-3"
          >
            <p class="text-dark-400 text-xs leading-relaxed">
              Test card tip: Visa
              <span class="font-mono text-dark-200">4111111111111111</span>,
              any future expiration, any CVV, US ZIP.
            </p>
          </div>

          <button
            @click="submitCard"
            :disabled="!canLinkCard"
            class="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-base font-semibold transition-all duration-200
              bg-primary-500 hover:bg-primary-600 text-white
              disabled:bg-dark-800 disabled:text-dark-500 disabled:border disabled:border-dark-700 disabled:cursor-not-allowed
              shadow-lg shadow-primary-500/10 disabled:shadow-none"
          >
            <svg v-if="isLinking" class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ isLinking ? 'Linking card…' : 'Link Test Card' }}
          </button>

          <div class="mt-4 rounded-xl border border-dark-700 bg-dark-950/50 px-4 py-3.5">
            <p class="text-dark-300 text-sm font-medium">Submit Test Payment</p>
            <p class="text-dark-500 text-xs mt-1 leading-relaxed">
              Payment submission is not enabled yet. Card linking only — no charge is created on this page.
            </p>
          </div>
        </section>

        <!-- Order summary -->
        <aside class="lg:sticky lg:top-8">
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
                <span class="inline-flex items-center gap-1.5 text-amber-400">
                  <span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
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
import { ref, computed, onMounted, nextTick } from 'vue'
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

const MOOV_INPUT_STYLE = {
  color: '#f8fafc',
  backgroundColor: 'transparent',
  fontSize: '16px',
  fontFamily: 'inherit',
  lineHeight: '1.25',
  padding: '0 2px',
  height: '100%',
  width: '100%',
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

const isTestMode = computed(() => {
  return (config.public.moovMode as string || 'test') === 'test'
})

const invalidTotal = computed(() => !totalCents.value || totalCents.value <= 0)

const canLinkCard = computed(() => {
  return (
    cardReady.value &&
    !isLinking.value &&
    !needsHttps.value &&
    !invalidTotal.value &&
    showCardLink.value
  )
})

const formatCents = (cents: number) => `${CURRENCY.SYMBOL}${((Number(cents) || 0) / 100).toFixed(2)}`

const displayPaymentStatus = computed(() => {
  const status = paymentStatus.value || 'pending'
  return status.charAt(0).toUpperCase() + status.slice(1)
})

const displayShippingStatus = computed(() => {
  const status = shippingStatus.value || 'selected'
  return status.split('_').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')
})

const isLoading = ref(true)
const isLinking = ref(false)
const error = ref<string | null>(null)
const cardError = ref<string | null>(null)

const accessToken = ref('')
const customerAccountId = ref('')
const merchantAccountId = ref('')

const cardReady = ref(false)
const showCardLink = ref(false)

const cardFormRef = ref<any>(null)
const cardFormContainer = ref<HTMLElement | null>(null)

const cardFormAction = computed(() => {
  return customerAccountId.value ? `/accounts/${customerAccountId.value}/cards` : ''
})

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

function applyMoovInputStyles() {
  const root = cardFormContainer.value
  if (!root) return

  const selectors = [
    'moov-text-input',
    'moov-card-number-input',
    'moov-expiration-date-input',
    'moov-card-security-code-input',
  ].join(',')

  root.querySelectorAll(selectors).forEach((el: any) => {
    el.inputStyle = { ...MOOV_INPUT_STYLE }
  })
}

function loadMoovScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (import.meta.server) {
      resolve()
      return
    }
    if (customElements.get('moov-form')) {
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

    accessToken.value = session.accessToken || ''
    customerAccountId.value = session.customerAccountId || ''
    merchantAccountId.value = session.merchantAccountId || ''
    showCardLink.value = true

    await nextTick()
    attachCardLinkHandlers()
  } catch (err: any) {
    console.error('Card session error:', err)
    error.value = err.data?.message || err.message || 'Could not initialize payment form.'
  } finally {
    isLoading.value = false
  }
}

function attachCardLinkHandlers(retries = 0) {
  const form = cardFormRef.value
  if (form) {
    form.method = 'POST'
    form.action = cardFormAction.value
    form.requestHeaders = {
      Authorization: `Bearer ${accessToken.value}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Moov-Version': 'v2026.04.00',
      'X-Wait-For': 'payment-method',
    }
    form.requestBody = {
      merchantAccountID: merchantAccountId.value,
      cardOnFile: true,
      ...(customerName.value ? { holderName: customerName.value } : {}),
    }
    form.onSuccess = handleCardSuccess
    form.onError = handleCardError
    form.onReportValidity = (result: { isValid?: boolean }) => {
      if (result && result.isValid === false) {
        isLinking.value = false
        cardError.value = 'Please complete all required card fields.'
      }
    }
    applyMoovInputStyles()
    cardReady.value = true
    return
  }

  if (retries < 10) {
    setTimeout(() => attachCardLinkHandlers(retries + 1), 100)
  } else {
    cardReady.value = false
    error.value = 'Secure card form could not be initialized.'
  }
}

async function submitCard() {
  cardError.value = null

  if (invalidTotal.value) {
    cardError.value = 'Cannot link a card without a valid server order total.'
    return
  }

  isLinking.value = true

  try {
    const form = cardFormRef.value
    if (!form) {
      throw new Error('Payment form is not ready.')
    }

    form.action = cardFormAction.value
    form.requestHeaders = {
      Authorization: `Bearer ${accessToken.value}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Moov-Version': 'v2026.04.00',
      'X-Wait-For': 'payment-method',
    }
    form.requestBody = {
      merchantAccountID: merchantAccountId.value,
      cardOnFile: true,
      ...(customerName.value ? { holderName: customerName.value } : {}),
    }

    if (typeof form.requestSubmit === 'function') {
      form.requestSubmit()
    } else if (typeof form.submit === 'function') {
      form.submit()
    } else {
      throw new Error('Payment form is not ready.')
    }
  } catch (err: any) {
    console.error('Card submit error:', err)
    cardError.value = err.message || 'Could not submit card.'
    isLinking.value = false
  }
}

async function handleCardSuccess(response: any) {
  try {
    const cardId = response?.cardID
    if (!cardId) {
      throw new Error('Card linking did not return a card ID.')
    }

    const result = await $fetch('/api/moov/card-linked', {
      method: 'POST',
      body: { orderId, cardId },
      credentials: 'include',
    })

    await router.push(
      `/checkout/card-success?orderNumber=${encodeURIComponent((result as any).orderNumber)}` +
      `&paymentStatus=${encodeURIComponent((result as any).paymentStatus)}`
    )
  } catch (err: any) {
    console.error('Card linked confirmation error:', err)
    cardError.value = err.data?.message || err.message || 'Card was linked but we could not confirm it.'
    isLinking.value = false
  }
}

async function handleCardError(err: any) {
  console.error('Moov card link error:', err)
  isLinking.value = false

  let message = 'Card linking failed. Please try again.'

  try {
    let data: any = null
    if (err && typeof err.json === 'function') {
      data = await err.json()
    } else if (err && typeof err.clone === 'function') {
      data = await err.clone().json()
    } else if (err && typeof err === 'object') {
      data = err
    }

    if (data) {
      const parts: string[] = []
      if (typeof data.error === 'string' && data.error.trim()) parts.push(data.error)
      if (typeof data.message === 'string' && data.message.trim()) parts.push(data.message)

      for (const key of [
        'cardNumber',
        'cardCvv',
        'expiration',
        'holderName',
        'billingAddress',
        'merchantAccountID',
        'cardOnFile',
        'verifyName',
      ]) {
        const value = data[key]
        if (!value) continue
        if (typeof value === 'string') parts.push(`${key}: ${value}`)
        else if (typeof value === 'object') parts.push(`${key}: ${JSON.stringify(value)}`)
      }

      if (parts.length > 0) {
        message = parts.join(' ')
      } else if (err?.status === 422) {
        message = 'Card was declined or failed verification (422). Check the test card details and try again.'
      }
    } else if (err?.status === 422) {
      message = 'Card was declined or failed verification (422). Check the test card details and try again.'
    }
  } catch {
    if (err?.status === 422) {
      message = 'Card was declined or failed verification (422). Check the test card details and try again.'
    }
  }

  cardError.value = message
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

useHead({
  title: 'Secure Payment — Quantum Bio Peptides',
})
</script>

<style scoped>
.payment-field {
  margin-bottom: 1rem;
}

.payment-label {
  display: block;
  margin-bottom: 0.375rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: #cbd5e1;
}

.payment-moov-shell {
  display: flex;
  align-items: center;
  width: 100%;
  height: 52px;
  min-height: 52px;
  max-height: 52px;
  padding: 0 0.875rem;
  border-radius: 0.75rem;
  border: 1px solid rgba(100, 116, 139, 0.55);
  background: rgba(15, 23, 42, 0.92);
  overflow: hidden;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.payment-moov-shell:focus-within {
  border-color: rgba(34, 211, 238, 0.7);
  box-shadow: 0 0 0 3px rgba(34, 211, 238, 0.12);
}

.payment-moov-form :deep(moov-text-input),
.payment-moov-form :deep(moov-card-number-input),
.payment-moov-form :deep(moov-expiration-date-input),
.payment-moov-form :deep(moov-card-security-code-input) {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 0 !important;
  max-height: 100%;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  line-height: 1.25;
  overflow: hidden;
}

.payment-moov-form :deep(moov-form) {
  display: none;
}
</style>
