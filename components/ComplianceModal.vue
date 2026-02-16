<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="isModalOpen"
        class="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
      >
        <div class="bg-dark-900 rounded-xl max-w-md w-full p-6 border border-dark-700 shadow-2xl">
          <!-- Header -->
          <div class="text-center mb-6">
            <div class="w-16 h-16 mx-auto mb-4 bg-primary-500/10 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h2 class="text-xl font-bold text-white mb-2">Age & Professional Verification</h2>
            <p class="text-dark-400 text-sm">
              Please confirm the following before proceeding
            </p>
          </div>

          <!-- Checkboxes -->
          <div class="space-y-4 mb-6">
            <label
              v-for="(requirement, index) in COMPLIANCE.REQUIREMENTS"
              :key="index"
              class="flex items-start gap-3 cursor-pointer group"
            >
              <input
                type="checkbox"
                v-model="checks[index]"
                class="mt-1 w-5 h-5 rounded border-dark-600 bg-dark-800 text-primary-500 focus:ring-primary-500 focus:ring-offset-dark-900"
              />
              <span class="text-dark-300 group-hover:text-white transition-colors">
                {{ requirement }}
              </span>
            </label>
          </div>

          <!-- Actions -->
          <div class="space-y-3">
            <button
              @click="handleConfirm"
              :disabled="!allChecked"
              class="w-full py-3 bg-primary-500 hover:bg-primary-600 disabled:bg-dark-700 disabled:text-dark-500 text-white font-semibold rounded-lg transition-all duration-200"
            >
              Confirm & Continue
            </button>
            <button
              @click="handleCancel"
              class="w-full py-3 bg-dark-800 hover:bg-dark-700 text-dark-300 font-medium rounded-lg border border-dark-600 transition-colors"
            >
              Cancel
            </button>
          </div>

          <!-- Disclaimer -->
          <p class="text-dark-500 text-xs text-center mt-4">
            By confirming, you agree that all products are for research purposes only.
          </p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useCompliance } from '~/composables/useCompliance'
import { COMPLIANCE } from '~/constants'

const { isModalOpen, confirm, closeModal } = useCompliance()

const checks = ref<boolean[]>(COMPLIANCE.REQUIREMENTS.map(() => false))

const allChecked = computed(() => checks.value.every(Boolean))

const handleConfirm = () => {
  if (allChecked.value) {
    confirm()
  }
}

const handleCancel = () => {
  checks.value = COMPLIANCE.REQUIREMENTS.map(() => false)
  closeModal()
}

// Reset checks when modal opens
watch(isModalOpen, (open) => {
  if (open) {
    checks.value = COMPLIANCE.REQUIREMENTS.map(() => false)
  }
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
