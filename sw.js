const VERSION="ft-uisu-v11-20261031",APP=VERSION+"-app",MODELS="ft-uisu-v11-models",STATIC=["./","./index.html","./style.css?v=11-meshopt-xr","./script.js?v=11-meshopt-xr","./data/map-data.js?v=11-meshopt-xr"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(APP).then(c=>c.addAll(STATIC)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(k=>k.startsWith("ft-uisu")&&k!==APP&&k!==MODELS).map(k=>caches.delete(k)));await self.clients.claim()})())});
self.addEventListener("fetch",e=>{
const r=e.request,u=new URL(r.url);if(r.method!=="GET"||u.origin!==self.location.origin||r.headers.has("range")||u.pathname.endsWith("/sw.js"))return;
const model=/\.glb$/i.test(u.pathname);
if(model){e.respondWith((async()=>{const c=await caches.open(MODELS);try{const response=await fetch(r,{cache:"no-cache"});if(response.ok)await c.put(r,response.clone()).catch(()=>{});return response}catch(error){const saved=await c.match(r,{ignoreSearch:true});if(saved)return saved;throw error}})());return}
if(r.mode==="navigate"||/\.(?:html|css|js)$/i.test(u.pathname)){e.respondWith((async()=>{const c=await caches.open(APP);try{const response=await fetch(r,{cache:"no-cache"});if(response.ok)await c.put(r,response.clone()).catch(()=>{});return response}catch(error){const saved=await c.match(r,{ignoreSearch:true});if(saved)return saved;if(r.mode==="navigate"){const home=await c.match("./index.html");if(home)return home}throw error}})());return}
e.respondWith((async()=>{const c=await caches.open(APP),saved=await c.match(r);if(saved)return saved;const response=await fetch(r);if(response.ok)await c.put(r,response.clone()).catch(()=>{});return response})());
});
