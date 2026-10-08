/* =========================================================
   FT UISU EXPLORER
   SERVICE WORKER
   REVISI 5 (NO NAVIGATION) — DIREKTORI

   - Cache model 3D
   - Cache file statis
   - Mendukung gambar Tendik .webp
   - Cache lama dibersihkan saat versi diperbarui
========================================================= */

const MODEL_CACHE=
    "ft-uisu-models-no-navigation-r5-directory";

const STATIC_CACHE=
    "ft-uisu-static-no-navigation-r5-directory";

/* =========================================================
   INSTALL
========================================================= */

self.addEventListener("install",()=>{
    self.skipWaiting();
});

/* =========================================================
   ACTIVATE
========================================================= */

self.addEventListener("activate",event=>{
    event.waitUntil(
        (async()=>{
            const cacheNames=await caches.keys();

            await Promise.all(
                cacheNames.map(name=>{
                    if(
                        name.startsWith("ft-uisu-models-")&&
                        name!==MODEL_CACHE
                    ){
                        return caches.delete(name);
                    }

                    if(
                        name.startsWith("ft-uisu-static-")&&
                        name!==STATIC_CACHE
                    ){
                        return caches.delete(name);
                    }

                    return Promise.resolve();
                })
            );

            await self.clients.claim();
        })()
    );
});

/* =========================================================
   FETCH
========================================================= */

self.addEventListener("fetch",event=>{
    const request=event.request;

    if(request.method!=="GET"){
        return;
    }

    const url=new URL(request.url);

    // Range requests tidak ditangani Service Worker.
    if(request.headers.has("range")){
        return;
    }

    const path=url.pathname.toLowerCase();

    /* MODEL GLB */

    if(path.endsWith(".glb")){
        event.respondWith(
            modelStaleWhileRevalidate(request)
        );
        return;
    }

    /* STATIC FILE, TERMASUK FOTO TENDIK */

    if(
        path.endsWith(".css")||
        path.endsWith(".js")||
        path.endsWith(".png")||
        path.endsWith(".jpg")||
        path.endsWith(".jpeg")||
        path.endsWith(".webp")
    ){
        event.respondWith(
            staticNetworkFirst(request)
        );
    }
});

/* =========================================================
   MODEL CACHE — STALE WHILE REVALIDATE
========================================================= */

async function modelStaleWhileRevalidate(request){
    const cache=await caches.open(MODEL_CACHE);

    const cached=await cache.match(request,{
        ignoreSearch:true
    });

    const networkPromise=fetch(request)
        .then(async response=>{
            if(response&&response.ok){
                await cache.put(
                    request,
                    response.clone()
                );
            }
            return response;
        })
        .catch(()=>null);

    if(cached){
        // Gunakan file tersimpan sambil memperbarui cache.
        networkPromise;
        return cached;
    }

    const network=await networkPromise;
    if(network){
        return network;
    }

    return new Response("",{
        status:504,
        statusText:"Model unavailable"
    });
}

/* =========================================================
   STATIC CACHE — NETWORK FIRST
========================================================= */

async function staticNetworkFirst(request){
    const cache=await caches.open(STATIC_CACHE);

    try{
        const response=await fetch(request);

        if(response&&response.ok){
            cache.put(
                request,
                response.clone()
            );
        }

        return response;
    }catch(error){
        const cached=await cache.match(request);

        if(cached){
            return cached;
        }

        throw error;
    }
}
