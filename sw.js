
/* =========================================================
   FT UISU EXPLORER — SERVICE WORKER
   REVISI 8 (NO NAVIGATION)

   - Model GLB mencoba jaringan terlebih dahulu.
   - Cache foto Tendik tetap didukung.
   - Cache lama dibersihkan.
========================================================= */

const MODEL_CACHE =
    "ft-uisu-models-no-navigation-r8-webar";

const STATIC_CACHE =
    "ft-uisu-static-no-navigation-r8-webar";

/* =========================================================
   INSTALL
========================================================= */

self.addEventListener("install", () => {
    self.skipWaiting();
});

/* =========================================================
   ACTIVATE
========================================================= */

self.addEventListener("activate", event => {
    event.waitUntil(
        (async () => {
            const keys = await caches.keys();

            await Promise.all(
                keys.filter(name => (
                    (
                        name.startsWith("ft-uisu-models-") &&
                        name !== MODEL_CACHE
                    ) ||
                    (
                        name.startsWith("ft-uisu-static-") &&
                        name !== STATIC_CACHE
                    )
                )).map(name => caches.delete(name))
            );

            await self.clients.claim();
        })()
    );
});

/* =========================================================
   FETCH
========================================================= */

self.addEventListener("fetch", event => {
    const request = event.request;

    if (
        request.method !== "GET" ||
        request.headers.has("range")
    ) {
        return;
    }

    const url = new URL(request.url);

    // CDN XR8 dan Three.js tidak dicegat.
    if (url.origin !== self.location.origin) {
        return;
    }

    const pathname = url.pathname.toLowerCase();

    /* MODEL 3D */
    if (/\.(glb|gltf)$/.test(pathname)) {
        event.respondWith(
            networkFirst(request, MODEL_CACHE)
        );
    }

    /* FILE STATIS DAN FOTO TENDIK */
    else if (
        /\.(css|js|png|jpg|jpeg|webp|svg)$/.test(pathname)
    ) {
        event.respondWith(
            networkFirst(request, STATIC_CACHE)
        );
    }
});

/* =========================================================
   NETWORK FIRST
========================================================= */

async function networkFirst(request, cacheName) {
    const cache = await caches.open(cacheName);

    try {
        const response = await fetch(request, {
            cache: "no-cache"
        });

        if (response?.ok) {
            cache.put(
                request,
                response.clone()
            ).catch(() => {});
        }

        return response;

    } catch (error) {
        const cached = await cache.match(request, {
            ignoreSearch: true
        });

        if (cached) {
            return cached;
        }

        return new Response("", {
            status: 504,
            statusText: "Offline resource unavailable"
        });
    }
}
