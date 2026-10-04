/* =========================================================
   FT UISU EXPLORER
   SCRIPT.JS
   REVISION 37 - REVISI 1
   NATIVE 3D VIEWER CONTROL
========================================================= */

(function(){

"use strict";


/* =========================================================
   DATABASE
========================================================= */

const DATA =
    window.FT_DATA
    ||
    {};


const MAP_WIDTH =
    DATA.MAP_WIDTH
    ||
    768;


const MAP_HEIGHT =
    DATA.MAP_HEIGHT
    ||
    1024;


const buildings =
    Array.isArray(DATA.buildings)
    ?
    DATA.buildings
    :
    [];


const rooms =
    Array.isArray(DATA.rooms)
    ?
    DATA.rooms
    :
    [];


const people =
    Array.isArray(DATA.people)
    ?
    DATA.people
    :
    [];


const entrances =
    Array.isArray(DATA.entrances)
    ?
    DATA.entrances
    :
    [];


const mapNodes =
    DATA.mapNodes
    ||
    {};


const mapEdges =
    Array.isArray(DATA.mapEdges)
    ?
    DATA.mapEdges
    :
    [];


const mapCalibration =
    Array.isArray(DATA.mapCalibration)
    ?
    DATA.mapCalibration
    :
    [];


/* =========================================================
   DOM
========================================================= */

function byId(id){

    return document.getElementById(
        id
    );

}


function all(selector){

    return Array.from(
        document.querySelectorAll(
            selector
        )
    );

}


function on(
    id,
    eventName,
    handler,
    options
){

    const element =
        byId(id);


    if(!element){

        return;

    }


    element.addEventListener(
        eventName,
        handler,
        options
    );

}


function show(id){

    const element =
        byId(id);


    if(element){

        element.classList.remove(
            "hidden"
        );

    }

}


function hide(id){

    const element =
        byId(id);


    if(element){

        element.classList.add(
            "hidden"
        );

    }

}


function setText(
    id,
    value
){

    const element =
        byId(id);


    if(element){

        element.textContent =
            value
            ??
            "";

    }

}


/* =========================================================
   STATE
========================================================= */

const state = {

    currentPage:
        "home",

    pageHistory:
        [],

    currentSlide:
        0,

    landingModelIndex:
        0,

    globalSelection:
        null,

    infoLocation:
        null,

    destination:
        null,

    clickedPosition:
        null,

    routeResult:
        null,

    liveInstructions:
        [],

    gpsWatchId:
        null,

    viewerBuildingId:
        null,

    viewerModelId:
        null,

    arBuildingId:
        null,

    arModelId:
        null,

    pending3DMarker:
        null

};


/* =========================================================
   DATABASE HELPERS
========================================================= */

function getBuildingById(id){

    if(
        typeof DATA.getBuildingById
        ===
        "function"
    ){

        return DATA.getBuildingById(
            id
        );

    }


    return (
        buildings.find(
            building =>
                building.id === id
        )
        ||
        null
    );

}


function getEntranceById(id){

    if(
        typeof DATA.getEntranceById
        ===
        "function"
    ){

        return DATA.getEntranceById(
            id
        );

    }


    return (
        entrances.find(
            entrance =>
                entrance.id === id
        )
        ||
        null
    );

}


function getBuildingModels(
    buildingId
){

    if(
        typeof DATA.getBuildingModels
        ===
        "function"
    ){

        return DATA.getBuildingModels(
            buildingId
        );

    }


    const building =
        getBuildingById(
            buildingId
        );


    return (
        building
        ?
        building.models || []
        :
        []
    );

}


function getModelVariant(
    buildingId,
    modelId
){

    if(
        typeof DATA.getModelVariant
        ===
        "function"
    ){

        return DATA.getModelVariant(
            buildingId,
            modelId
        );

    }


    return (
        getBuildingModels(
            buildingId
        )
            .find(
                model =>
                    model.id === modelId
            )
        ||
        null
    );

}


function getDefaultModelVariant(
    buildingId
){

    if(
        typeof DATA.getDefaultModelVariant
        ===
        "function"
    ){

        return DATA.getDefaultModelVariant(
            buildingId
        );

    }


    const building =
        getBuildingById(
            buildingId
        );


    if(!building){

        return null;

    }


    return (
        getModelVariant(
            building.id,
            building.defaultModel
        )
        ||
        building.models?.[0]
        ||
        null
    );

}


function getNavigationEntrance(
    location
){

    if(
        typeof
        DATA.getNavigationEntranceForLocation
        ===
        "function"
    ){

        return DATA
            .getNavigationEntranceForLocation(
                location
            );

    }


    if(!location){

        return null;

    }


    if(
        location.type ===
        "room"
        &&
        location.navigationEntranceId
    ){

        return getEntranceById(
            location.navigationEntranceId
        );

    }


    const building =
        getBuildingById(
            location.buildingId
            ||
            location.id
        );


    if(!building){

        return null;

    }


    return getEntranceById(
        building.defaultEntranceId
    );

}


/* =========================================================
   MODEL CACHE
========================================================= */

const MODEL_CACHE_NAME =
    "ft-uisu-models-v37.1";


const PRIORITY_MODELS = [

    "./assets/models/gedung_biro_outdoor.glb",

    "./assets/models/gedung_perkuliahan_outdoor.glb",

    "./assets/models/gedung_laboratorium.glb",

    "./assets/models/gedung_biro_indoor.glb",

    "./assets/models/gedung_perkuliahan_indoor.glb"

];


async function registerServiceWorker(){

    if(
        !(
            "serviceWorker"
            in navigator
        )
    ){

        return;

    }


    try{

        await navigator
            .serviceWorker
            .register(
                "./sw.js?v=rev1",
                {
                    scope:"./"
                }
            );


        await navigator
            .serviceWorker
            .ready;

    }

    catch(error){

        console.warn(
            "Service Worker:",
            error
        );

    }

}


async function cacheModel(
    url
){

    if(
        !url
        ||
        !(
            "caches"
            in window
        )
    ){

        return false;

    }


    try{

        const cache =
            await caches.open(
                MODEL_CACHE_NAME
            );


        const existing =
            await cache.match(
                url,
                {
                    ignoreSearch:true
                }
            );


        if(existing){

            return true;

        }


        const response =
            await fetch(
                url,
                {
                    cache:"force-cache"
                }
            );


        if(
            !response.ok
        ){

            return false;

        }


        await cache.put(
            url,
            response.clone()
        );


        return true;

    }

    catch(error){

        return false;

    }

}


async function preloadPriorityModels(){

    const queue =
        PRIORITY_MODELS.slice();


    async function worker(){

        while(queue.length){

            const url =
                queue.shift();


            await cacheModel(
                url
            );

        }

    }


    await Promise.all([
        worker(),
        worker()
    ]);

}


function preloadBuildingModels(
    building
){

    if(
        !building
        ||
        !Array.isArray(
            building.models
        )
    ){

        return;

    }


    building.models
        .forEach(
            model => {

                cacheModel(
                    model.src
                );

            }
        );

}


/* =========================================================
   LOCATION SEARCH DATABASE
========================================================= */

const locations = [];


buildings.forEach(
    building => {

        locations.push({

            id:
                building.id,

            type:
                "building",

            name:
                building.name,

            buildingId:
                building.id,

            floor:
                building.actualFloor,

            parent:
                "Fakultas Teknik UISU",

            description:
                building.description,

            navigationEntranceId:
                building.defaultEntranceId,

            modelMarker:
                null

        });

    }
);


rooms.forEach(
    room => {

        const building =
            getBuildingById(
                room.buildingId
            );


        locations.push({

            id:
                room.id,

            type:
                "room",

            name:
                room.name,

            buildingId:
                room.buildingId,

            floor:
                room.floor,

            parent:
                building
                ?
                building.name
                :
                "Fakultas Teknik UISU",

            navigationEntranceId:
                room.navigationEntranceId,

            modelMarker:
                room.modelMarker
                ||
                null,

            description:
                room.description
                ||
                (
                    room.name
                    +
                    " berada di "
                    +
                    (
                        building
                        ?
                        building.name
                        :
                        "Fakultas Teknik UISU"
                    )
                    +
                    (
                        room.floor
                        ?
                        ", lantai "
                        +
                        room.floor
                        :
                        ""
                    )
                    +
                    "."
                )

        });

    }
);


people.forEach(
    person => {

        locations.push({

            ...person,

            type:"person"

        });

    }
);


/* =========================================================
   PAGE
========================================================= */

function updateHeaderActive(
    pageName
){

    all(".header-link")
        .forEach(
            button => {

                button.classList.remove(
                    "active"
                );

            }
        );


    const button =
        document.querySelector(
            `.header-link[data-page="${pageName}"]`
        );


    if(button){

        button.classList.add(
            "active"
        );

    }

}


function showPage(
    pageName,
    pushHistory = true
){

    const page =
        byId(
            pageName
            +
            "Page"
        );


    if(!page){

        return;

    }


    if(
        pushHistory
        &&
        state.currentPage
        &&
        state.currentPage !== pageName
    ){

        state.pageHistory.push(
            state.currentPage
        );

    }


    all(".page")
        .forEach(
            item => {

                item.classList.remove(
                    "active"
                );

            }
        );


    page.classList.add(
        "active"
    );


    state.currentPage =
        pageName;


    updateHeaderActive(
        pageName
    );


    closeDrawer();


    if(
        pageName !==
        "navigationActive"
    ){

        window.scrollTo({
            top:0,
            behavior:"auto"
        });

    }


    setTimeout(
        syncAllMapGeometry,
        60
    );

}


function goBack(){

    stopGpsTracking();


    const previous =
        state.pageHistory.length
        ?
        state.pageHistory.pop()
        :
        "home";


    showPage(
        previous,
        false
    );

}


all("[data-back]")
    .forEach(
        button => {

            button.addEventListener(
                "click",
                goBack
            );

        }
    );


on(
    "logoHome",
    "click",
    () => {

        stopGpsTracking();


        state.pageHistory =
            [];


        showPage(
            "home",
            false
        );

    }
);


all("[data-page]")
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    showPage(
                        button.dataset.page
                    );

                }
            );

        }
    );


