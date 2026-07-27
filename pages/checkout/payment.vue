<template>
  <div class="min-h-screen bg-dark-950 py-8">
    <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">

      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-white">Secure Payment</h1>
        <p class="text-dark-400 mt-2">Complete payment for your order.</p>
      </div>

      <!-- HTTPS required for Moov card iframes -->
      <div
        v-if="needsHttps"
        class="mb-6 bg-red-500/10 border border-red-500/30 rounded-lg p-4"
      >
        <p class="text-red-400 font-semibold text-sm">HTTPS required for Moov card form</p>
        <p class="text-red-200/80 text-sm mt-1 leading-relaxed">
          Moov card fields load from <code class="text-red-300">cards.moov.io</code> and only allow HTTPS parent pages.
          Plain <code class="text-red-300">http://localhost</code> is blocked by their Content Security Policy.
          Open this checkout through an HTTPS tunnel (ngrok, Cloudflare Tunnel, etc.) and set
          <code class="text-red-300">APP_URL</code> to that HTTPS origin.
        </p>
      </div>

      <!-- Test mode notice -->
      <div
        v-if="isTestMode"
        class="mb-6 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex items-start gap-3"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <div>
          <p class="text-yellow-400 font-semibold text-sm">MOOV TEST MODE — NO REAL MONEY</p>
          <p class="text-yellow-200/70 text-xs mt-0.5">Use Moov test card numbers only. No real money will be charged.</p>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="isLoading" class="text-center py-16">
        <svg class="animate-spin h-8 w-8 text-primary-400 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p class="text-dark-400">Loading order and secure payment form...</p>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
        <p class="text-red-400 text-sm">{{ error }}</p>
        <div class="mt-3 flex flex-wrap gap-3">
          <button
            @click="loadSession"
            class="px-4 py-2 bg-dark-800 hover:bg-dark-700 text-white text-sm rounded-lg transition-colors"
          >
            Try Again
          </button>
          <NuxtLink
            to="/checkout"
            class="px-4 py-2 bg-dark-800 hover:bg-dark-700 text-white text-sm rounded-lg transition-colors"
          >
            Return to Checkout
          </NuxtLink>
        </div>
      </div>

      <!-- Payment blocked (shipping not selected) -->
      <div v-else-if="paymentBlocked" class="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
        <p class="text-yellow-400 text-sm font-medium">Shipping must be selected first</p>
        <p class="text-yellow-200/70 text-sm mt-1">{{ paymentBlocked }}</p>
        <NuxtLink
          to="/checkout"
          class="mt-3 inline-block px-4 py-2 bg-dark-800 hover:bg-dark-700 text-white text-sm rounded-lg transition-colors"
        >
          Return to Checkout
        </NuxtLink>
      </div>

      <!-- Order summary + form -->
      <div v-else class="space-y-6">
        <div class="bg-dark-900 rounded-xl border border-dark-700 p-6">
          <h2 class="text-lg font-semibold text-white mb-4">Order Summary</h2>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-dark-400">Order Number</span>
              <span class="text-white font-mono">{{ orderNumber || '—' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-dark-400">Shipping</span>
              <span class="text-white text-right">
                <template v-if="shippingCarrier || shippingService">
                  {{ shippingCarrier }}{{ shippingCarrier && shippingService ? ' — ' : '' }}{{ shippingService }}
                </template>
                <template v-else>
                  Selected
                </template>
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-dark-400">Shipping Status</span>
              <span class="inline-flex items-center gap-1.5 text-green-400">
                <span class="w-1.5 h-1.5 rounded-full bg-green-400"></span>
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

            <div class="border-t border-dark-700 pt-3 mt-3 space-y-2">
              <div class="flex justify-between text-dark-300">
                <span>Product subtotal</span>
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
              <div class="flex justify-between text-white font-semibold text-base pt-2 border-t border-dark-700">
                <span>Total</span>
                <span>{{ formatCents(totalCents) }}</span>
              </div>
            </div>
          </div>
          <p class="text-dark-500 text-xs mt-4">
            Totals are loaded from the server for this pending order. Cart contents are not used on this page.
          </p>
        </div>

        <div class="bg-dark-900 rounded-xl border border-dark-700 p-6">
          <h2 class="text-lg font-semibold text-white mb-4">Test Card</h2>
          <p class="text-dark-400 text-xs mb-4 leading-relaxed">
            Use Moov test cards only — e.g. Visa <span class="font-mono text-dark-300">4111111111111111</span>,
            any future expiration, any CVV, and a valid US ZIP.
          </p>

          <!-- Moov composable drops: form is separate; inputs register via formname -->
          <ClientOnly>
            <div ref="cardFormContainer" class="space-y-4">
              <moov-form
                v-if="showCardLink"
                ref="cardFormRef"
                name="card-link-form"
                method="POST"
              ></moov-form>

              <template v-if="showCardLink">
                <div>
                  <label class="block text-sm font-medium text-dark-300 mb-1">Name on card</label>
                  <moov-text-input
                    formname="card-link-form"
                    name="holderName"
                    autocomplete="cc-name"
                    required
                    class="block w-full"
                  ></moov-text-input>
                </div>

                <div>
                  <label class="block text-sm font-medium text-dark-300 mb-1">Card number</label>
                  <moov-card-number-input
                    formname="card-link-form"
                    name="cardNumber"
                    required
                    class="block w-full"
                  ></moov-card-number-input>
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-dark-300 mb-1">Expiration</label>
                    <moov-expiration-date-input
                      formname="card-link-form"
                      name="expiration"
                      required
                      class="block w-full"
                    ></moov-expiration-date-input>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-dark-300 mb-1">CVV</label>
                    <moov-card-security-code-input
                      formname="card-link-form"
                      name="cardCvv"
                      required
                      class="block w-full"
                    ></moov-card-security-code-input>
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-medium text-dark-300 mb-1">Billing ZIP</label>
                  <moov-text-input
                    formname="card-link-form"
                    name="billingAddress.postalCode"
                    autocomplete="postal-code"
                    required
                    class="block w-full"
                  ></moov-text-input>
                </div>
              </template>
            </div>
            <template #fallback>
              <div class="py-8 text-center text-dark-400 text-sm">
                Loading secure card form...
              </div>
            </template>
          </ClientOnly>

          <button
            @click="submitCard"
            :disabled="isLinking || !cardReady || needsHttps"
            class="w-full mt-6 py-4 bg-primary-500 hover:bg-primary-600 disabled:bg-dark-700 disabled:text-dark-500 text-white font-semibold rounded-lg transition-all duration-200 text-lg flex items-center justify-center gap-2"
          >
            <svg v-if="isLinking" class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ isLinking ? 'Linking Card...' : 'Link Test Card' }}
          </button>

          <button
            type="button"
            disabled
            class="w-full mt-3 py-4 bg-dark-700 text-dark-500 font-semibold rounded-lg text-lg cursor-not-allowed"
          >
            Submit Test Payment
          </button>

          <p class="text-dark-500 text-xs text-center mt-3">
            Link a test card first. Payment capture (Moov transfer) is disabled until the next stage — no charge is created on this page.
          </p>
        </div>
      </div>

      <!-- Card linking error -->
      <div v-if="cardError" class="mt-6 bg-red-500/10 border border-red-500/30 rounded-lg p-4">
        <p class="text-red-400 text-sm">{{ cardError }}</p>
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
    // Set properties in JS (Vue attribute binding can stringify objects on custom elements).
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
  isLinking.value = true

  try {
    const form = cardFormRef.value
    if (!form) {
      throw new Error('Payment form is not ready.')
    }

    // Re-apply auth/body right before submit in case token/account refreshed.
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
