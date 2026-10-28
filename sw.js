/* FT UISU Explorer — Revisi 10 (No Navigate) */
const MODEL_CACHE="ft-uisu-models-no-navigation-r10-webar",STATIC_CACHE="ft-uisu-static-no-navigation-r10-webar";

self.addEventListener("install",()=>self.skipWaiting());

self.addEventListener("activate",event=>{
event.waitUntil((async()=>{
const keys=await caches.keys();
await Promise.all(keys.filter(name=>(name.startsWith("ft-uisu-models-")&&name!==MODEL_CACHE)||(name.startsWith("ft-uisu-static-")&&name!==STATIC_CACHE)).map(name=>caches.delete(name)));
await self.clients.claim();
})());
});

self.addEventListener("fetch",event=>{
const request=event.request;
if(request.method!=="GET"||request.headers.has("range"))return;
const url=new URL(request.url);
if(url.origin!==self.location.origin)return;
const path=url.pathname.toLowerCase();
if(/\.(glb|gltf)$/.test(path))event.respondWith(networkFirst(request,MODEL_CACHE));
else if(/\.(css|js|png|jpg|jpeg|webp|svg)$/.test(path))event.respondWith(networkFirst(request,STATIC_CACHE));
});

async function networkFirst(request,cacheName){
const cache=await caches.open(cacheName);
try{
const response=await fetch(request,{cache:"no-cache"});
if(response?.ok)cache.put(request,response.clone()).catch(()=>{});
return response;
}catch(error){
const cached=await cache.match(request,{ignoreSearch:true});
return cached||new Response("",{status:504,statusText:"Offline resource unavailable"});
}
}
