<template>
  <div class="p-6 lg:p-8">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-white">Store Settings</h1>
      <p class="text-dark-400 mt-1">Configure your store settings and preferences</p>
    </div>

    <div class="space-y-6 max-w-3xl">
      <!-- Store Information -->
      <div class="bg-dark-900 rounded-xl border border-dark-700 p-6">
        <h2 class="text-lg font-semibold text-white mb-4">Store Information</h2>
        
        <div class="space-y-4">
          <div>
            <label for="storeName" class="block text-sm font-medium text-dark-300 mb-2">
              Store Name
            </label>
            <input
              id="storeName"
              v-model="settings.storeName"
              type="text"
              placeholder="House of Peptides"
              class="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          <div>
            <label for="contactEmail" class="block text-sm font-medium text-dark-300 mb-2">
              Contact Email
            </label>
            <input
              id="contactEmail"
              v-model="settings.contactEmail"
              type="email"
              placeholder="support@houseofpeptides.com"
              class="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>
        </div>
      </div>

      <!-- Messaging -->
      <div class="bg-dark-900 rounded-xl border border-dark-700 p-6">
        <h2 class="text-lg font-semibold text-white mb-4">Store Messaging</h2>
        
        <div class="space-y-4">
          <div>
            <label for="announcementBanner" class="block text-sm font-medium text-dark-300 mb-2">
              Announcement Banner
              <span class="text-dark-500">(shown at top of site)</span>
            </label>
            <input
              id="announcementBanner"
              v-model="settings.announcementBanner"
              type="text"
              placeholder="Free shipping on orders over $100!"
              class="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          <div>
            <label for="shippingMessage" class="block text-sm font-medium text-dark-300 mb-2">
              Shipping Message
            </label>
            <textarea
              id="shippingMessage"
              v-model="settings.shippingMessage"
              rows="2"
              placeholder="Orders ship within 1-2 business days. US shipping only."
              class="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:border-cyan-500 transition-colors resize-none"
            ></textarea>
          </div>
        </div>
      </div>

      <!-- Compliance -->
      <div class="bg-dark-900 rounded-xl border border-dark-700 p-6">
        <h2 class="text-lg font-semibold text-white mb-4">Compliance & Legal</h2>
        
        <div class="space-y-4">
          <div>
            <label for="researchDisclaimer" class="block text-sm font-medium text-dark-300 mb-2">
              Research Use Disclaimer
            </label>
            <textarea
              id="researchDisclaimer"
              v-model="settings.researchUseDisclaimer"
              rows="3"
              placeholder="All products are sold for research purposes only. Not for human or veterinary use."
              class="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:border-cyan-500 transition-colors resize-none"
            ></textarea>
          </div>

          <div>
            <label for="termsUrl" class="block text-sm font-medium text-dark-300 mb-2">
              Terms & Conditions URL
            </label>
            <input
              id="termsUrl"
              v-model="settings.termsUrl"
              type="url"
              placeholder="https://yoursite.com/terms"
              class="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          <div>
            <label for="privacyUrl" class="block text-sm font-medium text-dark-300 mb-2">
              Privacy Policy URL
            </label>
            <input
              id="privacyUrl"
              v-model="settings.privacyUrl"
              type="url"
              placeholder="https://yoursite.com/privacy"
              class="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>
        </div>
      </div>

      <!-- Notice about backend -->
      <div class="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
        <div class="flex gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p class="text-yellow-400 font-medium">Backend Configuration Required</p>
            <p class="text-yellow-400/80 text-sm mt-1">
              To persist these settings, you need to create a "Store Settings" single type in Strapi with the following fields:
              <code class="bg-dark-800 px-1 rounded text-xs">storeName</code>,
              <code class="bg-dark-800 px-1 rounded text-xs">contactEmail</code>,
              <code class="bg-dark-800 px-1 rounded text-xs">announcementBanner</code>,
              <code class="bg-dark-800 px-1 rounded text-xs">shippingMessage</code>,
              <code class="bg-dark-800 px-1 rounded text-xs">researchUseDisclaimer</code>,
              <code class="bg-dark-800 px-1 rounded text-xs">termsUrl</code>,
              <code class="bg-dark-800 px-1 rounded text-xs">privacyUrl</code>.
              Until then, settings are stored in localStorage only.
            </p>
          </div>
        </div>
      </div>

      <!-- Error/Success Messages -->
      <div v-if="error" class="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
        <p class="text-red-400">{{ error }}</p>
      </div>
      <div v-if="success" class="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
        <p class="text-green-400">{{ success }}</p>
      </div>

      <!-- Save Button -->
      <div class="flex gap-4">
        <button
          @click="saveSettings"
          :disabled="isLoading"
          class="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 disabled:bg-dark-700 disabled:text-dark-500 text-white font-semibold rounded-lg transition-colors"
        >
          {{ isLoading ? 'Saving...' : 'Save Settings' }}
        </button>
        <button
          @click="resetSettings"
          class="px-6 py-3 bg-dark-700 hover:bg-dark-600 text-white font-medium rounded-lg transition-colors"
        >
          Reset to Defaults
        </button>
      </div>

      <!-- Admin Actions -->
      <div class="bg-dark-900 rounded-xl border border-dark-700 p-6">
        <h2 class="text-lg font-semibold text-white mb-4">Admin Actions</h2>
        
        <div class="space-y-4">
          <button
            @click="logout"
            class="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-medium rounded-lg transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAdmin } from '~/composables/useAdmin'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const { logout: adminLogout } = useAdmin()

const STORAGE_KEY = 'houseofpeptides_settings'

const defaultSettings = {
  storeName: 'House of Peptides',
  contactEmail: '',
  announcementBanner: '',
  shippingMessage: 'Orders ship within 1-2 business days. US shipping only.',
  researchUseDisclaimer: 'All products are sold for research purposes only. Not for human or veterinary use. Must be 21+ and a qualified professional to purchase.',
  termsUrl: '',
  privacyUrl: '',
}

const settings = ref({ ...defaultSettings })
const isLoading = ref(false)
const error = ref('')
const success = ref('')

// Load settings from localStorage on mount
onMounted(() => {
  if (import.meta.client) {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        settings.value = { ...defaultSettings, ...parsed }
      } catch {
        // Use defaults
      }
    }
  }
})

const saveSettings = async () => {
  error.value = ''
  success.value = ''
  isLoading.value = true

  // Simulate save delay
  await new Promise(resolve => setTimeout(resolve, 500))

  try {
    // Save to localStorage (MVP approach)
    if (import.meta.client) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings.value))
    }
    
    success.value = 'Settings saved successfully! (stored locally)'
  } catch (err: any) {
    error.value = err.message || 'Failed to save settings'
  } finally {
    isLoading.value = false
  }
}

const resetSettings = () => {
  settings.value = { ...defaultSettings }
  if (import.meta.client) {
    localStorage.removeItem(STORAGE_KEY)
  }
  success.value = 'Settings reset to defaults'
  error.value = ''
}

const logout = () => {
  adminLogout()
}
</script>
