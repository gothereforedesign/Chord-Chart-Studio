/**
 * Service Worker for Chord Chart Studio (Fully Offline Progressive Web App)
 * Caches static layouts and dynamically revalidates Javascript, CSS bundles, Google Fonts, and custom assets.
 */

const CACHE_NAME = 'chord-chart-studio-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/heathergreen.otf',
  '/skinny_things.otf',
  '/skinny_things.ttf'
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching static assets for offline performance');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// Activate Event - Clear previous versions of the cache
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Cleaning out old cache store:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch Event - Serve from Cache with background Network Revalidation (Stale-While-Revalidate)
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // 1. Only intercept safe GET requests
  if (request.method !== 'GET') {
    return;
  }

  // 2. Only cache HTTP protocol origins (avoid chrome-extension schemes etc)
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // 3. Do NOT cache server API endpoints (such as Gemini deep analyzer)
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      // Return cached immediately if available, triggers background sync
      if (cachedResponse) {
        fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
            }
          })
          .catch((err) => {
            // Quiet fail if background fetch is unavailable (offline state)
          });
        return cachedResponse;
      }

      // If missing from cache, fetch from network and store for future offline visits
      return fetch(request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }

          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });

          return networkResponse;
        })
        .catch((err) => {
          // If offline and request is document navigation, fallback to root
          if (request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/');
          }
          throw err;
        });
    })
  );
});
