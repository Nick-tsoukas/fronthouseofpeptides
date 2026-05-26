<template>
  <div class="min-h-screen bg-dark-950">
    <!-- Mobile Header -->
    <div class="lg:hidden bg-dark-900 border-b border-dark-700 px-4 py-3 flex items-center justify-between">
      <NuxtLink to="/admin" class="flex items-center gap-2">
        <div class="w-8 h-8 bg-gradient-to-br from-cyan-400 to-teal-500 rounded-lg"></div>
        <span class="text-lg font-semibold text-white">Admin</span>
      </NuxtLink>
      <button @click="sidebarOpen = !sidebarOpen" class="p-2 text-dark-400 hover:text-white">
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

    <!-- Sidebar -->
    <aside 
      :class="[
        'fixed top-0 left-0 z-50 h-full w-64 bg-dark-900 border-r border-dark-700 transform transition-transform duration-200',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      ]"
    >
      <!-- Logo -->
      <div class="h-16 flex items-center px-6 border-b border-dark-700">
        <NuxtLink to="/admin" class="flex items-center gap-2">
          <div class="w-8 h-8 bg-gradient-to-br from-cyan-400 to-teal-500 rounded-lg"></div>
          <span class="text-lg font-semibold text-white">Admin Panel</span>
        </NuxtLink>
      </div>

      <!-- Navigation -->
      <nav class="p-4 space-y-1">
        <NuxtLink 
          to="/admin" 
          class="flex items-center gap-3 px-4 py-3 rounded-lg text-dark-300 hover:text-white hover:bg-dark-800 transition-colors"
          :class="{ 'bg-dark-800 text-white': route.path === '/admin' }"
          @click="sidebarOpen = false"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Dashboard
        </NuxtLink>

        <NuxtLink 
          to="/admin/products" 
          class="flex items-center gap-3 px-4 py-3 rounded-lg text-dark-300 hover:text-white hover:bg-dark-800 transition-colors"
          :class="{ 'bg-dark-800 text-white': route.path.startsWith('/admin/products') }"
          @click="sidebarOpen = false"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          Products
        </NuxtLink>

        <NuxtLink 
          to="/admin/orders" 
          class="flex items-center gap-3 px-4 py-3 rounded-lg text-dark-300 hover:text-white hover:bg-dark-800 transition-colors"
          :class="{ 'bg-dark-800 text-white': route.path.startsWith('/admin/orders') }"
          @click="sidebarOpen = false"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          Orders
        </NuxtLink>

        <NuxtLink 
          to="/admin/settings" 
          class="flex items-center gap-3 px-4 py-3 rounded-lg text-dark-300 hover:text-white hover:bg-dark-800 transition-colors"
          :class="{ 'bg-dark-800 text-white': route.path.startsWith('/admin/settings') }"
          @click="sidebarOpen = false"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Settings
        </NuxtLink>

        <div class="border-t border-dark-700 my-4"></div>

        <NuxtLink 
          to="/" 
          class="flex items-center gap-3 px-4 py-3 rounded-lg text-dark-400 hover:text-white hover:bg-dark-800 transition-colors"
          @click="sidebarOpen = false"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          View Store
        </NuxtLink>
      </nav>
    </aside>

    <!-- Main Content -->
    <main class="lg:ml-64 min-h-screen">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const sidebarOpen = ref(false)

// Close sidebar on route change (mobile)
watch(() => route.path, () => {
  sidebarOpen.value = false
})
</script>
