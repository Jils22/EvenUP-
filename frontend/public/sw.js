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

const CACHE_NAME = 'evenup-v1';
const API_CACHE = 'evenup-api-v1';

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

  // Skip non-GET and cross-origin (except API)
  if (request.method !== 'GET') return;

  // API requests: Network-First
  if (url.hostname === '127.0.0.1' || url.pathname.startsWith('/api')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Cache successful API responses
          if (response.ok) {
            const cloned = response.clone();
            caches.open(API_CACHE).then(cache => cache.put(request, cloned));
          }
          return response;
        })
        .catch(() => caches.match(request))  // offline fallback
    );
    return;
  }

  // For exchange rate API — network only (never cache currency data)
  if (url.hostname.includes('er-api.com')) return;

  // App shell & static assets: Cache-First
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        if (response.ok) {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, cloned));
        }
        return response;
      });
    })
  );
});
