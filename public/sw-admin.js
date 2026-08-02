/* Quantum Bio Owner Admin PWA service worker */
const CACHE = 'qbp-admin-v1'
const PRECACHE = [
  '/admin',
  '/admin.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return

  const url = new URL(req.url)
  // Only handle same-origin admin navigations + static assets
  if (url.origin !== self.location.origin) return

  const isAdminNav = req.mode === 'navigate' && url.pathname.startsWith('/admin')
  const isIcon = url.pathname.startsWith('/icons/') || url.pathname === '/admin.webmanifest'

  if (!isAdminNav && !isIcon) return

  event.respondWith(
    (async () => {
      try {
        const network = await fetch(req)
        if (isIcon && network.ok) {
          const cache = await caches.open(CACHE)
          cache.put(req, network.clone())
        }
        return network
      } catch {
        const cached = await caches.match(req)
        if (cached) return cached
        if (isAdminNav) {
          const fallback = await caches.match('/admin')
          if (fallback) return fallback
        }
        throw new Error('Offline')
      }
    })()
  )
})
