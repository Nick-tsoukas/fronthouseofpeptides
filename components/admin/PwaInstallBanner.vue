<template>
  <ClientOnly>
    <div
      v-if="visible"
      class="lg:hidden fixed inset-x-0 z-[80] px-3 pointer-events-none"
      style="bottom: calc(4.25rem + env(safe-area-inset-bottom))"
    >
      <div
        class="pointer-events-auto mx-auto max-w-md rounded-2xl border border-cyan-500/25 bg-dark-900/95 backdrop-blur-xl shadow-2xl shadow-black/40 px-4 py-3.5 flex items-center gap-3"
      >
        <QbpAppIcon class="w-11 h-11 rounded-xl border border-dark-600 shrink-0 overflow-hidden" />
        <div class="min-w-0 flex-1">
          <p class="text-white text-sm font-semibold leading-tight">Install QBP Owner</p>
          <p class="text-dark-400 text-xs mt-0.5 leading-snug">
            One tap. No Chrome menu needed.
          </p>
        </div>
        <div class="flex flex-col gap-1.5 shrink-0">
          <button
            type="button"
            class="min-h-[40px] px-3 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white text-xs font-semibold"
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
  </ClientOnly>
</template>

<script setup lang="ts">
const STORAGE_KEY = 'qbp_admin_pwa_dismissed'
const route = useRoute()
const { showInstall, ready, canNativeInstall, promptInstall } = usePwaInstall('admin')

const dismissed = ref(false)

const visible = computed(() => {
  if (!ready.value) return false
  if (dismissed.value) return false
  if (!showInstall.value) return false
  if (route.path === '/admin/install' || route.path === '/admin/login') return false
  return true
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
    if (outcome !== 'unavailable') return
  }
  if (import.meta.client) window.location.assign('/admin/install')
}

onMounted(() => {
  if (!import.meta.client) return
  const dismissedAt = Number(localStorage.getItem(STORAGE_KEY) || 0)
  const week = 7 * 24 * 60 * 60 * 1000
  if (dismissedAt && Date.now() - dismissedAt < week) dismissed.value = true
})
</script>
