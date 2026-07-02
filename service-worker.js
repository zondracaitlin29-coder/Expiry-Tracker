// Expiry Date Tracker — offline caching service worker
// This is the one file that genuinely has to live outside index.html:
// browsers won't let a page register a service worker from an in-memory
// (blob:) URL, only from a real same-origin .js file. Everything else
// (manifest, icons) is generated inside index.html itself.

const CACHE_NAME = 'expiry-tracker-v1';
const APP_SHELL_URL = self.registration.scope; // the folder this file lives in, e.g. .../index.html

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.add(APP_SHELL_URL))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Got a fresh copy from the network — save it for next time offline
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() =>
        // No network — serve the cached page instead
        caches.match(event.request).then((cached) => cached || caches.match(APP_SHELL_URL))
      )
  );
});
