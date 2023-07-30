// import { cleanupOutdatedCaches, precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching'
// import { registerRoute, NavigationRoute } from 'workbox-routing'
// import {NetworkFirst, StaleWhileRevalidate} from 'workbox-strategies';
//
// cleanupOutdatedCaches()
//
// try {
//     precacheAndRoute(self.__WB_MANIFEST);
// } catch (error) {
//
// }
//
// // registerRoute(new NavigationRoute(createHandlerBoundToURL('/index.html')), new StaleWhileRevalidate());
//
// registerRoute(
//     ({url}) => url.pathname.startsWith('/pspdfkit-lib/'),
//     new NetworkFirst()
// );
//
//
import { cacheNames, clientsClaim } from 'workbox-core';
import { registerRoute, setCatchHandler, setDefaultHandler } from 'workbox-routing';
import {CacheFirst, NetworkFirst, NetworkOnly} from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

const data = {
    race: false,
    debug: true,
    credentials: 'same-origin',
    networkTimeoutSeconds: 0,
    fallback: 'index.html',
};

const cacheName = cacheNames.runtime;

const buildStrategy = () => {
    if (data.race) {
        class CacheNetworkRace extends workbox.strategies.Strategy {
            _handle(request, handler) {
                const fetchAndCachePutDone = handler.fetchAndCachePut(request);
                const cacheMatchDone = handler.cacheMatch(request);

                return new Promise((resolve, reject) => {
                    fetchAndCachePutDone.then(resolve).catch((e) => {
                        if (data.debug) console.log(`Cannot fetch resource: ${request.url}`, e);
                    });
                    cacheMatchDone.then((response) => response && resolve(response));

                    // Reject if both network and cache error or find no response.
                    Promise.allSettled([fetchAndCachePutDone, cacheMatchDone]).then((results) => {
                        const [fetchAndCachePutResult, cacheMatchResult] = results;
                        if (
                            fetchAndCachePutResult.status === 'rejected' &&
                            !cacheMatchResult.value
                        )
                            reject(fetchAndCachePutResult.reason);
                    });
                });
            }
        }
        return new CacheNetworkRace();
    } else {
        if (data.networkTimeoutSeconds > 0)
            return new NetworkFirst({ cacheName, networkTimeoutSeconds: data.networkTimeoutSeconds });
        else return new NetworkFirst({ cacheName });
    }
};

const manifest = self.__WB_MANIFEST;

const cacheEntries = [];

const manifestURLs = manifest
    // .filter(entry => !entry.url.includes('pspdfkit-lib'))
    .map((entry) => {
    const url = new URL(entry.url, self.location);
    cacheEntries.push(
        new Request(url.href, {
            credentials: data.credentials,
        })
    );
    return url.href;
});

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(cacheName).then((cache) => {
            return cache.addAll(cacheEntries);
        })
            .catch(error => {
                console.error(error);
            })
    );
});

self.addEventListener('activate', (event) => {
    // - clean up outdated runtime cache
    event.waitUntil(
        caches.open(cacheName).then((cache) => {
            // clean up those who are not listed in manifestURLs
            cache.keys().then((keys) => {
                keys.forEach((request) => {
                    if (data.debug)
                        console.log(`Checking cache entry to be removed: ${request.url}`);
                    if (!manifestURLs.includes(request.url)) {
                        cache.delete(request).then((deleted) => {
                            if (data.debug) {
                                if (deleted) console.log(`Precached data removed: ${request.url || request}`);
                                else console.log(`No precache found: ${request.url || request}`);
                            }
                        });
                    }
                });
            });
        })
    );
});

registerRoute(
    ({ url }) => manifestURLs.includes(url.href) && !url.pathname.startsWith('/pspdfkit-lib/'),
    buildStrategy()
);

registerRoute(
    ({ url }) => manifestURLs.includes(url.href) && url.pathname.startsWith('/pspdfkit-lib/'),
    new CacheFirst()
);

setDefaultHandler(new NetworkOnly());

// fallback to app-shell for document request
setCatchHandler(({ event }) => {
    switch (event.request.destination) {
        case 'document':
            return caches.match(data.fallback).then((r) => {
                return r ? Promise.resolve(r) : Promise.resolve(Response.error());
            });
        default:
            return Promise.resolve(Response.error());
    }
});

// this is necessary, since the new service worker will keep on skipWaiting state
// and then, caches will not be cleared since it is not activated
self.skipWaiting();
clientsClaim();
