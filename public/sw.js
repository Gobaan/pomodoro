// Minimal service worker — registers the app as having background responsibilities,
// which reduces the likelihood of the browser evicting the tab under memory pressure.
// Also caches the app shell so page restore after a tab kill is instant.

const CACHE = 'flowbeats-v1'

const PRECACHE = [
  '/flowbeats/',
  '/flowbeats/index.html',
]

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', e => {
  // Only handle same-origin navigation requests — serve from cache, fall back to network.
  if (e.request.mode === 'navigate') {
    e.respondWith(
      caches.match(e.request).then(cached => cached ?? fetch(e.request))
    )
  }
})
