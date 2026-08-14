export default defineNuxtPlugin(() => {
  if (!import.meta.client || !('serviceWorker' in navigator)) return

  const route = useRoute()
  const router = useRouter()

  const register = async () => {
    if (!route.path.startsWith('/admin')) return
    try {
      await navigator.serviceWorker.register('/sw-admin.js', { scope: '/admin' })
    } catch (err) {
      console.warn('[pwa] admin SW registration failed', err)
    }
  }

  navigator.serviceWorker.addEventListener('message', (event) => {
    const path = event.data?.url
    if (event.data?.type !== 'QBP_NAVIGATE' || typeof path !== 'string') return
    if (!path.startsWith('/admin')) return
    void router.push(path)
  })

  watch(
    () => route.path,
    () => {
      void register()
    },
    { immediate: true }
  )
})
