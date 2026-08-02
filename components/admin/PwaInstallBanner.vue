<template>
  <div
    v-if="visible"
    class="lg:hidden fixed inset-x-0 bottom-0 z-[80] px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pointer-events-none"
  >
    <div
      class="pointer-events-auto mx-auto max-w-md rounded-2xl border border-cyan-500/25 bg-dark-900/95 backdrop-blur-xl shadow-2xl shadow-black/40 px-4 py-3.5 flex items-center gap-3"
    >
      <img
        src="/icons/icon-192.png"
        alt=""
        class="w-11 h-11 rounded-xl border border-dark-600 shrink-0"
      />
      <div class="min-w-0 flex-1">
        <p class="text-white text-sm font-semibold leading-tight">Install QBP Owner</p>
        <p class="text-dark-400 text-xs mt-0.5 leading-snug">
          Add to your home screen for quick inventory &amp; sales.
        </p>
      </div>
      <div class="flex flex-col gap-1.5 shrink-0">
        <button
          type="button"
          class="min-h-[36px] px-3 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white text-xs font-semibold"
          @click="install"
        >
          Install
        </button>
        <button
          type="button"
          class="min-h-[28px] px-3 text-dark-500 hover:text-dark-300 text-[11px]"
          @click="dismiss"
        >
          Not now
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const STORAGE_KEY = 'qbp_admin_pwa_dismissed'

const deferredPrompt = ref<any>(null)
const visible = ref(false)

function checkStandalone() {
  if (!import.meta.client) return false
  const mq = window.matchMedia('(display-mode: standalone)').matches
  const ios = Boolean((navigator as any).standalone)
  return mq || ios
}

function install() {
  if (!deferredPrompt.value) {
    alert('To install: tap Share → Add to Home Screen')
    return
  }
  deferredPrompt.value.prompt()
  deferredPrompt.value.userChoice.finally(() => {
    deferredPrompt.value = null
    visible.value = false
  })
}

function dismiss() {
  visible.value = false
  if (import.meta.client) {
    localStorage.setItem(STORAGE_KEY, String(Date.now()))
  }
}

function onBeforeInstallPrompt(e: Event) {
  e.preventDefault()
  deferredPrompt.value = e
  visible.value = true
}

onMounted(() => {
  if (!import.meta.client) return
  if (checkStandalone()) return

  const dismissedAt = Number(localStorage.getItem(STORAGE_KEY) || 0)
  const week = 7 * 24 * 60 * 60 * 1000
  if (dismissedAt && Date.now() - dismissedAt < week) return

  window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)

  const ua = navigator.userAgent || ''
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  if (isIOS) {
    setTimeout(() => {
      if (!deferredPrompt.value && !checkStandalone()) visible.value = true
    }, 1800)
  }
})

onBeforeUnmount(() => {
  if (!import.meta.client) return
  window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
})
</script>
