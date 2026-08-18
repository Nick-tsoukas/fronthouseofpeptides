/* Quantum Bio Owner Admin PWA service worker */
const CACHE = 'qbp-admin-v4'
const PRECACHE = [
  '/admin',
  '/admin/login',
  '/admin/install',
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

self.addEventListener('push', (event) => {
  let data = {
    title: 'QBP Owner',
    body: 'You have a new store alert.',
    url: '/admin/orders',
    tag: 'qbp-owner',
  }
  try {
    if (event.data) data = { ...data, ...event.data.json() }
  } catch {
    // keep defaults
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      tag: data.tag,
      icon: '/icons/icon-192.png',
      badge: '/icons/favicon-32.png',
      data: { url: data.url || '/admin/orders' },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const path = (event.notification.data && event.notification.data.url) || '/admin/orders'
  const target = new URL(path, self.location.origin).href

  event.waitUntil(
    (async () => {
      const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      for (const client of clientList) {
        try {
          if (new URL(client.url).origin !== self.location.origin) continue
        } catch {
          continue
        }
        if ('focus' in client) await client.focus()
        if (client.postMessage) {
          client.postMessage({ type: 'QBP_NAVIGATE', url: path })
        }
        if (typeof client.navigate === 'function') {
          try {
            await client.navigate(target)
          } catch {
            // iOS / older clients may not support navigate
          }
        }
        return
      }
      if (self.clients.openWindow) return self.clients.openWindow(target)
    })()
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return

  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return

  // Never cache admin API / order data — fulfillment must stay fresh.
  if (url.pathname.startsWith('/api/')) return

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
