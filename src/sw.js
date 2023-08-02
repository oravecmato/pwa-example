import { registerRoute, registerNavigationRoute } from 'workbox-routing';
import { CacheFirst, StaleWhileRevalidate, NetworkFirst, NetworkOnly } from 'workbox-strategies';
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
        .map(item => new URL('/' + item.url, location.origin).href);

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

const registerFallbackHtmlRoute = (fallbackUrl = '/index.html') => {

    // Custom handler to serve "index.html" when offline
    const customHandler = async ({event}) => {
        const networkOnly = new NetworkOnly();
        try {
            return await networkOnly.handle(event);
        } catch (error) {
            // If the network request fails, attempt to retrieve "index.html" from the cache
            return caches.match(fallbackUrl, {
                ignoreVary: true, // Ignore any Vary headers when matching
            });
        }
    };

    // Register the route for navigation requests
    registerRoute(
        ({request}) => request.mode === 'navigate',
        customHandler,
        'GET'
    );
}

self.addEventListener('message', async (event) => {
    if (event.data.type === 'sign_in') {

        // Function to cache must-have assets
        const cacheMustHaveAssets = async (disableWebAssembly = false) => {
            const cache = await caches.open('pspdfkit-lib');
            const mustHaveAssets = filesToCache.filter(item => {
                return item.url.startsWith('pspdfkit-lib/') && mustHaveExtensions.filter(ext => disableWebAssembly ? ext !== 'wasm' : true).includes(item.url.split('.').pop());
            });

            console.log('Must have assets', mustHaveAssets.length)

            for (const asset of mustHaveAssets) {
                const response = await fetch(asset.url);
                await cache.put(asset.url, response);
            }
        }

        const hasPspdfAssetsChanged = await clearOutdatedPSPDFKitLibCaches();

        if (hasPspdfAssetsChanged) {

            let disableWebAssemblyStreaming = false;
            // Attempt to cache all assets
            caches.open('pspdfkit-lib').then(cache => {
                const allAssets = filesToCache.filter(item => item.url.startsWith('pspdfkit-lib/'));

                Promise.all(allAssets.map(asset => fetch(asset.url).then(response => cache.put(asset.url, response))))
                    .catch(async () => {
                        // Failed to cache all assets, deleting and retrying with must-have ones
                        await caches.delete('pspdfkit-lib');
                        await cacheMustHaveAssets();
                    })
                    .catch(async () => {
                        // The very last chance: cache a restricted version of the app for offline usage
                        await caches.delete('pspdfkit-lib');
                        await cacheMustHaveAssets(true);
                        disableWebAssemblyStreaming = true;
                        console.log('Finally got it!!!');
                    })
                    .then(() => {
                        // Register CacheFirst strategy for pspdfkit-lib/ assets
                        registerRoute(({request}) => request.url.includes('pspdfkit-lib/') && new URL(request.url).origin === location.origin, new CacheFirst());
                        // registerFallbackHtmlRoute(disableWebAssemblyStreaming ? '/noWasmIndex.html' : '/index.html');
                        registerNavigationRoute(disableWebAssemblyStreaming ? '/noWasmIndex.html' : '/index.html');
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