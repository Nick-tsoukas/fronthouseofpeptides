<template>
  <div class="min-h-screen bg-dark-950 py-8 sm:py-12">
    <div class="max-w-xl mx-auto px-4">
      <div v-if="pending" class="text-center py-20 text-dark-400">Loading your payment instructions…</div>

      <div v-else-if="loadError" class="bg-dark-900 border border-dark-700 rounded-2xl p-6 text-center">
        <h1 class="text-xl font-semibold text-white mb-2">We can't show this order</h1>
        <p class="text-dark-400 text-sm mb-6">{{ loadError }}</p>
        <NuxtLink to="/contact" class="text-primary-400 hover:text-primary-300 text-sm">
          Contact support →
        </NuxtLink>
      </div>

      <template v-else-if="order">
        <!-- Header -->
        <div class="text-center mb-6">
          <p class="text-xs uppercase tracking-[0.2em] text-primary-400 mb-2">{{ payment.label }} payment</p>
          <h1 class="text-2xl sm:text-3xl font-bold text-white">{{ headline }}</h1>
          <p class="text-dark-400 text-sm mt-2">Order {{ order.orderNumber }}</p>
        </div>

        <!-- Paid -->
        <div
          v-if="order.paymentStatus === 'paid'"
          class="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 mb-6 text-center"
        >
          <p class="text-emerald-300 font-semibold">Payment received — order confirmed</p>
          <p class="text-emerald-200/80 text-sm mt-2">
            Thanks! We verified your payment and your order is being prepared. A receipt is on its way to
            {{ order.email }}.
          </p>
        </div>

        <!-- Awaiting verification -->
        <div
          v-else-if="order.paymentStatus === 'payment_claimed_by_customer' || order.paymentStatus === 'manual_review'"
          class="bg-fuchsia-500/10 border border-fuchsia-500/30 rounded-2xl p-6 mb-6"
        >
          <p class="text-fuchsia-200 font-semibold">Thanks — your payment is awaiting verification</p>
          <p class="text-fuchsia-100/80 text-sm mt-2 leading-relaxed">
            We'll check {{ payment.label }} and email {{ order.email }} as soon as it's confirmed. Your order is
            not confirmed until payment is verified. No card has been charged on this website.
          </p>
        </div>

        <!-- Rejected -->
        <div
          v-else-if="order.paymentStatus === 'manual_payment_rejected'"
          class="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-6 mb-6"
        >
          <p class="text-orange-300 font-semibold">We couldn't verify your payment</p>
          <p v-if="order.manualPaymentRejectionReason" class="text-orange-100/90 text-sm mt-2 whitespace-pre-line">
            {{ order.manualPaymentRejectionReason }}
          </p>
          <p class="text-orange-100/80 text-sm mt-2">
            Please send exactly {{ formatCents(order.totalCents) }} to {{ payment.handle }} with
            {{ order.orderNumber }} in the note, then tap “I sent payment” again below.
          </p>
        </div>

        <!-- Payment instructions -->
        <div
          v-if="showInstructions"
          class="bg-dark-900 border border-dark-700 rounded-2xl p-5 sm:p-6 mb-6"
        >
          <div v-if="!payment.configured" class="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
            <p class="text-amber-300 text-sm font-semibold">Payment instructions are not configured</p>
            <p class="text-amber-200/80 text-xs mt-1">
              Please contact
              <a v-if="payment.supportEmail" :href="`mailto:${payment.supportEmail}`" class="underline">
                {{ payment.supportEmail }}
              </a>
              <span v-else>support</span>
              to complete this order.
            </p>
          </div>

          <template v-else>
            <p class="text-dark-300 text-sm leading-relaxed mb-5">
              Send <span class="text-white font-semibold">exactly {{ formatCents(order.totalCents) }}</span> to
              <span class="text-white font-semibold">{{ payment.handle }}</span> and include
              <span class="text-white font-semibold">{{ order.orderNumber }}</span> in the {{ payment.label }} note.
            </p>

            <dl class="space-y-3 mb-5">
              <div class="flex items-center justify-between gap-3">
                <dt class="text-dark-400 text-sm">Amount</dt>
                <dd class="flex items-center gap-2">
                  <span class="text-white font-semibold tabular-nums">{{ formatCents(order.totalCents) }}</span>
                  <button type="button" class="copy-btn" @click="copy(amountPlain, 'amount')">
                    {{ copied === 'amount' ? 'Copied' : 'Copy' }}
                  </button>
                </dd>
              </div>
              <div class="flex items-center justify-between gap-3">
                <dt class="text-dark-400 text-sm">Order number</dt>
                <dd class="flex items-center gap-2">
                  <span class="text-white font-mono text-sm">{{ order.orderNumber }}</span>
                  <button type="button" class="copy-btn" @click="copy(order.orderNumber, 'order')">
                    {{ copied === 'order' ? 'Copied' : 'Copy' }}
                  </button>
                </dd>
              </div>
              <div class="flex items-center justify-between gap-3">
                <dt class="text-dark-400 text-sm">Send to</dt>
                <dd class="flex items-center gap-2">
                  <span class="text-white font-mono text-sm">{{ payment.handle }}</span>
                  <button type="button" class="copy-btn" @click="copy(payment.handle, 'handle')">
                    {{ copied === 'handle' ? 'Copied' : 'Copy' }}
                  </button>
                </dd>
              </div>
              <div v-if="payment.displayName" class="flex items-center justify-between gap-3">
                <dt class="text-dark-400 text-sm">Recipient name</dt>
                <dd class="text-white text-sm">{{ payment.displayName }}</dd>
              </div>
            </dl>

            <img
              v-if="payment.qrImageUrl"
              :src="payment.qrImageUrl"
              :alt="`${payment.label} QR code`"
              class="w-40 h-40 object-contain mx-auto rounded-xl bg-white p-2 mb-5"
            />

            <a
              v-if="payment.paymentUrl"
              :href="payment.paymentUrl"
              target="_blank"
              rel="noopener"
              class="w-full min-h-[48px] mb-3 bg-[#00d54b] hover:bg-[#00c144] text-black font-semibold rounded-xl flex items-center justify-center"
            >
              Open {{ payment.label }}
            </a>

            <p v-if="payment.instructions" class="text-dark-400 text-sm whitespace-pre-line mb-4">
              {{ payment.instructions }}
            </p>

            <p class="text-amber-300/90 text-xs leading-relaxed">
              Your order is not confirmed until payment is verified. No card has been charged on this website.
            </p>
          </template>
        </div>

        <!-- I sent payment -->
        <div
          v-if="canClaim && payment.configured"
          class="bg-dark-900 border border-dark-700 rounded-2xl p-5 sm:p-6 mb-6"
        >
          <h2 class="text-white font-semibold mb-1">I sent payment</h2>
          <p class="text-dark-400 text-xs mb-4">
            Tell us who it came from so we can match it in {{ payment.label }}.
          </p>

          <div class="space-y-3">
            <div>
              <label class="block text-dark-300 text-xs mb-1">Name on your {{ payment.label }} account *</label>
              <input
                v-model="claim.senderName"
                type="text"
                class="w-full min-h-[44px] px-3 bg-dark-800 border border-dark-700 rounded-xl text-white text-sm focus:border-primary-500 focus:outline-none"
                placeholder="Jane Doe"
              />
            </div>
            <div>
              <label class="block text-dark-300 text-xs mb-1">
                Your {{ payment.method === 'zelle' ? 'Zelle email or phone' : '$Cashtag' }}
              </label>
              <input
                v-model="claim.senderHandle"
                type="text"
                class="w-full min-h-[44px] px-3 bg-dark-800 border border-dark-700 rounded-xl text-white text-sm focus:border-primary-500 focus:outline-none"
                :placeholder="payment.method === 'zelle' ? 'jane@example.com' : '$janedoe'"
              />
            </div>
            <div>
              <label class="block text-dark-300 text-xs mb-1">Note (optional)</label>
              <textarea
                v-model="claim.note"
                rows="2"
                class="w-full px-3 py-2 bg-dark-800 border border-dark-700 rounded-xl text-white text-sm focus:border-primary-500 focus:outline-none"
                placeholder="Anything we should know about this payment"
              ></textarea>
            </div>
          </div>

          <p v-if="claimError" class="text-red-400 text-sm mt-3">{{ claimError }}</p>

          <button
            type="button"
            :disabled="isClaiming || !claim.senderName.trim()"
            class="w-full min-h-[48px] mt-4 bg-primary-500 hover:bg-primary-600 disabled:bg-dark-700 disabled:text-dark-500 text-white font-semibold rounded-xl transition-colors"
            @click="submitClaim"
          >
            {{ isClaiming ? 'Sending…' : 'I sent payment' }}
          </button>
          <p class="text-dark-500 text-xs mt-2 text-center">
            This tells us to check {{ payment.label }}. It does not confirm your order.
          </p>
        </div>

        <div class="text-center space-y-2">
          <p v-if="payment.supportEmail" class="text-dark-500 text-xs">
            Questions? <a :href="`mailto:${payment.supportEmail}`" class="text-primary-400">{{ payment.supportEmail }}</a>
          </p>
          <NuxtLink to="/" class="inline-block text-dark-400 hover:text-white text-sm">Continue browsing</NuxtLink>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useCartStore } from '~/stores/cart'
