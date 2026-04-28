// ===== DULCE Y JALEO — SERVICE WORKER (Offline-First) =====
// Estrategia:
//   - Cache First → recursos estáticos (JS, CSS, imágenes, fuentes)
//   - Network First con fallback → llamadas a /api/records (datos Airtable)
//   - Background Sync → registros de limpieza creados offline

const CACHE_NAME = 'dulceos-v2';
const CACHE_STATIC = 'dulceos-static-v1';
const CACHE_DATA   = 'dulceos-data-v1';

// ─── Recursos del shell que siempre se cachean ───
const SHELL_FILES = [
    '/',
    '/index.html',
    '/login.html',
    '/public/js/api.js',
    '/manifest.json'
];

// ─── Install: pre-caché del shell ───
self.addEventListener('install', event => {
    console.log('[SW] Instalando y cacheando shell...');
    event.waitUntil(
        caches.open(CACHE_STATIC).then(cache => cache.addAll(SHELL_FILES))
    );
    self.skipWaiting();
});

// ─── Activate: limpiar cachés viejos ───
self.addEventListener('activate', event => {
    console.log('[SW] Activado. Limpiando cachés obsoletos...');
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys
                    .filter(k => k !== CACHE_STATIC && k !== CACHE_DATA)
                    .map(k => caches.delete(k))
            )
        )
    );
    self.clients.claim();
});

// ─── Fetch: interceptar peticiones ───
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // 1. Peticiones a la API de datos → Network First con fallback de caché
    if (url.pathname.startsWith('/api/records') || url.pathname.startsWith('/api/')) {
        event.respondWith(networkFirstWithCache(event.request, CACHE_DATA));
        return;
    }

    // 2. Peticiones externas (Airtable directo, Gemini) → siempre network, sin cachear
    if (url.hostname !== self.location.hostname && url.hostname !== 'localhost') {
        event.respondWith(fetch(event.request).catch(() => offlineFallback('data')));
        return;
    }

    // 3. Resto (estáticos) → Cache First
    event.respondWith(cacheFirstWithNetwork(event.request, CACHE_STATIC));
});

// ─── Background Sync: guardar registros offline ───
self.addEventListener('sync', event => {
    if (event.tag === 'sync-registros-limpieza') {
        event.waitUntil(syncOfflineRegistros());
    }
});

// ─── Notificaciones push (futuro) ───
self.addEventListener('push', event => {
    if (event.data) {
        const data = event.data.json();
        self.registration.showNotification(data.title || 'DulceOS', {
            body: data.body || '',
            icon: '/icon-192.png',
            badge: '/icon-192.png'
        });
    }
});

// ══════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════

async function cacheFirstWithNetwork(request, cacheName) {
    const cached = await caches.match(request);
    if (cached) return cached;
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, response.clone());
        }
        return response;
    } catch {
        return offlineFallback('shell');
    }
}

async function networkFirstWithCache(request, cacheName) {
    try {
        const response = await fetch(request, { headers: request.headers });
        if (response.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, response.clone());
        }
        return response;
    } catch {
        const cached = await caches.match(request);
        if (cached) return cached;
        return offlineFallback('data');
    }
}

function offlineFallback(type) {
    if (type === 'data') {
        return new Response(JSON.stringify({
            facturas: [], albaranes: [], gastos: [],
            _offline: true
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }
    // Fallback de shell → devolver index.html cacheado
    return caches.match('/index.html');
}

async function syncOfflineRegistros() {
    // Abre la BD IndexedDB donde el front guardó los registros offline
    const db = await openIDB('dulceos-offline', 1);
    const tx = db.transaction('pendientes', 'readwrite');
    const store = tx.objectStore('pendientes');
    const pendientes = await storeGetAll(store);

    for (const item of pendientes) {
        try {
            const res = await fetch('/api/records/' + item.tabla, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...item.headers },
                body: JSON.stringify({ fields: item.fields })
            });
            if (res.ok) {
                await store.delete(item.id);
            }
        } catch (e) {
            console.warn('[SW] Sync fallido para item', item.id, e);
        }
    }
}

function openIDB(name, version) {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(name, version);
        req.onupgradeneeded = e => {
            e.target.result.createObjectStore('pendientes', { keyPath: 'id', autoIncrement: true });
        };
        req.onsuccess = e => resolve(e.target.result);
        req.onerror   = e => reject(e.target.error);
    });
}

function storeGetAll(store) {
    return new Promise((resolve, reject) => {
        const req = store.getAll();
        req.onsuccess = e => resolve(e.target.result);
        req.onerror   = reject;
    });
}
