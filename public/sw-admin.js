/* Quantum Bio Owner Admin PWA service worker */
const CACHE = 'qbp-admin-v6'
const CACHE_PREFIX = 'qbp-admin-'
// Precache icons/manifest only — never pin SSR HTML shells (stale chunks → Nuxt errors).
const PRECACHE = [
  '/admin.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then(async (cache) => {
      await Promise.all(PRECACHE.map((url) => cache.add(url).catch(() => undefined)))
    }).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k.startsWith(CACHE_PREFIX) && k !== CACHE)
          .map((k) => caches.delete(k))
      )
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
        // Always network-first for admin navigations (avoid stale HTML/chunk mismatches).
        const network = await fetch(req)
        if (isIcon && network.ok) {
          const cache = await caches.open(CACHE)
          cache.put(req, network.clone())
        }
        return network
      } catch {
        if (isIcon) {
          const cached = await caches.match(req)
          if (cached) return cached
        }
        if (isAdminNav) {
          return new Response(
            '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline — QBP Owner</title></head><body style="margin:0;font-family:system-ui,sans-serif;background:#0b1220;color:#e5e7eb;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:24px;text-align:center"><div><h1 style="font-size:1.25rem;margin:0 0 8px">You are offline</h1><p style="margin:0;color:#9ca3af;line-height:1.5">Reconnect to manage orders, mark payments, or buy labels.</p></div></body></html>',
            { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } }
          )
        }
        throw new Error('Offline')
      }
    })()
  )
})
