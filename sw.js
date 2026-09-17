// BB Tracker service worker
//
// IMPORTANT: bump CACHE_NAME (e.g. v1 -> v2) every time you redeploy a
// changed index.html or manifest.json. The version string is what makes
// old caches get thrown away — without bumping it, phones can keep
// serving a stale cached copy of the app even after you've pushed an
// update to Netlify.
const CACHE_NAME = 'bb-tracker-v1';

const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

// On install: pre-cache the core files so the app can open offline
// immediately, even before the person has opened it once online.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

// On activate: delete any caches left over from a previous version.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

// Network-first: always try to fetch the latest version first (so you see
// updates immediately when online), and only fall back to the cached copy
// when there's no connection. Every successful fetch also refreshes the
// cache, so the offline copy stays reasonably current.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const responseCopy = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseCopy);
        });
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cached) => {
          // Fall back to the cached page itself, or to index.html for any
          // navigation request that isn't individually cached.
          return cached || caches.match('./index.html');
        });
      })
  );
});