/* =========================================================
   DRAWER
========================================================= */

function openDrawer(){

    byId("drawer")
        ?.classList
        .add(
            "open"
        );


    byId("drawerOverlay")
        ?.classList
        .add(
            "show"
        );


    document.body.style.overflow =
        "hidden";

}


function closeDrawer(){

    byId("drawer")
        ?.classList
        .remove(
            "open"
        );


    byId("drawerOverlay")
        ?.classList
        .remove(
            "show"
        );


    document.body.style.overflow =
        "";

}


on(
    "hamburgerButton",
    "click",
    openDrawer
);


on(
    "closeDrawer",
    "click",
    closeDrawer
);


on(
    "drawerOverlay",
    "click",
    closeDrawer
);


/* =========================================================
   SLIDER
========================================================= */

const slides =
    all(
        ".hero-slide"
    );


function showSlide(index){

    if(!slides.length){

        return;

    }


    if(index < 0){

        index =
            slides.length - 1;

    }


    if(
        index >=
        slides.length
    ){

        index = 0;

    }


    state.currentSlide =
        index;


    slides.forEach(
        (slide,i) => {

            slide.classList.toggle(
                "active",
                i === index
            );

        }
    );


    all(".slider-dot")
        .forEach(
            (dot,i) => {

                dot.classList.toggle(
                    "active",
                    i === index
                );

            }
        );

}


on(
    "prevSlide",
    "click",
    () => {

        showSlide(
            state.currentSlide - 1
        );

    }
);


on(
    "nextSlide",
    "click",
    () => {

        showSlide(
            state.currentSlide + 1
        );

    }
);


all(".slider-dot")
    .forEach(
        dot => {

            dot.addEventListener(
                "click",
                () => {

                    showSlide(
                        Number(
                            dot.dataset.slide
                        )
                    );

                }
            );

        }
    );


/* =========================================================
   LANDING MODEL
========================================================= */

const landingModels = [

    {
        name:
            "Gedung Biro Fakultas Teknik",

        viewer:
            byId(
                "landingModel0"
            )
    },

    {
        name:
            "Gedung Perkuliahan Fakultas Teknik",

        viewer:
            byId(
                "landingModel1"
            )
    },

    {
        name:
            "Gedung Laboratorium Fakultas Teknik",

        viewer:
            byId(
                "landingModel2"
            )
    }

];


function showLandingModel(index){

    if(!landingModels.length){

        return;

    }


    if(index < 0){

        index =
            landingModels.length - 1;

    }


    if(
        index >=
        landingModels.length
    ){

        index = 0;

    }


    state.landingModelIndex =
        index;


    landingModels.forEach(
        (item,i) => {

            if(!item.viewer){

                return;

            }


            item.viewer
                .classList
                .toggle(
                    "active",
                    i === index
                );

        }
    );


    setText(
        "landingModelName",
        landingModels[index].name
    );


    setText(
        "landingModelCounter",
        `${index + 1} / ${landingModels.length}`
    );

}


on(
    "landingNextModel",
    "click",
    () => {

        showLandingModel(
            state.landingModelIndex + 1
        );

    }
);


/* =========================================================
   SEARCH
========================================================= */

function normalize(value){

    return String(
        value
        ||
        ""
    )
        .toLowerCase()
        .trim();

}


function searchLocations(
    value
){

    const query =
        normalize(
            value
        );


    if(!query){

        return [];

    }


    return locations
        .filter(
            location => {

                return normalize(
                    location.name
                    +
                    " "
                    +
                    (
                        location.parent
                        ||
                        ""
                    )
                )
                    .includes(
                        query
                    );

            }
        )
        .slice(
            0,
            40
        );

}


function renderSearchResults(
    results,
    container,
    onSelect
){

    if(!container){

        return;

    }


    container.innerHTML =
        "";


    if(!results.length){

        container.innerHTML =
            `
            <div class="search-empty">
                Lokasi tidak ditemukan.
            </div>
            `;

        return;

    }


    results.forEach(
        location => {

            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";


            button.className =
                "search-result";


            let typeText =
                "Ruangan";


            if(
                location.type ===
                "building"
            ){

                typeText =
                    "Gedung";

            }


            else if(
                location.type ===
                "person"
            ){

                typeText =
                    "Civitas";

            }


            button.innerHTML =
                `
                <span>

                    <strong>
                        ${location.name}
                    </strong>

                    <small>
                        ${location.parent || "Fakultas Teknik UISU"}
                        ${
                            location.floor
                            ?
                            " • Lantai "
                            +
                            location.floor
                            :
                            ""
                        }
                    </small>

                </span>

                <span class="search-type">
                    ${typeText}
                </span>
                `;


            button.addEventListener(
                "click",
                () => {

                    onSelect(
                        location
                    );

                }
            );


            container.appendChild(
                button
            );

        }
    );

}


/* =========================================================
   GLOBAL SEARCH
========================================================= */

const globalSearch =
    byId(
        "globalSearch"
    );


if(globalSearch){

    globalSearch.addEventListener(
        "input",
        event => {

            const value =
                event.target.value;


            if(!value.trim()){

                hide(
                    "globalSearchResults"
                );

                return;

            }


            renderSearchResults(

                searchLocations(
                    value
                ),

                byId(
                    "globalSearchResults"
                ),

                location => {

                    state.globalSelection =
                        location;


                    globalSearch.value =
                        location.name;


                    setText(
                        "globalSelectedName",
                        location.name
                    );


                    hide(
                        "globalSearchResults"
                    );


                    show(
                        "globalSelected"
                    );

                }

            );


            show(
                "globalSearchResults"
            );

        }
    );

}


on(
    "clearGlobalSearch",
    "click",
    () => {

        if(globalSearch){

            globalSearch.value =
                "";

        }


        state.globalSelection =
            null;


        hide(
            "globalSelected"
        );


        hide(
            "globalSearchResults"
        );

    }
);


/* =========================================================
   INFO
========================================================= */

function openInfo(
    location
){

    if(!location){

        return;

    }


    state.infoLocation =
        location;


    setText(
        "infoTitle",
        location.name
    );


    setText(
        "infoParent",
        location.parent
        ||
        "Fakultas Teknik UISU"
    );


    setText(
        "infoDescription",
        location.description
        ||
        "Informasi belum tersedia."
    );


    show(
        "infoModal"
    );

}


function closeInfo(){

    hide(
        "infoModal"
    );

}


on(
    "closeInfoModal",
    "click",
    closeInfo
);


on(
    "infoBackdrop",
    "click",
    closeInfo
);


on(
    "globalInfoButton",
    "click",
    () => {

        openInfo(
            state.globalSelection
        );

    }
);


on(
    "globalNavButton",
    "click",
    () => {

        if(
            state.globalSelection
        ){

            openNavigationWithDestination(
                state.globalSelection
            );

        }

    }
);


/* =========================================================
   BUILDING SELECT
========================================================= */

function populateBuildingSelect(
    select
){

    if(!select){

        return;

    }


    select.innerHTML =
        `
        <option value="">
            -- Pilih Gedung --
        </option>
        `;


    buildings.slice()
        .sort((a,b) => (a.modelMenuOrder ?? 99) - (b.modelMenuOrder ?? 99))
        .forEach(
        building => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                building.id;


            option.textContent =
                building.modelMenuName || building.name;


            select.appendChild(
                option
            );

        }
    );

}


const viewerBuildingSelect =
    byId(
        "viewerBuildingSelect"
    );


const arBuildingSelect =
    byId(
        "arBuildingSelect"
    );


populateBuildingSelect(
    viewerBuildingSelect
);


