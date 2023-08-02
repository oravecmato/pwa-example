import { registerRoute } from 'workbox-routing';
import { CacheFirst, StaleWhileRevalidate, NetworkFirst } from 'workbox-strategies';
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';

const filesToCache = self.__WB_MANIFEST;

// Clean up outdated caches
cleanupOutdatedCaches();

// Exclude pspdfkit-lib/ paths and precache remaining assets
const assetsToCache = filesToCache.filter(item => !item.url.startsWith('pspdfkit-lib/'));
precacheAndRoute(assetsToCache);

// Use StaleWhileRevalidate for other assets
registerRoute(
    ({ request }) => !request.url.includes('pspdfkit-lib/') && new URL(request.url).origin === location.origin,
    new StaleWhileRevalidate()
);

// PSPDFKit required assets file extensions
const mustHaveExtensions = ['js', 'json', 'css', 'html', 'mem', 'wasm'];

async function clearOutdatedPSPDFKitLibCaches() {
    const cacheName = 'pspdfkit-lib';
    const cache = await caches.open(cacheName);
    const cachedRequests = await cache.keys();
    const cachedURLs = cachedRequests.map(request => request.url);

    const manifestURLs = filesToCache
        .filter(item => item.url.startsWith('pspdfkit-lib/'))
        .map(item => new URL(item.url, location.origin).href);

    console.log('manifestURLs:', manifestURLs.length);
    console.log('cached URLs:', cachedURLs.length)

    const shouldClearCache =
        cachedURLs.some(url => !manifestURLs.includes(url)) ||
        manifestURLs
            .filter(url => mustHaveExtensions.includes(url.split('.').pop()))
            .some(url => !cachedURLs.includes(url));

    if (shouldClearCache) {
        await caches.delete(cacheName);
        return true
    }

    return false
}

self.addEventListener('message', async (event) => {
    if (event.data.type === 'sign_in') {

        // Function to cache must-have assets
        const cacheMustHaveAssets = async () => {
            const cache = await caches.open('pspdfkit-lib');
            const mustHaveAssets = filesToCache.filter(item => {
                return item.url.startsWith('pspdfkit-lib/') && mustHaveExtensions.includes(item.url.split('.').pop());
            });

            console.log('Must have assets', mustHaveAssets.length)

            for (const asset of mustHaveAssets) {
                try {
                    const response = await fetch(asset.url);
                    await cache.put(asset.url, response);
                } catch (error) {
                    console.error('Failed to cache a must-have asset:', asset.url, error);
                }
            }
        };

        const hasPspdfAssetsChanged = await clearOutdatedPSPDFKitLibCaches();

        if (hasPspdfAssetsChanged) {
            // Attempt to cache all assets
            caches.open('pspdfkit-lib').then(cache => {
                const allAssets = filesToCache.filter(item => item.url.startsWith('pspdfkit-lib/'));

                Promise.all(allAssets.map(asset => fetch(asset.url).then(response => cache.put(asset.url, response))))
                    .catch(async () => {
                        // Failed to cache all assets, deleting and retrying with must-have ones
                        await caches.delete('pspdfkit-lib');
                        await cacheMustHaveAssets();
                    })
                    .then(() => {
                        // Register CacheFirst strategy for pspdfkit-lib/ assets
                        registerRoute(({request}) => request.url.includes('pspdfkit-lib/') && new URL(request.url).origin === location.origin, new CacheFirst());
                    });
            });
        }
    }
});

// TODO: add PDF & instantJSON api here, too
registerRoute(
    ({url}) => url.pathname.includes('amazonaws.com') && url.pathname.includes('users/shelf'),
    new NetworkFirst()
);