(function(){
"use strict";
const DATA=window.FT_DATA||{},buildings=Array.isArray(DATA.buildings)?DATA.buildings:[],rooms=Array.isArray(DATA.rooms)?DATA.rooms:[],people=Array.isArray(DATA.people)?DATA.people:[];
function byId(id){return document.getElementById(id)}
function all(selector){return Array.from(document.querySelectorAll(selector))}
function on(id,eventName,handler,options){const element=byId(id);if(element)element.addEventListener(eventName,handler,options)}
function show(id){byId(id)?.classList.remove("hidden")}
function hide(id){byId(id)?.classList.add("hidden")}
function setText(id,value){const element=byId(id);if(element)element.textContent=value??""}
const state={currentPage:"home",pageHistory:[],currentSlide:0,landingModelIndex:0,globalSelection:null,infoLocation:null,viewerBuildingId:null,viewerModelId:null,arBuildingId:null,arModelId:null};
function getBuildingById(id){return typeof DATA.getBuildingById==="function"?DATA.getBuildingById(id):buildings.find(building=>building.id===id)||null}
function getBuildingModels(buildingId){if(typeof DATA.getBuildingModels==="function")return DATA.getBuildingModels(buildingId);const building=getBuildingById(buildingId);return building?building.models||[]:[]}
function getModelVariant(buildingId,modelId){return typeof DATA.getModelVariant==="function"?DATA.getModelVariant(buildingId,modelId):getBuildingModels(buildingId).find(model=>model.id===modelId)||null}
function getDefaultModelVariant(buildingId){if(typeof DATA.getDefaultModelVariant==="function")return DATA.getDefaultModelVariant(buildingId);const building=getBuildingById(buildingId);return building?getModelVariant(building.id,building.defaultModel)||building.models?.[0]||null:null}
const MODEL_CACHE_NAME="ft-uisu-r12-models",PRIORITY_MODELS=["./assets/models/gedung_biro_outdoor.glb","./assets/models/gedung_perkuliahan_outdoor.glb","./assets/models/laboratorium_outdoor.glb","./assets/models/gedung_biro_indoor.glb","./assets/models/gedung_perkuliahan_indoor.glb"];
async function registerServiceWorker(){if(!("serviceWorker"in navigator))return;try{await navigator.serviceWorker.register("./sw.js?v=12-clean",{scope:"./"});await navigator.serviceWorker.ready}catch(error){console.warn("Service Worker:",error)}}
async function cacheModel(url){if(!url||!("caches"in window))return false;try{const cache=await caches.open(MODEL_CACHE_NAME);if(await cache.match(url,{ignoreSearch:true}))return true;const response=await fetch(url,{cache:"force-cache"});if(!response.ok)return false;await cache.put(url,response.clone());return true}catch(error){return false}}
async function preloadPriorityModels(){const queue=PRIORITY_MODELS.slice();async function worker(){while(queue.length)await cacheModel(queue.shift())}await Promise.all([worker(),worker()])}
function preloadBuildingModels(building){if(building&&Array.isArray(building.models))building.models.forEach(model=>cacheModel(model.src))}
const locations=[];
buildings.forEach(building=>locations.push({id:building.id,type:"building",name:building.name,buildingId:building.id,floor:building.actualFloor,parent:"Fakultas Teknik UISU",description:building.description,tendik:Array.isArray(building.tendik)?building.tendik:[]}));
rooms.forEach(room=>{const building=getBuildingById(room.buildingId);locations.push({id:room.id,type:"room",name:room.name,buildingId:room.buildingId,floor:room.floor,parent:building?building.name:"Fakultas Teknik UISU",units:Array.isArray(room.units)?room.units:[],tendik:Array.isArray(room.tendik)?room.tendik:[],description:room.description||room.name+" berada di "+(building?building.name:"Fakultas Teknik UISU")+(room.floor?", lantai "+room.floor:"")+"."})});
people.forEach(person=>locations.push({...person,type:"person"}));
function updateHeaderActive(pageName){all(".header-link").forEach(button=>button.classList.remove("active"));document.querySelector(`.header-link[data-page="${pageName}"]`)?.classList.add("active")}
function showPage(pageName,pushHistory=true){const page=byId(pageName+"Page");if(!page)return;if(pushHistory&&state.currentPage&&state.currentPage!==pageName)state.pageHistory.push(state.currentPage);all(".page").forEach(item=>item.classList.remove("active"));page.classList.add("active");state.currentPage=pageName;updateHeaderActive(pageName);closeDrawer();window.scrollTo({top:0,behavior:"auto"})}
function goBack(){showPage(state.pageHistory.length?state.pageHistory.pop():"home",false)}
all("[data-back]").forEach(button=>button.addEventListener("click",goBack));
on("logoHome","click",()=>{state.pageHistory=[];showPage("home",false)});
all("[data-page]").forEach(button=>button.addEventListener("click",()=>showPage(button.dataset.page)));
function openDrawer(){byId("drawer")?.classList.add("open");byId("drawerOverlay")?.classList.add("show");document.body.style.overflow="hidden"}
function closeDrawer(){byId("drawer")?.classList.remove("open");byId("drawerOverlay")?.classList.remove("show");document.body.style.overflow=""}
on("hamburgerButton","click",openDrawer);on("closeDrawer","click",closeDrawer);on("drawerOverlay","click",closeDrawer);
const slides=all(".hero-slide");
function showSlide(index){if(!slides.length)return;if(index<0)index=slides.length-1;if(index>=slides.length)index=0;state.currentSlide=index;slides.forEach((slide,i)=>slide.classList.toggle("active",i===index));all(".slider-dot").forEach((dot,i)=>dot.classList.toggle("active",i===index))}
on("prevSlide","click",()=>showSlide(state.currentSlide-1));on("nextSlide","click",()=>showSlide(state.currentSlide+1));all(".slider-dot").forEach(dot=>dot.addEventListener("click",()=>showSlide(Number(dot.dataset.slide))));
const landingModels=[{name:"Biro Fakultas Teknik UISU",viewer:byId("landingModel0")},{name:"Gedung Perkuliahan Fakultas Teknik UISU",viewer:byId("landingModel1")},{name:"Laboratorium Fakultas Teknik UISU",viewer:byId("landingModel2")}];
function showLandingModel(index){if(!landingModels.length)return;if(index<0)index=landingModels.length-1;if(index>=landingModels.length)index=0;state.landingModelIndex=index;landingModels.forEach((item,i)=>item.viewer?.classList.toggle("active",i===index));setText("landingModelName",landingModels[index].name);setText("landingModelCounter",`${index+1} / ${landingModels.length}`)}
on("landingNextModel","click",()=>showLandingModel(state.landingModelIndex+1));
const UNIT_CLASS={"Teknik Informatika":"room-unit-informatika","Teknik Mesin":"room-unit-mesin","Teknik Sipil":"room-unit-sipil","Teknik Industri":"room-unit-industri","Teknik Elektro":"room-unit-elektro","Fakultas Teknik":"room-unit-fakultas"};
function escapeHtml(value){return String(value??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}
function renderUnitMarkup(units){if(!Array.isArray(units)||!units.length)return"";const content=units.map((unit,index)=>{const className=UNIT_CLASS[unit]||"room-unit-fakultas",comma=index<units.length-1?'<span class="room-unit-punctuation">, </span>':"";return`<span class="room-unit ${className}">${escapeHtml(unit)}</span>${comma}`}).join("");return`<span class="room-unit-group"><span class="room-unit-punctuation">(</span>${content}<span class="room-unit-punctuation">)</span></span>`}
function normalize(value){return String(value||"").toLowerCase().trim()}
function searchLocations(value){const query=normalize(value);return query?locations.filter(location=>normalize(location.name+" "+(location.units||[]).join(" ")+" "+(location.parent||"")).includes(query)).slice(0,40):[]}
function renderSearchResults(results,container,onSelect){if(!container)return;container.innerHTML="";if(!results.length){container.innerHTML='<div class="search-empty">Lokasi tidak ditemukan.</div>';return}results.forEach(location=>{const button=document.createElement("button");button.type="button";button.className="search-result";const typeText=location.type==="building"?"Gedung":location.type==="person"?"Civitas":"Ruangan";button.innerHTML=`
<span>
<strong class="search-result-title"><span>${escapeHtml(location.name)}</span>${renderUnitMarkup(location.units)}</strong>
<small>${location.parent||"Fakultas Teknik UISU"}${location.floor?" • Lantai "+location.floor:""}</small>
</span>
<span class="search-type">${typeText}</span>`;button.addEventListener("click",()=>onSelect(location));container.appendChild(button)})}
const globalSearch=byId("globalSearch");
if(globalSearch)globalSearch.addEventListener("input",event=>{const value=event.target.value;if(!value.trim()){hide("globalSearchResults");return}renderSearchResults(searchLocations(value),byId("globalSearchResults"),location=>{state.globalSelection=location;globalSearch.value=location.name;setText("globalSelectedName",location.name);hide("globalSearchResults");show("globalSelected")});show("globalSearchResults")});
on("clearGlobalSearch","click",()=>{if(globalSearch)globalSearch.value="";state.globalSelection=null;hide("globalSelected");hide("globalSearchResults")});
function openInfo(location){if(!location)return;state.infoLocation=location;setText("infoTitle",location.name);const infoUnits=byId("infoUnits");if(infoUnits){infoUnits.innerHTML=renderUnitMarkup(location.units);infoUnits.classList.toggle("hidden",!Array.isArray(location.units)||!location.units.length)}setText("infoDescription",location.description||"Informasi belum tersedia.");show("infoModal")}
function closeInfo(){hide("infoModal")}
on("closeInfoModal","click",closeInfo);on("infoBackdrop","click",closeInfo);on("globalInfoButton","click",()=>openInfo(state.globalSelection));
function normalizeWhatsappNumber(phone){let digits=String(phone||"").replace(/\D/g,"");if(!digits)return"";if(digits.startsWith("0"))digits="62"+digits.slice(1);return digits}
function whatsappUrl(phone){const number=normalizeWhatsappNumber(phone);return number?`https://wa.me/${number}`:""}
function openTendik(location){
const isBiroRoom=location?.buildingId==="biro-ft",isLibrary=location?.id==="perpustakaan-ft",isSerbaguna=location?.id==="serbaguna-ft",contacts=Array.isArray(location?.tendik)?location.tendik:[];
if(!isBiroRoom&&!isLibrary&&!isSerbaguna||!contacts.length)return;setText("tendikRoomTitle",location.name);hide("tendikRoomParent");const list=byId("tendikList");if(!list)return;list.replaceChildren();
contacts.forEach(contact=>{
const card=document.createElement("article");card.className="tendik-card";const jabatan=contact.jabatan?.trim()||"-",name=contact.name?.trim()||"-",phone=contact.phone?.trim()||"-",photo=contact.photo?.trim()||"",whatsapp=phone!=="-"?whatsappUrl(phone):"";
const photoMarkup=photo?`<div class="tendik-photo-wrap">
<img class="tendik-photo" src="${escapeHtml(photo)}" alt="Foto ${escapeHtml(name)}" loading="lazy" decoding="async" onerror="this.parentNode.classList.add('tendik-photo-empty');this.remove()">
</div>`:'<div class="tendik-photo-wrap tendik-photo-empty" aria-label="Foto tidak tersedia">-</div>';
card.innerHTML=`
<p class="tendik-jabatan">${escapeHtml(jabatan)}</p>
${photoMarkup}
<h3 class="tendik-name">${escapeHtml(name)}</h3>
${whatsapp?`<a class="tendik-whatsapp" href="${whatsapp}" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp ${escapeHtml(name)}"><span class="tendik-whatsapp-label">KONTAK (WhatsApp)</span><strong>${escapeHtml(phone)}</strong></a>`:'<div class="tendik-whatsapp tendik-contact-empty" aria-label="Kontak kosong"><span class="tendik-whatsapp-label">KONTAK</span><strong>-</strong></div>'}`;
list.appendChild(card);
});show("tendikModal");
}
function closeTendik(){hide("tendikModal")}
on("closeTendikModal","click",closeTendik);on("tendikBackdrop","click",closeTendik);
function populateBuildingSelect(select){if(!select)return;select.innerHTML='<option value="">-- Pilih Gedung --</option>';buildings.slice().sort((a,b)=>(a.modelMenuOrder??99)-(b.modelMenuOrder??99)).forEach(building=>{const option=document.createElement("option");option.value=building.id;option.textContent=building.modelMenuName||building.name;select.appendChild(option)})}
const viewerBuildingSelect=byId("viewerBuildingSelect"),arBuildingSelect=byId("arBuildingSelect");populateBuildingSelect(viewerBuildingSelect);populateBuildingSelect(arBuildingSelect);
const indoorFloorMemory={};
function renderModelSwitch({building,activeModelId,containerId,singleBadgeId,onChange}){
const container=byId(containerId),badge=byId(singleBadgeId);if(!container||!badge||!building)return;const models=building.models||[];
let floorControls=byId(containerId+"Floors");if(!floorControls){floorControls=document.createElement("div");floorControls.id=containerId+"Floors";floorControls.className="laboratory-floor-controls hidden";floorControls.setAttribute("aria-label","Pilih lantai Laboratorium");container.closest(".viewer-toolbar").after(floorControls)}
container.replaceChildren();floorControls.replaceChildren();floorControls.classList.add("hidden");
function button(parent,label,active,modelId){const element=document.createElement("button");element.type="button";element.className="model-switch-button";element.textContent=label;element.classList.toggle("active",active);element.setAttribute("aria-pressed",String(active));element.addEventListener("click",()=>onChange(modelId));parent.appendChild(element)}
if(building.id==="laboratorium-ft"){const active=models.find(model=>model.id===activeModelId),indoor=active?.mode==="indoor";if(indoor)indoorFloorMemory[containerId]=active.id;const remembered=models.find(model=>model.id===indoorFloorMemory[containerId]),firstIndoor=remembered||models.find(model=>model.mode==="indoor");hide(singleBadgeId);show(containerId);button(container,"Outdoor",!indoor,"outdoor");if(firstIndoor)button(container,"Indoor",indoor,firstIndoor.id);if(indoor){floorControls.classList.remove("hidden");models.filter(model=>model.mode==="indoor").forEach(model=>button(floorControls,"Lantai "+model.floor,model.id===activeModelId,model.id))}return}
if(models.length<=1){hide(containerId);if(models[0]){badge.textContent=models[0].name;show(singleBadgeId)}else hide(singleBadgeId);return}
hide(singleBadgeId);show(containerId);models.forEach(model=>button(container,model.name,model.id===activeModelId,model.id));
}
function makeLaboratoryViewers(baseId,prefix){const base=byId(baseId),viewers=new Map();if(!base)return viewers;base.dataset.viewerGroup=prefix;for(let floor=1;floor<=3;floor++){const viewer=document.createElement("model-viewer");for(const a of base.attributes)if(!["id","src"].includes(a.name))viewer.setAttribute(a.name,a.value);viewer.id=prefix+floor;viewer.classList.add("hidden");viewer.dataset.viewerGroup=prefix;viewer.dataset.laboratoryFloor=String(floor);viewer.removeAttribute("src");viewer.setAttribute("alt","Laboratorium Fakultas Teknik UISU — Indoor Lantai "+floor);if(prefix==="labARFloor")viewer.classList.add("laboratory-ar-viewer");base.after(viewer);viewers.set(floor,viewer)}return viewers}
const laboratory3DViewers=makeLaboratoryViewers("main3DViewer","lab3DFloor"),laboratoryARViewers=makeLaboratoryViewers("mainARViewer","labARFloor");
function selectModelViewer(baseId,viewers,building,model){const base=byId(baseId),active=building.id==="laboratorium-ft"&&model.mode==="indoor"?viewers.get(model.floor):base;[base,...viewers.values()].forEach(viewer=>{if(!viewer)return;viewer.classList.toggle("hidden",viewer!==active);viewer.setAttribute("aria-hidden",String(viewer!==active))});return active}
let main3DViewer=byId("main3DViewer"),current3DModel={buildingId:null,modelId:null,src:null};
function updateViewerText(building,model){const title=model.viewerTitle||building.name;setText("viewerTitle",title);setText("viewerCurrentModelName",title+" - "+model.name);setText("viewerPreloadDescription",model.viewerDescription)}
function setViewerLoading(building,model){updateViewerText(building,model);setText("viewerLoadStatus","MEMUAT MODEL 3D...");byId("viewerLoadingDot").className="loading-dot loading";show("viewerLoadingOverlay");hide("viewerUnavailable")}
function setViewerReady(building,model){updateViewerText(building,model);setText("viewerLoadStatus","MODEL 3D SIAP");byId("viewerLoadingDot").className="loading-dot ready";hide("viewerLoadingOverlay");hide("viewerUnavailable")}
function setViewerUnavailable(building,model){updateViewerText(building,model);setText("viewerLoadStatus","MODEL BELUM TERSEDIA");byId("viewerLoadingDot").className="loading-dot error";hide("viewerLoadingOverlay");show("viewerUnavailable")}
function applyModelDefaultCamera(model,jump=true){if(!main3DViewer||!model)return;main3DViewer.cameraOrbit=model.defaultCameraOrbit||"0deg 75deg auto";main3DViewer.cameraTarget=model.defaultCameraTarget||"auto auto auto";main3DViewer.fieldOfView=model.defaultFieldOfView||"35deg";if(jump&&typeof main3DViewer.jumpCameraToGoal==="function")main3DViewer.jumpCameraToGoal()}
on("resetCamera","click",()=>{const model=getModelVariant(current3DModel.buildingId,current3DModel.modelId);if(model)applyModelDefaultCamera(model,true)});
function load3DModel(building,model){if(!building||!model)return;main3DViewer=selectModelViewer("main3DViewer",laboratory3DViewers,building,model);if(!main3DViewer)return;state.viewerBuildingId=building.id;state.viewerModelId=model.id;current3DModel={buildingId:building.id,modelId:model.id,src:model.src};applyModelDefaultCamera(model,true);renderModelSwitch({building,activeModelId:model.id,containerId:"viewerModelSwitch",singleBadgeId:"viewerSingleModeBadge",onChange:modelId=>{const next=getModelVariant(building.id,modelId);if(next)load3DModel(building,next)}});setViewerLoading(building,model);if(main3DViewer.getAttribute("src")!==model.src)main3DViewer.setAttribute("src",model.src);else if(main3DViewer.loaded)setViewerReady(building,model);else if(main3DViewer.dataset.loadFailed==="true"){main3DViewer.removeAttribute("src");main3DViewer.setAttribute("src",model.src)}}
[byId("main3DViewer"),...laboratory3DViewers.values()].forEach(viewer=>{
viewer?.addEventListener("load",()=>{viewer.dataset.loadFailed="false";if(viewer!==main3DViewer)return;const building=getBuildingById(current3DModel.buildingId),model=getModelVariant(current3DModel.buildingId,current3DModel.modelId);if(!building||!model||viewer.getAttribute("src")!==model.src)return;setViewerReady(building,model);applyModelDefaultCamera(model,true)});
viewer?.addEventListener("error",()=>{viewer.dataset.loadFailed="true";if(viewer!==main3DViewer)return;const building=getBuildingById(current3DModel.buildingId),model=getModelVariant(current3DModel.buildingId,current3DModel.modelId);if(building&&model&&viewer.getAttribute("src")===model.src)setViewerUnavailable(building,model)});
});
function prepareViewerBuilding(buildingId,preferredModelId=null,scroll=true){const building=getBuildingById(buildingId);if(!building){toast("Gedung tidak ditemukan.");return}const models=building.models||[];if(!models.length){toast("Model belum tersedia.");return}show("viewerCard");const model=getModelVariant(building.id,preferredModelId)||getDefaultModelVariant(building.id)||models[0];load3DModel(building,model);if(scroll)setTimeout(()=>byId("viewerCard")?.scrollIntoView({behavior:"smooth",block:"start"}),50)}
on("show3DModel","click",()=>{const id=viewerBuildingSelect?.value;if(!id){setText("viewerMessage","Pilih gedung terlebih dahulu.");return}setText("viewerMessage","");prepareViewerBuilding(id)});
let mainARViewer=byId("mainARViewer");
function setARLoading(building,model){const title=model.viewerTitle||building.name;setText("arViewerTitle",title);setText("arCurrentModelName",title+" - "+model.name);setText("arPreloadDescription",model.viewerDescription);setText("arLoadStatus","MEMUAT MODEL AR...");byId("arLoadingDot").className="loading-dot loading";show("arLoadingOverlay");hide("arUnavailable");const launch=byId("launchARCamera");if(launch)launch.disabled=true}
function setARReady(building,model){window.FT_WEBAR?.preload().catch(()=>{});const title=model.viewerTitle||building.name;setText("arViewerTitle",title);setText("arCurrentModelName",title+" - "+model.name);setText("arPreloadDescription",model.viewerDescription);setText("arLoadStatus","MODEL AR SIAP");byId("arLoadingDot").className="loading-dot ready";hide("arLoadingOverlay");hide("arUnavailable");const launch=byId("launchARCamera");if(launch)launch.disabled=false}
function setARUnavailable(building,model){const title=model.viewerTitle||building.name;setText("arViewerTitle",title);setText("arCurrentModelName",title+" - "+model.name);setText("arLoadStatus","MODEL BELUM TERSEDIA");byId("arLoadingDot").className="loading-dot error";hide("arLoadingOverlay");show("arUnavailable");const launch=byId("launchARCamera");if(launch)launch.disabled=true}
function loadARModel(buildingId,modelId){const building=getBuildingById(buildingId);if(!building)return;const model=getModelVariant(buildingId,modelId)||getDefaultModelVariant(buildingId);if(!model)return;mainARViewer=selectModelViewer("mainARViewer",laboratoryARViewers,building,model);state.arBuildingId=building.id;state.arModelId=model.id;show("arViewerCard");renderModelSwitch({building,activeModelId:model.id,containerId:"arModelSwitch",singleBadgeId:"arSingleModeBadge",onChange:id=>loadARModel(building.id,id)});setARLoading(building,model);if(mainARViewer){if(mainARViewer.getAttribute("src")!==model.src)mainARViewer.setAttribute("src",model.src);else if(mainARViewer.loaded)setARReady(building,model);else if(mainARViewer.dataset.loadFailed==="true"){mainARViewer.removeAttribute("src");mainARViewer.setAttribute("src",model.src)}}}
[byId("mainARViewer"),...laboratoryARViewers.values()].forEach(viewer=>{
viewer?.addEventListener("load",()=>{viewer.dataset.loadFailed="false";if(viewer!==mainARViewer)return;const building=getBuildingById(state.arBuildingId),model=getModelVariant(state.arBuildingId,state.arModelId);if(building&&model&&viewer.getAttribute("src")===model.src)setARReady(building,model)});
viewer?.addEventListener("error",()=>{viewer.dataset.loadFailed="true";if(viewer!==mainARViewer)return;const building=getBuildingById(state.arBuildingId),model=getModelVariant(state.arBuildingId,state.arModelId);if(building&&model&&viewer.getAttribute("src")===model.src)setARUnavailable(building,model)});
});
on("prepareMainAR","click",()=>{const buildingId=arBuildingSelect?.value;if(!buildingId){setText("arMessage","Pilih gedung terlebih dahulu.");return}setText("arMessage","");const model=getModelVariant(buildingId,"outdoor")||getDefaultModelVariant(buildingId);if(!model)return;loadARModel(buildingId,model.id);setTimeout(()=>byId("arViewerCard")?.scrollIntoView({behavior:"smooth",block:"start"}),60)});
on("launchARCamera","click",()=>{const building=getBuildingById(state.arBuildingId),model=getModelVariant(state.arBuildingId,state.arModelId);if(!building||!model||byId("launchARCamera")?.disabled)return;window.FT_WEBAR?.start(model.src,`${building.name} • ${model.name}`)});
function locationForBuilding(building){return locations.find(location=>location.type==="building"&&location.id===building.id)||null}
function locationForRoom(room){return locations.find(location=>location.type==="room"&&location.id===room.id)||null}
function closeDirectoryRoomItem(item){if(!item)return;item.classList.remove("open");item.querySelector(".room-toggle-button")?.setAttribute("aria-expanded","false");item.querySelector(".room-actions")?.classList.add("hidden")}
function closeDirectoryBuildingCard(article){if(!article)return;article.classList.remove("open");article.querySelector(".building-button")?.setAttribute("aria-expanded","false");article.querySelectorAll(".room-item.open").forEach(closeDirectoryRoomItem)}
function closeOtherDirectoryRooms(currentItem){document.querySelectorAll(".directory .room-item.open").forEach(item=>{if(item!==currentItem)closeDirectoryRoomItem(item)})}
function closeOtherDirectoryBuildings(currentArticle){document.querySelectorAll(".directory .building-card.open").forEach(article=>{if(article!==currentArticle)closeDirectoryBuildingCard(article)})}
function renderRoomList(roomList,container){
if(!container)return;container.innerHTML="";if(!roomList.length)return;const grid=document.createElement("div");grid.className="room-grid";
roomList.forEach(room=>{
const location=locationForRoom(room),item=document.createElement("div"),actionsId=`directory-room-actions-${room.id}`;item.className="room-item";item.innerHTML=`
<button type="button" class="room-row room-toggle-button" aria-expanded="false" aria-controls="${actionsId}">
<span class="room-name-wrap"><span class="room-name"></span><span class="room-unit-slot"></span></span><span class="room-chevron" aria-hidden="true">›</span>
</button>
<div id="${actionsId}" class="room-actions hidden">
<button type="button" class="room-info">Informasi</button>
${room.buildingId==="biro-ft"&&Array.isArray(room.tendik)&&room.tendik.length?'<button type="button" class="room-tendik">Civitas Akademik</button>':""}
</div>`;
item.querySelector(".room-name").textContent=room.name;const unitSlot=item.querySelector(".room-unit-slot");if(unitSlot)unitSlot.innerHTML=renderUnitMarkup(room.units);const toggle=item.querySelector(".room-toggle-button"),actions=item.querySelector(".room-actions");
toggle.addEventListener("click",()=>{const expanded=toggle.getAttribute("aria-expanded")!=="true";closeOtherDirectoryRooms(item);toggle.setAttribute("aria-expanded",String(expanded));actions.classList.toggle("hidden",!expanded);item.classList.toggle("open",expanded)});
item.querySelector(".room-info").addEventListener("click",()=>openInfo(location));item.querySelector(".room-tendik")?.addEventListener("click",()=>openTendik(room));grid.appendChild(item);
});container.appendChild(grid);
}
function renderLaboratory(roomList,container){const floorButtons=document.createElement("div");floorButtons.className="floor-buttons";const roomContainer=document.createElement("div");[1,2,3].forEach(floor=>{const button=document.createElement("button");button.type="button";button.className="floor-button";button.textContent=`Lantai ${floor}`;button.addEventListener("click",()=>{Array.from(floorButtons.children).forEach(item=>item.classList.remove("active"));button.classList.add("active");renderRoomList(roomList.filter(room=>room.floor===floor),roomContainer)});floorButtons.appendChild(button)});container.appendChild(floorButtons);container.appendChild(roomContainer);floorButtons.firstElementChild?.click()}
function renderDirectory(){
const container=byId("directoryContainer");if(!container)return;container.innerHTML="";
buildings.forEach((building,index)=>{
const buildingRooms=rooms.filter(room=>room.buildingId===building.id),location=locationForBuilding(building),article=document.createElement("article");article.className="building-card";article.innerHTML=`
<button class="building-button" type="button" aria-expanded="false" aria-controls="directory-building-content-${building.id}">
<span class="building-number">${String(index+1).padStart(2,"0")}</span>
<span><strong>${building.name}</strong></span>
<span>›</span>
</button>
<div id="directory-building-content-${building.id}" class="building-content"></div>`;
const header=article.querySelector(".building-button"),content=article.querySelector(".building-content");
header?.addEventListener("click",()=>{const expanded=!article.classList.contains("open");closeOtherDirectoryBuildings(article);if(!expanded)article.querySelectorAll(".room-item.open").forEach(closeDirectoryRoomItem);article.classList.toggle("open",expanded);header.setAttribute("aria-expanded",String(expanded))});
const actions=document.createElement("div");actions.className="building-actions";actions.innerHTML=`
<button class="button button-primary building-info" type="button">Informasi</button>
${(building.id==="perpustakaan-ft"||building.id==="serbaguna-ft")&&Array.isArray(building.tendik)&&building.tendik.length?'<button class="button button-primary building-tendik" type="button">Civitas Akademik</button>':""}`;
content.appendChild(actions);actions.querySelector(".building-info")?.addEventListener("click",()=>openInfo(location));actions.querySelector(".building-tendik")?.addEventListener("click",()=>openTendik(location));
if(buildingRooms.length){const roomHolder=document.createElement("div");content.appendChild(roomHolder);if(building.id==="laboratorium-ft")renderLaboratory(buildingRooms,roomHolder);else renderRoomList(buildingRooms,roomHolder)}
container.appendChild(article);
});
}
function openViewer(){showPage("viewer")}
function openAR(){showPage("ar")}
function openDirectory(){showPage("directory")}
["menu3D","feature3D"].forEach(id=>on(id,"click",openViewer));["menuAR","featureAR"].forEach(id=>on(id,"click",openAR));["menuDirectory","featureDirectory"].forEach(id=>on(id,"click",openDirectory));
let toastTimer=null;
function toast(message){const element=byId("toast");if(!element)return;element.textContent=message;element.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>element.classList.remove("show"),2600)}
document.addEventListener("keydown",event=>{if(event.key!=="Escape")return;closeDrawer();if(!byId("tendikModal")?.classList.contains("hidden")){closeTendik();return}if(!byId("infoModal")?.classList.contains("hidden")){closeInfo();return}if(state.currentPage!=="home")goBack()});
async function startApp(){renderDirectory();showSlide(0);showLandingModel(0);showPage("home",false);registerServiceWorker();console.log("FT UISU Explorer Revision 12 loaded")}
startApp();
})();

