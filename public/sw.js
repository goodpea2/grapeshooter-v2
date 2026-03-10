// Minimal Service Worker for PWA installability
const CACHE_NAME = 'grapeshooter-v2-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Network-first or just pass-through for now
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
