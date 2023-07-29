importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.3/workbox-sw.js');

workbox.precaching.cleanupOutdatedCaches()

workbox.precaching.precacheAndRoute(self.__WB_MANIFEST)

workbox.routing.registerRoute(new workbox.routing.NavigationRoute(workbox.precaching.createHandlerBoundToURL('/index.html')));

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