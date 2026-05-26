<template>
  <div class="min-h-screen bg-dark-950 flex items-center justify-center px-4">
    <div class="w-full max-w-sm">
      <div class="text-center mb-8">
        <p class="text-primary-400 font-bold text-sm tracking-widest uppercase mb-1">Quantum Bio Peptides</p>
        <h1 class="text-2xl font-bold text-white">Owner Dashboard</h1>
      </div>

      <form
        class="bg-dark-900 border border-dark-700 rounded-xl p-6 space-y-5"
        @submit.prevent="handleLogin"
      >
        <div>
          <label class="block text-sm font-medium text-dark-300 mb-2">Password</label>
          <input
            v-model="password"
            type="password"
            autocomplete="current-password"
            placeholder="Enter owner password"
            class="w-full bg-dark-800 border border-dark-600 rounded-lg px-4 py-3 text-white placeholder-dark-500 focus:outline-none focus:border-primary-500 transition-colors text-base"
            :disabled="isLoading"
          />
        </div>

        <div v-if="error" class="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
          {{ error }}
        </div>

        <button
          type="submit"
          :disabled="isLoading || !password"
          class="w-full py-3 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors text-base"
        >
          {{ isLoading ? 'Signing in…' : 'Sign In' }}
        </button>
      </form>

      <p class="text-dark-600 text-xs text-center mt-6">
        Owner access only. Not for customers.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const password = ref('')
const isLoading = ref(false)
const error = ref('')

async function handleLogin() {
  error.value = ''
  isLoading.value = true
  try {
    await $fetch('/api/owner/login', {
      method: 'POST',
      credentials: 'include',
      body: { password: password.value },
    })
    window.location.href = '/owner'
  } catch (err: any) {
    error.value = err.data?.message || 'Sign in failed. Check your password.'
    isLoading.value = false
  }
}
</script>
