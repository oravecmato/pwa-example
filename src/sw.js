import { cleanupOutdatedCaches, precacheAndRoute, createHandlerBoundToURL, precache } from 'workbox-precaching'
import { registerRoute, NavigationRoute } from 'workbox-routing'
import {NetworkFirst, StaleWhileRevalidate} from 'workbox-strategies';

cleanupOutdatedCaches()

precacheAndRoute(self.__WB_MANIFEST);

registerRoute(new NavigationRoute(createHandlerBoundToURL('/index.html')), new StaleWhileRevalidate());

// TODO: add PDF & instantJSON api here, too
registerRoute(
    ({url}) => url.pathname.includes('amazonaws.com') && url.pathname.includes('users/shelf'),
    new NetworkFirst()
);