populateBuildingSelect(
    arBuildingSelect
);


/* =========================================================
   MODEL SWITCH
========================================================= */

function renderModelSwitch({

    building,

    activeModelId,

    containerId,

    singleBadgeId,

    onChange

}){

    const container =
        byId(
            containerId
        );


    const badge =
        byId(
            singleBadgeId
        );


    if(
        !container
        ||
        !badge
        ||
        !building
    ){

        return;

    }


    const models =
        building.models
        ||
        [];


    container.innerHTML =
        "";


    if(
        models.length <= 1
    ){

        hide(
            containerId
        );


        if(
            models[0]
        ){

            badge.textContent =
                models[0].name;


            show(
                singleBadgeId
            );

        }

        else{

            hide(
                singleBadgeId
            );

        }


        return;

    }


    hide(
        singleBadgeId
    );


    show(
        containerId
    );


    models.forEach(
        model => {

            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";


            button.className =
                "model-switch-button";


            button.textContent =
                model.name;


            button.classList.toggle(
                "active",
                model.id === activeModelId
            );


            button.addEventListener(
                "click",
                () => {

                    onChange(
                        model.id
                    );

                }
            );


            container.appendChild(
                button
            );

        }
    );

}


/* =========================================================
   SINGLE / NATIVE 3D VIEWER
========================================================= */

const main3DViewer =
    byId(
        "main3DViewer"
    );


let current3DModel = {

    buildingId:null,

    modelId:null,

    src:null

};


/* =========================================================
   VIEWER TEXT
========================================================= */

function updateViewerText(
    building,
    model
){

    const modelTitle =
        model.viewerTitle
        ||
        building.name;


    setText(
        "viewerTitle",
        modelTitle
    );


    setText(
        "viewerCurrentModelName",
        modelTitle
        +
        " - "
        +
        model.name
    );


    setText(
        "viewerPreloadDescription",
        model.viewerDescription
    );

}


/* =========================================================
   VIEWER LOADING
========================================================= */

function setViewerLoading(
    building,
    model
){

    updateViewerText(
        building,
        model
    );


    setText(
        "viewerLoadStatus",
        "MEMUAT MODEL 3D..."
    );


    const dot =
        byId(
            "viewerLoadingDot"
        );


    if(dot){

        dot.className =
            "loading-dot loading";

    }


    show(
        "viewerLoadingOverlay"
    );


    hide(
        "viewerUnavailable"
    );

}


/* =========================================================
   VIEWER READY
========================================================= */

function setViewerReady(
    building,
    model
){

    updateViewerText(
        building,
        model
    );


    setText(
        "viewerLoadStatus",
        "MODEL 3D SIAP"
    );


    const dot =
        byId(
            "viewerLoadingDot"
        );


    if(dot){

        dot.className =
            "loading-dot ready";

    }


    hide(
        "viewerLoadingOverlay"
    );


    hide(
        "viewerUnavailable"
    );

}


/* =========================================================
   VIEWER UNAVAILABLE
========================================================= */

function setViewerUnavailable(
    building,
    model
){

    const modelTitle =
        model.viewerTitle
        ||
        building.name;


    setText(
        "viewerTitle",
        modelTitle
    );


    setText(
        "viewerCurrentModelName",
        modelTitle
        +
        " - "
        +
        model.name
    );


    setText(
        "viewerPreloadDescription",
        "Model 3D sedang dalam tahap penyelesaian"
    );


    setText(
        "viewerLoadStatus",
        "MODEL BELUM TERSEDIA"
    );


    const dot =
        byId(
            "viewerLoadingDot"
        );


    if(dot){

        dot.className =
            "loading-dot error";

    }


    hide(
        "viewerLoadingOverlay"
    );


    show(
        "viewerUnavailable"
    );

}


/* =========================================================
   RESET CAMERA

   TIDAK ADA CUSTOM CLICK-ZOOM.
   DRAG / ROTATE / SCROLL / PINCH DIKELOLA
   LANGSUNG OLEH MODEL-VIEWER.
========================================================= */

function reset3DCamera(){

    if(!main3DViewer){

        return;

    }


    main3DViewer.cameraOrbit =
        "auto auto auto";


    main3DViewer.cameraTarget =
        "auto auto auto";


    main3DViewer.fieldOfView =
        "35deg";


    if(
        typeof
        main3DViewer.jumpCameraToGoal
        ===
        "function"
    ){

        main3DViewer
            .jumpCameraToGoal();

    }

}


on(
    "resetCamera",
    "click",
    reset3DCamera
);


/* =========================================================
   LOAD 3D MODEL
========================================================= */

function load3DModel(
    building,
    model
){

    if(
        !building
        ||
        !model
        ||
        !main3DViewer
    ){

        return;

    }


    state.viewerBuildingId =
        building.id;


    state.viewerModelId =
        model.id;


    current3DModel = {

        buildingId:
            building.id,

        modelId:
            model.id,

        src:
            model.src

    };


    renderModelSwitch({

        building,

        activeModelId:
            model.id,

        containerId:
            "viewerModelSwitch",

        singleBadgeId:
            "viewerSingleModeBadge",

        onChange:
            nextModelId => {

                const nextModel =
                    getModelVariant(
                        building.id,
                        nextModelId
                    );


                if(nextModel){

                    load3DModel(
                        building,
                        nextModel
                    );

                }

            }

    });


    setViewerLoading(
        building,
        model
    );


    /*
       Tetap gunakan cache model yang sudah kita siapkan.
    */

    cacheModel(
        model.src
    );


    const currentSrc =
        main3DViewer
            .getAttribute(
                "src"
            );


    if(
        currentSrc !==
        model.src
    ){

        main3DViewer
            .setAttribute(
                "src",
                model.src
            );

    }

    else{

        setViewerReady(
            building,
            model
        );

    }


    applyDestinationMarker();

}


/* =========================================================
   VIEWER EVENTS
========================================================= */

if(main3DViewer){

    main3DViewer
        .addEventListener(
            "load",
            () => {

                const building =
                    getBuildingById(
                        current3DModel
                            .buildingId
                    );


                const model =
                    getModelVariant(

                        current3DModel
                            .buildingId,

                        current3DModel
                            .modelId

                    );


                if(
                    building
                    &&
                    model
                ){

                    setViewerReady(
                        building,
                        model
                    );

                }

            }
        );


    main3DViewer
        .addEventListener(
            "error",
            () => {

                const building =
                    getBuildingById(
                        current3DModel
                            .buildingId
                    );


                const model =
                    getModelVariant(

                        current3DModel
                            .buildingId,

                        current3DModel
                            .modelId

                    );


                if(
                    building
                    &&
                    model
                ){

                    setViewerUnavailable(
                        building,
                        model
                    );

                }

            }
        );

}


/* =========================================================
   PREPARE VIEWER BUILDING
========================================================= */

function prepareViewerBuilding(
    buildingId,
    preferredModelId = null,
    scroll = true
){

    const building =
        getBuildingById(
            buildingId
        );


    if(!building){

        toast(
            "Gedung tidak ditemukan."
        );

        return;

    }


    const models =
        building.models
        ||
        [];


    if(
        !models.length
    ){

        toast(
            "Model belum terdaftar."
        );

        return;

    }


    preloadBuildingModels(
        building
    );


    show(
        "viewerCard"
    );


    const model =
        getModelVariant(

            building.id,

            preferredModelId

        )

        ||

        getDefaultModelVariant(
            building.id
        )

        ||

        models[0];


    load3DModel(
        building,
        model
    );


    if(scroll){

        setTimeout(
            () => {

                byId(
                    "viewerCard"
                )
                    ?.scrollIntoView({

                        behavior:"smooth",

                        block:"start"

                    });

            },
            50
        );

    }

}


/* =========================================================
   SHOW 3D BUTTON
========================================================= */

on(
    "show3DModel",
    "click",
    () => {

        if(!viewerBuildingSelect){

            return;

        }


        const buildingId =
            viewerBuildingSelect.value;


        if(!buildingId){

            setText(
                "viewerMessage",
                "Pilih gedung terlebih dahulu."
            );

            return;

        }


        setText(
            "viewerMessage",
            ""
        );


        state.pending3DMarker =
            null;


        prepareViewerBuilding(
            buildingId,
            null,
            true
        );

    }
);


/* =========================================================
   DESTINATION 3D HOTSPOT
========================================================= */

function hideDestinationHotspot(){

    hide(
        "destination3DHotspot"
    );

}


function applyDestinationMarker(){

    hideDestinationHotspot();


    if(
        !state.pending3DMarker
        ||
        !main3DViewer
    ){

        return;

    }


    const marker =
        state.pending3DMarker.marker;


    const hotspot =
        byId(
            "destination3DHotspot"
        );


    if(!hotspot){

        return;

    }


    hotspot.dataset.position =
        `${marker.x}m ${marker.y}m ${marker.z}m`;


    setText(
        "destination3DLabel",
        state.pending3DMarker.label
    );


    show(
        "destination3DHotspot"
    );

}


