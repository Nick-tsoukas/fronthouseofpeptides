export function useAdminOnline() {
  const online = ref(true)

  function sync() {
    if (!import.meta.client) return
    online.value = navigator.onLine
  }

  onMounted(() => {
    sync()
    window.addEventListener('online', sync)
    window.addEventListener('offline', sync)
  })

  onBeforeUnmount(() => {
    if (!import.meta.client) return
    window.removeEventListener('online', sync)
    window.removeEventListener('offline', sync)
  })

  return { online }
}
