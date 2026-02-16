<template>
  <nav class="sticky top-0 z-50 bg-dark-950/80 backdrop-blur-xl border-b border-white/5">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-20">
        <!-- Brand -->
        <NuxtLink to="/" class="group flex items-center">
          <span class="text-2xl font-semibold tracking-tight">
            <span class="text-white">HOUSE OF</span>
            <span class="ml-2 bg-gradient-to-r from-primary-400 via-primary-300 to-emerald-400 bg-clip-text text-transparent">PEPTIDES</span>
          </span>
        </NuxtLink>

        <!-- Navigation Links + Cart -->
        <div class="flex items-center space-x-8">
          <!-- Nav Links -->
          <div class="hidden md:flex items-center space-x-1">
            <NuxtLink 
              to="/" 
              class="relative px-4 py-2 text-sm font-medium text-dark-300 hover:text-white transition-all duration-300 group"
            >
              <span class="relative z-10">Shop</span>
              <span class="absolute inset-0 bg-white/5 rounded-lg scale-0 group-hover:scale-100 transition-transform duration-300"></span>
            </NuxtLink>
            <NuxtLink 
              to="/cart" 
              class="relative px-4 py-2 text-sm font-medium text-dark-300 hover:text-white transition-all duration-300 group"
            >
              <span class="relative z-10">Cart</span>
              <span class="absolute inset-0 bg-white/5 rounded-lg scale-0 group-hover:scale-100 transition-transform duration-300"></span>
            </NuxtLink>
          </div>

          <!-- Cart Button -->
          <button
            @click="cartStore.toggleDrawer()"
            class="relative flex items-center justify-center w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-300 group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-dark-300 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            <span
              v-if="cartStore.itemCount > 0"
              class="absolute -top-1 -right-1 bg-gradient-to-r from-primary-500 to-emerald-500 text-white text-xs font-bold rounded-full min-w-[22px] h-[22px] flex items-center justify-center px-1 shadow-lg shadow-primary-500/30"
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
