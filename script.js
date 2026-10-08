
(function(){
"use strict";

/* =====================================================
   FT UISU EXPLORER - REV 7 (NO NAVIGATE)
   Semua menu dan database tetap dipertahankan.
===================================================== */

const NAVIGATION_ENABLED=false;
const DATA=window.FT_DATA||{};
const MAP_WIDTH=DATA.MAP_WIDTH||768;
const MAP_HEIGHT=DATA.MAP_HEIGHT||1024;
const buildings=Array.isArray(DATA.buildings)?DATA.buildings:[];
const rooms=Array.isArray(DATA.rooms)?DATA.rooms:[];
const people=Array.isArray(DATA.people)?DATA.people:[];
const entrances=Array.isArray(DATA.entrances)?DATA.entrances:[];
const mapNodes=DATA.mapNodes||{};
const mapEdges=Array.isArray(DATA.mapEdges)?DATA.mapEdges:[];
const mapCalibration=Array.isArray(DATA.mapCalibration)?DATA.mapCalibration:[];

const byId=id=>document.getElementById(id);
const all=selector=>Array.from(document.querySelectorAll(selector));
function on(id,type,callback,options){
    byId(id)?.addEventListener(type,callback,options);
}
function show(id){byId(id)?.classList.remove("hidden");}
function hide(id){byId(id)?.classList.add("hidden");}
function setText(id,text){
    const element=byId(id);
    if(element)element.textContent=text??"";
}
function escapeHtml(value){
    return String(value??"")
        .replace(/&/g,"&amp;")
        .replace(/</g,"&lt;")
        .replace(/>/g,"&gt;")
        .replace(/"/g,"&quot;")
        .replace(/'/g,"&#039;");
}
function applyFeatureVisibility(){
    document.documentElement.classList.toggle(
        "navigation-disabled",!NAVIGATION_ENABLED
    );
    document.querySelectorAll(
        "#menuNavigation,#featureNav,#globalNavButton,.room-nav,.building-nav"
    ).forEach(element=>{
        element.disabled=!NAVIGATION_ENABLED;
        if(NAVIGATION_ENABLED)element.removeAttribute("aria-hidden");
        else element.setAttribute("aria-hidden","true");
    });

    const description=byId("directoryNavigationDescription");
    if(description){
        description.textContent=NAVIGATION_ENABLED
            ?"Pilih gedung dan ruangan untuk melihat informasi atau membuka Petunjuk Arah."
            :"Pilih gedung dan ruangan untuk melihat informasi atau data tenaga kependidikan.";
    }
}

const state={
    currentPage:"home",
    pageHistory:[],
    currentSlide:0,
    landingModelIndex:0,
    globalSelection:null,
    infoLocation:null,
    destination:null,
    clickedPosition:null,
    routeResult:null,
    liveInstructions:[],
    gpsWatchId:null,
    viewerBuildingId:null,
    viewerModelId:null,
    arBuildingId:null,
    arModelId:null,
    pending3DMarker:null
};

function getBuildingById(id){
    return typeof DATA.getBuildingById==="function"
        ?DATA.getBuildingById(id)
        :buildings.find(item=>item.id===id)||null;
}
function getEntranceById(id){
    return typeof DATA.getEntranceById==="function"
        ?DATA.getEntranceById(id)
        :entrances.find(item=>item.id===id)||null;
}
function getBuildingModels(id){
    return typeof DATA.getBuildingModels==="function"
        ?DATA.getBuildingModels(id)
        :getBuildingById(id)?.models||[];
}
function getModelVariant(buildingId,modelId){
    return typeof DATA.getModelVariant==="function"
        ?DATA.getModelVariant(buildingId,modelId)
        :getBuildingModels(buildingId).find(item=>item.id===modelId)||null;
}
function getDefaultModelVariant(buildingId){
    if(typeof DATA.getDefaultModelVariant==="function"){
        return DATA.getDefaultModelVariant(buildingId);
    }
    const building=getBuildingById(buildingId);
    if(!building)return null;
    return getModelVariant(buildingId,building.defaultModel)
        ||building.models?.[0]||null;
}
function getNavigationEntrance(location){
    if(typeof DATA.getNavigationEntranceForLocation==="function"){
        return DATA.getNavigationEntranceForLocation(location);
    }
    if(!location)return null;
    if(location.type==="room"&&location.navigationEntranceId){
        return getEntranceById(location.navigationEntranceId);
    }
    const building=getBuildingById(location.buildingId||location.id);
    return building?getEntranceById(building.defaultEntranceId):null;
}

/* CACHE */
const MODEL_CACHE_NAME="ft-uisu-models-no-navigation-r7-webar";
const PRIORITY_MODELS=[
    "./assets/models/gedung_biro_outdoor.glb",
    "./assets/models/gedung_perkuliahan_outdoor.glb",
    "./assets/models/laboratorium_outdoor.glb",
    "./assets/models/gedung_biro_indoor.glb",
    "./assets/models/gedung_perkuliahan_indoor.glb"
];
async function registerServiceWorker(){
    if(!("serviceWorker" in navigator))return;
    try{
        await navigator.serviceWorker.register(
            "./sw.js?v=7-webar",{scope:"./"}
        );
        await navigator.serviceWorker.ready;
    }catch(error){
        console.warn("Service worker:",error);
    }
}
async function cacheModel(url){
    if(!url||!("caches" in window))return false;
    try{
        const cache=await caches.open(MODEL_CACHE_NAME);
        if(await cache.match(url,{ignoreSearch:true}))return true;
        const response=await fetch(url,{cache:"force-cache"});
        if(!response.ok)return false;
        await cache.put(url,response.clone());
        return true;
    }catch(error){
        return false;
    }
}
async function preloadPriorityModels(){
    const queue=PRIORITY_MODELS.slice();
    async function worker(){
        while(queue.length){
            await cacheModel(queue.shift());
        }
    }
    await Promise.all([worker(),worker()]);
}
function preloadBuildingModels(building){
    if(!Array.isArray(building?.models))return;
    building.models.forEach(model=>cacheModel(model.src));
}

/* LOKASI */
const locations=[];
buildings.forEach(building=>{
    locations.push({
        id:building.id,
        type:"building",
        name:building.name,
        buildingId:building.id,
        floor:building.actualFloor,
        parent:"Fakultas Teknik UISU",
        description:building.description,
        tendik:Array.isArray(building.tendik)?building.tendik:[],
        navigationEntranceId:building.defaultEntranceId,
        modelMarker:null
    });
});
rooms.forEach(room=>{
    const building=getBuildingById(room.buildingId);
    locations.push({
        id:room.id,
        type:"room",
        name:room.name,
        buildingId:room.buildingId,
        floor:room.floor,
        parent:building?.name||"Fakultas Teknik UISU",
        description:room.description||"",
        navigationEntranceId:room.navigationEntranceId,
        units:Array.isArray(room.units)?room.units:[],
        tendik:Array.isArray(room.tendik)?room.tendik:[],
        modelMarker:room.modelMarker||null
    });
});
people.forEach(person=>{
    locations.push({...person,type:"person"});
});

/* HALAMAN */
function updateHeaderActive(page){
    all(".header-link").forEach(button=>{
        button.classList.toggle("active",button.dataset.page===page);
    });
}
function showPage(pageName,pushHistory=true){
    if(!NAVIGATION_ENABLED&&
       (pageName==="navigation"||pageName==="navigationActive"))return;
    const page=byId(pageName+"Page");
    if(!page)return;
    if(pushHistory&&state.currentPage!==pageName){
        state.pageHistory.push(state.currentPage);
    }
    all(".page").forEach(item=>item.classList.remove("active"));
    page.classList.add("active");
    state.currentPage=pageName;
    updateHeaderActive(pageName);
    closeDrawer();
    if(pageName!=="navigationActive"){
        window.scrollTo({top:0,behavior:"auto"});
    }
    setTimeout(syncAllMapGeometry,60);
}
function goBack(){
    stopGpsTracking();
    const previous=state.pageHistory.length
        ?state.pageHistory.pop()
        :"home";
    showPage(previous,false);
}
all("[data-back]").forEach(button=>{
    button.addEventListener("click",goBack);
});
on("logoHome","click",()=>{
    stopGpsTracking();
    state.pageHistory=[];
    showPage("home",false);
});
all("[data-page]").forEach(button=>{
    button.addEventListener("click",()=>{
        showPage(button.dataset.page);
    });
});

/* DRAWER */
function openDrawer(){
    byId("drawer")?.classList.add("open");
    byId("drawerOverlay")?.classList.add("show");
    document.body.style.overflow="hidden";
}
function closeDrawer(){
    byId("drawer")?.classList.remove("open");
    byId("drawerOverlay")?.classList.remove("show");
    document.body.style.overflow="";
}
on("hamburgerButton","click",openDrawer);
on("closeDrawer","click",closeDrawer);
on("drawerOverlay","click",closeDrawer);

/* SLIDER */
const slides=all(".hero-slide");
function showSlide(index){
    if(!slides.length)return;
    state.currentSlide=(index+slides.length)%slides.length;
    slides.forEach((slide,i)=>{
        slide.classList.toggle("active",i===state.currentSlide);
    });
    all(".slider-dot").forEach((dot,i)=>{
        dot.classList.toggle("active",i===state.currentSlide);
    });
}
on("prevSlide","click",()=>showSlide(state.currentSlide-1));
on("nextSlide","click",()=>showSlide(state.currentSlide+1));
all(".slider-dot").forEach(dot=>{
    dot.addEventListener("click",()=>{
        showSlide(Number(dot.dataset.slide));
    });
});

/* MODEL BERANDA */
const landingModels=[
    {name:"Biro Fakultas Teknik UISU",viewer:byId("landingModel0")},
    {name:"Gedung Perkuliahan Fakultas Teknik UISU",viewer:byId("landingModel1")},
    {name:"Laboratorium Fakultas Teknik UISU",viewer:byId("landingModel2")}
];
function showLandingModel(index){
    if(!landingModels.length)return;
    state.landingModelIndex=
        (index+landingModels.length)%landingModels.length;
    landingModels.forEach((item,i)=>{
        item.viewer?.classList.toggle(
            "active",i===state.landingModelIndex
        );
    });
    setText(
        "landingModelName",
        landingModels[state.landingModelIndex].name
    );
    setText(
        "landingModelCounter",
        `${state.landingModelIndex+1} / ${landingModels.length}`
    );
}
on("landingNextModel","click",()=>{
    showLandingModel(state.landingModelIndex+1);
});

/* WARNA UNIT */
const UNIT_CLASS={
    "Teknik Informatika":"room-unit-informatika",
    "Teknik Mesin":"room-unit-mesin",
    "Teknik Sipil":"room-unit-sipil",
    "Teknik Industri":"room-unit-industri",
    "Teknik Elektro":"room-unit-elektro",
    "Fakultas Teknik":"room-unit-fakultas"
};
function renderUnitMarkup(units){
    if(!Array.isArray(units)||!units.length)return "";
    const content=units.map((unit,index)=>{
        const name=UNIT_CLASS[unit]||"room-unit-fakultas";
        const separator=index<units.length-1
            ?'<span class="room-unit-punctuation">, </span>'
            :"";
        return `<span class="room-unit ${name}">${escapeHtml(unit)}</span>${separator}`;
    }).join("");
    return `<span class="room-unit-group">
        <span class="room-unit-punctuation">(</span>
        ${content}
        <span class="room-unit-punctuation">)</span>
    </span>`;
}

/* PENCARIAN */
function normalize(text){
    return String(text||"").toLowerCase().trim();
}
function searchLocations(value){
    const search=normalize(value);
    if(!search)return [];
    return locations.filter(item=>
        normalize(
            item.name+" "+
            (item.units||[]).join(" ")+" "+
            (item.parent||"")
        ).includes(search)
    ).slice(0,40);
}
function renderSearchResults(results,container,callback){
    if(!container)return;
    container.innerHTML="";
    if(!results.length){
        container.innerHTML=
            '<div class="search-empty">Lokasi tidak ditemukan.</div>';
        return;
    }
    results.forEach(location=>{
        const button=document.createElement("button");
        button.type="button";
        button.className="search-result";
        const type=location.type==="building"
            ?"Gedung"
            :location.type==="person"?"Civitas":"Ruangan";
        button.innerHTML=`
            <span>
                <strong class="search-result-title">
                    <span>${escapeHtml(location.name)}</span>
                    ${renderUnitMarkup(location.units)}
                </strong>
                <small>${escapeHtml(location.parent||"Fakultas Teknik UISU")}
                ${location.floor?" • Lantai "+location.floor:""}</small>
            </span>
            <span class="search-type">${type}</span>
        `;
        button.addEventListener("click",()=>callback(location));
        container.appendChild(button);
    });
}
on("globalSearch","input",event=>{
    const value=event.target.value;
    if(!value.trim()){
        hide("globalSearchResults");
        return;
    }
    renderSearchResults(
        searchLocations(value),
        byId("globalSearchResults"),
        location=>{
            state.globalSelection=location;
            setText("globalSelectedName",location.name);
            byId("globalSearch").value=location.name;
            hide("globalSearchResults");
            show("globalSelected");
        }
    );
    show("globalSearchResults");
});
on("clearGlobalSearch","click",()=>{
    byId("globalSearch").value="";
    state.globalSelection=null;
    hide("globalSearchResults");
    hide("globalSelected");
});

/* INFORMASI */
function openInfo(location){
    if(!location)return;
    state.infoLocation=location;
    setText("infoTitle",location.name);
    const units=byId("infoUnits");
    if(units){
        units.innerHTML=renderUnitMarkup(location.units);
        units.classList.toggle(
            "hidden",!Array.isArray(location.units)||!location.units.length
        );
    }
    setText(
        "infoDescription",
        location.description||"Informasi belum tersedia."
    );
    show("infoModal");
}
function closeInfo(){hide("infoModal");}
on("closeInfoModal","click",closeInfo);
on("infoBackdrop","click",closeInfo);
on("globalInfoButton","click",()=>{
    openInfo(state.globalSelection);
});
on("globalNavButton","click",()=>{
    openNavigationWithDestination(state.globalSelection);
});

/* TENDIK */
function normalizeWhatsappNumber(phone){
    let digits=String(phone||"").replace(/\D/g,"");
    if(!digits)return "";
    if(digits.startsWith("0"))digits="62"+digits.slice(1);
    return digits;
}
function whatsappUrl(phone){
    const number=normalizeWhatsappNumber(phone);
    return number?`https://wa.me/${number}`:"";
}
function openTendik(location){
    const isBiro=location?.buildingId==="biro-ft";
    const isLibrary=location?.id==="perpustakaan-ft";
    const contacts=Array.isArray(location?.tendik)
        ?location.tendik:[];
    if((!isBiro&&!isLibrary)||!contacts.length)return;
    setText("tendikRoomTitle",location.name);
    hide("tendikRoomParent");

    const list=byId("tendikList");
    if(!list)return;
    list.replaceChildren();

    contacts.forEach(contact=>{
        const card=document.createElement("article");
        card.className="tendik-card";
        const jabatan=String(contact.jabatan||"-").trim()||"-";
        const name=String(contact.name||"-").trim()||"-";
        const phone=String(contact.phone||"-").trim()||"-";
        const photo=String(contact.photo||"").trim();
        const wa=phone!=="-"?whatsappUrl(phone):"";

        const photoMarkup=photo
            ?`<div class="tendik-photo-wrap">
                <img class="tendik-photo"
                     src="${escapeHtml(photo)}"
                     alt="Foto ${escapeHtml(name)}"
                     loading="lazy"
                     decoding="async"
                     onerror="this.parentNode.classList.add('tendik-photo-empty');this.remove()">
              </div>`
            :`<div class="tendik-photo-wrap tendik-photo-empty">-</div>`;

        card.innerHTML=`
            <p class="tendik-jabatan">${escapeHtml(jabatan)}</p>
            ${photoMarkup}
            <h3 class="tendik-name">${escapeHtml(name)}</h3>
            ${wa
                ?`<a class="tendik-whatsapp"
                     href="${wa}"
                     target="_blank"
                     rel="noopener noreferrer"
                     aria-label="WhatsApp ${escapeHtml(name)}">
                    <span class="tendik-whatsapp-label">KONTAK (WhatsApp)</span>
                    <strong>${escapeHtml(phone)}</strong>
                  </a>`
                :`<div class="tendik-whatsapp tendik-contact-empty">
                    <span class="tendik-whatsapp-label">KONTAK</span>
                    <strong>-</strong>
                  </div>`
            }
        `;
        list.appendChild(card);
    });
    show("tendikModal");
}
function closeTendik(){hide("tendikModal");}
on("closeTendikModal","click",closeTendik);
on("tendikBackdrop","click",closeTendik);

/* PILIHAN GEDUNG */
function populateBuildingSelect(select){
    if(!select)return;
    select.innerHTML=
        '<option value="">-- Pilih Gedung --</option>';
    buildings.slice().sort((a,b)=>
        (a.modelMenuOrder??99)-(b.modelMenuOrder??99)
    ).forEach(building=>{
        const option=document.createElement("option");
        option.value=building.id;
        option.textContent=building.modelMenuName||building.name;
        select.appendChild(option);
    });
}
const viewerBuildingSelect=byId("viewerBuildingSelect");
const arBuildingSelect=byId("arBuildingSelect");
populateBuildingSelect(viewerBuildingSelect);
populateBuildingSelect(arBuildingSelect);

function renderModelSwitch({
    building,activeModelId,containerId,singleBadgeId,onChange
}){
    const container=byId(containerId);
    const badge=byId(singleBadgeId);
    if(!container||!badge||!building)return;
    const models=building.models||[];
    container.innerHTML="";
    if(models.length<=1){
        hide(containerId);
        if(models[0]){
            badge.textContent=models[0].name;
            show(singleBadgeId);
        }else{
            hide(singleBadgeId);
        }
        return;
    }
    hide(singleBadgeId);
    show(containerId);
    models.forEach(model=>{
        const button=document.createElement("button");
        button.type="button";
        button.className="model-switch-button";
        button.textContent=model.name;
        button.classList.toggle(
            "active",model.id===activeModelId
        );
        button.addEventListener("click",()=>onChange(model.id));
        container.appendChild(button);
    });
}

/* 3D VIEWER */
const main3DViewer=byId("main3DViewer");
let current3DModel={buildingId:null,modelId:null,src:null};

function updateViewerText(building,model){
    const title=model.viewerTitle||building.name;
    setText("viewerTitle",title);
    setText("viewerCurrentModelName",title+" - "+model.name);
    setText("viewerPreloadDescription",model.viewerDescription);
}
function setViewerLoading(building,model){
    updateViewerText(building,model);
    setText("viewerLoadStatus","MEMUAT MODEL 3D...");
    byId("viewerLoadingDot").className="loading-dot loading";
    show("viewerLoadingOverlay");
    hide("viewerUnavailable");
}
function setViewerReady(building,model){
    updateViewerText(building,model);
    setText("viewerLoadStatus","MODEL 3D SIAP");
    byId("viewerLoadingDot").className="loading-dot ready";
    hide("viewerLoadingOverlay");
    hide("viewerUnavailable");
}
function setViewerUnavailable(building,model){
    updateViewerText(building,model);
    setText("viewerLoadStatus","MODEL BELUM TERSEDIA");
    byId("viewerLoadingDot").className="loading-dot error";
    hide("viewerLoadingOverlay");
    show("viewerUnavailable");
}
function applyModelDefaultCamera(model,jump=true){
    if(!main3DViewer||!model)return;
    main3DViewer.cameraOrbit=
        model.defaultCameraOrbit||"0deg 75deg auto";
    main3DViewer.cameraTarget=
        model.defaultCameraTarget||"auto auto auto";
    main3DViewer.fieldOfView=
        model.defaultFieldOfView||"35deg";
    if(jump&&typeof main3DViewer.jumpCameraToGoal==="function"){
        main3DViewer.jumpCameraToGoal();
    }
}
on("resetCamera","click",()=>{
    const model=getModelVariant(
        current3DModel.buildingId,
        current3DModel.modelId
    );
    if(model)applyModelDefaultCamera(model,true);
});
function load3DModel(building,model){
    if(!building||!model||!main3DViewer)return;
    state.viewerBuildingId=building.id;
    state.viewerModelId=model.id;
    current3DModel={
        buildingId:building.id,modelId:model.id,src:model.src
    };
    applyModelDefaultCamera(model,true);
    renderModelSwitch({
        building,
        activeModelId:model.id,
        containerId:"viewerModelSwitch",
        singleBadgeId:"viewerSingleModeBadge",
        onChange:modelId=>{
            const next=getModelVariant(building.id,modelId);
            if(next)load3DModel(building,next);
        }
    });
    setViewerLoading(building,model);
    cacheModel(model.src);
    if(main3DViewer.getAttribute("src")!==model.src){
        main3DViewer.setAttribute("src",model.src);
    }else{
        setViewerReady(building,model);
    }
    applyDestinationMarker();
}
main3DViewer?.addEventListener("load",()=>{
    const building=getBuildingById(current3DModel.buildingId);
    const model=getModelVariant(
        current3DModel.buildingId,current3DModel.modelId
    );
    if(building&&model){
        setViewerReady(building,model);
        applyModelDefaultCamera(model,true);
    }
});
main3DViewer?.addEventListener("error",()=>{
    const building=getBuildingById(current3DModel.buildingId);
    const model=getModelVariant(
        current3DModel.buildingId,current3DModel.modelId
    );
    if(building&&model)setViewerUnavailable(building,model);
});
function prepareViewerBuilding(
    buildingId,preferredModelId=null,scroll=true
){
    const building=getBuildingById(buildingId);
    if(!building){toast("Gedung tidak ditemukan.");return;}
    const models=building.models||[];
    if(!models.length){toast("Model belum tersedia.");return;}
    preloadBuildingModels(building);
    show("viewerCard");
    const model=getModelVariant(building.id,preferredModelId)
        ||getDefaultModelVariant(building.id)
        ||models[0];
    load3DModel(building,model);
    if(scroll){
        setTimeout(()=>{
            byId("viewerCard")?.scrollIntoView({
                behavior:"smooth",block:"start"
            });
        },50);
    }
}
on("show3DModel","click",()=>{
    const id=viewerBuildingSelect?.value;
    if(!id){
        setText("viewerMessage","Pilih gedung terlebih dahulu.");
        return;
    }
    setText("viewerMessage","");
    state.pending3DMarker=null;
    prepareViewerBuilding(id);
});
function applyDestinationMarker(){
    hide("destination3DHotspot");
    if(!state.pending3DMarker)return;
    const marker=state.pending3DMarker.marker;
    const element=byId("destination3DHotspot");
    if(!element)return;
    element.dataset.position=
        `${marker.x}m ${marker.y}m ${marker.z}m`;
    setText("destination3DLabel",state.pending3DMarker.label);
    show("destination3DHotspot");
}

/* AR PREVIEW - INDOOR / OUTDOOR */
const mainARViewer=byId("mainARViewer");
const launchARCamera=byId("launchARCamera");
let arPreviewLoaded=false;

function setARLoading(building,model){
    const title=model.viewerTitle||building.name;
    setText("arViewerTitle",title);
    setText("arCurrentModelName",title+" - "+model.name);
    setText("arPreloadDescription",model.viewerDescription);
    setText("arLoadStatus","MEMUAT MODEL AR...");
    byId("arLoadingDot").className="loading-dot loading";
    show("arLoadingOverlay");
    hide("arUnavailable");
    arPreviewLoaded=false;
    if(launchARCamera)launchARCamera.disabled=true;
}
function setARReady(building,model){
    const title=model.viewerTitle||building.name;
    setText("arViewerTitle",title);
    setText("arCurrentModelName",title+" - "+model.name);
    setText("arPreloadDescription",model.viewerDescription);
    setText("arLoadStatus","MODEL AR SIAP");
    byId("arLoadingDot").className="loading-dot ready";
    hide("arLoadingOverlay");
    hide("arUnavailable");
    arPreviewLoaded=true;
    if(launchARCamera)launchARCamera.disabled=false;
}
function setARUnavailable(building,model){
    const title=model.viewerTitle||building.name;
    setText("arViewerTitle",title);
    setText("arCurrentModelName",title+" - "+model.name);
    setText("arLoadStatus","MODEL BELUM TERSEDIA");
    byId("arLoadingDot").className="loading-dot error";
    hide("arLoadingOverlay");
    show("arUnavailable");
    arPreviewLoaded=false;
    if(launchARCamera)launchARCamera.disabled=true;
}
function loadARModel(buildingId,modelId){
    const building=getBuildingById(buildingId);
    if(!building)return;
    const model=getModelVariant(buildingId,modelId)
        ||getDefaultModelVariant(buildingId);
    if(!model)return;

    state.arBuildingId=buildingId;
    state.arModelId=model.id;
    preloadBuildingModels(building);
    show("arViewerCard");

    renderModelSwitch({
        building,
        activeModelId:model.id,
        containerId:"arModelSwitch",
        singleBadgeId:"arSingleModeBadge",
        onChange:id=>loadARModel(building.id,id)
    });

    setARLoading(building,model);
    if(mainARViewer){
        if(mainARViewer.getAttribute("src")===model.src){
            if(mainARViewer.loaded){
                setARReady(building,model);
            }
        }else{
            mainARViewer.setAttribute("src",model.src);
        }
    }
}
mainARViewer?.addEventListener("load",()=>{
    const building=getBuildingById(state.arBuildingId);
    const model=getModelVariant(
        state.arBuildingId,state.arModelId
    );
    if(building&&model)setARReady(building,model);
});
mainARViewer?.addEventListener("error",()=>{
    const building=getBuildingById(state.arBuildingId);
    const model=getModelVariant(
        state.arBuildingId,state.arModelId
    );
    if(building&&model)setARUnavailable(building,model);
});
on("prepareMainAR","click",()=>{
    const buildingId=arBuildingSelect?.value;
    if(!buildingId){
        setText("arMessage","Pilih gedung terlebih dahulu.");
        return;
    }
    setText("arMessage","");
    const model=getDefaultModelVariant(buildingId);
    if(!model)return;
    loadARModel(buildingId,model.id);
    setTimeout(()=>{
        byId("arViewerCard")?.scrollIntoView({
            behavior:"smooth",block:"start"
        });
    },60);
});
on("launchARCamera","click",()=>{
    if(!arPreviewLoaded){
        setText("arMessage","Tunggu model selesai dimuat.");
        return;
    }
    const building=getBuildingById(state.arBuildingId);
    const model=getModelVariant(
        state.arBuildingId,state.arModelId
    );
    if(!building||!model)return;
    window.FT_WEBAR?.start(
        model.src,
        model.viewerTitle||building.name
    );
});

/* DIREKTORI */
function locationForBuilding(building){
    return locations.find(item=>
        item.type==="building"&&item.id===building.id
    )||null;
}
function locationForRoom(room){
    return locations.find(item=>
        item.type==="room"&&item.id===room.id
    )||null;
}
function closeDirectoryRoomItem(item){
    if(!item)return;
    item.classList.remove("open");
    item.querySelector(".room-toggle-button")
        ?.setAttribute("aria-expanded","false");
    item.querySelector(".room-actions")
        ?.classList.add("hidden");
}
function closeDirectoryBuildingCard(article){
    if(!article)return;
    article.classList.remove("open");
    article.querySelector(".building-button")
        ?.setAttribute("aria-expanded","false");
    article.querySelectorAll(".room-item.open")
        .forEach(closeDirectoryRoomItem);
}
function closeOtherDirectoryRooms(current){
    document.querySelectorAll(".directory .room-item.open")
        .forEach(item=>{
            if(item!==current)closeDirectoryRoomItem(item);
        });
}
function closeOtherDirectoryBuildings(current){
    document.querySelectorAll(".directory .building-card.open")
        .forEach(item=>{
            if(item!==current)closeDirectoryBuildingCard(item);
        });
}
function renderRoomList(roomList,container){
    if(!container)return;
    container.innerHTML="";
    if(!roomList.length)return;
    const grid=document.createElement("div");
    grid.className="room-grid";
    roomList.forEach(room=>{
        const location=locationForRoom(room);
        const item=document.createElement("div");
        item.className="room-item";
        const actionsId=`directory-room-actions-${room.id}`;
        const hasTendik=room.buildingId==="biro-ft"&&
            Array.isArray(room.tendik)&&room.tendik.length>0;

        item.innerHTML=`
            <button type="button"
                    class="room-row room-toggle-button"
                    aria-expanded="false"
                    aria-controls="${actionsId}">
                <span class="room-name-wrap">
                    <span class="room-name"></span>
                    <span class="room-unit-slot"></span>
                </span>
                <span class="room-chevron" aria-hidden="true">›</span>
            </button>
            <div id="${actionsId}" class="room-actions hidden">
                <button type="button" class="room-info">Informasi</button>
                <button type="button" class="room-nav">Petunjuk Arah</button>
                ${hasTendik
                    ?'<button type="button" class="room-tendik">Tendik</button>'
                    :""}
            </div>
        `;
        item.querySelector(".room-name").textContent=room.name;
        item.querySelector(".room-unit-slot").innerHTML=
            renderUnitMarkup(room.units);

        const toggle=item.querySelector(".room-toggle-button");
        const actions=item.querySelector(".room-actions");
        toggle.addEventListener("click",()=>{
            const expanded=
                toggle.getAttribute("aria-expanded")!=="true";
            closeOtherDirectoryRooms(item);
            toggle.setAttribute("aria-expanded",String(expanded));
            actions.classList.toggle("hidden",!expanded);
            item.classList.toggle("open",expanded);
        });
        item.querySelector(".room-info")
            .addEventListener("click",()=>openInfo(location));
        item.querySelector(".room-nav")
            .addEventListener("click",()=>{
                openNavigationWithDestination(location);
            });
        item.querySelector(".room-tendik")
            ?.addEventListener("click",()=>openTendik(room));
        grid.appendChild(item);
    });
    container.appendChild(grid);
}
function renderLaboratory(roomList,container){
    const floorButtons=document.createElement("div");
    floorButtons.className="floor-buttons";
    const roomContainer=document.createElement("div");
    [1,2,3].forEach(floor=>{
        const button=document.createElement("button");
        button.type="button";
        button.className="floor-button";
        button.textContent=`Lantai ${floor}`;
        button.addEventListener("click",()=>{
            Array.from(floorButtons.children).forEach(element=>{
                element.classList.remove("active");
            });
            button.classList.add("active");
            renderRoomList(
                roomList.filter(room=>room.floor===floor),
                roomContainer
            );
        });
        floorButtons.appendChild(button);
    });
    container.appendChild(floorButtons);
    container.appendChild(roomContainer);
    floorButtons.firstElementChild?.click();
}
function renderDirectory(){
    const container=byId("directoryContainer");
    if(!container)return;
    container.innerHTML="";
    buildings.forEach((building,index)=>{
        const buildingRooms=rooms.filter(
            room=>room.buildingId===building.id
        );
        const location=locationForBuilding(building);
        const article=document.createElement("article");
        article.className="building-card";
        article.innerHTML=`
            <button class="building-button"
                    type="button"
                    aria-expanded="false"
                    aria-controls="directory-building-content-${building.id}">
                <span class="building-number">
                    ${String(index+1).padStart(2,"0")}
                </span>
                <span>
                    <strong>${escapeHtml(building.name)}</strong>
                </span>
                <span>›</span>
            </button>
            <div id="directory-building-content-${building.id}"
                 class="building-content"></div>
        `;
        const header=article.querySelector(".building-button");
        const content=article.querySelector(".building-content");
        header.addEventListener("click",()=>{
            const expanded=!article.classList.contains("open");
            closeOtherDirectoryBuildings(article);
            article.classList.toggle("open",expanded);
            header.setAttribute(
                "aria-expanded",String(expanded)
            );
        });

        const hasLibraryTendik=
            building.id==="perpustakaan-ft"&&
            Array.isArray(building.tendik)&&
            building.tendik.length>0;

        const actions=document.createElement("div");
        actions.className="building-actions";
        actions.innerHTML=`
            <button class="button button-primary building-info"
                    type="button">Informasi</button>
            <button class="button button-primary building-nav"
                    type="button">Petunjuk Arah</button>
            ${hasLibraryTendik
                ?`<button class="button button-primary building-tendik"
                           type="button">Tendik</button>`
                :""}
        `;
        content.appendChild(actions);
        actions.querySelector(".building-info")
            .addEventListener("click",()=>openInfo(location));
        actions.querySelector(".building-nav")
            .addEventListener("click",()=>{
                openNavigationWithDestination(location);
            });
        actions.querySelector(".building-tendik")
            ?.addEventListener("click",()=>openTendik(location));

        if(buildingRooms.length){
            const roomHolder=document.createElement("div");
            content.appendChild(roomHolder);
            if(building.id==="laboratorium-ft"){
                renderLaboratory(buildingRooms,roomHolder);
            }else{
                renderRoomList(buildingRooms,roomHolder);
            }
        }
        container.appendChild(article);
    });
}

/* NAVIGATION ENGINE (DIPERTAHANKAN) */
function setStep(step){
    ["stepTarget","stepPosition","stepRoute","stepNavigation"]
        .forEach((id,index)=>{
            byId(id)?.classList.toggle("active",index+1<=step);
        });
}
function getImageContentBox(container,image){
    if(!container||!image)return null;
    const cw=container.clientWidth;
    const ch=container.clientHeight;
    const nw=image.naturalWidth||cw;
    const nh=image.naturalHeight||ch;
    if(!cw||!ch||!nw||!nh)return null;
    const scale=Math.min(cw/nw,ch/nh);
    const width=nw*scale,height=nh*scale;
    return {
        left:(cw-width)/2,
        top:(ch-height)/2,
        width,height
    };
}
function fitContainerToImage(container,image){
    if(!container||!image?.naturalWidth||!image.naturalHeight)return;
    container.style.aspectRatio=
        `${image.naturalWidth} / ${image.naturalHeight}`;
}
function fitSvgToImage(svg,container,image){
    if(!svg||!container||!image)return;
    const box=getImageContentBox(container,image);
    if(!box)return;
    Object.assign(svg.style,{
        inset:"auto",
        left:box.left+"px",
        top:box.top+"px",
        width:box.width+"px",
        height:box.height+"px"
    });
    svg.setAttribute("viewBox",`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`);
    svg.setAttribute("preserveAspectRatio","none");
}
function positionElementOnImage(element,point,container,image){
    if(!element||!point||!container||!image)return;
    const box=getImageContentBox(container,image);
    if(!box)return;
    element.style.left=
        box.left+point.x/MAP_WIDTH*box.width+"px";
    element.style.top=
        box.top+point.y/MAP_HEIGHT*box.height+"px";
}
function positionSelectionMapElement(element,point){
    positionElementOnImage(
        element,point,byId("navigationMap"),
        byId("navigationMapImage")
    );
}
function positionLiveMapElement(element,point){
    const container=byId("liveMapContent");
    if(!container)return;
    positionElementOnImage(
        element,point,container,
        container.querySelector(".live-map-background")
    );
}
function syncNavigationMapGeometry(){
    const container=byId("navigationMap");
    const image=byId("navigationMapImage");
    if(!container||!image)return;
    fitContainerToImage(container,image);
    fitSvgToImage(
        container.querySelector(".route-svg"),container,image
    );
    if(state.routeResult){
        positionSelectionMapElement(
            byId("userMarker"),state.routeResult.startSnap.point
        );
        positionSelectionMapElement(
            byId("entranceMarker"),state.routeResult.entrance
        );
    }
}
function syncLiveMapGeometry(){
    const container=byId("liveMapContent");
    const image=container?.querySelector(".live-map-background");
    if(!container||!image)return;
    fitContainerToImage(container,image);
    fitSvgToImage(
        container.querySelector(".live-route-svg"),container,image
    );
    if(state.routeResult){
        positionLiveMapElement(
            byId("liveUserMarker"),state.routeResult.startSnap.point
        );
        positionLiveMapElement(
            byId("liveDestinationMarker"),state.routeResult.entrance
        );
        renderLiveBuildingMarkers();
    }
}
function syncAllMapGeometry(){
    syncNavigationMapGeometry();
    syncLiveMapGeometry();
}
function resetNavigation(){
    stopGpsTracking();
    state.destination=null;
    state.clickedPosition=null;
    state.routeResult=null;
    if(byId("navigationSearch"))byId("navigationSearch").value="";
    byId("activeRoute")?.setAttribute("points","");
    [
        "mapSection","selectedDestination","routeFoundBox",
        "userMarker","entranceMarker","resetPosition"
    ].forEach(hide);
    show("mapInstructionArea");
    setStep(1);
    const results=byId("navigationSearchResults");
    if(results){
        results.innerHTML=
            '<div class="search-empty">Ketik nama gedung atau ruangan tujuan.</div>';
    }
}
function selectDestination(location){
    if(!location)return;
    state.destination=location;
    if(byId("navigationSearch")){
        byId("navigationSearch").value=location.name;
    }
    setText("selectedDestinationName",location.name);
    setText(
        "selectedDestinationParent",
        location.parent||"Fakultas Teknik UISU"
    );
    show("selectedDestination");
    byId("navigationSearchResults").innerHTML="";
    setText(
        "mapHeadingTitle",
        `Tap pada denah sesuai posisi Anda sekarang, lalu sistem akan memberikan jalur terdekat menuju ${location.name}.`
    );
    show("mapInstructionArea");
    show("mapSection");
    ["routeFoundBox","userMarker","entranceMarker","resetPosition"]
        .forEach(hide);
    byId("activeRoute")?.setAttribute("points","");
    setStep(2);
    setTimeout(()=>{
        syncNavigationMapGeometry();
        byId("mapSection")?.scrollIntoView({
            behavior:"smooth",block:"start"
        });
    },80);
}
on("navigationSearch","input",event=>{
    const value=event.target.value;
    const container=byId("navigationSearchResults");
    if(!container)return;
    if(!value.trim()){
        container.innerHTML=
            '<div class="search-empty">Ketik nama gedung atau ruangan tujuan.</div>';
        return;
    }
    renderSearchResults(
        searchLocations(value),container,selectDestination
    );
});

/* GRAPH DAN DIJKSTRA */
function pointDistance(a,b){
    return Math.hypot(a.x-b.x,a.y-b.y);
}
const graph={};
Object.keys(mapNodes).forEach(id=>{graph[id]=[];});
const preparedEdges=mapEdges.map(edge=>{
    const points=edge.points.map(p=>({x:p[0],y:p[1]}));
    let length=0;
    const cumulative=[0];
    for(let i=0;i<points.length-1;i++){
        length+=pointDistance(points[i],points[i+1]);
        cumulative.push(length);
    }
    return {...edge,points,length,cumulative};
});
const edgeById={};
preparedEdges.forEach(edge=>{
    edgeById[edge.id]=edge;
    graph[edge.from]?.push({
        node:edge.to,edgeId:edge.id,weight:edge.length
    });
    graph[edge.to]?.push({
        node:edge.from,edgeId:edge.id,weight:edge.length
    });
});
function projectPointToSegment(point,a,b){
    const dx=b.x-a.x,dy=b.y-a.y;
    const lengthSquared=dx*dx+dy*dy;
    const t=lengthSquared
        ?Math.max(0,Math.min(1,
            ((point.x-a.x)*dx+(point.y-a.y)*dy)/lengthSquared
        )):0;
    const projected={x:a.x+dx*t,y:a.y+dy*t};
    return {
        point:projected,
        t,
        distance:pointDistance(point,projected)
    };
}
function snapToRoute(point){
    let best=null;
    preparedEdges.forEach(edge=>{
        for(let i=0;i<edge.points.length-1;i++){
            const a=edge.points[i],b=edge.points[i+1];
            const projection=projectPointToSegment(point,a,b);
            const segmentLength=pointDistance(a,b);
            const along=edge.cumulative[i]+segmentLength*projection.t;
            if(!best||projection.distance<best.distance){
                best={
                    edge,segmentIndex:i,
                    point:projection.point,
                    distance:projection.distance,
                    along,
                    distanceToFrom:along,
                    distanceToTo:edge.length-along
                };
            }
        }
    });
    return best;
}
function dijkstra(start,target){
    const ids=Object.keys(graph);
    if(!ids.includes(start)||!ids.includes(target))return null;
    const distance={},previous={},previousEdge={};
    ids.forEach(id=>{
        distance[id]=Infinity;
        previous[id]=null;
        previousEdge[id]=null;
    });
    distance[start]=0;
    const remaining=new Set(ids);
    while(remaining.size){
        let current=null,minimum=Infinity;
        remaining.forEach(id=>{
            if(distance[id]<minimum){
                minimum=distance[id];
                current=id;
            }
        });
        if(current===null||minimum===Infinity)break;
        if(current===target)break;
        remaining.delete(current);
        graph[current].forEach(next=>{
            if(!remaining.has(next.node))return;
            const cost=distance[current]+next.weight;
            if(cost<distance[next.node]){
                distance[next.node]=cost;
                previous[next.node]=current;
                previousEdge[next.node]=next.edgeId;
            }
        });
    }
    if(distance[target]===Infinity)return null;
    const nodes=[],edges=[];
    let cursor=target;
    while(cursor){
        nodes.unshift(cursor);
        if(cursor===start)break;
        edges.unshift(previousEdge[cursor]);
        cursor=previous[cursor];
    }
    return {distance:distance[target],nodes,edges};
}
function pointsFromSnapToEndpoint(snap,endpoint){
    const points=snap.edge.points;
    const output=[{...snap.point}];
    if(endpoint===snap.edge.from){
        output.push(points[snap.segmentIndex]);
        for(let i=snap.segmentIndex-1;i>=0;i--){
            output.push(points[i]);
        }
    }else{
        output.push(points[snap.segmentIndex+1]);
        for(let i=snap.segmentIndex+2;i<points.length;i++){
            output.push(points[i]);
        }
    }
    return output;
}
function routeNodePolyline(route){
    const output=[];
    route.edges.forEach((edgeId,index)=>{
        const edge=edgeById[edgeId];
        if(!edge)return;
        const forward=edge.from===route.nodes[index];
        let pts=forward
            ?edge.points.slice()
            :edge.points.slice().reverse();
        if(output.length)pts=pts.slice(1);
        output.push(...pts);
    });
    return output;
}
function dedupePoints(points){
    const output=[];
    points.forEach(point=>{
        const last=output[output.length-1];
        if(!last||pointDistance(last,point)>.5){
            output.push(point);
        }
    });
    return output;
}
function buildRoute(clickedPoint){
    if(!state.destination)return null;
    const entrance=getNavigationEntrance(state.destination);
    if(!entrance)return null;
    const snap=snapToRoute(clickedPoint);
    if(!snap)return null;

    const fromRoute=dijkstra(snap.edge.from,entrance.nodeId);
    const toRoute=dijkstra(snap.edge.to,entrance.nodeId);
    const candidates=[];
    if(fromRoute){
        candidates.push({
            endpoint:snap.edge.from,
            route:fromRoute,
            cost:snap.distanceToFrom+fromRoute.distance
        });
    }
    if(toRoute){
        candidates.push({
            endpoint:snap.edge.to,
            route:toRoute,
            cost:snap.distanceToTo+toRoute.distance
        });
    }
    if(!candidates.length)return null;
    candidates.sort((a,b)=>a.cost-b.cost);
    const best=candidates[0];
    const startPart=pointsFromSnapToEndpoint(snap,best.endpoint);
    const graphPart=routeNodePolyline(best.route);
    return {
        startSnap:snap,
        entrance,
        graphDistance:best.cost,
        points:dedupePoints([
            ...startPart,
            ...graphPart,
            {x:entrance.x,y:entrance.y}
        ])
    };
}
on("navigationMap","pointerdown",event=>{
    if(!state.destination)return;
    const map=byId("navigationMap");
    const image=byId("navigationMapImage");
    const rect=map.getBoundingClientRect();
    const box=getImageContentBox(map,image);
    if(!box)return;
    const x=event.clientX-rect.left;
    const y=event.clientY-rect.top;
    if(x<box.left||x>box.left+box.width||
       y<box.top||y>box.top+box.height)return;
    const point={
        x:(x-box.left)/box.width*MAP_WIDTH,
        y:(y-box.top)/box.height*MAP_HEIGHT
    };
    const route=buildRoute(point);
    if(!route){
        toast("Rute belum ditemukan.");
        return;
    }
    state.clickedPosition=point;
    state.routeResult=route;
    byId("activeRoute")?.setAttribute(
        "points",route.points.map(p=>`${p.x},${p.y}`).join(" ")
    );
    positionSelectionMapElement(
        byId("userMarker"),route.startSnap.point
    );
    positionSelectionMapElement(
        byId("entranceMarker"),route.entrance
    );
    show("userMarker");
    show("entranceMarker");
    hide("mapInstructionArea");
    show("routeFoundBox");
    show("resetPosition");
    setStep(3);
});
on("resetPosition","click",()=>{
    state.clickedPosition=null;
    state.routeResult=null;
    byId("activeRoute")?.setAttribute("points","");
    ["userMarker","entranceMarker","routeFoundBox","resetPosition"]
        .forEach(hide);
    show("mapInstructionArea");
    setStep(2);
});

/* PETUNJUK RUTE */
function turnAngle(a,b,c){
    const ax=b.x-a.x,ay=b.y-a.y;
    const bx=c.x-b.x,by=c.y-b.y;
    return Math.atan2(
        ax*by-ay*bx,
        ax*bx+ay*by
    )*180/Math.PI;
}
function simplifyInstructionPoints(points){
    if(!points||points.length<=2)return points?.slice()||[];
    const result=[points[0]];
    for(let i=1;i<points.length-1;i++){
        if(Math.abs(turnAngle(
            points[i-1],points[i],points[i+1]
        ))>=28){
            result.push(points[i]);
        }
    }
    result.push(points[points.length-1]);
    return result;
}
function createNavigationInstructions(){
    if(!state.routeResult||!state.destination)return [];
    const points=simplifyInstructionPoints(
        state.routeResult.points
    );
    const output=[{
        icon:"●",title:"Lokasi Anda saat ini",
        description:"Mulai dari posisi yang Anda tandai pada denah."
    }];
    for(let i=1;i<points.length-1;i++){
        const angle=turnAngle(
            points[i-1],points[i],points[i+1]
        );
        if(angle>28){
            output.push({
                icon:"↱",title:"Belok kanan",
                description:"Ikuti jalur hingga persimpangan berikutnya."
            });
        }else if(angle<-28){
            output.push({
                icon:"↰",title:"Belok kiri",
                description:"Ikuti jalur hingga persimpangan berikutnya."
            });
        }
    }
    output.push({
        icon:"◎",title:"Entrance tujuan di depan",
        description:state.routeResult.entrance.name
    });
    output.push({
        icon:"✓",title:"Anda sudah tiba",
        description:
            `Anda sudah tiba di entrance menuju ${state.destination.name}.`
    });
    return output;
}
function renderLiveBuildingMarkers(){
    const container=byId("liveBuildingMarkers");
    if(!container)return;
    container.innerHTML="";
    buildings.forEach(building=>{
        if(!building.liveMarker)return;
        const marker=document.createElement("div");
        marker.className="live-building-marker";
        marker.innerHTML=`<span></span><label>${escapeHtml(building.name)}</label>`;
        container.appendChild(marker);
        positionLiveMapElement(marker,building.liveMarker);
    });
}
function renderRouteDetail(){
    const container=byId("routeInstructionList");
    if(!container)return;
    container.innerHTML="";
    state.liveInstructions.forEach(item=>{
        const row=document.createElement("div");
        row.className="route-instruction-item";
        row.innerHTML=`
            <div class="route-step-icon">${item.icon}</div>
            <div class="route-step-copy">
                <strong>${escapeHtml(item.title)}</strong>
                <span>${escapeHtml(item.description)}</span>
            </div>
        `;
        container.appendChild(row);
    });
}
function renderLiveNavigation(){
    if(!state.routeResult||!state.destination)return;
    const route=state.routeResult;
    byId("liveRoute")?.setAttribute(
        "points",route.points.map(p=>`${p.x},${p.y}`).join(" ")
    );
    syncLiveMapGeometry();
    positionLiveMapElement(
        byId("liveUserMarker"),route.startSnap.point
    );
    positionLiveMapElement(
        byId("liveDestinationMarker"),route.entrance
    );
    show("liveUserMarker");
    show("liveDestinationMarker");
    setText("liveDestinationMarkerLabel",state.destination.name);
    setText("liveTargetName",state.destination.name);
    setText("liveRouteDestination",state.destination.name);
    setText("liveRouteEntrance",route.entrance.name);
    renderLiveBuildingMarkers();
    state.liveInstructions=createNavigationInstructions();
    renderRouteDetail();
    const next=state.liveInstructions.find(item=>
        item.title!=="Lokasi Anda saat ini"
    );
    if(next){
        setText("liveNextInstruction",next.title);
        setText("liveDirectionIcon",next.icon);
    }
}

/* GPS */
function solveAffine(calibration,lat,lon){
    if(!Array.isArray(calibration)||calibration.length<3){
        return null;
    }
    const [p1,p2,p3]=calibration;
    const determinant=
        p1.lon*(p2.lat-p3.lat)-
        p1.lat*(p2.lon-p3.lon)+
        (p2.lon*p3.lat-p3.lon*p2.lat);
    if(Math.abs(determinant)<1e-12)return null;
    function solve(v1,v2,v3){
        const a=(
            v1*(p2.lat-p3.lat)+
            v2*(p3.lat-p1.lat)+
            v3*(p1.lat-p2.lat)
        )/determinant;
        const b=(
            v1*(p3.lon-p2.lon)+
            v2*(p1.lon-p3.lon)+
            v3*(p2.lon-p1.lon)
        )/determinant;
        const c=(
            v1*(p2.lon*p3.lat-p3.lon*p2.lat)+
            v2*(p3.lon*p1.lat-p1.lon*p3.lat)+
            v3*(p1.lon*p2.lat-p2.lon*p1.lat)
        )/determinant;
        return {a,b,c};
    }
    const cx=solve(p1.x,p2.x,p3.x);
    const cy=solve(p1.y,p2.y,p3.y);
    return {
        x:cx.a*lon+cx.b*lat+cx.c,
        y:cy.a*lon+cy.b*lat+cy.c
    };
}
function stopGpsTracking(){
    if(state.gpsWatchId!==null&&navigator.geolocation){
        navigator.geolocation.clearWatch(state.gpsWatchId);
    }
    state.gpsWatchId=null;
}
function startGpsTracking(){
    stopGpsTracking();
    if(mapCalibration.length<3)return;
    if(!navigator.geolocation)return;
    state.gpsWatchId=navigator.geolocation.watchPosition(
        position=>{
            const point=solveAffine(
                mapCalibration,
                position.coords.latitude,
                position.coords.longitude
            );
            if(!point)return;
            const snap=snapToRoute(point);
            positionLiveMapElement(
                byId("liveUserMarker"),snap?.point||point
            );
        },
        error=>console.warn("GPS:",error),
        {
            enableHighAccuracy:true,
            maximumAge:1000,
            timeout:10000
        }
    );
}
on("startNavigation","click",()=>{
    if(!state.routeResult||!state.destination){
        toast("Pilih posisi terlebih dahulu.");
        return;
    }
    showPage("navigationActive");
    setTimeout(()=>{
        syncLiveMapGeometry();
        renderLiveNavigation();
        startGpsTracking();
    },80);
    setStep(4);
});
on("toggleRouteDetail","click",()=>{
    byId("routeDetailPanel")?.classList.toggle("hidden");
});
on("endRoute","click",()=>{
    stopGpsTracking();
    resetNavigation();
    state.pageHistory=[];
    showPage("navigation",false);
    toast("Navigasi telah diakhiri.");
});
function showDestinationIn3D(){
    if(!state.destination)return;
    const location=state.destination;
    const buildingId=location.buildingId||location.id;
    const building=getBuildingById(buildingId);
    if(!building)return;
    let model=location.type==="room"
        ?getModelVariant(building.id,"indoor")
        :null;
    if(!model)model=getDefaultModelVariant(building.id);
    showPage("viewer");
    if(viewerBuildingSelect){
        viewerBuildingSelect.value=building.id;
    }
    state.pending3DMarker=location.modelMarker
        ?{marker:location.modelMarker,label:location.name}
        :null;
    prepareViewerBuilding(building.id,model?.id,false);
}
on("showDestination3D","click",showDestinationIn3D);

/* MENU */
function openNavigationWithDestination(location=null){
    if(!NAVIGATION_ENABLED)return;
    showPage("navigation");
    resetNavigation();
    if(location)selectDestination(location);
}
["menu3D","feature3D"].forEach(id=>{
    on(id,"click",()=>showPage("viewer"));
});
["menuAR","featureAR"].forEach(id=>{
    on(id,"click",()=>showPage("ar"));
});
["menuNavigation","featureNav"].forEach(id=>{
    on(id,"click",()=>openNavigationWithDestination());
});
["menuDirectory","featureDirectory"].forEach(id=>{
    on(id,"click",()=>showPage("directory"));
});

/* TOAST */
let toastTimer=null;
function toast(message){
    const element=byId("toast");
    if(!element)return;
    element.textContent=message;
    element.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer=setTimeout(()=>{
        element.classList.remove("show");
    },2600);
}
document.addEventListener("keydown",event=>{
    if(event.key!=="Escape")return;
    closeDrawer();
    if(!byId("tendikModal")?.classList.contains("hidden")){
        closeTendik();
        return;
    }
    if(!byId("infoModal")?.classList.contains("hidden")){
        closeInfo();
        return;
    }
    if(state.currentPage!=="home")goBack();
});

/* MAP RESIZE */
function registerMapImageEvents(){
    const selection=byId("navigationMapImage");
    if(selection){
        if(selection.complete&&selection.naturalWidth){
            syncNavigationMapGeometry();
        }else{
            selection.addEventListener(
                "load",syncNavigationMapGeometry
            );
        }
    }
    const live=byId("liveMapContent")
        ?.querySelector(".live-map-background");
    if(live){
        if(live.complete&&live.naturalWidth){
            syncLiveMapGeometry();
        }else{
            live.addEventListener("load",syncLiveMapGeometry);
        }
    }
}
let resizeTimer=null;
window.addEventListener("resize",()=>{
    clearTimeout(resizeTimer);
    resizeTimer=setTimeout(syncAllMapGeometry,80);
});
window.addEventListener("orientationchange",()=>{
    setTimeout(syncAllMapGeometry,250);
});

/* INIT */
function startApp(){
    renderDirectory();
    applyFeatureVisibility();
    showSlide(0);
    showLandingModel(0);
    showPage("home",false);
    registerMapImageEvents();
    registerServiceWorker();

    const preload=()=>preloadPriorityModels();
    if("requestIdleCallback" in window){
        requestIdleCallback(preload,{timeout:2000});
    }else{
        setTimeout(preload,1000);
    }
    setTimeout(syncAllMapGeometry,120);
    console.log("FT UISU Explorer Revision 7 loaded");
}
startApp();
})();

/* =====================================================
   FULLSCREEN MODEL VIEWER
===================================================== */
(function(){
"use strict";
const card=document.getElementById("viewerCard");
const page=document.getElementById("viewerPage");
const viewer=document.getElementById("main3DViewer");
const status=document.getElementById("viewerLoadingDot");
const openButton=document.getElementById("viewerFullscreenButton");
const closeButton=document.getElementById("viewerFullscreenExit");
if(!card||!page||!viewer||!status||!openButton||!closeButton)return;
if(card.dataset.fullscreenInitialized)return;
card.dataset.fullscreenInitialized="true";

const root=document.documentElement;
const native=()=>document.fullscreenElement||
    document.webkitFullscreenElement;
const visible=()=>page.classList.contains("active")&&
    !card.classList.contains("hidden");
const ready=()=>visible()&&status.classList.contains("ready");
let current=null;

function updateButtons(){
    if(current&&!visible()){
        closeFullscreen(false);
        return;
    }
    openButton.classList.toggle("hidden",!ready()||!!current);
    closeButton.classList.toggle("hidden",!current);
}
function finish(session){
    if(current!==session)return;
    current=null;
    card.classList.remove("viewer-is-fullscreen");
    root.classList.remove("viewer-fullscreen-open");
    root.style.removeProperty("--viewer-fullscreen-scroll-top");
    card.removeAttribute("role");
    card.removeAttribute("aria-modal");
    card.removeAttribute("aria-labelledby");
    updateButtons();
    if(session.restore&&visible()){
        window.scrollTo({
            left:session.x,top:session.y,behavior:"instant"
        });
        (ready()?openButton:viewer).focus({preventScroll:true});
    }
}
async function openFullscreen(){
    if(current||!ready()||native())return;
    const session={
        x:window.scrollX,
        y:window.scrollY,
        restore:true,
        fallback:false
    };
    current=session;
    root.style.setProperty(
        "--viewer-fullscreen-scroll-top",`${-session.y}px`
    );
    root.classList.add("viewer-fullscreen-open");
    card.classList.add("viewer-is-fullscreen");
    card.setAttribute("role","dialog");
    card.setAttribute("aria-modal","true");
    card.setAttribute("aria-labelledby","viewerTitle");
    updateButtons();
    closeButton.focus({preventScroll:true});

    const request=card.requestFullscreen||
        card.webkitRequestFullscreen;
    if(request){
        try{
            await request.call(card);
            session.fallback=native()!==card;
        }catch(error){
            session.fallback=true;
        }
    }else{
        session.fallback=true;
    }
}
async function closeFullscreen(restore=true){
    if(!current)return;
    const session=current;
    if(!restore)session.restore=false;
    if(native()===card){
        const exit=document.exitFullscreen||
            document.webkitExitFullscreen;
        try{await exit?.call(document);}catch(error){}
    }
    finish(session);
}
openButton.addEventListener("click",openFullscreen);
closeButton.addEventListener("click",()=>closeFullscreen());
document.addEventListener("fullscreenchange",()=>{
    if(current&&!native()&&!current.fallback){
        finish(current);
    }
});
document.addEventListener("webkitfullscreenchange",()=>{
    if(current&&!native()&&!current.fallback){
        finish(current);
    }
});
document.addEventListener("keydown",event=>{
    if(!current)return;
    if(event.key==="Escape"){
        event.preventDefault();
        event.stopPropagation();
        closeFullscreen();
    }
},true);
const observer=new MutationObserver(updateButtons);
[page,card,status].forEach(element=>{
    observer.observe(element,{
        attributes:true,
        attributeFilter:["class"]
    });
});
viewer.addEventListener("load",updateButtons);
viewer.addEventListener("error",updateButtons);
updateButtons();
})();

/* =====================================================
   WEBAR MARKERLESS - REVISI 7
   CAMERA FALLBACK, TRACKING, INDOOR / OUTDOOR
===================================================== */
(function(){
"use strict";

const $=id=>document.getElementById(id);
const overlay=$("webarOverlay");
const canvas=$("webarCamera");
const video=$("webarPreview");
if(!overlay||!canvas||!video)return;

const ENGINE=
    "https://cdn.jsdelivr.net/npm/@8thwall/engine-binary@1/dist/xr.js";
const EXTRAS=
    "https://cdn.jsdelivr.net/npm/@8thwall/xrextras@1/dist/xrextras.js";
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const mobile=()=>/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)||
    (navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);

const s={
    active:false,
    opening:false,
    token:0,
    src:"",
    title:"",
    stream:null,
    xrRunning:false,
    hasVideo:false,
    visibleFrame:false,
    frameSamples:0,
    blankSamples:0,
    lastProbe:0,
    watchdog:null,
    THREE:null,
    Loader:null,
    Draco:null,
    Ktx:null,
    scene:null,
    camera:null,
    renderer:null,
    anchor:null,
    pivot:null,
    object:null,
    modelReady:false,
    tracking:false,
    candidate:null,
    stable:0,
    placed:false,
    lastMessage:0,
    zoom:1,
    yaw:0,
    pointers:new Map(),
    pinch:0,
    orientationAllowed:false
};

function message(heading,description){
    if(!s.active)return;
    $("webarStatus").textContent=heading;
    if(description!==undefined){
        $("webarInstructions").textContent=description;
    }
}
function errorMessage(error){
    if(error?.name==="NotAllowedError"){
        return "Akses kamera ditolak. Aktifkan izin kamera untuk situs ini di pengaturan browser.";
    }
    if(error?.name==="NotFoundError"){
        return "Kamera belakang tidak ditemukan.";
    }
    if(error?.name==="NotReadableError"){
        return "Kamera sedang digunakan aplikasi lain.";
    }
    return error?.message||String(error)||
        "Terjadi kesalahan kamera atau mesin AR.";
}
function ui(id,visible){
    $(id)?.classList.toggle("hidden",!visible);
}
function viewCanvas(visible){
    canvas.classList.toggle("webar-waiting",!visible);
    canvas.classList.toggle("webar-live",visible);
    video.classList.toggle("hidden",visible);
}
function stopPreview(){
    s.stream?.getTracks().forEach(track=>track.stop());
    s.stream=null;
    try{video.pause();}catch(error){}
    video.srcObject=null;
}
async function startPreview(token){
    if(!s.active||token!==s.token)return;
    if(!navigator.mediaDevices?.getUserMedia){
        throw new Error("Browser tidak mendukung akses kamera.");
    }
    stopPreview();
    const stream=await navigator.mediaDevices.getUserMedia({
        audio:false,
        video:{facingMode:{ideal:"environment"}}
    });
    if(!s.active||token!==s.token){
        stream.getTracks().forEach(track=>track.stop());
        return;
    }
    s.stream=stream;
    video.srcObject=stream;
    video.muted=true;
    video.setAttribute("playsinline","");
    try{await video.play();}catch(error){
        console.warn("Preview camera:",error);
    }
    viewCanvas(false);
}
function scriptOnce(id,url,globalName,timeout=30000){
    if(window[globalName]){
        return Promise.resolve(window[globalName]);
    }
    return new Promise((resolve,reject)=>{
        const script=document.getElementById(id)||
            document.createElement("script");
        let finished=false;
        const eventName=globalName==="XR8"
            ?"xrloaded"
            :"xrextrasloaded";
        let timer;
        function cleanup(){
            window.removeEventListener(eventName,ready);
            script.removeEventListener("load",ready);
            script.removeEventListener("error",failed);
            clearTimeout(timer);
        }
        function finish(error){
            if(finished)return;
            finished=true;
            cleanup();
            if(error){
                script.remove();
                reject(error);
            }else{
                resolve(window[globalName]);
            }
        }
        function ready(){
            if(window[globalName])finish();
        }
        function failed(){
            finish(new Error(
                "Gagal mengunduh "+globalName+" dari CDN."
            ));
        }
        timer=setTimeout(()=>{
            finish(new Error(
                globalName+" tidak siap dalam "+
                Math.round(timeout/1000)+" detik."
            ));
        },timeout);
        window.addEventListener(eventName,ready);
        script.addEventListener("load",ready);
        script.addEventListener("error",failed);
        if(!script.isConnected){
            script.id=id;
            script.async=true;
            script.src=url;
            script.crossOrigin="anonymous";
            if(globalName==="XR8"){
                script.dataset.preloadChunks="slam";
            }
            document.head.appendChild(script);
        }
        ready();
    });
}
async function ensureLibraries(){
    if(!s.THREE){
        const [THREE,loader]=await Promise.all([
            import("three"),
            import("three/addons/loaders/GLTFLoader.js")
        ]);
        s.THREE=THREE;
        s.Loader=loader.GLTFLoader;
        window.THREE=THREE;

        const extras=await Promise.allSettled([
            import("three/addons/loaders/DRACOLoader.js"),
            import("three/addons/loaders/KTX2Loader.js")
        ]);
        s.Draco=extras[0].status==="fulfilled"
            ?extras[0].value.DRACOLoader:null;
        s.Ktx=extras[1].status==="fulfilled"
            ?extras[1].value.KTX2Loader:null;
    }
    await scriptOnce("ft-xrextras-r7",EXTRAS,"XRExtras");
    await scriptOnce("ft-engine-r7",ENGINE,"XR8",40000);
    if(!window.XR8?.XrController||!window.XR8?.Threejs){
        throw new Error(
            "Modul SLAM atau renderer 3D tidak tersedia."
        );
    }
    if(typeof window.XR8.loadChunk==="function"){
        await Promise.race([
            Promise.resolve(window.XR8.loadChunk("slam")),
            new Promise((_,reject)=>{
                setTimeout(()=>{
                    reject(new Error("Modul SLAM tidak siap."));
                },25000);
            })
        ]);
    }
}
function attachModel(root){
    if(!s.active||!s.pivot)return;
    const THREE=s.THREE;
    root.updateMatrixWorld(true);
    const bounds=new THREE.Box3().setFromObject(root);
    if(bounds.isEmpty()){
        throw new Error("GLB tidak memiliki mesh 3D.");
    }
    const size=bounds.getSize(new THREE.Vector3());
    const center=bounds.getCenter(new THREE.Vector3());
    const scale=.9/Math.max(
        size.x,size.z,size.y*.6,.001
    );
    root.scale.multiplyScalar(scale);
    root.position.set(
        -center.x*scale,
        -bounds.min.y*scale,
        -center.z*scale
    );
    root.traverse(node=>{
        if(!node.isMesh)return;
        node.frustumCulled=false;
        node.castShadow=true;
        const materials=Array.isArray(node.material)
            ?node.material:[node.material];
        materials.filter(Boolean).forEach(material=>{
            material.needsUpdate=true;
        });
    });
    s.object=root;
    s.pivot.add(root);
    s.modelReady=true;
    message(
        "Model siap — pindai permukaan",
        "Arahkan kamera ke lantai/meja dengan pola dan pencahayaan cukup."
    );
}
function loadModel(token){
    const loader=new s.Loader();
    if(s.Draco){
        const decoder=new s.Draco();
        decoder.setDecoderPath(
            "https://www.gstatic.com/draco/v1/decoders/"
        );
        loader.setDRACOLoader(decoder);
    }
    if(s.Ktx&&s.renderer){
        const ktx=new s.Ktx();
        ktx.setTranscoderPath(
            "https://cdn.jsdelivr.net/npm/three@0.160.1/examples/jsm/libs/basis/"
        );
        ktx.detectSupport(s.renderer);
        loader.setKTX2Loader(ktx);
    }

    const source=new URL(s.src,document.baseURI);
    source.searchParams.set("arVersion","7");
    loader.load(
        source.href,
        gltf=>{
            if(!s.active||token!==s.token)return;
            try{
                attachModel(gltf.scene);
            }catch(error){
                fatal("Model tidak bisa dirender",error);
            }
        },
        undefined,
        error=>{
            if(s.active&&token===s.token){
                fatal("GLB gagal dimuat",error);
            }
        }
    );
}
function sceneStart(token){
    const xr=window.XR8;
    const THREE=s.THREE;
    const {scene,camera,renderer}=xr.Threejs.xrScene();
    if(!scene||!camera||!renderer){
        throw new Error("Scene WebGL tidak berhasil dibuat.");
    }
    s.scene=scene;
    s.camera=camera;
    s.renderer=renderer;

    // Jangan hapus gambar dari GlTextureRenderer.
    renderer.autoClear=false;
    renderer.autoClearColor=false;
    renderer.autoClearDepth=true;
    scene.background=null;
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.shadowMap.enabled=true;

    scene.add(
        new THREE.HemisphereLight(
            0xffffff,0xb5cbd0,2
        )
    );
    const sun=new THREE.DirectionalLight(
        0xffffff,2
    );
    sun.position.set(3,6,4);
    sun.castShadow=true;
    scene.add(sun);

    s.anchor=new THREE.Group();
    s.anchor.visible=false;
    scene.add(s.anchor);

    s.pivot=new THREE.Group();
    s.anchor.add(s.pivot);

    const shadow=new THREE.Mesh(
        new THREE.PlaneGeometry(2.5,2.5),
        new THREE.ShadowMaterial({opacity:.19})
    );
    shadow.rotation.x=-Math.PI/2;
    shadow.position.y=.003;
    shadow.receiveShadow=true;
    s.anchor.add(shadow);

    camera.position.set(0,1.6,0);
    xr.XrController.updateCameraProjectionMatrix({
        origin:camera.position,
        facing:camera.quaternion
    });
    loadModel(token);
}
function valid(point){
    return point&&
        [point.x,point.y,point.z].every(Number.isFinite);
}
function surfacePoint(reality){
    if(!s.camera||
       !reality||
       reality.trackingStatus!=="NORMAL")return null;
    const xr=window.XR8;
    if(typeof xr?.XrController?.hitTest!=="function"){
        return null;
    }
    const hits=[];
    for(const [u,v] of [
        [.50,.63],[.40,.66],[.60,.66],[.50,.75]
    ]){
        try{
            const result=xr.XrController.hitTest(
                u,v,["FEATURE_POINT"]
            )||[];
            const hit=result.find(item=>
                valid(item.position)
            );
            if(hit)hits.push(hit.position);
        }catch(error){}
    }
    if(hits.length<2)return null;
    const heights=hits.map(p=>p.y).sort((a,b)=>a-b);
    const y=heights[Math.floor(heights.length/2)];
    const same=hits.filter(p=>Math.abs(p.y-y)<.10);
    if(same.length<2||s.camera.position.y-y<.15)return null;

    const point=new s.THREE.Vector3(
        same.reduce((sum,p)=>sum+p.x,0)/same.length,
        y,
        same.reduce((sum,p)=>sum+p.z,0)/same.length
    );
    const distance=s.camera.position.distanceTo(point);
    return distance>.25&&distance<5?point:null;
}
function place(){
    if(!s.modelReady||
       !s.visibleFrame||
       !s.tracking||
       !s.candidate||
       !s.anchor)return;

    s.anchor.position.copy(s.candidate);
    s.anchor.visible=true;
    s.placed=true;
    ui("webarPlace",false);
    ui("webarReticle",false);
    ui("webarReset",true);
    message(
        "Model ditempatkan di permukaan",
        "Satu jari untuk memutar, dua jari untuk zoom. Geser posisi ponsel untuk melihat sudut berbeda."
    );
}
function trackingUpdate(reality){
    if(!s.active||!s.modelReady)return;
    s.tracking=reality?.trackingStatus==="NORMAL";

    if(s.placed){
        if(s.anchor){
            s.anchor.visible=s.tracking&&s.visibleFrame;
        }
        if(!s.tracking&&
           performance.now()-s.lastMessage>1500){
            s.lastMessage=performance.now();
            message(
                "Tracking hilang sementara",
                "Gerakkan kamera ke area yang sudah dipindai sebelumnya."
            );
        }
        return;
    }
    if(!s.visibleFrame)return;
    const point=surfacePoint(reality);

    if(!point){
        s.stable=0;
        s.candidate=null;
        ui("webarPlace",false);
        ui("webarReticle",false);

        if(performance.now()-s.lastMessage>1300){
            s.lastMessage=performance.now();
            message(
                s.tracking
                    ?"Mencari bidang datar..."
                    :"Memulai pelacakan SLAM...",
                "Arahkan kamera ke bawah perlahan pada lantai atau meja yang bertekstur."
            );
        }
        return;
    }

    if(s.candidate&&
       s.candidate.distanceTo(point)<.14){
        s.candidate.lerp(point,.24);
        s.stable++;
    }else{
        s.candidate=point.clone();
        s.stable=1;
    }

    const ready=s.stable>=4;
    ui("webarPlace",ready);
    ui("webarReticle",ready);
    if(s.stable>=16){
        place();
        return;
    }
    if(performance.now()-s.lastMessage>1300){
        s.lastMessage=performance.now();
        message(
            "Bidang ditemukan, menstabilkan...",
            "Tahan posisi atau tekan Tempatkan Model."
        );
    }
}
function sampleVideoFrame(){
    if(!s.active||!s.hasVideo||!s.renderer)return;
    const now=performance.now();
    if(now-s.lastProbe<1200)return;
    s.lastProbe=now;
    try{
        const gl=s.renderer.getContext();
        const width=gl.drawingBufferWidth;
        const height=gl.drawingBufferHeight;
        if(width<10||height<10)return;
        const rgba=new Uint8Array(4);
        let bright=0;
        for(const [x,y] of [
            [.2,.2],[.5,.35],[.7,.6],[.4,.8],[.85,.75]
        ]){
            gl.readPixels(
                Math.round(width*x),
                Math.round(height*y),
                1,1,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                rgba
            );
            if(rgba[0]+rgba[1]+rgba[2]>42)bright++;
        }
        s.frameSamples++;
        if(bright){
            s.visibleFrame=true;
            s.blankSamples=0;
            if(canvas.classList.contains("webar-waiting")){
                viewCanvas(true);
                message(
                    "Kamera AR aktif",
                    "Memuat model dan mencari bidang datar..."
                );
            }
        }else{
            s.blankSamples++;
            if(s.blankSamples>=6&&!s.visibleFrame){
                fallback(
                    "Lapisan kamera XR berwarna hitam. Pratinjau kamera biasa diaktifkan; tracking AR belum tersedia."
                );
            }
        }
    }catch(error){
        s.visibleFrame=true;
        viewCanvas(true);
    }
}
function pipeline(token){
    return {
        name:"ft-uisu-r7-slam-scene",
        onStart:()=>{
            if(!s.active||token!==s.token)return;
            try{
                sceneStart(token);
            }catch(error){
                fatal("Renderer AR gagal dibuat",error);
            }
        },
        onCameraStatusChange:({status,error})=>{
            if(!s.active||token!==s.token)return;
            if(status==="hasVideo"){
                s.hasVideo=true;
                message(
                    "Kamera XR terhubung",
                    "Memeriksa tampilan video sebelum membuka lapisan AR..."
                );
            }else if(status==="failed"){
                fatal("Kamera XR gagal",error);
            }else if(status==="requesting"){
                message(
                    "Mengaktifkan kamera XR...",
                    "Izinkan kamera bila diminta browser."
                );
            }
        },
        onUpdate:({processCpuResult})=>{
            if(s.active&&token===s.token){
                trackingUpdate(processCpuResult?.reality);
            }
        },
        onRender:()=>{
            if(s.active&&token===s.token){
                sampleVideoFrame();
            }
        },
        onException:error=>{
            if(s.active&&token===s.token){
                fatal("Mesin WebAR gagal",error);
            }
        }
    };
}
function stopXR(){
    clearTimeout(s.watchdog);
    s.watchdog=null;
    if(s.xrRunning){
        try{window.XR8?.stop?.();}catch(error){
            console.warn(error);
        }
        try{
            window.XR8?.clearCameraPipelineModules?.();
        }catch(error){}
    }
    s.xrRunning=false;
    s.hasVideo=false;
    s.visibleFrame=false;
    s.scene=null;
    s.camera=null;
    s.renderer=null;
    s.anchor=null;
    s.pivot=null;
    s.object=null;
    s.modelReady=false;
}
async function fallback(reason){
    if(!s.active)return;
    const token=s.token;
    stopXR();
    s.placed=false;
    viewCanvas(false);
    ui("webarRetry",true);
    ui("webarPlace",false);
    ui("webarReset",false);
    message(
        "Kamera pratinjau — AR belum aktif",
        reason
    );
    try{
        await startPreview(token);
    }catch(error){
        if(s.active&&token===s.token){
            message(
                "Kamera gagal",
                errorMessage(error)
            );
        }
    }
}
function fatal(context,error){
    console.error(context,error);
    if(s.active){
        fallback(context+": "+errorMessage(error));
    }
}
async function runEngine(token){
    await ensureLibraries();
    if(!s.active||token!==s.token)return;

    if(!mobile()){
        message(
            "Pratinjau kamera desktop",
            "Tracking SLAM memerlukan perangkat mobile. Gunakan Safari iPhone atau Chrome Android."
        );
        ui("webarRetry",false);
        return;
    }

    const xr=window.XR8;
    const extras=window.XRExtras;
    if(!extras?.FullWindowCanvas?.pipelineModule){
        throw new Error(
            "Modul layar penuh XRExtras tidak tersedia."
        );
    }

    stopPreview();
    viewCanvas(false);
    message(
        "Memulai kamera AR...",
        "Menguji lapisan kamera agar tidak hitam."
    );

    try{
        xr.stop?.();
        xr.clearCameraPipelineModules?.();
    }catch(error){}

    xr.XrController.configure({
        disableWorldTracking:false,
        enableWorldPoints:true,
        scale:"absolute"
    });

    xr.addCameraPipelineModules([
        xr.GlTextureRenderer.pipelineModule(),
        xr.Threejs.pipelineModule(),
        xr.XrController.pipelineModule(),
        extras.FullWindowCanvas.pipelineModule(),
        pipeline(token)
    ]);

    s.xrRunning=true;
    const result=xr.run({
        canvas,
        cameraConfig:{
            direction:xr.XrConfig.camera().BACK
        },
        allowedDevices:xr.XrConfig.device().MOBILE,
        glContextConfig:{
            alpha:false,
            preserveDrawingBuffer:false
        }
    });

    if(result&&typeof result.then==="function"){
        await result;
    }
    s.watchdog=setTimeout(()=>{
        if(s.active&&token===s.token&&!s.visibleFrame){
            fallback(
                "Mesin XR tidak menampilkan gambar kamera dalam 18 detik. Tekan Coba Lagi atau kembali memilih model."
            );
        }
    },18000);
}
function start(src,title){
    if(s.active||s.opening)return;

    s.active=true;
    s.opening=true;
    s.token++;
    const token=s.token;

    s.src=src;
    s.title=title;
    s.xrRunning=false;
    s.hasVideo=false;
    s.visibleFrame=false;
    s.blankSamples=0;
    s.frameSamples=0;
    s.lastProbe=0;
    s.modelReady=false;
    s.tracking=false;
    s.candidate=null;
    s.stable=0;
    s.placed=false;
    s.zoom=1;
    s.yaw=0;
    s.pointers.clear();

    $("webarTitle").textContent=title;
    [
        "webarRetry","webarMotion",
        "webarPlace","webarReset","webarReticle"
    ].forEach(id=>ui(id,false));

    ui(
        "webarMotion",
        typeof window.DeviceOrientationEvent?.requestPermission==="function"
    );

    overlay.classList.remove("hidden");
    document.documentElement.classList.add("webar-open");
    viewCanvas(false);

    document.querySelectorAll("model-viewer").forEach(item=>{
        try{item.pause?.();}catch(error){}
    });
    message(
        "Meminta izin kamera...",
        "Izinkan kamera melalui browser untuk memulai AR."
    );

    // Request pertama harus berjalan dari interaksi klik.
    const request=window.isSecureContext&&
        navigator.mediaDevices?.getUserMedia
        ?navigator.mediaDevices.getUserMedia({
            audio:false,
            video:{facingMode:{ideal:"environment"}}
        })
        :Promise.reject(new Error(
            "Kamera membutuhkan HTTPS dan browser yang mendukung getUserMedia."
        ));

    (async()=>{
        try{
            const stream=await request;
            if(!s.active||token!==s.token){
                stream.getTracks().forEach(track=>track.stop());
                return;
            }
            s.stream=stream;
            video.srcObject=stream;
            try{
                await video.play();
            }catch(error){}

            message(
                "Kamera siap",
                "Mengunduh mesin pelacakan bidang..."
            );
            await runEngine(token);
        }catch(error){
            if(s.active&&token===s.token){
                console.error("WebAR start:",error);
                await fallback(errorMessage(error));
            }
        }finally{
            if(token===s.token){
                s.opening=false;
            }
        }
    })();
}
function reset(){
    if(!s.active||!s.xrRunning)return;
    s.placed=false;
    s.candidate=null;
    s.stable=0;
    s.zoom=1;
    s.yaw=0;

    if(s.anchor)s.anchor.visible=false;
    if(s.pivot){
        s.pivot.rotation.y=0;
        s.pivot.scale.setScalar(1);
    }

    ui("webarReset",false);
    ui("webarPlace",false);
    ui("webarReticle",false);
    message(
        "Ulangi pencarian permukaan",
        "Gerakkan kamera perlahan untuk melacak bidang baru."
    );
}
function close(){
    if(!s.active)return;
    s.active=false;
    s.opening=false;
    s.token++;

    stopXR();
    stopPreview();
    s.pointers.clear();

    overlay.classList.add("hidden");
    document.documentElement.classList.remove("webar-open");
    viewCanvas(false);

    document.querySelectorAll("model-viewer").forEach(item=>{
        try{item.play?.();}catch(error){}
    });
}
function retry(){
    if(!s.active)return;
    const src=s.src;
    const title=s.title;
    close();
    start(src,title);
}
function grantMotion(){
    const fn=window.DeviceOrientationEvent?.requestPermission;
    if(!fn){
        ui("webarMotion",false);
        return;
    }
    Promise.resolve(
        fn.call(window.DeviceOrientationEvent)
    ).then(permission=>{
        s.orientationAllowed=permission==="granted";
        ui("webarMotion",false);
    }).catch(error=>{
        message(
            "Sensor gerak belum diizinkan",
            errorMessage(error)
        );
    });
}
function gestureDistance(){
    const points=[...s.pointers.values()];
    if(points.length!==2)return 0;
    return Math.hypot(
        points[0].x-points[1].x,
        points[0].y-points[1].y
    );
}

canvas.addEventListener("pointerdown",event=>{
    if(!s.placed)return;
    event.preventDefault();
    try{
        canvas.setPointerCapture(event.pointerId);
    }catch(error){}
    s.pointers.set(event.pointerId,{
        x:event.clientX,
        y:event.clientY
    });
    s.pinch=gestureDistance();
});
canvas.addEventListener("pointermove",event=>{
    if(!s.placed||
       !s.pivot||
       !s.pointers.has(event.pointerId))return;
    event.preventDefault();

    const old=s.pointers.get(event.pointerId);
    s.pointers.set(event.pointerId,{
        x:event.clientX,
        y:event.clientY
    });

    if(s.pointers.size===2){
        const distance=gestureDistance();
        if(s.pinch>0){
            s.zoom=clamp(
                s.zoom*distance/s.pinch,.35,3.5
            );
            s.pivot.scale.setScalar(s.zoom);
        }
        s.pinch=distance;
    }else if(s.pointers.size===1){
        s.yaw+=(event.clientX-old.x)*.008;
        s.pivot.rotation.y=s.yaw;
    }
},{passive:false});
function endPointer(event){
    s.pointers.delete(event.pointerId);
    s.pinch=gestureDistance();
}
canvas.addEventListener("pointerup",endPointer);
canvas.addEventListener("pointercancel",endPointer);
canvas.addEventListener("wheel",event=>{
    if(!s.placed||!s.pivot)return;
    event.preventDefault();
    s.zoom=clamp(
        s.zoom*(event.deltaY>0?.93:1.07),
        .35,3.5
    );
    s.pivot.scale.setScalar(s.zoom);
},{passive:false});

$("webarPlace")?.addEventListener("click",place);
$("webarReset")?.addEventListener("click",reset);
$("webarRetry")?.addEventListener("click",retry);
$("webarClose")?.addEventListener("click",close);
$("webarBackBottom")?.addEventListener("click",close);
$("webarMotion")?.addEventListener("click",grantMotion);

document.addEventListener("keydown",event=>{
    if(s.active&&event.key==="Escape"){
        event.preventDefault();
        event.stopImmediatePropagation();
        close();
    }
},true);
document.addEventListener("visibilitychange",()=>{
    if(s.active&&document.hidden)close();
});
window.FT_WEBAR={start,close,reset};
})();
