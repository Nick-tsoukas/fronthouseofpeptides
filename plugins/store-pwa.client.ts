/**
 * Customer storefront must not register a store PWA or show install prompts.
 * Owner install lives under /admin only (admin-pwa.client.ts + AdminPwaInstallBanner).
 */
export default defineNuxtPlugin(() => {
  // Intentionally no-op: do not register /sw.js on the public site.
})
