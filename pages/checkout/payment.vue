<template>
  <div class="min-h-screen bg-dark-950 py-8">
    <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">

      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-white">Payment</h1>
        <p class="text-dark-400 mt-2">Link a test card to your order.</p>
      </div>

      <!-- Test mode notice -->
      <div
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
        <p class="text-dark-400">Initializing secure payment form...</p>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
        <p class="text-red-400 text-sm">{{ error }}</p>
        <button
          @click="loadSession"
          class="mt-3 px-4 py-2 bg-dark-800 hover:bg-dark-700 text-white text-sm rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>

      <!-- Order summary + form -->
      <div v-else class="space-y-6">
        <div class="bg-dark-900 rounded-xl border border-dark-700 p-6">
          <h2 class="text-lg font-semibold text-white mb-4">Order Summary</h2>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-dark-400">Order Number</span>
              <span class="text-white font-mono">{{ orderNumber }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-dark-400">Total</span>
              <span class="text-white font-semibold">{{ formatTotal }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-dark-400">Payment Status</span>
              <span class="inline-flex items-center gap-1.5 text-yellow-400">
                <span class="w-1.5 h-1.5 rounded-full bg-yellow-400"></span>
                Pending
              </span>
            </div>
          </div>
        </div>

        <div class="bg-dark-900 rounded-xl border border-dark-700 p-6">
          <h2 class="text-lg font-semibold text-white mb-4">Test Card</h2>

          <!-- Moov composable drops (client-side only) -->
          <ClientOnly>
            <div ref="cardFormContainer">
              <moov-form
                v-if="showCardLink"
                ref="cardFormRef"
                name="card-link-form"
                method="POST"
                :action="cardFormAction"
                :request-headers="cardFormHeaders"
                class="space-y-4"
              >
                <div>
                  <label class="block text-sm font-medium text-dark-300 mb-1">Name on card</label>
                  <moov-text-input
                    formname="card-link-form"
                    name="holderName"
                    autocomplete="cc-name"
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
                    class="block w-full"
                  ></moov-text-input>
                </div>
              </moov-form>
            </div>
            <template #fallback>
              <div class="py-8 text-center text-dark-400 text-sm">
                Loading secure card form...
              </div>
            </template>
          </ClientOnly>

          <button
            @click="submitCard"
            :disabled="isLinking || !cardReady"
            class="w-full mt-6 py-4 bg-primary-500 hover:bg-primary-600 disabled:bg-dark-700 disabled:text-dark-500 text-white font-semibold rounded-lg transition-all duration-200 text-lg flex items-center justify-center gap-2"
          >
            <svg v-if="isLinking" class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ isLinking ? 'Linking Card...' : 'Link Test Card' }}
          </button>

          <p class="text-dark-500 text-xs text-center mt-3">
            Card information is entered directly into Moov's secure iframe.
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

const route = useRoute()
const router = useRouter()

const orderId = Number(route.query.orderId)
const orderNumber = computed(() => (route.query.orderNumber as string) || '')
const totalCents = computed(() => Number(route.query.totalCents) || 0)
const checkoutSessionToken = computed(() => (route.query.t as string) || '')

const formatTotal = computed(() => {
  const dollars = totalCents.value / 100
  return `${CURRENCY.SYMBOL}${dollars.toFixed(2)}`
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

const cardFormHeaders = computed(() => {
  return accessToken.value
    ? {
        Authorization: `Bearer ${accessToken.value}`,
        'X-Moov-Version': 'v2026.04.00',
      }
    : {}
})

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

  try {
    if (!orderId || !checkoutSessionToken.value) {
      throw new Error('Missing order information.')
    }

    const session = await $fetch('/api/moov/card-session', {
      method: 'POST',
      body: {
        orderId,
        checkoutSessionToken: checkoutSessionToken.value,
      },
    })

    accessToken.value = (session as any).accessToken
    customerAccountId.value = (session as any).customerAccountId
    merchantAccountId.value = (session as any).merchantAccountId
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
    form.action = cardFormAction.value
    form.requestHeaders = cardFormHeaders.value
    form.onSuccess = handleCardSuccess
    form.onError = handleCardError
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
    if (!form || typeof form.submit !== 'function') {
      throw new Error('Payment form is not ready.')
    }
    form.submit()
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
      body: {
        orderId,
        checkoutSessionToken: checkoutSessionToken.value,
        cardId,
      },
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

function handleCardError(err: any) {
  console.error('Moov card link error:', err)
  const message = err?.message || err?.error?.message || err?.response?.message || 'Card linking failed. Please try again.'
  cardError.value = message
  isLinking.value = false
}

onMounted(async () => {
  if (import.meta.client) {
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
  title: 'Payment — Quantum Bio Peptides',
})
</script>
