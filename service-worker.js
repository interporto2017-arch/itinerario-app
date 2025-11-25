// Service Worker minimal e sempre aggiornato
self.addEventListener("install", (event) => {
  // Attiva subito il SW nuovo
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Prende subito il controllo di tutte le schede
  event.waitUntil(self.clients.claim());
});

// Nessuna cache: tutte le richieste sempre fresche
self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
