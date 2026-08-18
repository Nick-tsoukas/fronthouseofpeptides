<template>
  <div class="min-h-screen bg-dark-950 text-white px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] flex items-center">
    <div class="w-full max-w-md mx-auto">
      <QbpAppIcon
        label="QBP Owner"
        class="w-24 h-24 rounded-[1.75rem] mx-auto mb-5 border border-dark-700 shadow-lg shadow-cyan-500/10 overflow-hidden"
      />
      <h1 class="text-3xl font-bold text-center">Install QBP Owner</h1>
      <p class="text-dark-300 text-center mt-2 text-base leading-relaxed">
        One tap. The app is added to your home screen — no Chrome menu.
      </p>

      <div
        v-if="standalone || justInstalled"
        class="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-4 text-sm text-emerald-200 leading-relaxed"
      >
        QBP Owner is installed. Open it from your home screen, then sign in.
      </div>

      <template v-else>
        <button
          type="button"
          class="mt-8 w-full min-h-[64px] rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-white text-xl font-bold shadow-lg shadow-cyan-500/25"
          @click="install"
        >
          {{ installing ? 'Installing…' : 'Install app' }}
        </button>
        <p class="mt-3 text-center text-dark-400 text-sm">
          {{ hint }}
        </p>

        <div
          v-if="ios && showIosHelp"
          class="mt-5 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-4"
        >
          <p class="text-white font-semibold">On iPhone / iPad</p>
          <ol class="mt-3 space-y-3 text-sm text-dark-200 leading-relaxed">
            <li class="flex gap-3">
              <span class="shrink-0 w-7 h-7 rounded-full bg-cyan-500 text-white text-sm font-bold inline-flex items-center justify-center">1</span>
              <span>Tap the <strong class="text-white">Share</strong> button
                <svg class="inline-block w-5 h-5 align-text-bottom text-cyan-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />
                </svg>
                at the bottom of Safari.
              </span>
            </li>
            <li class="flex gap-3">
              <span class="shrink-0 w-7 h-7 rounded-full bg-cyan-500 text-white text-sm font-bold inline-flex items-center justify-center">2</span>
              <span>Tap <strong class="text-white">Add to Home Screen</strong>, then Add.</span>
            </li>
          </ol>
        </div>
      </template>

      <NuxtLink
        to="/admin/login"
        class="mt-8 inline-flex w-full min-h-[52px] items-center justify-center rounded-xl bg-dark-800 hover:bg-dark-700 border border-dark-600 text-white font-semibold"
      >
        Already installed? Sign in
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

const { canNativeInstall, standalone, ios, justInstalled, promptInstall } = usePwaInstall('admin')

const installing = ref(false)
const showIosHelp = ref(false)
const fallbackHint = ref('')

const hint = computed(() => {
  if (fallbackHint.value) return fallbackHint.value
  if (ios.value) return 'iPhone cannot one-tap install. Tap the button for the 2 steps.'
  if (canNativeInstall.value) return 'Chrome will ask to confirm. Tap Install on that popup.'
  return 'Tap Install. Chrome should pop up a confirm screen.'
})

async function install() {
  if (ios.value) {
    showIosHelp.value = true
    fallbackHint.value = 'Use Share → Add to Home Screen. iPhone does not allow a one-tap install.'
    return
  }

  installing.value = true
  fallbackHint.value = ''
  try {
    const outcome = await promptInstall()
    if (outcome === 'unavailable') {
      fallbackHint.value = 'Chrome has not offered install yet. Stay on this page a moment, then tap Install again.'
    }
  } finally {
    installing.value = false
  }
}
</script>
