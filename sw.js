const CACHE_NAME = 'teach-back-engine-v1';
const APP_SHELL_URLS = [
    '/',
    '/index.html',
    '/manifest.json'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache and caching app shell');
                return cache.addAll(APP_SHELL_URLS);
            })
    );
});

self.addEventListener('fetch', event => {
    // We only want to cache GET requests.
    if (event.request.method !== 'GET') {
        return;
    }
    
    // For navigation requests, use network first, then cache.
    // This ensures users get the latest HTML.
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).catch(() => caches.match(event.request))
        );
        return;
    }

    // For other requests (JS, CSS, etc.), use a stale-while-revalidate strategy.
    event.respondWith(
        caches.open(CACHE_NAME).then(cache => {
            return cache.match(event.request).then(response => {
                const fetchPromise = fetch(event.request).then(networkResponse => {
                    // Check if the response is valid and not from a third-party CDN before caching.
                    if (networkResponse && networkResponse.status === 200 && !networkResponse.url.includes('aistudiocdn') && !networkResponse.url.includes('cdnjs')) {
                        cache.put(event.request, networkResponse.clone());
                    }
                    return networkResponse;
                }).catch(err => {
                    console.error('Fetch failed; returning offline page instead.', err);
                    return new Response('Content is not available offline.', { status: 503, statusText: 'Service Unavailable' });
                });

                // Return cached response immediately if available, and update cache in the background.
                return response || fetchPromise;
            });
        })
    );
});

// Clean up old caches on activation
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
