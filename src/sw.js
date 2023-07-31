import { cleanupOutdatedCaches, precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching'
import { registerRoute, NavigationRoute } from 'workbox-routing'
import {CacheFirst, NetworkFirst, StaleWhileRevalidate} from 'workbox-strategies';

self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

cleanupOutdatedCaches()

const precacheManifest = self.__WB_MANIFEST;
precacheManifest.push({ url: '/sw.js', revision: null });
precacheAndRoute(precacheManifest);

registerRoute(new NavigationRoute(createHandlerBoundToURL('/index.html')), new StaleWhileRevalidate());

registerRoute(
    ({ url }) => url.pathname === '/sw.js',
    new NetworkFirst()
);

registerRoute(
    ({request}) => request.destination === 'style',
    new CacheFirst()
);

// TODO: add PDF & instantJSON api here, too
registerRoute(
    ({url}) => url.pathname.includes('amazonaws.com') && url.pathname.includes('users/shelf'),
    new NetworkFirst()
);