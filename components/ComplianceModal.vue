<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="isModalOpen"
        class="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/70 p-0 sm:p-4"
        @click.self="handleCancel"
      >
        <div
          class="bg-dark-900 w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl border border-dark-700 shadow-2xl
            max-h-[min(92dvh,920px)] overflow-y-auto overscroll-contain
            px-5 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="compliance-title"
        >
          <div class="mx-auto mb-3 h-1 w-10 rounded-full bg-dark-600 sm:hidden" />

          <div class="text-center mb-6">
            <div class="w-14 h-14 mx-auto mb-4 bg-primary-500/10 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h2 id="compliance-title" class="text-xl font-bold text-white mb-2">Age &amp; Professional Verification</h2>
            <p class="text-dark-400 text-sm">
              Please confirm the following before adding to your cart
            </p>
          </div>

          <div class="space-y-3 mb-6">
            <label
              v-for="(requirement, index) in COMPLIANCE.REQUIREMENTS"
              :key="index"
              class="flex items-start gap-3 cursor-pointer group rounded-xl border border-dark-700 bg-dark-800/40 px-3 py-3 min-h-[52px]"
            >
              <input
                type="checkbox"
                v-model="checks[index]"
                class="mt-0.5 h-5 w-5 shrink-0 rounded border-dark-600 bg-dark-800 text-primary-500 focus:ring-primary-500 focus:ring-offset-dark-900"
              />
              <span class="text-dark-300 group-hover:text-white transition-colors text-sm leading-snug">
                {{ requirement }}
              </span>
            </label>
          </div>

          <div class="space-y-2.5">
            <button
              type="button"
              @click="handleConfirm"
              :disabled="!allChecked"
              class="w-full min-h-[48px] py-3 bg-primary-500 hover:bg-primary-600 disabled:bg-dark-700 disabled:text-dark-500 text-white font-semibold rounded-xl transition-all duration-200"
            >
              Confirm &amp; Add to Cart
            </button>
            <button
              type="button"
              @click="handleCancel"
              class="w-full min-h-[44px] py-3 bg-dark-800 hover:bg-dark-700 text-dark-300 font-medium rounded-xl border border-dark-600 transition-colors"
            >
              Cancel
            </button>
          </div>

          <p class="text-dark-500 text-xs text-center mt-4 leading-relaxed">
            By confirming, you agree that all products are for research purposes only.
          </p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue'
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

watch(isModalOpen, (open) => {
  if (open) {
    checks.value = COMPLIANCE.REQUIREMENTS.map(() => false)
  }
  if (!import.meta.client) return
  if (open) {
    document.body.style.overflow = 'hidden'
  } else {
    // Restore only if cart drawer isn't open
    const cartOpen = document.querySelector('[aria-label="Shopping cart"]')
    if (!cartOpen) document.body.style.overflow = ''
  }
})

onBeforeUnmount(() => {
  if (import.meta.client && isModalOpen.value) {
    document.body.style.overflow = ''
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
