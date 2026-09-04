export default defineNuxtPlugin({
  name: 'pwa-install',
  enforce: 'pre',
  setup() {
    // Install-prompt detection only. Admin SW registration lives in admin-pwa.client.ts.
    usePwaInstall('admin').attach()
  },
})
