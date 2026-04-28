// DulceOS Service Worker - Network First Strategy
// v4 - Actualizado para garantizar servicio de versiones frescas del HTML
const CACHE_NAME = 'dulceos-cache-v4';
const ASSETS_TO_CACHE = [
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Install: cachear solo assets estáticos (no el HTML)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate: limpiar cachés antiguas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[SW] Eliminando caché antigua:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: Network First para HTML, Cache First para assets
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  
  // Excluir API y webhooks del service worker
  const url = event.request.url;
  if (url.includes('/api/') || url.includes('/webhook/')) return;

  // Para HTML: siempre network first, nunca cachear
  const acceptHeader = event.request.headers.get('accept') || '';
  if (acceptHeader.includes('text/html')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/index.html');
      })
    );
    return;
  }

  // Para otros assets: network first con fallback a cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
