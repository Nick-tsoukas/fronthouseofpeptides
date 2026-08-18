export default defineNuxtPlugin({
  name: 'pwa-install',
  enforce: 'pre',
  setup() {
    usePwaInstall('admin').attach()

    if (!import.meta.client || !('serviceWorker' in navigator)) return
    if (window.location.pathname.startsWith('/admin')) {
      void navigator.serviceWorker.register('/sw-admin.js', { scope: '/admin' }).catch(() => {})
    }
  },
})
