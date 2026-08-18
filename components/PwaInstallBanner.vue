<template>
  <div
    v-if="visible"
    class="lg:hidden fixed inset-x-0 bottom-0 z-[80] px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pointer-events-none"
  >
    <div
      class="pointer-events-auto mx-auto max-w-md rounded-2xl border border-white/10 bg-black/95 backdrop-blur-xl shadow-2xl shadow-black/40 px-4 py-3.5 flex items-center gap-3"
    >
      <QbpAppIcon class="w-11 h-11 rounded-xl border border-white/15 shrink-0 overflow-hidden" />
      <div class="min-w-0 flex-1">
        <p class="text-white text-sm font-semibold leading-tight">Install QBP</p>
        <p class="text-neutral-400 text-xs mt-0.5 leading-snug">
          Add to your home screen in one tap.
        </p>
      </div>
      <div class="flex flex-col gap-1.5 shrink-0">
        <button
          type="button"
          class="min-h-[44px] px-3 rounded-lg bg-white text-black text-xs font-semibold"
          @click="install"
        >
          Install
        </button>
        <button
          type="button"
          class="min-h-[28px] px-3 text-neutral-500 hover:text-neutral-300 text-[11px]"
          @click="dismiss"
        >
          Not now
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const STORAGE_KEY = 'qbp_store_pwa_dismissed'
const route = useRoute()
const { showInstall, canNativeInstall, ios, promptInstall } = usePwaInstall('store')

const dismissed = ref(false)

function hideOnSensitivePage() {
  return (
    route.path.startsWith('/checkout') ||
    route.path.startsWith('/admin') ||
    route.path.startsWith('/owner')
  )
}

const visible = computed(() => {
  if (dismissed.value) return false
  if (!showInstall.value) return false
  if (hideOnSensitivePage()) return false
  return canNativeInstall.value || ios.value
})

function dismiss() {
  dismissed.value = true
  if (import.meta.client) {
    localStorage.setItem(STORAGE_KEY, String(Date.now()))
  }
}

async function install() {
  if (canNativeInstall.value) {
    const outcome = await promptInstall()
    if (outcome === 'accepted') dismissed.value = true
    return
  }
  if (import.meta.client) {
    window.alert('On iPhone: tap Share, then Add to Home Screen.')
  }
}

onMounted(() => {
  if (!import.meta.client) return
  const dismissedAt = Number(localStorage.getItem(STORAGE_KEY) || 0)
  const week = 7 * 24 * 60 * 60 * 1000
  if (dismissedAt && Date.now() - dismissedAt < week) dismissed.value = true
})
</script>
