<template>
  <div class="min-h-screen bg-dark-950 py-8 pb-28">
    <div class="max-w-xl mx-auto px-4 sm:px-6">
      <NuxtLink
        :to="orderId ? `/checkout?orderId=${orderId}` : '/checkout'"
        class="inline-flex items-center min-h-[44px] text-dark-400 hover:text-white text-sm mb-4"
      >
        ← Back to shipping
      </NuxtLink>

      <div class="mb-6">
        <p class="text-[11px] uppercase tracking-[0.2em] text-cyan-400/80 font-semibold mb-2">Step 3 of 3</p>
        <h1 class="text-2xl sm:text-3xl font-bold text-white">Pay with Cash App</h1>
        <p class="text-dark-300 mt-2 text-sm leading-relaxed">
          No card was charged. Send the exact total below. Your order is not confirmed until payment is verified. Tracking will be emailed when your order ships.
        </p>
      </div>

      <div v-if="loadError" class="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300 text-sm mb-4">
        {{ loadError }}
      </div>

      <div v-else-if="loading" class="space-y-3">
        <div class="h-28 rounded-xl bg-dark-900 border border-dark-700 animate-pulse" />
        <div class="h-40 rounded-xl bg-dark-900 border border-dark-700 animate-pulse" />
      </div>

      <template v-else-if="info">
        <div
          v-if="!info.configured"
          class="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-100 text-sm leading-relaxed"
        >
          {{ info.incompleteMessage }}
          <p v-if="info.supportEmail" class="mt-2">Support: {{ info.supportEmail }}</p>
        </div>

        <div class="rounded-xl border border-dark-700 bg-dark-900 p-5 space-y-4 mb-4">
          <div class="flex justify-between gap-3">
            <span class="text-dark-400 text-sm">Order</span>
            <span class="text-white font-mono font-semibold">{{ info.orderNumber }}</span>
          </div>
          <div class="flex justify-between gap-3">
            <span class="text-dark-400 text-sm">Amount due</span>
            <span class="text-white text-xl font-bold">{{ formatCents(info.totalCents) }}</span>
          </div>
          <div v-if="info.cashApp.cashtag" class="flex justify-between gap-3">
            <span class="text-dark-400 text-sm">$Cashtag</span>
            <span class="text-white font-semibold">{{ info.cashApp.cashtag }}</span>
          </div>
          <div v-if="info.cashApp.displayName" class="flex justify-between gap-3">
            <span class="text-dark-400 text-sm">Cash App name</span>
            <span class="text-white">{{ info.cashApp.displayName }}</span>
          </div>

          <div class="flex flex-wrap gap-2 pt-2">
            <button type="button" class="btn-secondary" @click="copy(info.orderNumber, 'Order number')">Copy order #</button>
            <button type="button" class="btn-secondary" @click="copy(formatCents(info.totalCents), 'Amount')">Copy amount</button>
            <button
              v-if="info.cashApp.cashtag"
              type="button"
              class="btn-secondary"
              @click="copy(info.cashApp.cashtag, 'Cashtag')"
            >
              Copy $Cashtag
            </button>
          </div>

          <a
            v-if="info.cashApp.paymentUrl"
            :href="info.cashApp.paymentUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex w-full min-h-[48px] items-center justify-center rounded-xl bg-[#00D632] text-black font-bold"
          >
            Open Cash App
          </a>

          <img
            v-if="info.cashApp.qrImageUrl"
            :src="info.cashApp.qrImageUrl"
            alt="Cash App QR code"
            class="mx-auto w-48 h-48 rounded-xl border border-dark-600 bg-white p-2 object-contain"
          />
        </div>

        <div
          v-if="info.paymentStatus === 'processing' || claimed"
          class="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-100 text-sm leading-relaxed mb-4"
        >
          Your payment submission was received and is awaiting verification. Once verified, you’ll receive order confirmation. Tracking will be emailed when your order ships.
        </div>

        <div
          v-else-if="info.paymentStatus === 'paid'"
          class="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-100 text-sm leading-relaxed mb-4"
        >
          Payment received. Your order is confirmed. You’ll receive tracking by email when your order ships.
        </div>

        <div
          v-else-if="info.configured"
          class="rounded-xl border border-dark-700 bg-dark-900 p-5 space-y-3"
        >
          <h2 class="text-white font-semibold">I sent payment</h2>
          <p class="text-dark-400 text-sm">Optional: tell us who sent it so we can match your Cash App payment faster.</p>
          <label class="block">
            <span class="text-dark-400 text-xs">Sender name</span>
            <input v-model="senderName" type="text" class="input mt-1" autocomplete="name" />
          </label>
          <label class="block">
            <span class="text-dark-400 text-xs">Your Cash App $Cashtag</span>
            <input v-model="cashAppHandle" type="text" class="input mt-1" placeholder="$yourcashtag" />
          </label>
          <label class="block">
            <span class="text-dark-400 text-xs">Note</span>
            <textarea v-model="note" rows="2" class="input mt-1 resize-none" placeholder="Optional note" />
          </label>
          <button
            type="button"
            class="w-full min-h-[48px] rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-semibold disabled:opacity-50"
            :disabled="claiming"
            @click="claimPayment"
          >
            {{ claiming ? 'Submitting…' : 'I sent payment' }}
          </button>
          <p v-if="claimError" class="text-red-400 text-sm">{{ claimError }}</p>
        </div>

        <p class="text-dark-500 text-xs mt-4 leading-relaxed">
          After your payment is verified, your order will be prepared for shipment. Tracking will be emailed when your order ships.
          Support: {{ info.supportEmail }}
        </p>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const orderId = computed(() => Number(route.query.orderId) || 0)

