importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.3/workbox-sw.js');
// import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'

workbox.precaching.cleanupOutdatedCaches()

// const manifest = self.__WB_MANIFEST;
workbox.precaching.precacheAndRoute(self.__WB_MANIFEST)

// self.addEventListener('activate', event => {
//     self.clients.matchAll().then(all => all.map(client => client.postMessage({message: 'Manifest', manifest})));
// });

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'MESSAGE_IDENTIFIER') {
        // do something
    }
});

let getVersionPort;
let count = 0;
self.addEventListener("message", event => {
    if (event.data && event.data.type === 'INIT_PORT') {
        getVersionPort = event.ports[0];
    }

    if (event.data && event.data.type === 'INCREASE_COUNT') {
        getVersionPort.postMessage({ payload: ++count });
    }
});