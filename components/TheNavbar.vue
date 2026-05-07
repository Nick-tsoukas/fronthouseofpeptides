<template>
  <nav class="sticky top-0 z-50 bg-dark-950/90 backdrop-blur-xl border-b border-white/5">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <!-- Brand -->
        <NuxtLink to="/" class="flex items-center gap-2">
          <div class="w-8 h-8 bg-gradient-to-br from-cyan-400 to-teal-500 rounded-lg"></div>
          <span class="text-lg font-semibold text-white">House of Peptides</span>
        </NuxtLink>

        <!-- Navigation Links + Cart -->
        <div class="flex items-center gap-6">
          <!-- Nav Links -->
          <div class="hidden md:flex items-center gap-1">
            <NuxtLink 
              to="/" 
              class="px-4 py-2 text-sm font-medium text-dark-300 hover:text-white transition-colors duration-200"
            >
              Compounds
            </NuxtLink>
            <a 
              href="#quality" 
              class="px-4 py-2 text-sm font-medium text-dark-300 hover:text-white transition-colors duration-200"
            >
              Process
            </a>
          </div>

          <!-- Cart Button -->
          <button
            @click="cartStore.toggleDrawer()"
            class="relative flex items-center justify-center w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/30 transition-all duration-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-dark-300 hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            <span
              v-if="cartStore.itemCount > 0"
              class="absolute -top-1 -right-1 bg-cyan-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1"
            >
              {{ cartStore.itemCount > 99 ? '99+' : cartStore.itemCount }}
            </span>
          </button>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { useCartStore } from '~/stores/cart'

const cartStore = useCartStore()
</script>
