<template>
  <div class="min-h-screen bg-dark-950 text-white px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] flex items-center">
    <div class="w-full max-w-md mx-auto">
      <img
        src="/icons/icon-192.png"
        alt="QBP Owner"
        class="w-20 h-20 rounded-2xl mx-auto mb-5 border border-dark-700 shadow-lg shadow-cyan-500/10"
      />
      <h1 class="text-2xl sm:text-3xl font-bold text-center">Install QBP Owner</h1>
      <p class="text-dark-300 text-center mt-2 text-sm leading-relaxed">
        This is the owner app for orders, labels, inventory, and Quick Sale. Add it to your phone’s home screen, then sign in.
      </p>

      <div
        v-if="isStandalone"
        class="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-4 text-sm text-emerald-200 leading-relaxed"
      >
        This phone already has QBP Owner installed. Open it from your home screen, then sign in.
      </div>

      <button
        v-else-if="canPrompt"
        type="button"
        class="mt-6 w-full min-h-[52px] rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-semibold"
        @click="install"
      >
        Install app
      </button>

      <div class="mt-6 space-y-4">
        <section class="rounded-2xl border border-dark-700 bg-dark-900 p-4">
          <h2 class="text-white font-semibold">iPhone / iPad</h2>
          <ol class="mt-3 space-y-2 text-sm text-dark-300 leading-relaxed list-decimal pl-5">
            <li>Open this page in <strong class="text-white">Safari</strong> (not Chrome).</li>
            <li>Tap the <strong class="text-white">Share</strong> button.</li>
            <li>Tap <strong class="text-white">Add to Home Screen</strong>.</li>
            <li>Open <strong class="text-white">QBP Owner</strong> from the home screen and sign in.</li>
          </ol>
        </section>

        <section class="rounded-2xl border border-dark-700 bg-dark-900 p-4">
          <h2 class="text-white font-semibold">Android</h2>
          <ol class="mt-3 space-y-2 text-sm text-dark-300 leading-relaxed list-decimal pl-5">
            <li>Open this page in <strong class="text-white">Chrome</strong>.</li>
            <li>Tap <strong class="text-white">Install</strong> above, or Chrome menu → <strong class="text-white">Install app</strong>.</li>
            <li>Open <strong class="text-white">QBP Owner</strong> and sign in.</li>
          </ol>
        </section>
      </div>

      <NuxtLink
        to="/admin/login"
        class="mt-6 inline-flex w-full min-h-[52px] items-center justify-center rounded-xl bg-dark-800 hover:bg-dark-700 border border-dark-600 text-white font-semibold"
      >
        Continue to sign in
      </NuxtLink>

      <p class="mt-4 text-center text-dark-500 text-xs leading-relaxed">
        After install, enable notifications in Settings so paid orders ping this phone.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false,
  middleware: 'admin',
})

useHead({
  title: 'Install QBP Owner',
  meta: [
    { name: 'theme-color', content: '#020617' },
    { name: 'mobile-web-app-capable', content: 'yes' },
    { name: 'apple-mobile-web-app-capable', content: 'yes' },
    { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
    { name: 'apple-mobile-web-app-title', content: 'QBP Owner' },
    { name: 'application-name', content: 'QBP Owner' },
  ],
  link: [
    { rel: 'manifest', href: '/admin.webmanifest' },
    { rel: 'apple-touch-icon', href: '/icons/apple-touch-icon.png' },
  ],
})

const deferredPrompt = ref<any>(null)
const canPrompt = ref(false)
const isStandalone = ref(false)

function checkStandalone() {
  if (!import.meta.client) return false
  return window.matchMedia('(display-mode: standalone)').matches || Boolean((navigator as any).standalone)
}

async function install() {
  if (!deferredPrompt.value) return
  deferredPrompt.value.prompt()
  await deferredPrompt.value.userChoice
  deferredPrompt.value = null
  canPrompt.value = false
}

function onBeforeInstallPrompt(e: Event) {
  e.preventDefault()
  deferredPrompt.value = e
  canPrompt.value = true
}

onMounted(() => {
  if (!import.meta.client) return
  isStandalone.value = checkStandalone()
  if (isStandalone.value) return
  window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
})

onBeforeUnmount(() => {
  if (!import.meta.client) return
  window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
})
</script>