/* =========================================================
   AR
========================================================= */

const mainARViewer =
    byId(
        "mainARViewer"
    );


function setARLoading(
    building,
    model
){

    const modelTitle =
        model.viewerTitle
        ||
        building.name;


    setText(
        "arViewerTitle",
        modelTitle
    );


    setText(
        "arCurrentModelName",
        modelTitle
        +
        " - "
        +
        model.name
    );


    setText(
        "arPreloadDescription",
        model.viewerDescription
    );


    setText(
        "arLoadStatus",
        "MEMUAT MODEL AR..."
    );


    const dot =
        byId(
            "arLoadingDot"
        );


    if(dot){

        dot.className =
            "loading-dot loading";

    }


    show(
        "arLoadingOverlay"
    );


    hide(
        "arUnavailable"
    );

}


function setARReady(
    building,
    model
){

    const modelTitle =
        model.viewerTitle
        ||
        building.name;


    setText(
        "arViewerTitle",
        modelTitle
    );


    setText(
        "arCurrentModelName",
        modelTitle
        +
        " - "
        +
        model.name
    );


    setText(
        "arPreloadDescription",
        model.viewerDescription
    );


    setText(
        "arLoadStatus",
        "MODEL AR SIAP"
    );


    const dot =
        byId(
            "arLoadingDot"
        );


    if(dot){

        dot.className =
            "loading-dot ready";

    }


    hide(
        "arLoadingOverlay"
    );


    hide(
        "arUnavailable"
    );

}


function setARUnavailable(
    building,
    model
){

    const modelTitle =
        model.viewerTitle
        ||
        building.name;


    setText(
        "arViewerTitle",
        modelTitle
    );


    setText(
        "arCurrentModelName",
        modelTitle
        +
        " - "
        +
        model.name
    );


    setText(
        "arPreloadDescription",
        "Model 3D sedang dalam tahap penyelesaian"
    );


    setText(
        "arLoadStatus",
        "MODEL BELUM TERSEDIA"
    );


    const dot =
        byId(
            "arLoadingDot"
        );


    if(dot){

        dot.className =
            "loading-dot error";

    }


    hide(
        "arLoadingOverlay"
    );


    show(
        "arUnavailable"
    );

}


function loadARModel(
    buildingId,
    modelId
){

    const building =
        getBuildingById(
            buildingId
        );


    if(!building){

        return;

    }


    const model =
        getModelVariant(
            building.id,
            modelId
        )
        ||
        getDefaultModelVariant(
            building.id
        );


    if(!model){

        return;

    }


    state.arBuildingId =
        building.id;


    state.arModelId =
        model.id;


    preloadBuildingModels(
        building
    );


    show(
        "arViewerCard"
    );


    renderModelSwitch({

        building,

        activeModelId:
            model.id,

        containerId:
            "arModelSwitch",

        singleBadgeId:
            "arSingleModeBadge",

        onChange:
            nextModelId => {

                loadARModel(
                    building.id,
                    nextModelId
                );

            }

    });


    setARLoading(
        building,
        model
    );


    if(mainARViewer){

        mainARViewer
            .setAttribute(
                "src",
                model.src
            );

    }

}


if(mainARViewer){

    mainARViewer.addEventListener(
        "load",
        () => {

            const building =
                getBuildingById(
                    state.arBuildingId
                );


            const model =
                getModelVariant(
                    state.arBuildingId,
                    state.arModelId
                );


            if(
                building
                &&
                model
            ){

                setARReady(
                    building,
                    model
                );

            }

        }
    );


    mainARViewer.addEventListener(
        "error",
        () => {

            const building =
                getBuildingById(
                    state.arBuildingId
                );


            const model =
                getModelVariant(
                    state.arBuildingId,
                    state.arModelId
                );


            if(
                building
                &&
                model
            ){

                setARUnavailable(
                    building,
                    model
                );

            }

        }
    );

}


on(
    "prepareMainAR",
    "click",
    () => {

        const buildingId =
            arBuildingSelect
                ?.value;


        if(!buildingId){

            setText(
                "arMessage",
                "Pilih gedung terlebih dahulu."
            );

            return;

        }


        const model =
            getDefaultModelVariant(
                buildingId
            );


        if(!model){

            return;

        }


        setText(
            "arMessage",
            ""
        );


        loadARModel(
            buildingId,
            model.id
        );

    }
);


/* =========================================================
   DIRECTORY
========================================================= */

function locationForBuilding(
    building
){

    return (
        locations.find(
            location =>
                location.type ===
                "building"
                &&
                location.id ===
                building.id
        )
        ||
        null
    );

}


function locationForRoom(
    room
){

    return (
        locations.find(
            location =>
                location.type ===
                "room"
                &&
                location.id ===
                room.id
        )
        ||
        null
    );

}


function renderRoomList(roomList, container){
    if(!container){
        return;
    }

    container.innerHTML = "";

    if(!roomList.length){
        container.innerHTML = `
            <div class="search-empty">
                Data ruangan akan dilengkapi kemudian.
            </div>
        `;
        return;
    }

    const grid = document.createElement("div");
    grid.className = "room-grid";

    roomList.forEach(room => {
        const location = locationForRoom(room);
        const item = document.createElement("div");
        const actionsId = `directory-room-actions-${room.id}`;
        item.className = "room-item";

        item.innerHTML = `
            <button
                type="button"
                class="room-row room-toggle-button"
                aria-expanded="false"
                aria-controls="${actionsId}"
            >
                <span class="room-name"></span>
                <span class="room-chevron" aria-hidden="true">›</span>
            </button>
            <div id="${actionsId}" class="room-actions hidden">
                <button type="button" class="room-info">Informasi</button>
                <button type="button" class="room-nav">Petunjuk Arah</button>
            </div>
        `;

        item.querySelector(".room-name").textContent = room.name;
        const toggle = item.querySelector(".room-toggle-button");
        const actions = item.querySelector(".room-actions");

        toggle.addEventListener("click", () => {
            const expanded = toggle.getAttribute("aria-expanded") !== "true";
            toggle.setAttribute("aria-expanded", String(expanded));
            actions.classList.toggle("hidden", !expanded);
            item.classList.toggle("open", expanded);
        });

        item.querySelector(".room-info").addEventListener("click", () => {
            openInfo(location);
        });

        item.querySelector(".room-nav").addEventListener("click", () => {
            openNavigationWithDestination(location);
        });

        grid.appendChild(item);
    });

    container.appendChild(grid);
}


function renderLaboratory(
    roomList,
    container
){

    const floorButtons =
        document.createElement(
            "div"
        );


    floorButtons.className =
        "floor-buttons";


    const roomContainer =
        document.createElement(
            "div"
        );


    [1,2,3]
        .forEach(
            floor => {

                const button =
                    document.createElement(
                        "button"
                    );


                button.type =
                    "button";


                button.className =
                    "floor-button";


                button.textContent =
                    `Lantai ${floor}`;


                button.addEventListener(
                    "click",
                    () => {

                        Array.from(
                            floorButtons.children
                        )
                            .forEach(
                                item => {

                                    item.classList.remove(
                                        "active"
                                    );

                                }
                            );


                        button.classList.add(
                            "active"
                        );


                        renderRoomList(

                            roomList.filter(
                                room =>
                                    room.floor ===
                                    floor
                            ),

                            roomContainer

                        );

                    }
                );


                floorButtons.appendChild(
                    button
                );

            }
        );


    container.appendChild(
        floorButtons
    );


    container.appendChild(
        roomContainer
    );


    floorButtons
        .firstElementChild
        ?.click();

}


