const CACHE_NAME = 'crankdoc-v2'
const STATIC_ASSETS = [
  '/',
  '/diagnose',
  '/bikes',
  '/dtc',
  '/vin',
  '/glossary',
  '/recalls',
]

// API paths that use network-first caching strategy
const CACHEABLE_API_PATHS = ['/api/search', '/api/dtc', '/api/glossary']

// Diagnostic tree data cached at runtime as users navigate
const RUNTIME_CACHE_PATHS = ['/api/diagnose', '/diagnose/']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  // Activate new SW immediately instead of waiting
  self.skipWaiting()
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Network-first for cacheable API routes
  if (CACHEABLE_API_PATHS.some((path) => url.pathname.startsWith(path))) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone and cache successful responses
          if (response.ok) {
            const cloned = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, cloned)
            })
          }
          return response
        })
        .catch(() => caches.match(event.request))
    )
    return
  }

  // Network-first for runtime-cacheable paths (diagnostic trees)
  if (RUNTIME_CACHE_PATHS.some((path) => url.pathname.startsWith(path))) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const cloned = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, cloned)
            })
          }
          return response
        })
        .catch(() => caches.match(event.request))
    )
    return
  }

  // Network-first fallback for other API routes
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    )
    return
  }

  // Cache-first for static assets
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  )
})

// Listen for messages from the app (e.g., skip waiting)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
