// Minimal service worker — enables PWA installability.
// In production, replace with a proper caching strategy (e.g. Workbox).

const CACHE_NAME = "field-tech-v1";
const PRECACHE = ["/", "/src/style.css", "/src/main.js"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Let API calls through to the network always
  if (event.request.url.includes("/analyze")) return;

  event.respondWith(
    caches.match(event.request).then((cached) => cached ?? fetch(event.request))
  );
});