function renderDirectory(){

    const container =
        byId(
            "directoryContainer"
        );


    if(!container){

        return;

    }


    container.innerHTML =
        "";


    buildings.forEach(
        (building,index) => {

            const buildingRooms =
                rooms.filter(
                    room =>
                        room.buildingId
                        ===
                        building.id
                );


            const location =
                locationForBuilding(
                    building
                );


            const article =
                document.createElement(
                    "article"
                );


            article.className =
                "building-card";


            article.innerHTML =
                `
                <button
                    class="building-button"
                    type="button"
                    aria-expanded="false"
                    aria-controls="directory-building-content-${building.id}"
                >

                    <span class="building-number">
                        ${String(index + 1).padStart(2,"0")}
                    </span>

                    <span>

                        <strong>
                            ${building.name}
                        </strong>

                        <p>
                            ${building.description || ""}
                        </p>

                    </span>

                    <span>
                        ›
                    </span>

                </button>

                <div id="directory-building-content-${building.id}" class="building-content">
                </div>
                `;


            const header =
                article.querySelector(
                    ".building-button"
                );


            const content =
                article.querySelector(
                    ".building-content"
                );


            header
                ?.addEventListener(
                    "click",
                    () => {

                        const expanded = article.classList.toggle("open");
                        header.setAttribute("aria-expanded", String(expanded));

                    }
                );


            const actions =
                document.createElement(
                    "div"
                );


            actions.className =
                "building-actions";


            actions.innerHTML =
                `
                <button
                    class="button button-primary building-info"
                    type="button"
                >
                    Informasi
                </button>

                <button
                    class="button button-primary building-nav"
                    type="button"
                >
                    Petunjuk Arah
                </button>
                `;


            content.appendChild(
                actions
            );


            actions
                .querySelector(
                    ".building-info"
                )
                ?.addEventListener(
                    "click",
                    () => {

                        openInfo(
                            location
                        );

                    }
                );


            actions
                .querySelector(
                    ".building-nav"
                )
                ?.addEventListener(
                    "click",
                    () => {

                        openNavigationWithDestination(
                            location
                        );

                    }
                );


            const roomHolder =
                document.createElement(
                    "div"
                );


            content.appendChild(
                roomHolder
            );


            if(
                building.id ===
                "laboratorium-ft"
            ){

                renderLaboratory(
                    buildingRooms,
                    roomHolder
                );

            }

            else{

                renderRoomList(
                    buildingRooms,
                    roomHolder
                );

            }


            container.appendChild(
                article
            );

        }
    );

}


/* =========================================================
   NAV STEPS
========================================================= */

function setStep(
    stepNumber
){

    const ids = [

        "stepTarget",

        "stepPosition",

        "stepRoute",

        "stepNavigation"

    ];


    ids.forEach(
        (id,index) => {

            const element =
                byId(id);


            if(!element){

                return;

            }


            element.classList.toggle(
                "active",
                index + 1
                <=
                stepNumber
            );

        }
    );

}


/* =========================================================
   MAP GEOMETRY
========================================================= */

function getImageContentBox(
    container,
    image
){

    if(
        !container
        ||
        !image
    ){

        return null;

    }


    const containerWidth =
        container.clientWidth;


    const containerHeight =
        container.clientHeight;


    const naturalWidth =
        image.naturalWidth
        ||
        containerWidth;


    const naturalHeight =
        image.naturalHeight
        ||
        containerHeight;


    if(
        !containerWidth
        ||
        !containerHeight
        ||
        !naturalWidth
        ||
        !naturalHeight
    ){

        return null;

    }


    const scale =
        Math.min(

            containerWidth
            /
            naturalWidth,

            containerHeight
            /
            naturalHeight

        );


    const width =
        naturalWidth
        *
        scale;


    const height =
        naturalHeight
        *
        scale;


    const left =
        (
            containerWidth
            -
            width
        )
        /
        2;


    const top =
        (
            containerHeight
            -
            height
        )
        /
        2;


    return {

        left,

        top,

        width,

        height,

        naturalWidth,

        naturalHeight

    };

}


function fitContainerToImage(
    container,
    image
){

    if(
        !container
        ||
        !image
        ||
        !image.naturalWidth
        ||
        !image.naturalHeight
    ){

        return;

    }


    container.style.aspectRatio =
        `${image.naturalWidth} / ${image.naturalHeight}`;

}


function fitSvgToImage(
    svg,
    container,
    image
){

    if(
        !svg
        ||
        !container
        ||
        !image
    ){

        return;

    }


    const box =
        getImageContentBox(
            container,
            image
        );


    if(!box){

        return;

    }


    svg.style.inset =
        "auto";


    svg.style.left =
        box.left
        +
        "px";


    svg.style.top =
        box.top
        +
        "px";


    svg.style.width =
        box.width
        +
        "px";


    svg.style.height =
        box.height
        +
        "px";


    svg.setAttribute(
        "viewBox",
        `0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`
    );


    svg.setAttribute(
        "preserveAspectRatio",
        "none"
    );

}


function syncNavigationMapGeometry(){

    const container =
        byId(
            "navigationMap"
        );


    const image =
        byId(
            "navigationMapImage"
        );


    if(
        !container
        ||
        !image
    ){

        return;

    }


    fitContainerToImage(
        container,
        image
    );


    fitSvgToImage(

        container.querySelector(
            ".route-svg"
        ),

        container,

        image

    );


    if(
        state.routeResult
    ){

        positionSelectionMapElement(

            byId(
                "userMarker"
            ),

            state.routeResult
                .startSnap
                .point

        );


        positionSelectionMapElement(

            byId(
                "entranceMarker"
            ),

            state.routeResult
                .entrance

        );

    }

}


function syncLiveMapGeometry(){

    const container =
        byId(
            "liveMapContent"
        );


    if(!container){

        return;

    }


    const image =
        container.querySelector(
            ".live-map-background"
        );


    if(!image){

        return;

    }


    fitContainerToImage(
        container,
        image
    );


    fitSvgToImage(

        container.querySelector(
            ".live-route-svg"
        ),

        container,

        image

    );


    if(
        state.routeResult
    ){

        positionLiveMapElement(

            byId(
                "liveUserMarker"
            ),

            state.routeResult
                .startSnap
                .point

        );


        positionLiveMapElement(

            byId(
                "liveDestinationMarker"
            ),

            state.routeResult
                .entrance

        );


        renderLiveBuildingMarkers();

    }

}


function syncAllMapGeometry(){

    syncNavigationMapGeometry();

    syncLiveMapGeometry();

}


/* =========================================================
   MAP ELEMENT POSITION
========================================================= */

function positionElementOnImage(
    element,
    point,
    container,
    image
){

    if(
        !element
        ||
        !point
        ||
        !container
        ||
        !image
    ){

        return;

    }


    const box =
        getImageContentBox(
            container,
            image
        );


    if(!box){

        return;

    }


    element.style.left =

        (
            box.left
            +
            (
                point.x
                /
                MAP_WIDTH
            )
            *
            box.width
        )
        +
        "px";


    element.style.top =

        (
            box.top
            +
            (
                point.y
                /
                MAP_HEIGHT
            )
            *
            box.height
        )
        +
        "px";

}


function positionSelectionMapElement(
    element,
    point
){

    positionElementOnImage(

        element,

        point,

        byId(
            "navigationMap"
        ),

        byId(
            "navigationMapImage"
        )

    );

}


function positionLiveMapElement(
    element,
    point
){

    const container =
        byId(
            "liveMapContent"
        );


    if(!container){

        return;

    }


    positionElementOnImage(

        element,

        point,

        container,

        container.querySelector(
            ".live-map-background"
        )

    );

}


/* =========================================================
   RESET NAV
========================================================= */

function resetNavigation(){

    stopGpsTracking();


    state.destination =
        null;


    state.clickedPosition =
        null;


    state.routeResult =
        null;


    const search =
        byId(
            "navigationSearch"
        );


    if(search){

        search.value =
            "";

    }


    byId(
        "activeRoute"
    )
        ?.setAttribute(
            "points",
            ""
        );


    hide(
        "mapSection"
    );


    hide(
        "selectedDestination"
    );


    hide(
        "routeFoundBox"
    );


    hide(
        "userMarker"
    );


    hide(
        "entranceMarker"
    );


    hide(
        "resetPosition"
    );


    show(
        "mapInstructionArea"
    );


    setStep(
        1
    );


    const results =
        byId(
            "navigationSearchResults"
        );


    if(results){

        results.innerHTML =
            `
            <div class="search-empty">
                Ketik nama gedung atau ruangan tujuan.
            </div>
            `;

    }

}


/* =========================================================
   SELECT DESTINATION
========================================================= */

function selectDestination(
    location
){

    if(!location){

        return;

    }


    state.destination =
        location;


    const search =
        byId(
            "navigationSearch"
        );


    if(search){

        search.value =
            location.name;

    }


    setText(
        "selectedDestinationName",
        location.name
    );


    setText(
        "selectedDestinationParent",
        location.parent
        ||
        "Fakultas Teknik UISU"
    );


    show(
        "selectedDestination"
    );


    const results =
        byId(
            "navigationSearchResults"
        );


    if(results){

        results.innerHTML =
            "";

    }


    setText(

        "mapHeadingTitle",

        `Tap pada denah sesuai posisi Anda sekarang, lalu sistem akan memberikan jalur terdekat menuju ${location.name}.`

    );


    show(
        "mapInstructionArea"
    );


    show(
        "mapSection"
    );


    hide(
        "routeFoundBox"
    );


    hide(
        "userMarker"
    );


    hide(
        "entranceMarker"
    );


    hide(
        "resetPosition"
    );


    byId(
        "activeRoute"
    )
        ?.setAttribute(
            "points",
            ""
        );


    setStep(
        2
    );


    setTimeout(
        () => {

            syncNavigationMapGeometry();


            byId(
                "mapSection"
            )
                ?.scrollIntoView({

                    behavior:"smooth",

                    block:"start"

                });

        },
        80
    );

}


/* =========================================================
   NAV SEARCH
========================================================= */

