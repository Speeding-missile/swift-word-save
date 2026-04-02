const CACHE_NAME = "vocabulary-vault-core-v1";
const OFFLINE_FALLBACK = "/";

self.addEventListener("install", (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.add(OFFLINE_FALLBACK);
        })
    );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
    if (event.request.mode === "navigate") {
        event.respondWith(
            fetch(event.request).catch(async () => {
                const cache = await caches.open(CACHE_NAME);
                return await cache.match(OFFLINE_FALLBACK);
            })
        );
    }
});