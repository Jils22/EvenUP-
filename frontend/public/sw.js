/**
 * EvenUP Service Worker — Offline-first for static assets.
 *
 * Strategy:
 *  - App shell (HTML/JS/CSS): Cache-First with network fallback.
 *  - API requests: Network-First with cache fallback (so data stays fresh).
 *
 * This follows the Workbox-compatible pattern but is written as vanilla JS
 * to avoid a build-step dependency.
 */

const CACHE_NAME = 'evenup-v2';
const API_CACHE = 'evenup-api-v2';

// Static assets to pre-cache on install
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// ── Install: pre-cache app shell ─────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// ── Activate: clean old caches ───────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME && k !== API_CACHE)
          .map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch: route-based caching strategy ─────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip unsupported schemes (e.g. chrome-extension://) so the service worker does not cache them
  if (!['http:', 'https:'].includes(url.protocol)) return;

  // 1. Navigation Fallback: Handle SPA routing
  // If this is a navigation request (loading a page), try network first, then cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => {
          // If network fails (offline or server issues), serve cached index.html
          return caches.match('/index.html')
            .then(cachedResponse => {
              if (cachedResponse) return cachedResponse;
              // Fallback to absolute root if /index.html not found in cache
              return caches.match('/');
            });
        })
    );
    return;
  }

  // 2. API requests: Network-First
  // Detect API: /api path or specific backend hostnames
  const looksLikeApi = url.pathname.startsWith('/api') || 
                       url.hostname === '127.0.0.1' || 
                       url.hostname === 'localhost' && url.port === '8000';

  if (looksLikeApi) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Only cache successful API responses
          if (response && response.ok) {
            const cloned = response.clone();
            caches.open(API_CACHE).then(cache => cache.put(request, cloned));
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache if network fails (offline support)
          return caches.match(request);
        })
    );
    return;
  }

  // 3. Static assets & External APIs
  if (url.hostname.includes('er-api.com')) return; // Currency API: Network-only

  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      
      return fetch(request)
        .then(response => {
          // Cache successful assets
          if (response && response.ok) {
            const cloned = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, cloned));
          }
          return response;
        })
        .catch(() => {
          // Return generic error or blank if everything fails
          return new Response('Network error occurred', { status: 408, headers: { 'Content-Type': 'text/plain' } });
        });
    })
  );
});
