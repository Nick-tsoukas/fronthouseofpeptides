<template>
  <div class="min-h-screen bg-dark-950 flex items-center justify-center px-4">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <div class="w-16 h-16 bg-gradient-to-br from-cyan-400 to-teal-500 rounded-xl mx-auto mb-4"></div>
        <h1 class="text-2xl font-bold text-white">Admin Login</h1>
        <p class="text-dark-400 mt-2">Quantum Bio Peptides</p>
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
              class="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:border-cyan-500 transition-colors"
              required
            />
          </div>

          <div v-if="error" class="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            <p class="text-red-400 text-sm">{{ error }}</p>
          </div>

          <button
            type="submit"
            :disabled="isLoading"
            class="w-full py-3 bg-cyan-500 hover:bg-cyan-600 disabled:bg-dark-700 disabled:text-dark-500 text-white font-semibold rounded-lg transition-colors"
          >
            {{ isLoading ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>

        <div class="mt-6 p-4 bg-dark-800/50 rounded-lg border border-dark-700">
          <p class="text-dark-400 text-xs">
            Uses the same admin password as configured in
            <code class="bg-dark-700 px-1 rounded">OWNER_ADMIN_PASSWORD</code>
            (falls back to <code class="bg-dark-700 px-1 rounded">admin123</code> if unset).
          </p>
        </div>
      </div>

      <div class="text-center mt-6">
        <NuxtLink to="/" class="text-dark-400 hover:text-white text-sm transition-colors">
          ← Back to Store
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false,
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
    error.value = err.data?.message || err.message || 'Invalid password. Please try again.'
  } finally {
    isLoading.value = false
  }
}
</script>
