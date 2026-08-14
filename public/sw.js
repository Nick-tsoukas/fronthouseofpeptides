/* Quantum Bio Peptides storefront PWA service worker */
const CACHE = 'qbp-store-v1'
const PRECACHE = [
  '/',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-512-maskable.png',
  '/icons/apple-touch-icon.png',
  '/icons/favicon-32.png',
  '/icons/favicon-16.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE && k.startsWith('qbp-store-')).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return

  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return

  // Admin has its own SW. Never intercept APIs, checkout, or payment.
  if (
    url.pathname.startsWith('/admin') ||
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/checkout') ||
    url.pathname.startsWith('/owner')
  ) {
    return
  }

  const isNav = req.mode === 'navigate'
  const isStatic =
    url.pathname.startsWith('/icons/') ||
    url.pathname === '/manifest.webmanifest' ||
    url.pathname === '/sw.js'

  if (!isNav && !isStatic) return

  event.respondWith(
    (async () => {
      try {
        const network = await fetch(req)
        if (isStatic && network.ok) {
          const cache = await caches.open(CACHE)
          cache.put(req, network.clone())
        }
        return network
      } catch {
        const cached = await caches.match(req)
        if (cached) return cached
        if (isNav) {
          const home = await caches.match('/')
          if (home) return home
        }
        throw new Error('Offline')
      }
    })()
  )
})