import { CURRENCY } from '~/constants'

interface ManualPaymentOrder {
  id: number
  orderNumber: string
  customerName: string
  email: string
  paymentStatus: string
  status: string
  manualPaymentMethod: 'cashapp' | 'zelle'
  totalCents: number
  manualPaymentExpiresAt: string | null
  customerPaymentClaimedAt: string | null
  manualPaymentRejectionReason: string | null
  paidAt: string | null
}

interface ManualPaymentConfig {
  method: 'cashapp' | 'zelle'
  label: string
  displayName: string
  handle: string
  secondaryHandle: string
  paymentUrl: string
  qrImageUrl: string
  instructions: string
  supportEmail: string
  expirationHours: number
  configured: boolean
}

const route = useRoute()
const cartStore = useCartStore()
const orderId = Number(route.query.orderId)

const order = ref<ManualPaymentOrder | null>(null)
const paymentConfig = ref<ManualPaymentConfig | null>(null)
const loadError = ref<string | null>(null)
const pending = ref(true)
const isClaiming = ref(false)
const claimError = ref<string | null>(null)
const copied = ref<string | null>(null)

const claim = reactive({ senderName: '', senderHandle: '', note: '' })

const payment = computed<ManualPaymentConfig>(
  () =>
    paymentConfig.value || {
      method: 'cashapp',
      label: 'Cash App',
      displayName: '',
      handle: '',
      secondaryHandle: '',
      paymentUrl: '',
      qrImageUrl: '',
      instructions: '',
      supportEmail: '',
      expirationHours: 24,
      configured: false,
    }
)

