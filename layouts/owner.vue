<template>
  <div class="min-h-screen bg-dark-950 text-white">
    <!-- Owner top bar -->
    <header class="bg-dark-900 border-b border-dark-700 sticky top-0 z-50">
      <div class="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <NuxtLink to="/owner" class="flex items-center gap-2">
            <span class="text-primary-400 font-bold text-sm tracking-widest uppercase">QBP</span>
            <span class="text-dark-400 text-sm">Admin</span>
          </NuxtLink>
          <span class="text-dark-700">|</span>
          <nav class="flex items-center gap-4">
            <NuxtLink
              to="/owner"
              class="text-sm text-dark-300 hover:text-white transition-colors"
              active-class="text-white font-medium"
            >
              Dashboard
            </NuxtLink>
            <NuxtLink
              to="/owner/orders"
              class="text-sm text-dark-300 hover:text-white transition-colors"
              active-class="text-white font-medium"
            >
              Orders
            </NuxtLink>
          </nav>
        </div>
        <button
          class="text-sm text-dark-400 hover:text-white transition-colors"
          @click="handleLogout"
        >
          Sign Out
        </button>
      </div>
    </header>

    <main class="max-w-5xl mx-auto px-4 py-6">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
async function handleLogout() {
  await $fetch('/api/owner/logout', { method: 'POST', credentials: 'include' }).catch(() => {})
  window.location.href = '/owner/login'
}
</script>
