export default defineNuxtPlugin(() => {
  if (!import.meta.client || !('serviceWorker' in navigator)) return

  const route = useRoute()

  const register = async () => {
    if (route.path.startsWith('/admin') || route.path.startsWith('/owner')) return
    try {
      await navigator.serviceWorker.register('/sw.js', { scope: '/' })
    } catch (err) {
      console.warn('[pwa] store SW registration failed', err)
    }
  }

  watch(
    () => route.path,
    () => {
      void register()
    },
    { immediate: true }
  )
})
