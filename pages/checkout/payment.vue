<template>
  <div class="payment-page min-h-screen bg-dark-950 pb-[max(6.5rem,env(safe-area-inset-bottom))] lg:pb-12">
    <div class="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8 pt-5 sm:pt-8 lg:pt-12">

      <NuxtLink
        :to="orderId ? `/checkout?orderId=${orderId}` : '/checkout'"
        class="inline-flex items-center min-h-[44px] text-dark-400 hover:text-white text-sm mb-4"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to shipping
      </NuxtLink>

      <div class="mb-5 sm:mb-8">
        <p class="text-[11px] uppercase tracking-[0.2em] text-cyan-400/80 font-semibold mb-2">Step 3 of 3</p>
        <h1 class="text-2xl sm:text-4xl font-bold text-white tracking-tight">Pay by card</h1>
        <p class="text-dark-300 mt-1.5 text-sm sm:text-base leading-relaxed">
          Pay securely with debit or credit card. You’ll get an email receipt when payment is confirmed.
        </p>
      </div>

      <div
        v-if="needsHttps"
        class="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3.5"
      >
        <p class="text-red-400 font-semibold text-sm">Secure connection required</p>
        <p class="text-red-200/80 text-sm mt-1 leading-relaxed">
          Card payment requires HTTPS. Please open this page on the live site.
        </p>
      </div>

      <div
        v-if="isTestMode"
        class="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3.5 flex items-start gap-3"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <div class="min-w-0">
          <p class="text-amber-400 font-semibold text-sm">Test mode — no real charge</p>
          <p class="text-amber-100/70 text-xs mt-1 leading-relaxed">
            Card <span class="font-mono text-amber-100">4111 1111 1111 1111</span>
            · any future date · CVV 111 · ZIP 11111
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
            class="min-h-[44px] px-4 py-2.5 rounded-xl bg-dark-800 hover:bg-dark-700 border border-dark-600 text-white text-sm font-medium transition-colors"
          >
            Try Again
          </button>
          <NuxtLink
            to="/checkout"
            class="inline-flex min-h-[44px] items-center px-4 py-2.5 rounded-xl bg-dark-800 hover:bg-dark-700 border border-dark-600 text-white text-sm font-medium transition-colors"
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
          class="mt-4 inline-flex min-h-[44px] items-center px-4 py-2.5 rounded-xl bg-dark-800 hover:bg-dark-700 border border-dark-600 text-white text-sm font-medium transition-colors"
        >
          Return to Checkout
        </NuxtLink>
      </div>

      <div
        v-else
        class="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5 lg:gap-8 items-start"
      >
        <section ref="paymentPanelRef" class="rounded-2xl border border-white/10 bg-gradient-to-b from-slate-900/90 to-dark-950 p-4 sm:p-8 shadow-xl shadow-black/25">
          <div class="mb-5 sm:mb-6 flex items-start justify-between gap-3">
            <div>
              <h2 class="text-lg sm:text-xl font-semibold text-white">Card details</h2>
              <p class="mt-1.5 flex items-start gap-2 text-dark-400 text-xs sm:text-sm leading-relaxed">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-cyan-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Processed securely. We never store your full card number.
              </p>
            </div>
            <div class="hidden sm:flex items-center gap-1.5 shrink-0" aria-hidden="true">
              <span class="px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide bg-white/10 text-white">VISA</span>
              <span class="px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide bg-white/10 text-white">MC</span>
              <span class="px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide bg-white/10 text-white">AMEX</span>
            </div>
          </div>

          <div
            v-if="invalidTotal"
            class="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3"
          >
            <p class="text-red-400 text-sm">
              Order total is missing. Return to checkout and select shipping again.
            </p>
          </div>

          <div
            v-if="paymentStage === 'paid'"
            class="rounded-2xl border border-emerald-500/35 bg-emerald-500/10 px-5 py-8 text-center"
          >
            <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500/30">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p class="text-emerald-300 text-lg font-semibold">Payment confirmed</p>
            <p class="text-emerald-100/75 text-sm mt-2">Taking you to your order confirmation…</p>
          </div>

          <div v-else class="relative">
            <div
              v-if="showPaymentOverlay"
              class="absolute inset-0 z-20 rounded-xl bg-dark-950/92 backdrop-blur-sm border border-slate-600/40 flex items-center justify-center p-6"
            >
              <div class="w-full max-w-sm text-center">
                <template v-if="paymentStage === 'awaiting_confirmation'">
                  <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/15 border border-amber-500/30">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p class="text-amber-300 text-base font-semibold">Confirming payment</p>
                  <p class="text-dark-300 text-sm mt-2 leading-relaxed">
                    Your card was submitted. We’re waiting for final confirmation.
                  </p>
                  <div class="mt-5 flex flex-col gap-2.5">
                    <button
                      type="button"
                      @click="checkPaymentStatus"
                      :disabled="isCheckingStatus"
                      class="min-h-[48px] px-4 rounded-xl bg-cyan-500 hover:bg-cyan-600 disabled:opacity-60 text-white text-sm font-semibold"
                    >
                      {{ isCheckingStatus ? 'Checking…' : 'Check payment status' }}
                    </button>
                    <NuxtLink
                      :to="`/checkout/success?orderId=${orderId}`"
                      class="min-h-[48px] inline-flex items-center justify-center px-4 rounded-xl bg-dark-800 hover:bg-dark-700 border border-dark-600 text-white text-sm font-medium"
                    >
                      View order status
                    </NuxtLink>
                  </div>
                </template>
                <template v-else>
                  <div class="mx-auto mb-4 h-10 w-10 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin" />
                  <p class="text-cyan-300 text-base font-semibold">{{ busyMessage }}</p>
                  <p class="text-dark-400 text-sm mt-2">Please keep this window open.</p>
                </template>
              </div>
            </div>

            <div
              :class="{
                'pointer-events-none select-none blur-[1px] opacity-40': showPaymentOverlay,
              }"
            >
              <!-- Card visual + Moov fields first on mobile -->
              <div class="payment-card-frame mb-5">
                <div class="flex items-center justify-between mb-4">
                  <span class="text-[11px] uppercase tracking-[0.18em] text-cyan-300/80 font-semibold">Debit or credit</span>
                  <div class="flex items-center gap-1.5 sm:hidden" aria-hidden="true">
                    <span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-white/10 text-white">VISA</span>
                    <span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-white/10 text-white">MC</span>
                    <span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-white/10 text-white">AMEX</span>
                  </div>
                </div>

                <label class="block mb-4">
                  <span class="text-xs text-slate-300 mb-1.5 block">Name on card</span>
                  <input
                    v-model="cardholderName"
                    type="text"
                    class="pay-input"
                    autocomplete="cc-name"
                    autocapitalize="words"
                    placeholder="Name as it appears on the card"
                  />
                </label>

                <ClientOnly>
                  <div class="payment-card-drop-shell">
                    <moov-card-link
                      v-if="showCardForm"
                      ref="cardLinkRef"
                    ></moov-card-link>
                    <div v-else class="py-10 text-center text-slate-400 text-sm">
                      Loading secure card fields…
                    </div>
                  </div>
                  <template #fallback>
                    <div class="payment-card-drop-shell py-10 text-center text-slate-400 text-sm">
                      Loading secure card fields…
                    </div>
                  </template>
                </ClientOnly>
              </div>

              <div class="mb-5">
                <label class="flex items-center gap-3 cursor-pointer select-none min-h-[48px] rounded-xl border border-white/10 bg-dark-950/40 px-3.5">
                  <input
                    v-model="billingSameAsShipping"
                    type="checkbox"
                    class="h-5 w-5 rounded border-dark-500 bg-dark-800 text-cyan-500 focus:ring-cyan-500 shrink-0"
                  />
                  <span class="text-sm text-dark-200 leading-snug">Billing address same as shipping</span>
                </label>

                <div v-if="billingSameAsShipping" class="mt-3 rounded-xl border border-white/10 bg-dark-950/50 px-4 py-3 text-sm text-dark-300 leading-relaxed">
                  <p class="text-white font-medium">{{ firstName }} {{ lastName }}</p>
                  <p>{{ shippingAddress1 }}</p>
                  <p v-if="shippingAddress2">{{ shippingAddress2 }}</p>
                  <p>{{ shippingCity }}, {{ shippingState }} {{ shippingPostalCode }}</p>
                </div>

                <div v-else class="mt-3 space-y-3">
                  <label class="block">
                    <span class="text-xs text-dark-400 mb-1.5 block">Billing name</span>
                    <input v-model="billingName" type="text" class="pay-input" autocomplete="name" />
                  </label>
                  <label class="block">
                    <span class="text-xs text-dark-400 mb-1.5 block">Address</span>
                    <input v-model="billingAddress1" type="text" class="pay-input" autocomplete="billing address-line1" placeholder="Street address" />
                  </label>
                  <label class="block">
                    <span class="text-xs text-dark-400 mb-1.5 block">Apt, suite (optional)</span>
                    <input v-model="billingAddress2" type="text" class="pay-input" autocomplete="billing address-line2" />
                  </label>
                  <div class="grid grid-cols-2 gap-3">
                    <label class="block col-span-2 sm:col-span-1">
                      <span class="text-xs text-dark-400 mb-1.5 block">City</span>
                      <input v-model="billingCity" type="text" class="pay-input" autocomplete="billing address-level2" />
                    </label>
                    <label class="block">
                      <span class="text-xs text-dark-400 mb-1.5 block">State</span>
                      <input v-model="billingState" type="text" class="pay-input" autocomplete="billing address-level1" />
                    </label>
                    <label class="block">
                      <span class="text-xs text-dark-400 mb-1.5 block">ZIP</span>
                      <input v-model="billingPostalCode" type="text" class="pay-input" inputmode="numeric" autocomplete="billing postal-code" />
                    </label>
                  </div>
                </div>
              </div>

              <button
                type="button"
                class="mb-5 w-full min-h-[44px] text-left text-sm text-dark-400 hover:text-white"
                @click="contactOpen = !contactOpen"
              >
                {{ contactOpen ? 'Hide contact details' : 'Edit email or phone' }}
              </button>

              <div v-if="contactOpen" class="mb-5 space-y-3">
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
                <label class="block">
                  <span class="text-xs text-dark-400 mb-1.5 block">Email</span>
                  <input v-model="email" type="email" class="pay-input" autocomplete="email" inputmode="email" />
                </label>
                <label class="block">
                  <span class="text-xs text-dark-400 mb-1.5 block">Phone</span>
                  <input v-model="phone" type="tel" class="pay-input" autocomplete="tel" inputmode="tel" />
                </label>
              </div>

              <div
                v-if="cardError"
                class="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3"
              >
                <p class="text-red-400 text-sm leading-relaxed">{{ cardError }}</p>
              </div>

              <p
                v-if="cardLinkedOnServer && paymentStage === 'ready'"
                class="mb-4 text-emerald-400/90 text-sm"
              >
                Card ready. Tap Pay to complete your order.
              </p>

              <p class="mt-4 text-center text-[11px] text-dark-400 leading-relaxed px-1">
                By placing an order, you agree to the
                <NuxtLink to="/terms" target="_blank" class="text-cyan-400/90">Terms of Service</NuxtLink>,
                <NuxtLink to="/privacy" target="_blank" class="text-cyan-400/90">Privacy Policy</NuxtLink>, and
                <NuxtLink to="/research-use-only" target="_blank" class="text-cyan-400/90">Research Use Only</NuxtLink> policy.
              </p>
              <button
                type="button"
                @click="submitPayment"
                :disabled="!canPay"
                class="hidden lg:inline-flex w-full items-center justify-center gap-2 rounded-xl min-h-[52px] px-5 text-base font-semibold transition-all duration-200
                  bg-cyan-500 hover:bg-cyan-600 text-white
                  disabled:bg-dark-800 disabled:text-dark-500 disabled:border disabled:border-dark-700 disabled:cursor-not-allowed
                  shadow-lg shadow-cyan-500/20 disabled:shadow-none"
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
            Secure card processing · 256-bit encryption
          </p>
        </section>

        <aside class="lg:sticky lg:top-8 order-first lg:order-none">
          <div class="rounded-2xl border border-white/10 bg-dark-900/95 overflow-hidden shadow-xl shadow-black/20">
            <button
              type="button"
              class="w-full flex items-center justify-between gap-3 px-4 py-4 sm:px-6 min-h-[56px] lg:pointer-events-none"
              @click="summaryOpen = !summaryOpen"
            >
              <div class="text-left min-w-0">
                <p class="text-xs text-dark-400">Order {{ orderNumber || '—' }}</p>
                <p class="text-white font-semibold truncate">{{ formatCents(totalCents) }}</p>
              </div>
              <span class="lg:hidden text-dark-400 text-sm shrink-0">{{ summaryOpen ? 'Hide' : 'Details' }}</span>
            </button>

            <div
              class="px-4 sm:px-6 pb-5 sm:pb-6"
              :class="summaryOpen ? 'block' : 'hidden lg:block'"
            >
              <div v-if="cartStore.items.length" class="divide-y divide-dark-800 mb-4 border-t border-dark-800">
                <div
                  v-for="item in cartStore.items"
                  :key="item.variantId"
                  class="flex justify-between py-2.5 text-sm gap-3"
                >
                  <div class="min-w-0">
                    <p class="text-white font-medium leading-snug">{{ item.productName }}</p>
                    <p class="text-dark-400">{{ item.variantName }} × {{ item.quantity }}</p>
                  </div>
                  <p class="text-white whitespace-nowrap shrink-0">{{ formatPrice(item.unitPrice * item.quantity) }}</p>
                </div>
              </div>

              <div class="space-y-2.5 text-sm">
                <div class="flex justify-between gap-4">
                  <span class="text-dark-400">Method</span>
                  <span class="text-white text-right">
                    <template v-if="shippingCarrier || shippingService">
                      {{ shippingCarrier }}{{ shippingCarrier && shippingService ? ' — ' : '' }}{{ shippingService }}
                    </template>
                    <template v-else>Selected</template>
                  </span>
                </div>
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
                  <span class="text-2xl font-bold text-cyan-400 tracking-tight">{{ formatCents(totalCents) }}</span>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>

    <!-- Mobile sticky pay bar -->
    <div
      v-if="!isLoading && !error && !paymentBlocked && paymentStage !== 'paid' && !showPaymentOverlay"
      class="lg:hidden fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-dark-950/95 backdrop-blur-xl px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
    >
      <div class="flex items-center gap-3 max-w-[1100px] mx-auto">
        <div class="min-w-0">
          <p class="text-[11px] text-dark-400 leading-none">Total</p>
          <p class="text-white font-bold text-lg leading-tight">{{ formatCents(totalCents) }}</p>
        </div>
        <button
          type="button"
          @click="submitPayment"
          :disabled="!canPay"
          class="flex-1 inline-flex items-center justify-center gap-2 rounded-xl min-h-[52px] px-4 text-base font-semibold
            bg-cyan-500 hover:bg-cyan-600 text-white
            disabled:bg-dark-800 disabled:text-dark-500 disabled:border disabled:border-dark-700 disabled:cursor-not-allowed"
        >
          <svg v-if="paymentStage === 'card_submitting'" class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ payButtonLabel }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
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
  | 'awaiting_confirmation'
  | 'paid'
  | 'failed'

