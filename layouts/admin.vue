<template>
  <div class="min-h-screen bg-dark-950">
    <!-- Mobile Header -->
    <div
      class="lg:hidden sticky top-0 z-30 bg-dark-900/95 backdrop-blur border-b border-dark-700 px-4 py-3 flex items-center justify-between pt-[max(0.75rem,env(safe-area-inset-top))]"
    >
      <NuxtLink to="/admin" class="flex items-center gap-2 min-h-[44px]">
        <div class="w-8 h-8 bg-gradient-to-br from-cyan-400 to-teal-500 rounded-lg"></div>
        <span class="text-lg font-semibold text-white">Admin</span>
      </NuxtLink>
      <button
        type="button"
        class="min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-dark-400 hover:text-white"
        aria-label="Open menu"
        @click="sidebarOpen = !sidebarOpen"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </div>

    <!-- Mobile Sidebar Overlay -->
    <div
      v-if="sidebarOpen"
      class="lg:hidden fixed inset-0 bg-black/50 z-40"
      @click="sidebarOpen = false"
    ></div>

    <!-- Sidebar drawer (mobile) / fixed (desktop) -->
    <aside
      :class="[
        'fixed top-0 left-0 z-50 h-full w-[min(18rem,85vw)] max-w-xs bg-dark-900 border-r border-dark-700 transform transition-transform duration-200 flex flex-col',
        'pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      ]"
    >
      <div class="h-16 flex items-center justify-between px-5 border-b border-dark-700 shrink-0">
        <NuxtLink to="/admin" class="flex items-center gap-2" @click="sidebarOpen = false">
          <div class="w-8 h-8 bg-gradient-to-br from-cyan-400 to-teal-500 rounded-lg"></div>
          <span class="text-lg font-semibold text-white">Admin Panel</span>
        </NuxtLink>
        <button
          type="button"
          class="lg:hidden min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-dark-400 hover:text-white"
          aria-label="Close menu"
          @click="sidebarOpen = false"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <nav class="p-4 space-y-1 overflow-y-auto flex-1">
        <NuxtLink
          to="/admin"
          class="flex items-center gap-3 px-4 min-h-[48px] rounded-xl text-dark-300 hover:text-white hover:bg-dark-800 transition-colors"
          :class="{ 'bg-dark-800 text-white': route.path === '/admin' }"
          @click="sidebarOpen = false"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Dashboard
        </NuxtLink>

        <NuxtLink
          to="/admin/products"
          class="flex items-center gap-3 px-4 min-h-[48px] rounded-xl text-dark-300 hover:text-white hover:bg-dark-800 transition-colors"
          :class="{ 'bg-dark-800 text-white': route.path.startsWith('/admin/products') }"
          @click="sidebarOpen = false"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          Products
        </NuxtLink>

        <NuxtLink
          to="/admin/orders"
          class="flex items-center gap-3 px-4 min-h-[48px] rounded-xl text-dark-300 hover:text-white hover:bg-dark-800 transition-colors"
          :class="{ 'bg-dark-800 text-white': route.path.startsWith('/admin/orders') }"
          @click="sidebarOpen = false"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          Orders
        </NuxtLink>

        <NuxtLink
          to="/admin/settings"
          class="flex items-center gap-3 px-4 min-h-[48px] rounded-xl text-dark-300 hover:text-white hover:bg-dark-800 transition-colors"
          :class="{ 'bg-dark-800 text-white': route.path.startsWith('/admin/settings') }"
          @click="sidebarOpen = false"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Settings
        </NuxtLink>

        <div class="border-t border-dark-700 my-4"></div>

        <button
          type="button"
          class="w-full flex items-center gap-3 px-4 min-h-[48px] rounded-xl text-dark-400 hover:text-white hover:bg-dark-800 transition-colors"
          @click="logout"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign out
        </button>

        <NuxtLink
          to="/"
          class="flex items-center gap-3 px-4 min-h-[48px] rounded-xl text-dark-400 hover:text-white hover:bg-dark-800 transition-colors"
          @click="sidebarOpen = false"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          View Store
        </NuxtLink>
      </nav>
    </aside>

    <!-- Main Content -->
    <main class="lg:ml-64 min-h-screen pb-[env(safe-area-inset-bottom)]">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const sidebarOpen = ref(false)
const { logout } = useAdmin()

// Close sidebar on route change (mobile)
watch(() => route.path, () => {
  sidebarOpen.value = false
})
</script>