(function(){
"use strict";
const card=document.getElementById("viewerCard"),page=document.getElementById("viewerPage"),viewer=document.getElementById("main3DViewer"),status=document.getElementById("viewerLoadingDot"),openButton=document.getElementById("viewerFullscreenButton"),closeButton=document.getElementById("viewerFullscreenExit");
if(!card||!page||!viewer||!status||!openButton||!closeButton||card.dataset.fullscreenInitialized)return;card.dataset.fullscreenInitialized="true";
let session=null;const root=document.documentElement,nativeElement=()=>document.fullscreenElement||document.webkitFullscreenElement,visible=()=>page.classList.contains("active")&&!card.classList.contains("hidden"),ready=()=>visible()&&status.classList.contains("ready");
function updateButtons(){if(session&&!visible()){closeFullscreen(false);return}openButton.classList.toggle("hidden",!ready()||!!session);closeButton.classList.toggle("hidden",!session);closeButton.disabled=!!session?.closing}
function finish(current){if(session!==current)return;session=null;card.classList.remove("viewer-is-fullscreen");root.classList.remove("viewer-fullscreen-open");root.style.removeProperty("--viewer-fullscreen-scroll-top");card.removeAttribute("role");card.removeAttribute("aria-modal");card.removeAttribute("aria-labelledby");updateButtons();if(current.restore&&visible()){window.scrollTo({left:current.x,top:current.y,behavior:"instant"});(ready()?openButton:viewer).focus({preventScroll:true})}}
function exitNativeQuietly(){const exit=document.exitFullscreen||document.webkitExitFullscreen;if(exit&&nativeElement()===card)try{Promise.resolve(exit.call(document)).catch(()=>{})}catch(_){}}
async function openFullscreen(){if(session||!ready()||nativeElement())return;const current={x:window.scrollX,y:window.scrollY,pending:true,fallback:false,closing:false,restore:true};session=current;root.style.setProperty("--viewer-fullscreen-scroll-top",`${-current.y}px`);root.classList.add("viewer-fullscreen-open");card.classList.add("viewer-is-fullscreen");card.setAttribute("role","dialog");card.setAttribute("aria-modal","true");card.setAttribute("aria-labelledby","viewerTitle");updateButtons();closeButton.focus({preventScroll:true});const request=card.requestFullscreen||card.webkitRequestFullscreen,enabled=document.fullscreenEnabled??document.webkitFullscreenEnabled??true;if(!request||!enabled){current.pending=false;current.fallback=true;return}try{await request.call(card);if(session!==current){if(!session)exitNativeQuietly();return}current.pending=false;current.fallback=nativeElement()!==card}catch(_){if(session!==current)return;current.pending=false;current.fallback=true}closeButton.focus({preventScroll:true});updateButtons()}
async function closeFullscreen(restore=true){const current=session;if(!current)return;if(!restore)current.restore=false;if(current.closing)return;current.closing=true;updateButtons();if(nativeElement()===card){const exit=document.exitFullscreen||document.webkitExitFullscreen;try{if(!exit)throw new Error("Fullscreen exit unavailable");await exit.call(document)}catch(_){if(session===current&&nativeElement()===card){current.closing=false;closeButton.disabled=false;return}}}finish(current)}
function onNativeChange(){if(nativeElement()===card){if(!session){exitNativeQuietly();return}session.pending=false;session.fallback=false}else if(session&&!session.pending&&!session.fallback){if(!visible())session.restore=false;finish(session)}}
openButton.addEventListener("click",openFullscreen);closeButton.addEventListener("click",()=>closeFullscreen());document.addEventListener("fullscreenchange",onNativeChange);document.addEventListener("webkitfullscreenchange",onNativeChange);
document.addEventListener("keydown",event=>{if(!session)return;if(event.key==="Escape"){event.preventDefault();event.stopPropagation();closeFullscreen()}else if(event.key==="Tab"){const controls=Array.from(card.querySelectorAll("button:not([disabled]), select:not([disabled]), a[href], [tabindex], model-viewer")).filter(element=>element.tabIndex>=0&&element.getClientRects().length);if(!controls.length)return;const first=controls[0],last=controls[controls.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}else if(!card.contains(document.activeElement)){event.preventDefault();closeButton.focus()}}},true);
const observer=new MutationObserver(updateButtons);[page,card,status].forEach(element=>observer.observe(element,{attributes:true,attributeFilter:["class"]}));viewer.addEventListener("load",updateButtons);viewer.addEventListener("error",updateButtons);updateButtons();
})();

