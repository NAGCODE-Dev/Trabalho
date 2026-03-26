const CACHE_NAME = 'warehouse-order-check-v2'
const APP_SHELL = ['/', '/offline.html', '/manifest.webmanifest', '/pwa-icon.svg', '/pwa-maskable.svg']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
    ),
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  const requestUrl = new URL(event.request.url)

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone()
          void caches.open(CACHE_NAME).then((cache) => cache.put('/', clone))
          return response
        })
        .catch(() => caches.match('/offline.html')),
    )
    return
  }

  if (!requestUrl.origin.startsWith(self.location.origin)) return

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached
      return fetch(event.request)
        .then((response) => {
          const clone = response.clone()
          if (response.ok) {
            void caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
          }
          return response
        })
        .catch(() => caches.match('/offline.html') || caches.match('/'))
    }),
  )
})
