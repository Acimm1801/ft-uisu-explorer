
/* =========================================================
   FT UISU EXPLORER — SERVICE WORKER
   REVISI 7 (NO NAVIGATION)

   - Model GLB mencoba jaringan lebih dahulu
   - Direktori dan foto Tendik tetap didukung
   - Cache lama dibersihkan saat pembaruan
========================================================= */

const MODEL_CACHE="ft-uisu-models-no-navigation-r7-webar";
const STATIC_CACHE="ft-uisu-static-no-navigation-r7-webar";

/* INSTALL */
self.addEventListener("install",()=>{
    self.skipWaiting();
});

/* ACTIVATE */
self.addEventListener("activate",event=>{
    event.waitUntil(
        (async()=>{
            const keys=await caches.keys();
            await Promise.all(
                keys.filter(name=>(
                    (
                        name.startsWith("ft-uisu-models-")&&
                        name!==MODEL_CACHE
                    )||
                    (
                        name.startsWith("ft-uisu-static-")&&
                        name!==STATIC_CACHE
                    )
                )).map(name=>caches.delete(name))
            );
            await self.clients.claim();
        })()
    );
});

/* FETCH */
self.addEventListener("fetch",event=>{
    const request=event.request;

    if(
        request.method!=="GET"||
        request.headers.has("range")
    ){
        return;
    }

    const url=new URL(request.url);

    // CDN XR8 dan Three.js tidak dicegat.
    if(url.origin!==self.location.origin){
        return;
    }

    const path=url.pathname.toLowerCase();

    if(/\.(glb|gltf)$/.test(path)){
        event.respondWith(
            networkFirst(request,MODEL_CACHE)
        );
    }else if(
        /\.(css|js|png|jpg|jpeg|webp|svg)$/.test(path)
    ){
        event.respondWith(
            networkFirst(request,STATIC_CACHE)
        );
    }
});

/* NETWORK FIRST */
async function networkFirst(request,cacheName){
    const cache=await caches.open(cacheName);

    try{
        const response=await fetch(request,{
            cache:"no-cache"
        });

        if(response?.ok){
            cache.put(
                request,
                response.clone()
            ).catch(()=>{});
        }

        return response;

    }catch(error){
        const cached=await cache.match(request,{
            ignoreSearch:true
        });

        if(cached)return cached;

        return new Response("",{
            status:504,
            statusText:"Offline resource unavailable"
        });
    }
}