const navigationSearch =
    byId(
        "navigationSearch"
    );


if(navigationSearch){

    navigationSearch.addEventListener(
        "input",
        () => {

            const value =
                navigationSearch.value;


            const container =
                byId(
                    "navigationSearchResults"
                );


            if(!value.trim()){

                container.innerHTML =
                    `
                    <div class="search-empty">
                        Ketik nama gedung atau ruangan tujuan.
                    </div>
                    `;

                return;

            }


            renderSearchResults(

                searchLocations(
                    value
                ),

                container,

                selectDestination

            );

        }
    );

}


/* =========================================================
   ROUTE GRAPH
========================================================= */

function pointDistance(
    a,
    b
){

    return Math.hypot(

        a.x - b.x,

        a.y - b.y

    );

}


const graph = {};


Object.keys(
    mapNodes
)
    .forEach(
        nodeId => {

            graph[nodeId] =
                [];

        }
    );


const preparedEdges =
    mapEdges.map(
        edge => {

            const points =
                edge.points.map(
                    point => ({

                        x:
                            point[0],

                        y:
                            point[1]

                    })
                );


            let length =
                0;


            const cumulative =
                [0];


            for(
                let i = 0;
                i < points.length - 1;
                i++
            ){

                length +=
                    pointDistance(

                        points[i],

                        points[i + 1]

                    );


                cumulative.push(
                    length
                );

            }


            return {

                id:
                    edge.id,

                from:
                    edge.from,

                to:
                    edge.to,

                points,

                length,

                cumulative

            };

        }
    );


const edgeById = {};


preparedEdges.forEach(
    edge => {

        edgeById[
            edge.id
        ] =
            edge;


        graph[
            edge.from
        ]
            .push({

                node:
                    edge.to,

                edgeId:
                    edge.id,

                weight:
                    edge.length

            });


        graph[
            edge.to
        ]
            .push({

                node:
                    edge.from,

                edgeId:
                    edge.id,

                weight:
                    edge.length

            });

    }
);


/* =========================================================
   SNAP
========================================================= */

function projectPointToSegment(
    point,
    a,
    b
){

    const abX =
        b.x - a.x;


    const abY =
        b.y - a.y;


    const apX =
        point.x - a.x;


    const apY =
        point.y - a.y;


    const lengthSquared =
        (
            abX * abX
        )
        +
        (
            abY * abY
        );


    let t =
        lengthSquared
        ?
        (
            (
                apX * abX
            )
            +
            (
                apY * abY
            )
        )
        /
        lengthSquared
        :
        0;


    t =
        Math.max(
            0,
            Math.min(
                1,
                t
            )
        );


    const projected = {

        x:
            a.x
            +
            abX * t,

        y:
            a.y
            +
            abY * t

    };


    return {

        point:
            projected,

        t,

        distance:
            pointDistance(
                point,
                projected
            )

    };

}


function snapToRoute(
    point
){

    let best =
        null;


    preparedEdges.forEach(
        edge => {

            for(
                let i = 0;
                i < edge.points.length - 1;
                i++
            ){

                const a =
                    edge.points[i];


                const b =
                    edge.points[
                        i + 1
                    ];


                const projection =
                    projectPointToSegment(
                        point,
                        a,
                        b
                    );


                const segmentLength =
                    pointDistance(
                        a,
                        b
                    );


                const along =
                    edge.cumulative[i]
                    +
                    segmentLength
                    *
                    projection.t;


                if(
                    !best
                    ||
                    projection.distance
                    <
                    best.distance
                ){

                    best = {

                        edge,

                        segmentIndex:
                            i,

                        point:
                            projection.point,

                        distance:
                            projection.distance,

                        along,

                        distanceToFrom:
                            along,

                        distanceToTo:
                            edge.length
                            -
                            along

                    };

                }

            }

        }
    );


    return best;

}


/* =========================================================
   DIJKSTRA
========================================================= */

function dijkstra(
    start,
    target
){

    const nodeIds =
        Object.keys(
            graph
        );


    if(
        !nodeIds.includes(
            start
        )
        ||
        !nodeIds.includes(
            target
        )
    ){

        return null;

    }


    const distances = {};

    const previous = {};

    const previousEdge = {};


    nodeIds.forEach(
        id => {

            distances[id] =
                Infinity;


            previous[id] =
                null;


            previousEdge[id] =
                null;

        }
    );


    distances[start] =
        0;


    const unvisited =
        new Set(
            nodeIds
        );


    while(
        unvisited.size
    ){

        let current =
            null;


        let smallest =
            Infinity;


        unvisited.forEach(
            id => {

                if(
                    distances[id]
                    <
                    smallest
                ){

                    smallest =
                        distances[id];


                    current =
                        id;

                }

            }
        );


        if(
            current === null
            ||
            smallest === Infinity
        ){

            break;

        }


        if(
            current === target
        ){

            break;

        }


        unvisited.delete(
            current
        );


        graph[current]
            .forEach(
                connection => {

                    if(
                        !unvisited.has(
                            connection.node
                        )
                    ){

                        return;

                    }


                    const candidate =
                        distances[current]
                        +
                        connection.weight;


                    if(
                        candidate
                        <
                        distances[
                            connection.node
                        ]
                    ){

                        distances[
                            connection.node
                        ] =
                            candidate;


                        previous[
                            connection.node
                        ] =
                            current;


                        previousEdge[
                            connection.node
                        ] =
                            connection.edgeId;

                    }

                }
            );

    }


    if(
        distances[target]
        ===
        Infinity
    ){

        return null;

    }


    const nodes = [];

    const edges = [];


    let cursor =
        target;


    while(cursor){

        nodes.unshift(
            cursor
        );


        if(
            cursor === start
        ){

            break;

        }


        edges.unshift(
            previousEdge[cursor]
        );


        cursor =
            previous[cursor];

    }


    return {

        distance:
            distances[target],

        nodes,

        edges

    };

}


/* =========================================================
   ROUTE POLYLINE
========================================================= */

function pointsFromSnapToEndpoint(
    snap,
    endpoint
){

    const points =
        snap.edge.points;


    const output = [

        {
            x:
                snap.point.x,

            y:
                snap.point.y
        }

    ];


    if(
        endpoint ===
        snap.edge.from
    ){

        output.push(
            points[
                snap.segmentIndex
            ]
        );


        for(
            let i =
                snap.segmentIndex - 1;

            i >= 0;

            i--
        ){

            output.push(
                points[i]
            );

        }

    }

    else{

        output.push(
            points[
                snap.segmentIndex + 1
            ]
        );


        for(
            let i =
                snap.segmentIndex + 2;

            i <
            points.length;

            i++
        ){

            output.push(
                points[i]
            );

        }

    }


    return output;

}


function routeNodePolyline(
    route
){

    const output =
        [];


    route.edges.forEach(
        (edgeId,index) => {

            const edge =
                edgeById[
                    edgeId
                ];


            if(!edge){

                return;

            }


            const fromNode =
                route.nodes[
                    index
                ];


            let points;


            if(
                edge.from ===
                fromNode
            ){

                points =
                    edge.points.slice();

            }

            else{

                points =
                    edge.points
                        .slice()
                        .reverse();

            }


            if(
                output.length
            ){

                points =
                    points.slice(
                        1
                    );

            }


            output.push(
                ...points
            );

        }
    );


    return output;

}


function dedupePoints(
    points
){

    const output =
        [];


    points.forEach(
        point => {

            const previous =
                output[
                    output.length - 1
                ];


            if(
                !previous
                ||
                pointDistance(
                    previous,
                    point
                )
                >
                0.5
            ){

                output.push(
                    point
                );

            }

        }
    );


    return output;

}


/* =========================================================
   BUILD ROUTE
========================================================= */

function buildRoute(
    clickedPoint
){

    if(
        !state.destination
    ){

        return null;

    }


    const entrance =
        getNavigationEntrance(
            state.destination
        );


    if(!entrance){

        toast(
            "Entrance tujuan belum tersedia."
        );

        return null;

    }


    const snap =
        snapToRoute(
            clickedPoint
        );


    if(!snap){

        return null;

    }


    const fromRoute =
        dijkstra(
            snap.edge.from,
            entrance.nodeId
        );


    const toRoute =
        dijkstra(
            snap.edge.to,
            entrance.nodeId
        );


    const candidates =
        [];


    if(fromRoute){

        candidates.push({

            endpoint:
                snap.edge.from,

            route:
                fromRoute,

            cost:
                snap.distanceToFrom
                +
                fromRoute.distance

        });

    }


    if(toRoute){

        candidates.push({

            endpoint:
                snap.edge.to,

            route:
                toRoute,

            cost:
                snap.distanceToTo
                +
                toRoute.distance

        });

    }


    if(
        !candidates.length
    ){

        return null;

    }


    candidates.sort(
        (a,b) =>
            a.cost - b.cost
    );


    const best =
        candidates[0];


    const startPart =
        pointsFromSnapToEndpoint(
            snap,
            best.endpoint
        );


    const graphPart =
        routeNodePolyline(
            best.route
        );


    const routePoints =
        dedupePoints(

            startPart

                .concat(
                    graphPart
                )

                .concat([

                    {
                        x:
                            entrance.x,

                        y:
                            entrance.y
                    }

                ])

        );


    return {

        startSnap:
            snap,

        entrance,

        graphDistance:
            best.cost,

        points:
            routePoints

    };

}


