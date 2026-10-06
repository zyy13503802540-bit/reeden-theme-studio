// PWA Service Worker：缓存优先，保证离线可用
// 版本号升级时改 CACHE 名即可触发全量换缓存（activate 里清旧缓存）
const CACHE = 'reeden-studio-v2'
const CORE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-1024.png'
]

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())
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
  const url = new URL(e.request.url)
  // 只接管同源 GET；GitHub API 等跨域请求直接放行
  if (e.request.method !== 'GET' || url.origin !== location.origin) return
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(hit => {
      if (hit) return hit
      return fetch(e.request).then(res => {
        if (res.ok) {
          const copy = res.clone()
          caches.open(CACHE).then(c => c.put(e.request, copy))
        }
        return res
      }).catch(() => caches.match('./index.html'))
    })
  )
})
