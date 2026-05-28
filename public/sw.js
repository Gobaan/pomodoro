// Offline-first service worker for FlowBeats.
//
// The melody MP3s are precached during install so playback does not depend on
// the network once this worker has installed. Built JS/CSS files are runtime
// cached because Vite gives them hashed filenames that change on each build.

const CACHE_VERSION = 'flowbeats-offline-v1'
const APP_ROOT = '/flowbeats/'

const PRECACHE_URLS = [
  APP_ROOT,
  `${APP_ROOT}manifest.json`,
  `${APP_ROOT}favicon.svg`,
  `${APP_ROOT}icons.svg`,
  `${APP_ROOT}audio/focus_melody.mp3`,
  `${APP_ROOT}audio/break_melody.mp3`,
]

const CACHE_FIRST_PATHS = [
  `${APP_ROOT}assets/`,
  `${APP_ROOT}audio/`,
]

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key !== CACHE_VERSION).map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', event => {
  const request = event.request
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, APP_ROOT))
    return
  }

  if (request.headers.has('range') && url.pathname.startsWith(`${APP_ROOT}audio/`)) {
    event.respondWith(rangeFromCacheOrNetwork(request))
    return
  }

  if (CACHE_FIRST_PATHS.some(path => url.pathname.startsWith(path)) || PRECACHE_URLS.includes(url.pathname)) {
    event.respondWith(cacheFirst(request))
  }
})

async function networkFirst(request, fallbackUrl) {
  const cache = await caches.open(CACHE_VERSION)
  try {
    const response = await fetch(request)
    if (response.ok) await cache.put(request, response.clone())
    return response
  } catch {
    return await caches.match(request) || await caches.match(fallbackUrl)
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request)
  if (cached) return cached

  const response = await fetch(request)
  if (response.ok) {
    const cache = await caches.open(CACHE_VERSION)
    await cache.put(request, response.clone())
  }
  return response
}

async function rangeFromCacheOrNetwork(request) {
  const cache = await caches.open(CACHE_VERSION)
  const fullRequest = new Request(request.url, {
    cache: 'reload',
    credentials: request.credentials,
    mode: request.mode,
    redirect: request.redirect,
  })

  let response = await cache.match(fullRequest)
  if (!response) {
    response = await fetch(fullRequest)
    if (response.ok) await cache.put(fullRequest, response.clone())
  }

  return rangeResponse(request, response)
}

async function rangeResponse(request, response) {
  const rangeHeader = request.headers.get('range')
  if (!rangeHeader) return response

  const size = Number(response.headers.get('content-length'))
  if (!Number.isFinite(size)) return response

  const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader)
  if (!match) return response

  const start = match[1] === '' ? 0 : Number(match[1])
  const end = match[2] === '' ? size - 1 : Number(match[2])
  if (start > end || start < 0 || end >= size) {
    return new Response(null, {
      status: 416,
      statusText: 'Range Not Satisfiable',
      headers: { 'Content-Range': `bytes */${size}` },
    })
  }

  const blob = await response.blob()
  const body = blob.slice(start, end + 1)
  const headers = new Headers(response.headers)
  headers.set('Content-Length', String(body.size))
  headers.set('Content-Range', `bytes ${start}-${end}/${size}`)
  headers.set('Accept-Ranges', 'bytes')

  return new Response(body, {
    status: 206,
    statusText: 'Partial Content',
    headers,
  })
}