const MOOV_INPUT_STYLE = {
  color: '#f8fafc',
  backgroundColor: 'transparent',
  fontSize: '16px',
  fontFamily: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
  lineHeight: '1.5',
  letterSpacing: '0.01em',
  '--text-color-invalid': '#f87171',
}

const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()
const cartStore = useCartStore()

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
const summaryOpen = ref(false)
const contactOpen = ref(false)

const isTestMode = computed(() => (config.public.moovMode as string || 'test') === 'test')
const invalidTotal = computed(() => !totalCents.value || totalCents.value <= 0)
const formatCents = (cents: number) => `${CURRENCY.SYMBOL}${((Number(cents) || 0) / 100).toFixed(2)}`
const formatPrice = (price: number) => `${CURRENCY.SYMBOL}${Number(price || 0).toFixed(2)}`

const isBusy = computed(() =>
  ['card_submitting', 'preparing', 'processing_payment'].includes(paymentStage.value)
)

const showPaymentOverlay = computed(() =>
  ['preparing', 'processing_payment', 'awaiting_confirmation'].includes(paymentStage.value)
)

const busyMessage = computed(() => {
  if (paymentStage.value === 'preparing') return 'Preparing secure payment…'
  if (paymentStage.value === 'card_submitting') return 'Securing your card…'
  return 'Confirming payment…'
})

