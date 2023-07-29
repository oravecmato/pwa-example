const cacheName = 'my-cache';
const filesToCache = [
    '/',
    '/index.html',
    '/styles.css',
    '/main.js',
    '/fallback.html'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(cacheName)
            .then((cache) => {
                return cache.addAll(filesToCache);
            })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    // if cached, return the response
                    return response;
                }
                // else, fetch from network
                return fetch(event.request).catch(() => {
                    // if fetch fails (because offline), return the fallback.html file
                    return caches.match('/fallback.html');
                });
            })
    );
});
