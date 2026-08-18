<template>
  <div class="min-h-screen bg-dark-950 flex items-center justify-center px-4 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <img
          src="/icons/icon-192.png"
          alt="QBP Owner"
          class="w-16 h-16 rounded-2xl mx-auto mb-4 border border-dark-700 shadow-lg shadow-cyan-500/10"
        />
        <h1 class="text-2xl font-bold text-white">QBP Owner</h1>
        <p class="text-dark-400 mt-2">Quantum Bio Peptides Admin</p>
      </div>

      <div class="bg-dark-900 rounded-xl border border-dark-700 p-6">
        <form @submit.prevent="handleLogin" class="space-y-4">
          <div>
            <label for="password" class="block text-sm font-medium text-dark-300 mb-2">
              Admin Password
            </label>
            <input
              id="password"
              v-model="password"
              type="password"
              placeholder="Enter admin password"
              autocomplete="current-password"
              class="w-full min-h-[48px] px-4 py-3 bg-dark-800 border border-dark-600 rounded-xl text-base text-white placeholder-dark-500 focus:outline-none focus:border-cyan-500 transition-colors"
              required
            />
          </div>

          <div v-if="error" class="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            <p class="text-red-400 text-sm">{{ error }}</p>
          </div>

          <button
            type="submit"
            :disabled="isLoading"
            class="w-full min-h-[48px] py-3 bg-cyan-500 hover:bg-cyan-600 disabled:bg-dark-700 disabled:text-dark-500 text-white font-semibold rounded-xl transition-colors"
          >
            {{ isLoading ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>
      </div>

      <div class="text-center mt-6 space-y-3">
        <NuxtLink
          to="/admin/install"
          class="inline-flex min-h-[44px] items-center justify-center text-cyan-400 hover:text-cyan-300 text-sm font-medium"
        >
          Install QBP Owner on this phone
        </NuxtLink>
        <div>
          <NuxtLink
            to="/"
            class="inline-flex min-h-[44px] items-center text-dark-400 hover:text-white text-sm transition-colors"
          >
            ← Back to Store
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false,
})

useHead({
  title: 'Sign in · QBP Owner',
  meta: [
    { name: 'theme-color', content: '#020617' },
    { name: 'apple-mobile-web-app-capable', content: 'yes' },
    { name: 'apple-mobile-web-app-title', content: 'QBP Owner' },
    { name: 'mobile-web-app-capable', content: 'yes' },
  ],
  link: [
    { rel: 'manifest', href: '/admin.webmanifest' },
    { rel: 'apple-touch-icon', href: '/icons/apple-touch-icon.png' },
  ],
})

const router = useRouter()
const password = ref('')
const error = ref('')
const isLoading = ref(false)

const handleLogin = async () => {
  error.value = ''
  isLoading.value = true
  try {
    await $fetch('/api/admin/login', {
      method: 'POST',
      body: { password: password.value },
      credentials: 'include',
    })
    if (import.meta.client) {
      localStorage.setItem('adminAuthenticated', 'true')
    }
    router.push('/admin')
  } catch (err: any) {
    error.value = err.data?.message || err.message || 'Login failed'
  } finally {
    isLoading.value = false
  }
}
</script>