const loading = ref(true)
const loadError = ref('')
const info = ref<any>(null)
const senderName = ref('')
const cashAppHandle = ref('')
const note = ref('')
const claiming = ref(false)
const claimError = ref('')
const claimed = ref(false)
const toast = ref('')

function formatCents(cents: number) {
  return `$${((Number(cents) || 0) / 100).toFixed(2)}`
}

async function copy(text: string, label: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.value = `${label} copied`
  } catch {
    toast.value = `Could not copy ${label}`
  }
}

async function load() {
  if (!orderId.value) {
    loadError.value = 'Missing order.'
    loading.value = false
    return
  }
  loading.value = true
  loadError.value = ''
  try {
    info.value = await $fetch('/api/checkout/payment-instructions', {
      query: { orderId: orderId.value },
      credentials: 'include',
    })
    if (info.value?.paymentStatus === 'processing') claimed.value = true
  } catch (err: any) {
    loadError.value = err?.data?.message || err?.message || 'Could not load payment instructions.'
  } finally {
    loading.value = false
  }
}

async function claimPayment() {
  if (claiming.value || !orderId.value) return
  claiming.value = true
  claimError.value = ''
  try {
    const res = await $fetch<any>('/api/checkout/claim-payment', {
      method: 'POST',
      credentials: 'include',
      body: {
        orderId: orderId.value,
        senderName: senderName.value,
        cashAppHandle: cashAppHandle.value,
        note: note.value,
      },
    })
    claimed.value = true
    if (info.value) info.value.paymentStatus = res.paymentStatus || 'processing'
  } catch (err: any) {
    claimError.value = err?.data?.message || err?.message || 'Could not submit payment claim.'
  } finally {
    claiming.value = false
  }
}

onMounted(load)

useHead({ title: 'Pay with Cash App — Quantum Bio Peptides' })
</script>

<style scoped>
.input {
  @apply w-full min-h-[44px] px-3 rounded-xl bg-dark-800 border border-dark-600 text-white text-sm focus:outline-none focus:border-cyan-500;
}
.btn-secondary {
  @apply min-h-[40px] px-3 rounded-lg bg-dark-800 border border-dark-600 text-white text-xs font-medium;
}
</style>
