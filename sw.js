const CACHE_NAME = 'dulce-jaleo-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Install event: cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate event: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event: Network first, fallback to cache
self.addEventListener('fetch', (event) => {
  // Only handle GET requests and exclude API / Webhook calls
  if (event.request.method !== 'GET' || event.request.url.includes('/api/line')) return;
  if (event.request.url.includes('/api/') || event.request.url.includes('/webhook/')) {
      return; // Permite a la API fallar naturalmente si estamos offline
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Almacenamos copias dinámicas de lo que vamos navegando
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          
          // Si estamos offline y pidiendo HTML, mandamos al index pre-cacheado
          if (event.request.headers.get('accept').includes('text/html')) {
             return caches.match('/index.html');
          }
        });
      })
  );
});
