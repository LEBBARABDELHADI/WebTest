const CACHE = 'react-blocs-v2'
const APP_SHELL = ['/WebTest/', '/WebTest/index.html']

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(APP_SHELL)).catch(() => {}))
  self.skipWaiting()
})

// Permet au client (main.jsx) de forcer l'activation immédiate d'une
// nouvelle version si besoin, en plus du skipWaiting automatique ci-dessus.
self.addEventListener('message', e => {
  if (e.data === 'skipWaiting') self.skipWaiting()
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  )
  self.clients.claim()
})

self.addEventListener('fetch', e => {
  const { request } = e
  if (request.method !== 'GET') return
  // Les données (API GitHub) ne sont jamais mises en cache : toujours à jour.
  if (request.url.includes('api.github.com') || request.url.includes('githubusercontent.com')) return

  e.respondWith(
    fetch(request)
      .then(res => {
        const copie = res.clone()
        caches.open(CACHE).then(c => c.put(request, copie)).catch(() => {})
        return res
      })
      .catch(() => caches.match(request).then(caché => caché || caches.match('/WebTest/index.html')))
  )
})
