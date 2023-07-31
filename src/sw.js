import { cleanupOutdatedCaches, precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching'
import { registerRoute, NavigationRoute } from 'workbox-routing'
import {CacheFirst, NetworkFirst, StaleWhileRevalidate} from 'workbox-strategies';

self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

cleanupOutdatedCaches()

precacheAndRoute(self.__WB_MANIFEST);

registerRoute(new NavigationRoute(createHandlerBoundToURL('/index.html')), new StaleWhileRevalidate());

registerRoute(
    ({request}) => request.destination === 'style',
    new CacheFirst()
);

// TODO: add PDF & instantJSON api here, too
registerRoute(
    ({url}) => url.pathname.includes('amazonaws.com') && url.pathname.includes('users/shelf'),
    new NetworkFirst()
);