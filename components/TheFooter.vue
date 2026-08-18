<template>
  <footer class="bg-dark-950 border-t border-white/5 mt-auto">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10">
        <div class="md:col-span-2">
          <div class="flex items-center space-x-2 mb-4">
            <div class="w-8 h-8 bg-gradient-to-br from-cyan-400 to-teal-500 rounded-lg"></div>
            <span class="text-xl font-bold text-white">{{ settings.storeName }}</span>
          </div>
          <p class="text-dark-400 text-sm leading-relaxed max-w-sm">
            {{ settings.footerDisclaimer }}
          </p>
          <a
            v-if="settings.supportEmail"
            :href="`mailto:${settings.supportEmail}`"
            class="inline-block mt-4 text-sm text-cyan-400 hover:text-cyan-300"
          >
            {{ settings.supportEmail }}
          </a>
        </div>

        <div>
          <h3 class="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Shop</h3>
          <ul class="space-y-3">
            <li>
              <NuxtLink to="/" class="text-dark-400 hover:text-cyan-400 transition-colors duration-200 text-sm">
                Browse compounds
              </NuxtLink>
            </li>
            <li>
              <NuxtLink to="/cart" class="text-dark-400 hover:text-cyan-400 transition-colors duration-200 text-sm">
                Cart
              </NuxtLink>
            </li>
            <li>
              <NuxtLink to="/contact" class="text-dark-400 hover:text-cyan-400 transition-colors duration-200 text-sm">
                Contact
              </NuxtLink>
            </li>
          </ul>
        </div>

        <div>
          <h3 class="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Policies</h3>
          <ul class="space-y-3">
            <li><NuxtLink to="/terms" class="text-dark-400 hover:text-cyan-400 text-sm">Terms of Service</NuxtLink></li>
            <li><NuxtLink to="/privacy" class="text-dark-400 hover:text-cyan-400 text-sm">Privacy Policy</NuxtLink></li>
            <li><NuxtLink to="/shipping-policy" class="text-dark-400 hover:text-cyan-400 text-sm">Shipping Policy</NuxtLink></li>
            <li><NuxtLink to="/refund-policy" class="text-dark-400 hover:text-cyan-400 text-sm">Refund Policy</NuxtLink></li>
            <li><NuxtLink to="/research-use-only" class="text-dark-400 hover:text-cyan-400 text-sm">Research Use Only</NuxtLink></li>
          </ul>
        </div>
      </div>

      <div class="border-t border-white/5 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <p class="text-dark-500 text-xs">
          © {{ new Date().getFullYear() }} {{ settings.storeName }}. All rights reserved.
        </p>
        <div class="flex items-center gap-6 text-dark-500 text-xs">
          <span>US Shipping Only</span>
          <span>•</span>
          <NuxtLink to="/research-use-only" class="hover:text-cyan-400">Research Use Only</NuxtLink>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
const { data } = await usePublicStoreSettings()
const settings = computed(() => data.value || {
  storeName: 'Quantum Bio Peptides',
  footerDisclaimer: '',
  supportEmail: '',
})
</script>
