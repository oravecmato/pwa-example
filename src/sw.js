import { cleanupOutdatedCaches, precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching'
import { registerRoute, NavigationRoute } from 'workbox-routing'
import {NetworkFirst, StaleWhileRevalidate} from 'workbox-strategies';

cleanupOutdatedCaches()

precacheAndRoute(self.__WB_MANIFEST);

registerRoute(new NavigationRoute(createHandlerBoundToURL('/index.html')), new StaleWhileRevalidate());

registerRoute(
    ({url}) => url.pathname.startsWith('/pspdfkit-lib/'),
    new NetworkFirst()
);

// importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.3/workbox-sw.js');
//
// workbox.precaching.cleanupOutdatedCaches()
//
// workbox.precaching.precacheAndRoute(self.__WB_MANIFEST)


// self.addEventListener('message', (event) => {
//     if (event.data && event.data.type === 'MESSAGE_IDENTIFIER') {
//         // do something
//     }
// });
//
// let getVersionPort;
// let count = 0;
// self.addEventListener("message", event => {
//     if (event.data && event.data.type === 'INIT_PORT') {
//         getVersionPort = event.ports[0];
//     }
//
//     if (event.data && event.data.type === 'INCREASE_COUNT') {
//         getVersionPort.postMessage({ payload: ++count });
//     }
// });