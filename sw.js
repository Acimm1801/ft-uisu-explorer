const VERSION="ft-uisu-r11-ar-interaction",APP=VERSION+"-app",MODELS="ft-uisu-r11-ar-models",STATIC=["./","./index.html","./style.css?v=12-r9-ui-ar","./script.js?v=11-ar-interaction","./data/map-data.js?v=12-r9-ui-ar"];

self.addEventListener("install",event=>{
event.waitUntil(caches.open(APP).then(cache=>cache.addAll(STATIC)).then(()=>self.skipWaiting()));
});

self.addEventListener("activate",event=>{
event.waitUntil((async()=>{
const keys=await caches.keys();
await Promise.all(keys.filter(name=>name.startsWith("ft-uisu")&&name!==APP&&name!==MODELS).map(name=>caches.delete(name)));
await self.clients.claim();
})());
});

self.addEventListener("fetch",event=>{
const request=event.request,url=new URL(request.url);
if(request.method!=="GET"||url.origin!==self.location.origin||request.headers.has("range"))return;
if(url.pathname.endsWith("/sw.js"))return;

if(/\.glb$/i.test(url.pathname)){
event.respondWith((async()=>{
const cache=await caches.open(MODELS);
try{
const response=await fetch(request,{cache:"no-cache"});
if(response.ok)await cache.put(request,response.clone()).catch(()=>{});
return response;
}catch(error){
const saved=await cache.match(request,{ignoreSearch:true});
if(saved)return saved;
throw error;
}
})());
return;
}

if(request.mode==="navigate"||/\.(?:html|css|js)$/i.test(url.pathname)){
event.respondWith((async()=>{
const cache=await caches.open(APP);
try{
const response=await fetch(request,{cache:"no-cache"});
if(response.ok)await cache.put(request,response.clone()).catch(()=>{});
return response;
}catch(error){
const saved=await cache.match(request,{ignoreSearch:true});
if(saved)return saved;
if(request.mode==="navigate"){
const home=await cache.match("./index.html");
if(home)return home;
}
throw error;
}
})());
return;
}

event.respondWith((async()=>{
const cache=await caches.open(APP),saved=await cache.match(request);
if(saved)return saved;
const response=await fetch(request);
if(response.ok)await cache.put(request,response.clone()).catch(()=>{});
return response;
})());
});
