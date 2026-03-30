// This is the optimized Service Worker for Word Vault
const CACHE = "word-vault-v1";

// Use the Workbox CDN to handle caching strategies
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js');

// This tells the service worker to skip the waiting phase and become active immediately
self.addEventListener("message", (event) => {
    if (event.data && event.data.type === "SKIP_WAITING") {
        self.skipWaiting();
    }
});

// Pre-cache the basic root page so the app loads offline
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE).then((cache) => cache.add("/"))
    );
});

// Strategy: Network First, falling back to cache
// This ensures users always see the latest version if online, 
// but the app still opens if they are offline.
workbox.routing.registerRoute(
    ({ request }) => request.mode === 'navigate',
    new workbox.strategies.NetworkFirst({
        cacheName: CACHE,
    })
);

// Cache CSS, JS, and Web Worker files with a Stale-While-Revalidate strategy
workbox.routing.registerRoute(
    ({ request }) =>
        request.destination === 'style' ||
        request.destination === 'script' ||
        request.destination === 'worker',
    new workbox.strategies.StaleWhileRevalidate({
        cacheName: 'static-resources',
    })
);

// Cache Images
workbox.routing.registerRoute(
    ({ request }) => request.destination === 'image',
    new workbox.strategies.CacheFirst({
        cacheName: 'images',
        plugins: [
            new workbox.expiration.ExpirationPlugin({
                maxEntries: 50,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
            }),
        ],
    })
);