(function(){
"use strict";
const $=id=>document.getElementById(id),overlay=$("webarOverlay"),canvas=$("webarCamera"),XR_URL="https://cdn.jsdelivr.net/npm/@8thwall/engine-binary@1.0.0/dist/xr.js";
if(!overlay||!canvas)return;
let libs=null,enginePromise=null,serial=0,current=null,motionOK=false;
const visible=(id,value)=>$(id)?.classList.toggle("hidden",!value),alive=q=>current===q&&!q.closed,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function message(a,b=""){$("webarStatus").textContent=a;$("webarInstructions").textContent=b}
function diagnostic(q){if(!alive(q))return;$("webarDiagnostic").textContent=`Kamera: ${q.started?"aktif":"menunggu"} · SLAM: ${q.tracking?"normal":"mencari"} · GLB: ${q.loaded?"siap":"memuat"}`}
function explain(e){const x=e?.error||e;if(x?.name==="NotAllowedError")return"Izinkan kamera dan sensor melalui pengaturan situs, lalu buka kembali menggunakan Safari atau Chrome.";if(x?.name==="NotReadableError")return"Kamera sedang digunakan aplikasi lain. Tutup aplikasi tersebut dan coba lagi.";return x?.message||String(x||"Mesin AR gagal dimulai.")}
function libraries(){if(!libs)libs=Promise.all([import("three"),import("three/addons/loaders/GLTFLoader.js"),import("three/addons/loaders/DRACOLoader.js"),import("three/addons/loaders/KTX2Loader.js"),import("three/addons/libs/meshopt_decoder.module.js")]).then(async([T,G,D,K,M])=>{await M.MeshoptDecoder.ready;window.THREE=T;return{T,G:G.GLTFLoader,D:D.DRACOLoader,K:K.KTX2Loader,M:M.MeshoptDecoder}}).catch(e=>{libs=null;throw e});return libs}
function engine(){
if(enginePromise)return enginePromise;
enginePromise=new Promise((resolve,reject)=>{
let tag,timer,settled=false;
const done=e=>{if(settled)return;settled=true;clearTimeout(timer);window.removeEventListener("xrloaded",loaded);if(e){tag?.remove();reject(e)}else resolve(window.XR8)},loaded=()=>{if(window.XR8)done()};
if(window.XR8)return done();tag=document.createElement("script");tag.src=XR_URL;tag.async=true;tag.crossOrigin="anonymous";tag.dataset.preloadChunks="slam";tag.onload=loaded;tag.onerror=()=>done(Error("Unduhan XR Engine gagal. Periksa koneksi internet."));timer=setTimeout(()=>done(Error("Unduhan XR Engine terlalu lama. Coba lagi.")),45000);window.addEventListener("xrloaded",loaded);document.head.appendChild(tag);
}).then(async xr=>{await xr.initialize?.();if(!xr.XrController)await xr.loadChunk("slam");if(!xr.XrController?.hitTest||!xr.Threejs?.pipelineModule)throw Error("Modul world tracking XR Engine tidak tersedia.");return xr}).catch(e=>{enginePromise=null;throw e});
return enginePromise;
}
function preload(){return Promise.all([libraries(),engine()])}
function requestMotion(){if(motionOK)return Promise.resolve(true);const tasks=[];try{for(const type of[window.DeviceMotionEvent,window.DeviceOrientationEvent])if(typeof type?.requestPermission==="function")tasks.push(type.requestPermission());return Promise.all(tasks).then(results=>motionOK=results.every(x=>x==="granted")).catch(()=>false)}catch(e){return Promise.resolve(false)}}
function dispose(root){const geometries=new Set(),materials=new Set(),textures=new Set();root?.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])if(m){materials.add(m);Object.values(m).forEach(t=>{if(t?.isTexture)textures.add(t)})}});textures.forEach(t=>t.dispose());materials.forEach(m=>m.dispose());geometries.forEach(g=>g.dispose())}
function clearHit(q){q.hit=null;q.since=0;q.lastHit=0;visible("webarPlace",false);visible("webarReticle",false);if(q.reticle)q.reticle.visible=false}
function size(){
const q=current;if(!q||q.closed)return;
const width=Math.max(2,overlay.clientWidth),height=Math.max(2,overlay.clientHeight),limit=q.renderer?.capabilities.maxTextureSize||4096;
const ratio=Math.min(window.devicePixelRatio||1,AR_INTERACTION.maxDpr,Math.sqrt(AR_INTERACTION.pixelBudget/(width*height)),limit/width,limit/height);
const w=Math.max(2,Math.floor(width*ratio)),h=Math.max(2,Math.floor(height*ratio)),changed=canvas.width!==w||canvas.height!==h;
if(changed){canvas.width=w;canvas.height=h;clearHit(q);q.pointers.clear();q.gesture=null;q.tapStart=null;q.lastTap=null}
if(q.renderer){if(q.renderer.getPixelRatio()!==1)q.renderer.setPixelRatio(1);const currentSize=q.renderer.getSize(q.renderSize||(q.renderSize=new q.L.T.Vector2()));if(currentSize.x!==w||currentSize.y!==h)q.renderer.setSize(w,h,false)}
}
function stop(q){if(!q||q.closed)return;q.closed=true;clearTimeout(q.watchdog);clearInterval(q.heartbeat);if(q.running){try{window.XR8.stop()}catch(e){}try{window.XR8.clearCameraPipelineModules()}catch(e){}}q.abort.abort();dispose(q.group);dispose(q.reticle);q.group?.removeFromParent();q.reticle?.removeFromParent();q.lights?.forEach(l=>l.removeFromParent());q.draco?.dispose();q.ktx?.dispose();q.renderer?.dispose();q.pointers.clear()}
function fail(q,error){if(!alive(q))return;const reason=explain(error);stop(q);visible("webarPlace",false);visible("webarReticle",false);visible("webarReset",false);visible("webarRetry",true);message("AR belum dapat dijalankan",reason);$("webarDiagnostic").textContent="Pelacakan AR tidak aktif."}
async function model(q,L){
const{T,G,D,K,M}=L,loader=new G();q.draco=new D();q.draco.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.7/");q.draco.setWorkerLimit(1);loader.setDRACOLoader(q.draco);loader.setMeshoptDecoder(M);q.ktx=new K();q.ktx.setTranscoderPath("https://cdn.jsdelivr.net/npm/three@0.160.1/examples/jsm/libs/basis/");q.ktx.setWorkerLimit(1);q.ktx.detectSupport(q.renderer);loader.setKTX2Loader(q.ktx);
const url=new URL(q.src,document.baseURI),response=await fetch(url.href,{signal:q.abort.signal,cache:"default"});if(!response.ok)throw Error(`Model tidak dapat diunduh (HTTP ${response.status}).`);
const bytes=await response.arrayBuffer();if(!alive(q))return;const gltf=await loader.parseAsync(bytes,new URL(".",url).href);if(!alive(q)){dispose(gltf.scene);return}
const root=gltf.scene;root.updateMatrixWorld(true);const box=new T.Box3().setFromObject(root);if(box.isEmpty()){dispose(root);throw Error("Model tidak mengandung mesh yang dapat ditampilkan.")}
const center=box.getCenter(new T.Vector3()),extent=box.getSize(new T.Vector3()),normalizer=1/Math.max(extent.x,extent.y,extent.z,.001),content=new T.Group();
content.add(root);content.scale.setScalar(normalizer);content.position.set(-center.x*normalizer,-box.min.y*normalizer,-center.z*normalizer);q.turn.add(content);q.radius=Math.max(.001,extent.length()*normalizer*.5);q.fitScale=1;
const textures=new Set(),anisotropy=Math.max(1,Math.min(AR_INTERACTION.anisotropy,q.renderer.capabilities.getMaxAnisotropy()));
root.traverse(object=>{for(const material of Array.isArray(object.material)?object.material:[object.material])if(material)Object.values(material).forEach(texture=>{if(texture?.isTexture&&!texture.isVideoTexture&&!textures.has(texture)){textures.add(texture);if(texture.anisotropy!==anisotropy){texture.anisotropy=anisotropy;texture.needsUpdate=true}}})});
q.loaded=true;diagnostic(q);
}
function update(q,reality,T){
if(!alive(q))return;q.lastFrame=performance.now();const now=q.lastFrame;q.tracking=reality?.trackingStatus==="NORMAL";
if(!q.tracking){q.wasTracking=false;clearHit(q);if(q.group)q.group.visible=false;if(now-q.notice>1800){q.notice=now;message("Mencari pelacakan SLAM...","Gerakkan perangkat perlahan. Pilih permukaan bertekstur dengan pencahayaan cukup.")}return}
if(q.placed){q.group.visible=true;if(!q.wasTracking)message("Model telah ditempatkan","Satu jari untuk memutar, dua jari untuk mengubah ukuran.");q.wasTracking=true;return}
q.wasTracking=false;if(!q.loaded){clearHit(q);return}if(now-q.query<100)return;q.query=now;
const hits=window.XR8.XrController.hitTest(.5,.5,["FEATURE_POINT"]),hit=hits.find(h=>h.position&&[h.position.x,h.position.y,h.position.z].every(Number.isFinite)&&h.distance>=.25&&h.distance<=6);
if(!hit){clearHit(q);if(now-q.notice>1600){q.notice=now;message("Mencari titik penempatan...","Arahkan tanda tengah ke bagian permukaan yang bertekstur. Hindari kaca dan bidang polos.")}return}
const point=new T.Vector3(hit.position.x,hit.position.y,hit.position.z);if(q.hit&&q.hit.distanceTo(point)<.12&&now-q.lastHit<350)q.hit.lerp(point,.35);else{q.hit=point;q.since=now}q.lastHit=now;const ready=now-q.since>=400;visible("webarPlace",ready);visible("webarReticle",ready);
if(ready&&now-q.notice>1300){q.notice=now;message("Titik terlacak — siap ditempatkan","Tekan Tempatkan Model. Penanda menunjukkan titik hasil hit-test SLAM.")}
}
async function boot(q,L,xr){
if(!alive(q)||q.booting||q.running)return;q.booting=true;
if(!isSecureContext||!navigator.mediaDevices?.getUserMedia||!window.WebAssembly)throw Error("AR memerlukan HTTPS, kamera, WebAssembly, dan browser yang didukung XR Engine.");
const mobile=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);if(!mobile)throw Error("Buka AR menggunakan Safari pada iPhone/iPad atau Chrome pada Android. Viewer 3D tetap dapat digunakan di komputer.");
const{T}=L;size();xr.clearCameraPipelineModules();xr.XrController.configure({disableWorldTracking:false,enableWorldPoints:false,enableLighting:false,scale:"responsive"});xr.Threejs.configure({renderCameraTexture:false});
const pipeline={
name:"ft-uisu-r9-ui-slam-"+q.id,
onCameraStatusChange:({status,error})=>{if(!alive(q))return;if(status==="failed")fail(q,error||Error("Kamera tidak dapat dibuka."));else if(status==="requesting")message("Meminta akses kamera...","Izinkan penggunaan kamera belakang ketika browser meminta izin.")},
onStart:()=>{if(!alive(q))return;try{const{scene,camera,renderer}=xr.Threejs.xrScene();Object.assign(q,{scene,camera,renderer,started:true});renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;renderer.shadowMap.enabled=false;size();camera.position.set(0,1.6,0);xr.XrController.updateCameraProjectionMatrix({origin:camera.position,facing:camera.quaternion});q.group=new T.Group();q.group.visible=false;q.turn=new T.Group();q.group.add(q.turn);scene.add(q.group);q.lights=[new T.HemisphereLight(0xffffff,0x9eabb0,2),new T.DirectionalLight(0xffffff,2)];q.lights[1].position.set(3,6,4);scene.add(...q.lights);message("Kamera aktif — memuat model","Gerakkan perangkat perlahan untuk membangun peta SLAM.");model(q,L).catch(e=>{if(alive(q))fail(q,e)});diagnostic(q)}catch(e){fail(q,e)}},
onUpdate:({processCpuResult})=>{try{update(q,processCpuResult?.reality,T)}catch(e){fail(q,e)}},
onException:e=>fail(q,e)
};
xr.addCameraPipelineModules([xr.GlTextureRenderer.pipelineModule(),xr.Threejs.pipelineModule(),xr.XrController.pipelineModule(),pipeline]);q.running=true;q.lastFrame=performance.now();message("Memulai XR Engine...","Kamera dibuka langsung oleh engine tanpa kamera pratinjau tambahan.");
await xr.run({canvas,webgl2:true,cameraConfig:{direction:xr.XrConfig.camera().BACK},glContextConfig:{alpha:false,antialias:true,preserveDrawingBuffer:false,powerPreference:"high-performance"},allowedDevices:xr.XrConfig.device().MOBILE,sessionConfiguration:{disableXrTablet:true,defaultEnvironment:{disabled:true}}});
if(!alive(q))return;q.watchdog=setTimeout(()=>{if(alive(q)&&!q.started)fail(q,Error("Kamera belum siap. Tutup kamera/aplikasi lain, kemudian coba kembali."))},30000);q.heartbeat=setInterval(()=>{if(!alive(q))return;diagnostic(q);if(q.started&&performance.now()-q.lastFrame>12000)fail(q,Error("Frame pelacakan terhenti. Tekan Coba Lagi untuk memulai sesi baru."))},2000);
}
function start(src,title){
if(current&&!current.closed)return;const permission=requestMotion(),q={id:++serial,src,title,closed:false,running:false,started:false,loaded:false,tracking:false,placed:false,hit:null,since:0,lastHit:0,query:0,notice:0,lastFrame:0,zoom:1,rotation:0,pointers:new Map(),pinch:0,abort:new AbortController()};
current=q;overlay.classList.remove("hidden");document.documentElement.classList.add("webar-open");$("webarTitle").textContent=title;["webarPlace","webarReset","webarMotion","webarRetry","webarReticle"].forEach(id=>visible(id,false));
document.querySelectorAll("model-viewer").forEach(v=>{v.dataset.arAutoRotate=v.hasAttribute("auto-rotate")?"1":"0";v.removeAttribute("auto-rotate");v.pause?.()});message("Menyiapkan XR Engine...","Izin kamera dan sensor diperlukan untuk pelacakan dunia.");
Promise.all([preload(),permission]).then(async([[L,xr],granted])=>{if(!alive(q))return;q.L=L;q.xr=xr;if(!granted){visible("webarMotion",true);message("Izin sensor gerak diperlukan","Tekan Izinkan Sensor Gerak untuk melanjutkan.");return}await boot(q,L,xr)}).catch(e=>fail(q,e));
}
function place(){const q=current;if(!q||!alive(q)||!q.tracking||!q.loaded||!q.hit||performance.now()-q.since<400||performance.now()-q.lastHit>350)return;q.group.position.copy(q.hit);fitModel(q);q.group.visible=true;q.placed=true;q.lastTap=null;q.tapStart=null;q.pointers.clear();q.gesture=null;visible("webarReticle",false);visible("webarPlace",false);visible("webarReset",true);message("Model telah ditempatkan",INTERACTION_HINT)}
function reset(){const q=current;if(!q||!alive(q)||!q.group)return;q.placed=false;q.group.visible=false;q.turn.rotation.y=0;q.turn.scale.setScalar(1);q.fitScale=1;q.zoom=1;q.rotation=0;q.pointers.clear();q.gesture=null;q.tapStart=null;q.lastTap=null;clearHit(q);visible("webarReset",false);message("Cari titik penempatan baru","Arahkan kamera ke permukaan bertekstur. Peta SLAM tetap dipertahankan.")}
function close(){if(current)stop(current);current=null;overlay.classList.add("hidden");document.documentElement.classList.remove("webar-open");document.querySelectorAll("model-viewer").forEach(v=>{if(v.dataset.arAutoRotate==="1")v.setAttribute("auto-rotate","");delete v.dataset.arAutoRotate;v.play?.()})}
function retry(){const q=current;if(!q)return;const{src,title}=q;close();start(src,title)}
function pinch(q){const p=[...q.pointers.values()];return p.length===2?Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y):0}
const AR_INTERACTION={minZoom:.05,maxZoom:64,maxDpr:3,pixelBudget:4000000,anisotropy:8,fillWidth:.72,fillHeight:.5};
const INTERACTION_HINT="Satu jari: putar. Dua jari: perbesar/perkecil dan putar. Ketuk dua kali untuk mengembalikan ukuran.";
function applyZoom(q,value){if(!q.turn||!Number.isFinite(value))return;q.zoom=clamp(value,AR_INTERACTION.minZoom,AR_INTERACTION.maxZoom);q.turn.scale.setScalar((q.fitScale||1)*q.zoom)}
function fitModel(q){
if(!q.camera||!q.group||!q.radius)return;
const p=q.camera.projectionMatrix.elements,distance=Math.max(.05,q.camera.position.distanceTo(q.group.position));
const width=2*distance/Math.max(Math.abs(p[0]),.001),height=2*distance/Math.max(Math.abs(p[5]),.001);
q.fitScale=Math.min(width*AR_INTERACTION.fillWidth,height*AR_INTERACTION.fillHeight)/(2*q.radius);
applyZoom(q,1);
}
function resetView(q){if(!alive(q)||!q.placed||!q.tracking)return;fitModel(q);q.rotation=0;q.turn.rotation.y=0;q.lastTap=null;rebaseGesture(q);message("Ukuran dan sudut model dikembalikan",INTERACTION_HINT)}
function gesture(q){const p=[...q.pointers.values()];if(p.length<2)return null;const dx=p[1].x-p[0].x,dy=p[1].y-p[0].y;return{distance:Math.hypot(dx,dy),angle:Math.atan2(dy,dx)}}
function rebaseGesture(q){const g=gesture(q);q.gesture=g?{distance:Math.max(g.distance,8),angle:g.angle,zoom:q.zoom,rotation:q.rotation}:null}
function pointerDown(e){
const q=current;if(!q?.placed||!alive(q)||!q.tracking)return;if(e.pointerType==="mouse"&&e.button!==0)return;e.preventDefault();
try{canvas.setPointerCapture(e.pointerId)}catch(error){}
q.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
if(q.pointers.size===1)q.tapStart={id:e.pointerId,x:e.clientX,y:e.clientY,time:performance.now(),moved:false};else{q.tapStart=null;q.lastTap=null}
rebaseGesture(q);
}
function pointerMove(e){
const q=current;if(!q?.placed||!alive(q)||!q.pointers.has(e.pointerId))return;e.preventDefault();
const previous=q.pointers.get(e.pointerId);q.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
if(q.tapStart&&Math.hypot(e.clientX-q.tapStart.x,e.clientY-q.tapStart.y)>10)q.tapStart.moved=true;
if(!q.tracking){rebaseGesture(q);return}
if(q.pointers.size>=2){const g=gesture(q);if(!q.gesture){rebaseGesture(q);return}applyZoom(q,q.gesture.zoom*g.distance/q.gesture.distance);const delta=g.angle-q.gesture.angle;q.rotation=q.gesture.rotation+Math.atan2(Math.sin(delta),Math.cos(delta));q.turn.rotation.y=q.rotation}
else{q.rotation+=(e.clientX-previous.x)*.008;q.turn.rotation.y=q.rotation}
}
function pointerEnd(e){
const q=current;if(!q||!q.pointers.has(e.pointerId))return;
const tap=q.tapStart,now=performance.now(),isTap=e.type==="pointerup"&&q.pointers.size===1&&tap?.id===e.pointerId&&!tap.moved&&now-tap.time<280&&Math.hypot(e.clientX-tap.x,e.clientY-tap.y)<10;
q.pointers.delete(e.pointerId);q.tapStart=null;rebaseGesture(q);
if(e.type!=="pointerup"){q.lastTap=null;return}
if(isTap){const last=q.lastTap;if(last&&now-last.time<350&&Math.hypot(e.clientX-last.x,e.clientY-last.y)<32)resetView(q);else q.lastTap={time:now,x:e.clientX,y:e.clientY}}
}
function wheelZoom(e){const q=current;if(!q?.placed||!alive(q)||!q.tracking)return;e.preventDefault();const pixels=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?canvas.clientHeight:1);applyZoom(q,q.zoom*Math.exp(-clamp(pixels,-600,600)*.002));q.lastTap=null;rebaseGesture(q)}
canvas.style.touchAction="none";canvas.addEventListener("pointerdown",pointerDown,{passive:false});canvas.addEventListener("pointermove",pointerMove,{passive:false});["pointerup","pointercancel","lostpointercapture"].forEach(name=>canvas.addEventListener(name,pointerEnd));canvas.addEventListener("wheel",wheelZoom,{passive:false});
$("webarClose").addEventListener("click",close);$("webarBackBottom").addEventListener("click",close);$("webarPlace").addEventListener("click",place);$("webarReset").addEventListener("click",reset);$("webarRetry").addEventListener("click",retry);
$("webarMotion").addEventListener("click",()=>{const q=current;if(!q||!alive(q))return;requestMotion().then(granted=>{if(!alive(q))return;if(!granted){message("Sensor belum diizinkan","Izinkan akses sensor melalui pengaturan Safari, kemudian coba lagi.");return}visible("webarMotion",false);return boot(q,q.L,q.xr)}).catch(e=>fail(q,e))});
window.addEventListener("resize",size);window.addEventListener("orientationchange",()=>requestAnimationFrame(size));if(typeof ResizeObserver!=="undefined")new ResizeObserver(size).observe(overlay);window.visualViewport?.addEventListener("resize",size);document.addEventListener("visibilitychange",()=>{if(document.hidden&&current)close()});window.addEventListener("pagehide",close);document.addEventListener("keydown",e=>{if(current&&e.key==="Escape"){e.preventDefault();e.stopImmediatePropagation();close()}},true);
window.FT_WEBAR={start,close,reset,preload};
})();
