export default defineNuxtPlugin(() => {
  if (!import.meta.client || !('serviceWorker' in navigator)) return

  const route = useRoute()

  const register = async () => {
    if (!route.path.startsWith('/admin')) return
    try {
      await navigator.serviceWorker.register('/sw-admin.js', { scope: '/admin' })
    } catch (err) {
      console.warn('[pwa] admin SW registration failed', err)
    }
  }

  // Register on admin routes (and when navigating into admin)
  watch(
    () => route.path,
    () => {
      void register()
    },
    { immediate: true }
  )
})