/* =========================================================
   MAP CLICK
========================================================= */

const navigationMap =
    byId(
        "navigationMap"
    );


if(navigationMap){

    navigationMap.addEventListener(
        "pointerdown",
        event => {

            if(
                !state.destination
            ){

                toast(
                    "Pilih tujuan terlebih dahulu."
                );

                return;

            }


            const image =
                byId(
                    "navigationMapImage"
                );


            const rect =
                navigationMap
                    .getBoundingClientRect();


            const box =
                getImageContentBox(
                    navigationMap,
                    image
                );


            if(!box){

                return;

            }


            const clickX =
                event.clientX
                -
                rect.left;


            const clickY =
                event.clientY
                -
                rect.top;


            if(
                clickX < box.left
                ||
                clickX > box.left + box.width
                ||
                clickY < box.top
                ||
                clickY > box.top + box.height
            ){

                return;

            }


            const clickedPoint = {

                x:
                    (
                        (
                            clickX - box.left
                        )
                        /
                        box.width
                    )
                    *
                    MAP_WIDTH,

                y:
                    (
                        (
                            clickY - box.top
                        )
                        /
                        box.height
                    )
                    *
                    MAP_HEIGHT

            };


            const route =
                buildRoute(
                    clickedPoint
                );


            if(!route){

                toast(
                    "Rute belum dapat ditemukan."
                );

                return;

            }


            state.clickedPosition =
                clickedPoint;


            state.routeResult =
                route;


            byId(
                "activeRoute"
            )
                ?.setAttribute(

                    "points",

                    route.points
                        .map(
                            point =>
                                `${point.x},${point.y}`
                        )
                        .join(
                            " "
                        )

                );


            positionSelectionMapElement(

                byId(
                    "userMarker"
                ),

                route.startSnap.point

            );


            positionSelectionMapElement(

                byId(
                    "entranceMarker"
                ),

                route.entrance

            );


            show(
                "userMarker"
            );


            show(
                "entranceMarker"
            );


            hide(
                "mapInstructionArea"
            );


            show(
                "routeFoundBox"
            );


            show(
                "resetPosition"
            );


            setStep(
                3
            );

        }
    );

}


/* =========================================================
   RESET POSITION
========================================================= */

on(
    "resetPosition",
    "click",
    () => {

        state.clickedPosition =
            null;


        state.routeResult =
            null;


        byId(
            "activeRoute"
        )
            ?.setAttribute(
                "points",
                ""
            );


        hide(
            "userMarker"
        );


        hide(
            "entranceMarker"
        );


        hide(
            "routeFoundBox"
        );


        hide(
            "resetPosition"
        );


        show(
            "mapInstructionArea"
        );


        setStep(
            2
        );

    }
);


/* =========================================================
   TURN INSTRUCTIONS
========================================================= */

function turnAngle(
    a,
    b,
    c
){

    const ax =
        b.x - a.x;


    const ay =
        b.y - a.y;


    const bx =
        c.x - b.x;


    const by =
        c.y - b.y;


    const cross =
        ax * by
        -
        ay * bx;


    const dot =
        ax * bx
        +
        ay * by;


    return (
        Math.atan2(
            cross,
            dot
        )
        *
        180
        /
        Math.PI
    );

}


function simplifyInstructionPoints(
    points
){

    if(
        !points
        ||
        points.length <= 2
    ){

        return points
        ?
        points.slice()
        :
        [];

    }


    const output =
        [
            points[0]
        ];


    for(
        let i = 1;
        i < points.length - 1;
        i++
    ){

        const angle =
            turnAngle(

                points[i - 1],

                points[i],

                points[i + 1]

            );


        if(
            Math.abs(
                angle
            )
            >=
            28
        ){

            output.push(
                points[i]
            );

        }

    }


    output.push(
        points[
            points.length - 1
        ]
    );


    return output;

}


function createNavigationInstructions(){

    if(
        !state.routeResult
        ||
        !state.destination
    ){

        return [];

    }


    const points =
        simplifyInstructionPoints(
            state.routeResult.points
        );


    const instructions = [

        {
            icon:"●",

            title:
                "Lokasi Anda saat ini",

            description:
                "Mulai dari posisi yang Anda tandai pada denah."
        }

    ];


    for(
        let i = 1;
        i < points.length - 1;
        i++
    ){

        const angle =
            turnAngle(

                points[i - 1],

                points[i],

                points[i + 1]

            );


        if(
            angle > 28
        ){

            instructions.push({

                icon:"↱",

                title:
                    "Belok kanan",

                description:
                    "Ikuti jalur hingga persimpangan berikutnya."

            });

        }


        else if(
            angle < -28
        ){

            instructions.push({

                icon:"↰",

                title:
                    "Belok kiri",

                description:
                    "Ikuti jalur hingga persimpangan berikutnya."

            });

        }

    }


    instructions.push({

        icon:"◎",

        title:
            "Entrance tujuan di depan",

        description:
            state.routeResult
                .entrance
                .name

    });


    instructions.push({

        icon:"✓",

        title:
            "Anda sudah tiba",

        description:
            `Anda sudah tiba di entrance menuju ${state.destination.name}.`

    });


    return instructions;

}


/* =========================================================
   LIVE BUILDINGS
========================================================= */

function renderLiveBuildingMarkers(){

    const container =
        byId(
            "liveBuildingMarkers"
        );


    if(!container){

        return;

    }


    container.innerHTML =
        "";


    buildings.forEach(
        building => {

            if(
                !building.liveMarker
            ){

                return;

            }


            const marker =
                document.createElement(
                    "div"
                );


            marker.className =
                "live-building-marker";


            marker.innerHTML =
                `
                <span></span>

                <label>
                    ${building.name}
                </label>
                `;


            container.appendChild(
                marker
            );


            positionLiveMapElement(
                marker,
                building.liveMarker
            );

        }
    );

}


/* =========================================================
   ROUTE DETAIL
========================================================= */

function renderRouteDetail(){

    const container =
        byId(
            "routeInstructionList"
        );


    if(!container){

        return;

    }


    container.innerHTML =
        "";


    state.liveInstructions
        .forEach(
            step => {

                const item =
                    document.createElement(
                        "div"
                    );


                item.className =
                    "route-instruction-item";


                item.innerHTML =
                    `
                    <div class="route-step-icon">
                        ${step.icon}
                    </div>

                    <div class="route-step-copy">

                        <strong>
                            ${step.title}
                        </strong>

                        <span>
                            ${step.description}
                        </span>

                    </div>
                    `;


                container.appendChild(
                    item
                );

            }
        );

}


/* =========================================================
   LIVE NAVIGATION
========================================================= */

function renderLiveNavigation(){

    if(
        !state.routeResult
        ||
        !state.destination
    ){

        return;

    }


    const route =
        state.routeResult;


    byId(
        "liveRoute"
    )
        ?.setAttribute(

            "points",

            route.points
                .map(
                    point =>
                        `${point.x},${point.y}`
                )
                .join(
                    " "
                )

        );


    syncLiveMapGeometry();


    positionLiveMapElement(

        byId(
            "liveUserMarker"
        ),

        route.startSnap.point

    );


    show(
        "liveUserMarker"
    );


    positionLiveMapElement(

        byId(
            "liveDestinationMarker"
        ),

        route.entrance

    );


    show(
        "liveDestinationMarker"
    );


    setText(
        "liveDestinationMarkerLabel",
        state.destination.name
    );


    setText(
        "liveTargetName",
        state.destination.name
    );


    setText(
        "liveRouteDestination",
        state.destination.name
    );


    setText(
        "liveRouteEntrance",
        route.entrance.name
    );


    renderLiveBuildingMarkers();


    state.liveInstructions =
        createNavigationInstructions();


    renderRouteDetail();


    const next =
        state.liveInstructions.find(
            item =>
                item.title !==
                "Lokasi Anda saat ini"
        );


    if(next){

        setText(
            "liveNextInstruction",
            next.title
        );


        setText(
            "liveDirectionIcon",
            next.icon
        );

    }

}


/* =========================================================
   GPS
========================================================= */

