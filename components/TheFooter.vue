<template>
  <footer class="bg-dark-900 border-t border-dark-700 mt-auto">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <!-- Brand -->
        <div>
          <div class="flex items-center space-x-2 mb-4">
            <div class="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg"></div>
            <span class="text-xl font-bold text-white">House of Peptides</span>
          </div>
          <p class="text-dark-400 text-sm">
            Premium research-grade peptides for qualified professionals.
          </p>
        </div>

        <!-- Quick Links -->
        <div>
          <h3 class="text-white font-semibold mb-4">Quick Links</h3>
          <ul class="space-y-2">
            <li>
              <NuxtLink to="/" class="text-dark-400 hover:text-primary-400 transition-colors text-sm">
                Shop All
              </NuxtLink>
            </li>
            <li>
              <NuxtLink to="/cart" class="text-dark-400 hover:text-primary-400 transition-colors text-sm">
                Cart
              </NuxtLink>
            </li>
          </ul>
        </div>

        <!-- Compliance -->
        <div>
          <h3 class="text-white font-semibold mb-4">Important Notice</h3>
          <p class="text-dark-400 text-sm">
            All products are sold for research purposes only. Not for human consumption. 
            Must be 21+ and a qualified professional to purchase.
          </p>
        </div>
      </div>

      <div class="border-t border-dark-700 mt-8 pt-8">
        <DisclaimerFooter />
        <p class="text-dark-500 text-xs text-center mt-4">
          © {{ new Date().getFullYear() }} House of Peptides. All rights reserved. US shipping only.
        </p>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
</script>