const formatCents = (cents: number) => `${CURRENCY.SYMBOL}${((cents || 0) / 100).toFixed(2)}`
const amountPlain = computed(() => ((order.value?.totalCents || 0) / 100).toFixed(2))

const showInstructions = computed(
  () => order.value != null && order.value.paymentStatus !== 'paid'
)

const canClaim = computed(
  () =>
    order.value != null &&
    ['awaiting_manual_payment', 'manual_payment_rejected'].includes(order.value.paymentStatus)
)

const headline = computed(() => {
  const status = order.value?.paymentStatus
  if (status === 'paid') return 'Order confirmed'
  if (status === 'payment_claimed_by_customer' || status === 'manual_review') {
    return 'Awaiting payment verification'
  }
  if (status === 'manual_payment_rejected') return 'Action needed'
  return 'Send your payment'
})

async function load() {
  if (!Number.isInteger(orderId) || orderId <= 0) {
    loadError.value = 'This payment link is invalid.'
    pending.value = false
    return
  }
  try {
    const res = await $fetch<{ order: ManualPaymentOrder; payment: ManualPaymentConfig }>(
      '/api/checkout/manual-payment/status',
      { query: { orderId }, credentials: 'include' }
    )
    order.value = res.order
    paymentConfig.value = res.payment
    claim.senderName = claim.senderName || res.order.customerName || ''
    // The order exists now — the cart is no longer needed.
    cartStore.clearCart()
  } catch (err: any) {
    loadError.value =
      err.data?.message ||
      'Your checkout session expired. Use your order confirmation email or order lookup to continue.'
  } finally {
    pending.value = false
  }
}

async function submitClaim() {
  if (!order.value || isClaiming.value) return
  isClaiming.value = true
  claimError.value = null
  try {
    const res = await $fetch<{ paymentStatus: string; customerPaymentClaimedAt?: string }>(
      `/api/orders/${order.value.id}/payment-sent`,
      {
        method: 'POST',
        credentials: 'include',
        body: {
          senderName: claim.senderName,
          senderHandle: claim.senderHandle,
          note: claim.note,
        },
      }
    )
    order.value = {
      ...order.value,
      paymentStatus: res.paymentStatus,
      customerPaymentClaimedAt: res.customerPaymentClaimedAt || new Date().toISOString(),
    }
  } catch (err: any) {
    claimError.value = err.data?.message || 'Could not send that. Please try again.'
  } finally {
    isClaiming.value = false
  }
}

async function copy(value: string, key: string) {
  try {
    await navigator.clipboard.writeText(value)
    copied.value = key
    setTimeout(() => {
      if (copied.value === key) copied.value = null
    }, 1800)
  } catch {
    /* clipboard unavailable — the value is visible on screen */
  }
}

onMounted(load)

useHead({ title: 'Payment instructions — Quantum Bio Peptides' })
</script>

<style scoped>
.copy-btn {
  @apply px-2 py-1 text-xs rounded-lg bg-dark-800 border border-dark-700 text-dark-300 hover:text-white hover:border-dark-600 transition-colors;
}
</style>
