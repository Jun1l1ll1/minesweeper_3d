// Service worker cache name and app shell assets to pre-cache for offline use
const CACHE_NAME = 'simple-pwa-cache-v2';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js',
    '/game.js',
    '/manifest.webmanifest',
    '/icons/icon-192.svg',
    '/icons/icon-512.svg',
    '/icons/settings.svg',
    '/icons/mine.svg',
    '/icons/flag.svg'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
    );
    self.skipWaiting();
});

// Clean up old caches during activation so the latest version is used
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) =>
            Promise.all(
                cacheNames
                .filter((name) => name !== CACHE_NAME)
                .map((name) => caches.delete(name))
            )
        )
    );
    self.clients.claim();
});

const canCacheRequest = (request) => {
    try {
        const url = new URL(request.url);
        return (url.protocol === 'http:' || url.protocol === 'https:') && url.origin === self.location.origin;
    } catch (err) {
        return false;
    }
};

self.addEventListener('fetch', (event) => {
    const request = event.request;
    if (request.method !== 'GET') return;

    if (request.destination === 'document' || request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    const clone = response.clone();
                    if (canCacheRequest(request)) {
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                    }
                    return response;
                })
                .catch(() => caches.match('/index.html'))
        );
        return;
    }

    // For other assets, try exact cache first, then network, and only fallback to a cached match ignoring search if offline
    event.respondWith(
        caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }
            return fetch(request)
                .then((response) => {
                    const clone = response.clone();
                    if (canCacheRequest(request)) {
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                    }
                    return response;
                })
                .catch(() => caches.match(request, { ignoreSearch: true }));
        })
    );
});
