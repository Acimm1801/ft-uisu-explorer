/* =========================================================
   FT UISU EXPLORER
   SERVICE WORKER
   REVISION 37 - BUILD 37.1
========================================================= */

const MODEL_CACHE =
    "ft-uisu-models-v37.1";


const STATIC_CACHE =
    "ft-uisu-static-v37.1";



/* =========================================================
   INSTALL
========================================================= */

self.addEventListener(
    "install",
    () => {

        self.skipWaiting();

    }
);



/* =========================================================
   ACTIVATE
========================================================= */

self.addEventListener(
    "activate",
    event => {

        event.waitUntil(

            (async() => {

                const cacheNames =
                    await caches.keys();


                await Promise.all(

                    cacheNames.map(
                        name => {

                            if(
                                name.startsWith(
                                    "ft-uisu-models-"
                                )
                                &&
                                name !== MODEL_CACHE
                            ){

                                return caches.delete(
                                    name
                                );

                            }


                            if(
                                name.startsWith(
                                    "ft-uisu-static-"
                                )
                                &&
                                name !== STATIC_CACHE
                            ){

                                return caches.delete(
                                    name
                                );

                            }


                            return Promise.resolve();

                        }
                    )

                );


                await self.clients.claim();

            })()

        );

    }
);



/* =========================================================
   FETCH
========================================================= */

self.addEventListener(
    "fetch",
    event => {

        const request =
            event.request;


        if(
            request.method !==
            "GET"
        ){

            return;

        }


        const url =
            new URL(
                request.url
            );


        /*
           Jangan intersep range requests.
        */

        if(
            request.headers.has(
                "range"
            )
        ){

            return;

        }



        /* =====================================================
           GLB MODEL
        ====================================================== */

        if(
            url.pathname
                .toLowerCase()
                .endsWith(
                    ".glb"
                )
        ){

            event.respondWith(

                modelStaleWhileRevalidate(
                    request
                )

            );


            return;

        }



        /* =====================================================
           STATIC FILE
        ====================================================== */

        if(
            url.pathname.endsWith(
                ".css"
            )
            ||
            url.pathname.endsWith(
                ".js"
            )
            ||
            url.pathname.endsWith(
                ".png"
            )
            ||
            url.pathname.endsWith(
                ".jpg"
            )
            ||
            url.pathname.endsWith(
                ".jpeg"
            )
            ||
            url.pathname.endsWith(
                ".webp"
            )
        ){

            event.respondWith(

                staticNetworkFirst(
                    request
                )

            );

        }

    }
);



/* =========================================================
   MODEL CACHE
========================================================= */

async function modelStaleWhileRevalidate(
    request
){

    const cache =
        await caches.open(
            MODEL_CACHE
        );


    const cached =
        await cache.match(
            request,
            {
                ignoreSearch:true
            }
        );


    const networkPromise =
        fetch(
            request
        )
            .then(
                async response => {

                    if(
                        response
                        &&
                        response.ok
                    ){

                        await cache.put(
                            request,
                            response.clone()
                        );

                    }


                    return response;

                }
            )
            .catch(
                () => null
            );


    if(cached){

        /*
           Update cache di background.
        */

        networkPromise;


        return cached;

    }


    const network =
        await networkPromise;


    if(network){

        return network;

    }


    return new Response(
        "",
        {
            status:504,
            statusText:"Model unavailable"
        }
    );

}



/* =========================================================
   STATIC CACHE
========================================================= */

async function staticNetworkFirst(
    request
){

    const cache =
        await caches.open(
            STATIC_CACHE
        );


    try{

        const response =
            await fetch(
                request
            );


        if(
            response
            &&
            response.ok
        ){

            cache.put(
                request,
                response.clone()
            );

        }


        return response;

    }

    catch(error){

        const cached =
            await cache.match(
                request
            );


        if(cached){

            return cached;

        }


        throw error;

    }

}

