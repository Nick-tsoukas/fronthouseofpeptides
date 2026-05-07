<template>
  <footer class="bg-dark-950 border-t border-white/5 mt-auto">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-12">
        <!-- Brand -->
        <div class="md:col-span-2">
          <div class="flex items-center space-x-2 mb-4">
            <div class="w-8 h-8 bg-gradient-to-br from-cyan-400 to-teal-500 rounded-lg"></div>
            <span class="text-xl font-bold text-white">House of Peptides</span>
          </div>
          <p class="text-dark-400 text-sm leading-relaxed max-w-sm">
            Research-grade peptides supplied to qualified researchers and laboratories. 
            All compounds verified for purity and identity.
          </p>
        </div>

        <!-- Quick Links -->
        <div>
          <h3 class="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Navigation</h3>
          <ul class="space-y-3">
            <li>
              <NuxtLink to="/" class="text-dark-400 hover:text-cyan-400 transition-colors duration-200 text-sm">
                Browse Compounds
              </NuxtLink>
            </li>
            <li>
              <NuxtLink to="/cart" class="text-dark-400 hover:text-cyan-400 transition-colors duration-200 text-sm">
                Cart
              </NuxtLink>
            </li>
            <li>
              <a href="#quality" class="text-dark-400 hover:text-cyan-400 transition-colors duration-200 text-sm">
                Our Process
              </a>
            </li>
          </ul>
        </div>

        <!-- Compliance -->
        <div>
          <h3 class="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Legal</h3>
          <p class="text-dark-400 text-sm leading-relaxed">
            All products are for research purposes only. Not for human or veterinary use. 
            Purchasers must be qualified professionals.
          </p>
        </div>
      </div>

      <div class="border-t border-white/5 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <p class="text-dark-500 text-xs">
          © {{ new Date().getFullYear() }} House of Peptides. All rights reserved.
        </p>
        <div class="flex items-center gap-6 text-dark-500 text-xs">
          <span>US Shipping Only</span>
          <span>•</span>
          <span>Research Use Only</span>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
</script>
