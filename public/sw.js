// Service Worker simplificado para desarrollo
console.log("[SW] Service Worker iniciado en modo desarrollo");

self.addEventListener("install", (event) => {
  console.log("[SW] Install - modo desarrollo");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("[SW] Activate - modo desarrollo");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName))
      );
    })
  );
});

self.addEventListener("fetch", (event) => {
  // No interceptar requests durante desarrollo
});
