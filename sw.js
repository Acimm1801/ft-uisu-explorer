
/* =========================================================
   FT UISU EXPLORER — SERVICE WORKER
   REVISI 9 (NO NAVIGATE)

   Fungsi:
   - Cache model 3D
   - Cache CSS dan JavaScript
   - Cache foto Tendik
   - Bersihkan cache versi lama
   - Gunakan jaringan terlebih dahulu
========================================================= */

const MODEL_CACHE =
    "ft-uisu-models-no-navigation-r9-webar";

const STATIC_CACHE =
    "ft-uisu-static-no-navigation-r9-webar";

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
                keys
                    .filter(name => (
                        (
                            name.startsWith("ft-uisu-models-") &&
                            name !== MODEL_CACHE
                        ) ||
                        (
                            name.startsWith("ft-uisu-static-") &&
                            name !== STATIC_CACHE
                        )
                    ))
                    .map(name => caches.delete(name))
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

    // Hanya proses permintaan GET biasa.
    if (
        request.method !== "GET" ||
        request.headers.has("range")
    ) {
        return;
    }

    const url = new URL(request.url);

    // Jangan intersep CDN XR Engine / Three.js.
    if (url.origin !== self.location.origin) {
        return;
    }

    const pathname = url.pathname.toLowerCase();

    /* MODEL GLB DAN GLTF */
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

        if (response && response.ok) {
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