function solveAffine(
    calibration,
    lat,
    lon
){

    if(
        !Array.isArray(
            calibration
        )
        ||
        calibration.length < 3
    ){

        return null;

    }


    const p1 =
        calibration[0];


    const p2 =
        calibration[1];


    const p3 =
        calibration[2];


    const determinant =

        p1.lon
        *
        (
            p2.lat - p3.lat
        )

        -

        p1.lat
        *
        (
            p2.lon - p3.lon
        )

        +

        (
            p2.lon * p3.lat
            -
            p3.lon * p2.lat
        );


    if(
        Math.abs(
            determinant
        )
        <
        1e-12
    ){

        return null;

    }


    function coefficients(
        v1,
        v2,
        v3
    ){

        const a =

            (
                v1
                *
                (
                    p2.lat - p3.lat
                )

                +

                v2
                *
                (
                    p3.lat - p1.lat
                )

                +

                v3
                *
                (
                    p1.lat - p2.lat
                )
            )
            /
            determinant;


        const b =

            (
                v1
                *
                (
                    p3.lon - p2.lon
                )

                +

                v2
                *
                (
                    p1.lon - p3.lon
                )

                +

                v3
                *
                (
                    p2.lon - p1.lon
                )
            )
            /
            determinant;


        const c =

            (
                v1
                *
                (
                    p2.lon * p3.lat
                    -
                    p3.lon * p2.lat
                )

                +

                v2
                *
                (
                    p3.lon * p1.lat
                    -
                    p1.lon * p3.lat
                )

                +

                v3
                *
                (
                    p1.lon * p2.lat
                    -
                    p2.lon * p1.lat
                )
            )
            /
            determinant;


        return {

            a,
            b,
            c

        };

    }


    const cx =
        coefficients(
            p1.x,
            p2.x,
            p3.x
        );


    const cy =
        coefficients(
            p1.y,
            p2.y,
            p3.y
        );


    return {

        x:
            cx.a * lon
            +
            cx.b * lat
            +
            cx.c,

        y:
            cy.a * lon
            +
            cy.b * lat
            +
            cy.c

    };

}


function stopGpsTracking(){

    if(
        state.gpsWatchId !== null
        &&
        navigator.geolocation
    ){

        navigator.geolocation
            .clearWatch(
                state.gpsWatchId
            );

    }


    state.gpsWatchId =
        null;

}


function startGpsTracking(){

    stopGpsTracking();


    if(
        mapCalibration.length < 3
    ){

        console.info(
            "GPS siap. Koordinat kalibrasi belum tersedia."
        );

        return;

    }


    if(
        !navigator.geolocation
    ){

        return;

    }


    state.gpsWatchId =
        navigator.geolocation
            .watchPosition(

                position => {

                    const projected =
                        solveAffine(

                            mapCalibration,

                            position.coords.latitude,

                            position.coords.longitude

                        );


                    if(!projected){

                        return;

                    }


                    const snap =
                        snapToRoute(
                            projected
                        );


                    positionLiveMapElement(

                        byId(
                            "liveUserMarker"
                        ),

                        snap
                        ?
                        snap.point
                        :
                        projected

                    );

                },

                error => {

                    console.warn(
                        "GPS:",
                        error
                    );

                },

                {
                    enableHighAccuracy:true,

                    maximumAge:1000,

                    timeout:10000
                }

            );

}


/* =========================================================
   START NAVIGATION
========================================================= */

on(
    "startNavigation",
    "click",
    () => {

        if(
            !state.routeResult
            ||
            !state.destination
        ){

            toast(
                "Pilih posisi terlebih dahulu."
            );

            return;

        }


        showPage(
            "navigationActive"
        );


        setTimeout(
            () => {

                syncLiveMapGeometry();


                renderLiveNavigation();


                startGpsTracking();

            },
            80
        );


        setStep(
            4
        );

    }
);


on(
    "toggleRouteDetail",
    "click",
    () => {

        byId(
            "routeDetailPanel"
        )
            ?.classList
            .toggle(
                "hidden"
            );

    }
);


on(
    "endRoute",
    "click",
    () => {

        stopGpsTracking();


        resetNavigation();


        state.pageHistory =
            [];


        showPage(
            "navigation",
            false
        );


        toast(
            "Navigasi telah diakhiri."
        );

    }
);


/* =========================================================
   NAVIGATION → 3D
========================================================= */

function showDestinationIn3D(){

    if(
        !state.destination
    ){

        return;

    }


    const destination =
        state.destination;


    const buildingId =
        destination.buildingId
        ||
        destination.id;


    const building =
        getBuildingById(
            buildingId
        );


    if(!building){

        return;

    }


    let model =
        null;


    if(
        destination.type ===
        "room"
    ){

        model =
            getModelVariant(
                building.id,
                "indoor"
            );

    }


    if(!model){

        model =
            getDefaultModelVariant(
                building.id
            );

    }


    showPage(
        "viewer"
    );


    if(
        viewerBuildingSelect
    ){

        viewerBuildingSelect.value =
            building.id;

    }


    state.pending3DMarker =

        destination.modelMarker

        ?

        {
            marker:
                destination.modelMarker,

            label:
                destination.name
        }

        :

        null;


    prepareViewerBuilding(

        building.id,

        model?.id,

        false

    );

}


on(
    "showDestination3D",
    "click",
    showDestinationIn3D
);


/* =========================================================
   PAGE OPENERS
========================================================= */

function openViewer(){

    showPage(
        "viewer"
    );

}


function openAR(){

    showPage(
        "ar"
    );

}


function openNavigation(){

    openNavigationWithDestination();

}


function openDirectory(){

    showPage(
        "directory"
    );

}


function openNavigationWithDestination(
    location = null
){

    showPage(
        "navigation"
    );


    resetNavigation();


    if(location){

        selectDestination(
            location
        );

    }

}


[
    "menu3D",
    "feature3D"
]
    .forEach(
        id => {

            on(
                id,
                "click",
                openViewer
            );

        }
    );


[
    "menuAR",
    "featureAR"
]
    .forEach(
        id => {

            on(
                id,
                "click",
                openAR
            );

        }
    );


[
    "menuNavigation",
    "featureNav"
]
    .forEach(
        id => {

            on(
                id,
                "click",
                openNavigation
            );

        }
    );


[
    "menuDirectory",
    "featureDirectory"
]
    .forEach(
        id => {

            on(
                id,
                "click",
                openDirectory
            );

        }
    );


/* =========================================================
   TOAST
========================================================= */

let toastTimer =
    null;


function toast(
    message
){

    const element =
        byId(
            "toast"
        );


    if(!element){

        return;

    }


    element.textContent =
        message;


    element.classList.add(
        "show"
    );


    clearTimeout(
        toastTimer
    );


    toastTimer =
        setTimeout(
            () => {

                element.classList.remove(
                    "show"
                );

            },
            2600
        );

}


/* =========================================================
   ESC
========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if(
            event.key !==
            "Escape"
        ){

            return;

        }


        closeDrawer();


        if(
            !byId(
                "infoModal"
            )
                ?.classList
                .contains(
                    "hidden"
                )
        ){

            closeInfo();

            return;

        }


        if(
            state.currentPage !==
            "home"
        ){

            goBack();

        }

    }
);


/* =========================================================
   MAP IMAGE EVENTS
========================================================= */

function registerMapImageEvents(){

    const selectionImage =
        byId(
            "navigationMapImage"
        );


    if(selectionImage){

        if(
            selectionImage.complete
            &&
            selectionImage.naturalWidth
        ){

            syncNavigationMapGeometry();

        }

        else{

            selectionImage.addEventListener(
                "load",
                syncNavigationMapGeometry
            );

        }

    }


    const liveImage =
        byId(
            "liveMapContent"
        )
            ?.querySelector(
                ".live-map-background"
            );


    if(liveImage){

        if(
            liveImage.complete
            &&
            liveImage.naturalWidth
        ){

            syncLiveMapGeometry();

        }

        else{

            liveImage.addEventListener(
                "load",
                syncLiveMapGeometry
            );

        }

    }

}


/* =========================================================
   RESIZE
========================================================= */

let resizeTimer =
    null;


window.addEventListener(
    "resize",
    () => {

        clearTimeout(
            resizeTimer
        );


        resizeTimer =
            setTimeout(
                syncAllMapGeometry,
                80
            );

    }
);


window.addEventListener(
    "orientationchange",
    () => {

        setTimeout(
            syncAllMapGeometry,
            250
        );

    }
);


/* =========================================================
   START APP
========================================================= */

async function startApp(){

    renderDirectory();


    showSlide(
        0
    );


    showLandingModel(
        0
    );


    showPage(
        "home",
        false
    );


    registerMapImageEvents();


    registerServiceWorker();


    const warmCache =
        () => {

            preloadPriorityModels();

        };


    if(
        "requestIdleCallback"
        in window
    ){

        requestIdleCallback(
            warmCache,
            {
                timeout:2000
            }
        );

    }

    else{

        setTimeout(
            warmCache,
            1000
        );

    }


    setTimeout(
        syncAllMapGeometry,
        120
    );


    console.log(
        "FT UISU Explorer Revision 37 - Native 3D Viewer loaded"
    );

}


startApp();


})();
