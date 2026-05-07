/**
 * sw.js — Service Worker de Míster11
 * Estrategia: Network-First con fallback a caché.
 * - Recursos críticos del shell se precargan en install.
 * - En fetch: intenta red primero; si falla, sirve desde caché.
 * - La caché se versiona: al actualizar CACHE_NAME, la antigua se elimina.
 */

const CACHE_NAME = 'mister11-v2';

// Recursos del app shell que se precargan en la instalación
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo_mister11.png',
  '/icon-512.png',
  '/favicon.svg'
];

// ── INSTALL: precarga el app shell ─────────────────────────────────────────
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Activa el nuevo SW de inmediato sin esperar cierre de tabs
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // addAll falla silenciosamente si algún recurso no existe; usamos Promise.allSettled
      return Promise.allSettled(
        PRECACHE_URLS.map(url =>
          cache.add(url).catch(err => console.warn('[SW] No se pudo cachear:', url, err))
        )
      );
    })
  );
});

// ── ACTIVATE: limpia cachés anteriores ─────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME)
          .map((k) => {
            console.log('[SW] Eliminando caché obsoleta:', k);
            return caches.delete(k);
          })
      )
    ).then(() => self.clients.claim())
  );
});

// ── FETCH: Network-First con fallback a caché ───────────────────────────────
self.addEventListener('fetch', (event) => {
  // Solo interceptar peticiones GET (no POST, Firebase, Groq, etc.)
  if (event.request.method !== 'GET') return;

  // No interceptar peticiones a APIs externas (Firebase, Groq, etc.)
  const url = new URL(event.request.url);
  const isExternal = url.origin !== self.location.origin;
  if (isExternal) return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Guardar la respuesta de red en caché para uso offline futuro
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        }
        return networkResponse;
      })
      .catch(() => {
        // Red no disponible: servir desde caché
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          // Para navegaciones (HTML), devolver el shell de la app
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          // Sin caché disponible
          return new Response('Sin conexión', { status: 503, statusText: 'Service Unavailable' });
        });
      })
  );
});
