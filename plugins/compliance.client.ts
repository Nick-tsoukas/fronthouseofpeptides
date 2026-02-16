import { useCompliance } from '~/composables/useCompliance'

export default defineNuxtPlugin(() => {
  const { loadFromStorage } = useCompliance()
  loadFromStorage()
})