async function goToSuccess() {
  paymentStage.value = 'paid'
  stopPolling()
  // Clear cart only after server confirms paid (not when leaving shipping).
  try {
    cartStore.clearCart()
  } catch {
    // non-fatal
  }
  // Brief confirmation beat so the transition doesn’t feel like a flash
  await new Promise((r) => setTimeout(r, 700))
  await router.replace(`/checkout/success?orderId=${orderId}`)
}

const displayPaymentStatus = computed(() => {
  if (paymentStage.value === 'paid' || paymentStatus.value === 'paid') return 'Paid'
  if (
    paymentStage.value === 'processing_payment' ||
    paymentStage.value === 'awaiting_confirmation' ||
    paymentStatus.value === 'processing'
  ) {
    return 'Processing'
  }
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
const paymentPanelRef = ref<HTMLElement | null>(null)
const cardLinkedOnServer = ref(false)
const isCheckingStatus = ref(false)

let pollTimer: ReturnType<typeof setTimeout> | null = null
let pollAttempts = 0
let submitWatchdog: ReturnType<typeof setTimeout> | null = null
const MAX_POLL_ATTEMPTS = 30 // 60 seconds at 2s interval
const CARD_SUBMIT_TIMEOUT_MS = 45000

const payButtonLabel = computed(() => {
  if (paymentStage.value === 'card_submitting') return 'Processing secure payment…'
  if (!cardReady.value && !cardLinkedOnServer.value) return 'Loading secure payment form…'
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
    drop.validationEvent = 'change'
    drop.inputStyle = { ...MOOV_INPUT_STYLE }
    applyBillingToDrop(drop)
    drop.onSuccess = handleCardSuccess
    drop.onError = handleCardError
    drop.onEnterKeyPress = () => {
      void submitPayment()
    }

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
      await goToSuccess()
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

  if (transfer.paymentStatus === 'paid') {
    await goToSuccess()
    return
  }

  if (transfer.paymentStatus === 'failed') {
    paymentStage.value = 'ready'
    cardError.value = 'Payment failed. Please try another card or contact support.'
    stopPolling()
    return
  }

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
  paymentStatus.value = 'processing'
  pollPaymentStatus()
}

async function applyStatusPayload(status: {
  paymentStatus?: string
  orderNumber?: string
  subtotalCents?: number
  shippingCostCents?: number
  taxCents?: number
  totalCents?: number
  shippingStatus?: string
  shippingCarrier?: string | null
  shippingService?: string | null
}) {
  paymentStatus.value = status.paymentStatus || paymentStatus.value
  if (status.orderNumber) orderNumber.value = status.orderNumber
  if (status.subtotalCents != null) subtotalCents.value = Number(status.subtotalCents) || 0
  if (status.shippingCostCents != null) shippingCostCents.value = Number(status.shippingCostCents) || 0
  if (status.taxCents != null) taxCents.value = Number(status.taxCents) || 0
  if (status.totalCents != null) totalCents.value = Number(status.totalCents) || 0
  if (status.shippingStatus) shippingStatus.value = status.shippingStatus
  if (status.shippingCarrier) shippingCarrier.value = status.shippingCarrier
  if (status.shippingService) shippingService.value = status.shippingService
}

async function fetchPaymentStatus() {
  return await $fetch<{
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
}

async function pollPaymentStatus() {
  pollAttempts += 1

  try {
    const status = await fetchPaymentStatus()
    await applyStatusPayload(status)

    if (status.paymentStatus === 'paid') {
      await goToSuccess()
      return
    }

    if (status.paymentStatus === 'failed' || status.paymentStatus === 'cancelled') {
      paymentStage.value = 'ready'
      cardError.value =
        'Payment failed. Please try another card or contact support.'
      stopPolling()
      return
    }
  } catch (err: any) {
    console.error('Payment status poll error:', err)
  }

  if (pollAttempts >= MAX_POLL_ATTEMPTS) {
    paymentStage.value = 'awaiting_confirmation'
    paymentStatus.value = 'processing'
    stopPolling()
    return
  }

  pollTimer = setTimeout(pollPaymentStatus, 2000)
}

async function checkPaymentStatus() {
  isCheckingStatus.value = true
  cardError.value = null
  try {
    const status = await fetchPaymentStatus()
    await applyStatusPayload(status)

    if (status.paymentStatus === 'paid') {
      await goToSuccess()
      return
    }

    if (status.paymentStatus === 'failed' || status.paymentStatus === 'cancelled') {
      paymentStage.value = 'ready'
      cardError.value = 'Payment failed. Please try another card or contact support.'
      return
    }

    paymentStage.value = 'awaiting_confirmation'
    paymentStatus.value = 'processing'
  } catch (err: any) {
    console.error('Check payment status error:', err)
    cardError.value = err.data?.message || err.message || 'Could not check payment status.'
  } finally {
    isCheckingStatus.value = false
  }
}

watch(showPaymentOverlay, (active) => {
  if (!active || !import.meta.client) return
  nextTick(() => {
    paymentPanelRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
})

watch(paymentStage, (stage) => {
  if (stage !== 'paid' || !import.meta.client) return
  nextTick(() => {
    paymentPanelRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
})

onMounted(async () => {
  if (import.meta.client) {
    needsHttps.value = window.location.protocol !== 'https:'
    if (!document.getElementById('qbp-moov-theme')) {
      const theme = document.createElement('style')
      theme.id = 'qbp-moov-theme'
      theme.textContent = `:root{--moov-color-background:#020617;--moov-color-background-secondary:#0f172a;--moov-color-background-tertiary:#1e293b;--moov-color-primary:#22d3ee;--moov-color-secondary:#67e8f9;--moov-color-tertiary:#334155;--moov-color-info:#7dd3fc;--moov-color-warn:#fbbf24;--moov-color-danger:#f87171;--moov-color-success:#34d399;--moov-color-low-contrast:#94a3b8;--moov-color-medium-contrast:#e2e8f0;--moov-color-high-contrast:#ffffff;--moov-color-graphic-1:#22d3ee;--moov-color-graphic-2:#67e8f9;--moov-color-graphic-3:#38bdf8;--moov-radius-small:.65rem;--moov-radius-large:.9rem}`
      document.body.prepend(theme)
    }
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
  border-radius: 0.85rem;
  border: 1px solid rgba(148, 163, 184, 0.28);
  background: rgba(2, 6, 23, 0.72);
  color: #f8fafc;
  padding: 0.8rem 0.95rem;
  font-size: 16px;
  line-height: 1.4;
  min-height: 48px;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  -webkit-appearance: none;
}

.pay-input::placeholder {
  color: #64748b;
}

.pay-input:focus {
  border-color: rgba(34, 211, 238, 0.65);
  box-shadow: 0 0 0 3px rgba(34, 211, 238, 0.12);
}

.payment-card-frame {
  border-radius: 1.25rem;
  border: 1px solid rgba(34, 211, 238, 0.22);
  background:
    radial-gradient(1200px 280px at 10% -10%, rgba(34, 211, 238, 0.12), transparent 55%),
    linear-gradient(145deg, #0b2744 0%, #020617 58%, #082f3b 100%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 18px 40px rgba(0, 0, 0, 0.28);
  padding: 1.1rem 1rem 1.15rem;
}

@media (min-width: 640px) {
  .payment-card-frame {
    padding: 1.35rem 1.35rem 1.4rem;
  }
}

.payment-card-drop-shell {
  border-radius: 0.9rem;
  border: 1px solid rgba(148, 163, 184, 0.22);
  background: rgba(2, 6, 23, 0.55);
  padding: 0.65rem 0.7rem;
  min-height: 0;
  overflow: visible;
}

.payment-card-drop-shell :deep(moov-card-link) {
  display: block;
  width: 100%;
  min-height: 168px;
  overflow: visible;
  color: #f8fafc;
  font-size: 16px;
  line-height: 1.45;
}
</style>

<style>
/* Moov Drop theme — override default palette from js.moov.io */
:root {
  --moov-color-background: #020617;
  --moov-color-background-secondary: #0f172a;
  --moov-color-background-tertiary: #1e293b;
  --moov-color-primary: #22d3ee;
  --moov-color-secondary: #67e8f9;
  --moov-color-tertiary: #334155;
  --moov-color-info: #7dd3fc;
  --moov-color-warn: #fbbf24;
  --moov-color-danger: #f87171;
  --moov-color-success: #34d399;
  --moov-color-low-contrast: #94a3b8;
  --moov-color-medium-contrast: #e2e8f0;
  --moov-color-high-contrast: #ffffff;
  --moov-color-graphic-1: #22d3ee;
  --moov-color-graphic-2: #67e8f9;
  --moov-color-graphic-3: #38bdf8;
  --moov-radius-small: 0.65rem;
  --moov-radius-large: 0.9rem;
}
</style>
