import { ref, onMounted } from 'vue'
import { COMPLIANCE } from '~/constants'

const isConfirmed = ref(false)
const isModalOpen = ref(false)
const pendingAction = ref<(() => void) | null>(null)

export function useCompliance() {
  const loadFromStorage = () => {
    if (import.meta.client) {
      isConfirmed.value = localStorage.getItem(COMPLIANCE.STORAGE_KEY) === 'true'
    }
  }

  const confirm = () => {
    isConfirmed.value = true
    if (import.meta.client) {
      localStorage.setItem(COMPLIANCE.STORAGE_KEY, 'true')
    }
    closeModal()
    
    // Execute pending action if any
    if (pendingAction.value) {
      pendingAction.value()
      pendingAction.value = null
    }
  }

  const reset = () => {
    isConfirmed.value = false
    if (import.meta.client) {
      localStorage.removeItem(COMPLIANCE.STORAGE_KEY)
    }
  }

  const openModal = () => {
    isModalOpen.value = true
  }

  const closeModal = () => {
    isModalOpen.value = false
    pendingAction.value = null
  }

  const requireConfirmation = (action: () => void) => {
    if (isConfirmed.value) {
      action()
    } else {
      pendingAction.value = action
      openModal()
    }
  }

  onMounted(() => {
    loadFromStorage()
  })

  return {
    isConfirmed,
    isModalOpen,
    confirm,
    reset,
    openModal,
    closeModal,
    requireConfirmation,
    loadFromStorage,
  }
}
