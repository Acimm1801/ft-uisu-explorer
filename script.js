
/* =========================================================
   FT UISU EXPLORER
   REVISI 9 — NO NAVIGATE

   PEMBARUAN:
   1. Tendik Ruang Serbaguna.
   2. Deskripsi singkat tiga gedung (dari database).
   3. Cache Revisi 9.
   4. AR Revisi 8 dipertahankan.
   5. Navigasi tetap disembunyikan.
========================================================= */

(function () {
"use strict";

/* KONFIGURASI */
const NAVIGATION_ENABLED = false;
const DATA = window.FT_DATA || {};

const MAP_WIDTH = DATA.MAP_WIDTH || 768;
const MAP_HEIGHT = DATA.MAP_HEIGHT || 1024;

const buildings = Array.isArray(DATA.buildings)
    ? DATA.buildings : [];

const rooms = Array.isArray(DATA.rooms)
    ? DATA.rooms : [];

const people = Array.isArray(DATA.people)
    ? DATA.people : [];

const entrances = Array.isArray(DATA.entrances)
    ? DATA.entrances : [];

const mapNodes = DATA.mapNodes || {};
const mapEdges = Array.isArray(DATA.mapEdges)
    ? DATA.mapEdges : [];

const mapCalibration = Array.isArray(DATA.mapCalibration)
    ? DATA.mapCalibration : [];

/* HELPERS */
const byId = id => document.getElementById(id);
const all = selector =>
    Array.from(document.querySelectorAll(selector));

function on(id, type, callback, options) {
    byId(id)?.addEventListener(type, callback, options);
}

function show(id) {
    byId(id)?.classList.remove("hidden");
}

function hide(id) {
    byId(id)?.classList.add("hidden");
}

function setText(id, value) {
    const element = byId(id);
    if (element) element.textContent = value ?? "";
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function applyFeatureVisibility() {
    document.documentElement.classList.toggle(
        "navigation-disabled",
        !NAVIGATION_ENABLED
    );

    document.querySelectorAll(
        "#menuNavigation,#featureNav,#globalNavButton,.room-nav,.building-nav"
    ).forEach(element => {
        element.disabled = !NAVIGATION_ENABLED;

        if (NAVIGATION_ENABLED) {
            element.removeAttribute("aria-hidden");
        } else {
            element.setAttribute("aria-hidden", "true");
        }
    });

    const description =
        byId("directoryNavigationDescription");

    if (description) {
        description.textContent = NAVIGATION_ENABLED
            ? "Pilih gedung dan ruangan untuk melihat informasi atau membuka Petunjuk Arah."
            : "Pilih gedung dan ruangan untuk melihat informasi atau data tenaga kependidikan.";
    }
}

/* STATE */
const state = {
    currentPage: "home",
    pageHistory: [],
    currentSlide: 0,
    landingModelIndex: 0,
    globalSelection: null,
    infoLocation: null,
    destination: null,
    clickedPosition: null,
    routeResult: null,
    liveInstructions: [],
    gpsWatchId: null,
    viewerBuildingId: null,
    viewerModelId: null,
    arBuildingId: null,
    arModelId: null,
    pending3DMarker: null
};

/* DATABASE HELPERS */
function getBuildingById(id) {
    return typeof DATA.getBuildingById === "function"
        ? DATA.getBuildingById(id)
        : buildings.find(building => building.id === id) || null;
}

function getEntranceById(id) {
    return typeof DATA.getEntranceById === "function"
        ? DATA.getEntranceById(id)
        : entrances.find(entrance => entrance.id === id) || null;
}

function getBuildingModels(id) {
    return typeof DATA.getBuildingModels === "function"
        ? DATA.getBuildingModels(id)
        : getBuildingById(id)?.models || [];
}

function getModelVariant(buildingId, modelId) {
    return typeof DATA.getModelVariant === "function"
        ? DATA.getModelVariant(buildingId, modelId)
        : getBuildingModels(buildingId)
            .find(model => model.id === modelId) || null;
}

function getDefaultModelVariant(buildingId) {
    if (typeof DATA.getDefaultModelVariant === "function") {
        return DATA.getDefaultModelVariant(buildingId);
    }

    const building = getBuildingById(buildingId);
    if (!building) return null;

    return getModelVariant(buildingId, building.defaultModel)
        || building.models?.[0] || null;
}

function getNavigationEntrance(location) {
    if (typeof DATA.getNavigationEntranceForLocation === "function") {
        return DATA.getNavigationEntranceForLocation(location);
    }

    if (!location) return null;

    if (location.type === "room" &&
        location.navigationEntranceId) {
        return getEntranceById(location.navigationEntranceId);
    }

    const building =
        getBuildingById(location.buildingId || location.id);

    return building
        ? getEntranceById(building.defaultEntranceId)
        : null;
}

/* =========================================================
   CACHE & SERVICE WORKER
========================================================= */

const MODEL_CACHE_NAME =
    "ft-uisu-models-no-navigation-r9-webar";

const PRIORITY_MODELS = [
    "./assets/models/gedung_biro_outdoor.glb",
    "./assets/models/gedung_perkuliahan_outdoor.glb",
    "./assets/models/laboratorium_outdoor.glb",
    "./assets/models/gedung_biro_indoor.glb",
    "./assets/models/gedung_perkuliahan_indoor.glb"
];

async function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;

    try {
        await navigator.serviceWorker.register(
            "./sw.js?v=9-no-nav",
            { scope: "./" }
        );

        await navigator.serviceWorker.ready;
    } catch (error) {
        console.warn("Service Worker:", error);
    }
}

async function cacheModel(url) {
    if (!url || !("caches" in window)) return false;

    try {
        const cache = await caches.open(MODEL_CACHE_NAME);

        if (await cache.match(url, { ignoreSearch: true })) {
            return true;
        }

        const response = await fetch(url, {
            cache: "force-cache"
        });

        if (!response.ok) return false;

        await cache.put(url, response.clone());
        return true;
    } catch (error) {
        return false;
    }
}

async function preloadPriorityModels() {
    const queue = PRIORITY_MODELS.slice();

    async function worker() {
        while (queue.length) {
            const src = queue.shift();
            await cacheModel(src);
        }
    }

    await Promise.all([worker(), worker()]);
}

function preloadBuildingModels(building) {
    if (!Array.isArray(building?.models)) return;
    building.models.forEach(model => cacheModel(model.src));
}

/* =========================================================
   LOKASI DAN RUANGAN
========================================================= */

const locations = [];

buildings.forEach(building => {
    locations.push({
        id: building.id,
        type: "building",
        name: building.name,
        buildingId: building.id,
        floor: building.actualFloor,
        parent: "Fakultas Teknik UISU",
        description: building.description,
        tendik: Array.isArray(building.tendik)
            ? building.tendik : [],
        navigationEntranceId: building.defaultEntranceId,
        modelMarker: null
    });
});

rooms.forEach(room => {
    const building = getBuildingById(room.buildingId);

    locations.push({
        id: room.id,
        type: "room",
        name: room.name,
        buildingId: room.buildingId,
        floor: room.floor,
        parent: building?.name || "Fakultas Teknik UISU",
        description: room.description || (
            room.name + " berada di " +
            (building?.name || "Fakultas Teknik UISU") +
            (room.floor ? ", lantai " + room.floor : "") + "."
        ),
        navigationEntranceId: room.navigationEntranceId,
        units: Array.isArray(room.units) ? room.units : [],
        tendik: Array.isArray(room.tendik) ? room.tendik : [],
        modelMarker: room.modelMarker || null
    });
});

people.forEach(person => {
    locations.push({ ...person, type: "person" });
});

/* =========================================================
   HALAMAN DAN NAVIGASI MENU
========================================================= */

function updateHeaderActive(pageName) {
    all(".header-link").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.page === pageName
        );
    });
}

function showPage(pageName, pushHistory = true) {
    if (!NAVIGATION_ENABLED &&
        (
            pageName === "navigation" ||
            pageName === "navigationActive"
        )) {
        return;
    }

    const page = byId(pageName + "Page");
    if (!page) return;

    if (
        pushHistory &&
        state.currentPage &&
        state.currentPage !== pageName
    ) {
        state.pageHistory.push(state.currentPage);
    }

    all(".page").forEach(item =>
        item.classList.remove("active")
    );

    page.classList.add("active");

    state.currentPage = pageName;
    updateHeaderActive(pageName);
    closeDrawer();

    if (pageName !== "navigationActive") {
        window.scrollTo({
            top: 0,
            behavior: "auto"
        });
    }

    setTimeout(syncAllMapGeometry, 60);
}

function goBack() {
    stopGpsTracking();

    const previous = state.pageHistory.length
        ? state.pageHistory.pop()
        : "home";

    showPage(previous, false);
}

all("[data-back]").forEach(button => {
    button.addEventListener("click", goBack);
});

on("logoHome", "click", () => {
    stopGpsTracking();
    state.pageHistory = [];
    showPage("home", false);
});

all("[data-page]").forEach(button => {
    button.addEventListener("click", () => {
        showPage(button.dataset.page);
    });
});

/* DRAWER */
function openDrawer() {
    byId("drawer")?.classList.add("open");
    byId("drawerOverlay")?.classList.add("show");
    document.body.style.overflow = "hidden";
}

function closeDrawer() {
    byId("drawer")?.classList.remove("open");
    byId("drawerOverlay")?.classList.remove("show");
    document.body.style.overflow = "";
}

on("hamburgerButton", "click", openDrawer);
on("closeDrawer", "click", closeDrawer);
on("drawerOverlay", "click", closeDrawer);

/* SLIDER */
const slides = all(".hero-slide");

function showSlide(index) {
    if (!slides.length) return;

    state.currentSlide =
        (index + slides.length) % slides.length;

    slides.forEach((slide, i) => {
        slide.classList.toggle(
            "active",
            i === state.currentSlide
        );
    });

    all(".slider-dot").forEach((dot, i) => {
        dot.classList.toggle(
            "active",
            i === state.currentSlide
        );
    });
}

on("prevSlide", "click", () =>
    showSlide(state.currentSlide - 1)
);

on("nextSlide", "click", () =>
    showSlide(state.currentSlide + 1)
);

all(".slider-dot").forEach(dot => {
    dot.addEventListener("click", () => {
        showSlide(Number(dot.dataset.slide));
    });
});

/* SLIDER MODEL 3D BERANDA */
const landingModels = [
    {
        name: "Biro Fakultas Teknik UISU",
        viewer: byId("landingModel0")
    },
    {
        name: "Gedung Perkuliahan Fakultas Teknik UISU",
        viewer: byId("landingModel1")
    },
    {
        name: "Laboratorium Fakultas Teknik UISU",
        viewer: byId("landingModel2")
    }
];

function showLandingModel(index) {
    if (!landingModels.length) return;

    state.landingModelIndex =
        (index + landingModels.length) %
        landingModels.length;

    landingModels.forEach((item, i) => {
        item.viewer?.classList.toggle(
            "active",
            i === state.landingModelIndex
        );
    });

    setText(
        "landingModelName",
        landingModels[state.landingModelIndex].name
    );

    setText(
        "landingModelCounter",
        `${state.landingModelIndex + 1} / ${landingModels.length}`
    );
}

on("landingNextModel", "click", () => {
    showLandingModel(state.landingModelIndex + 1);
});

/* =========================================================
   WARNA UNIT PROGRAM STUDI
========================================================= */

const UNIT_CLASS = {
    "Teknik Informatika": "room-unit-informatika",
    "Teknik Mesin": "room-unit-mesin",
    "Teknik Sipil": "room-unit-sipil",
    "Teknik Industri": "room-unit-industri",
    "Teknik Elektro": "room-unit-elektro",
    "Fakultas Teknik": "room-unit-fakultas"
};

function renderUnitMarkup(units) {
    if (!Array.isArray(units) || !units.length) {
        return "";
    }

    const content = units.map((unit, index) => {
        const className =
            UNIT_CLASS[unit] || "room-unit-fakultas";

        const separator = index < units.length - 1
            ? '<span class="room-unit-punctuation">, </span>'
            : "";

        return `
            <span class="room-unit ${className}">
                ${escapeHtml(unit)}
            </span>${separator}
        `;
    }).join("");

    return `
        <span class="room-unit-group">
            <span class="room-unit-punctuation">(</span>
            ${content}
            <span class="room-unit-punctuation">)</span>
        </span>
    `;
}

/* =========================================================
   SEARCH
========================================================= */

function normalize(value) {
    return String(value || "").toLowerCase().trim();
}

function searchLocations(value) {
    const search = normalize(value);
    if (!search) return [];

    return locations.filter(location =>
        normalize(
            location.name + " " +
            (location.units || []).join(" ") + " " +
            (location.parent || "")
        ).includes(search)
    ).slice(0, 40);
}

function renderSearchResults(
    results,
    container,
    callback
) {
    if (!container) return;

    container.innerHTML = "";

    if (!results.length) {
        container.innerHTML = `
            <div class="search-empty">
                Lokasi tidak ditemukan.
            </div>
        `;
        return;
    }

    results.forEach(location => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "search-result";

        const type = location.type === "building"
            ? "Gedung"
            : location.type === "person"
                ? "Civitas"
                : "Ruangan";

        button.innerHTML = `
            <span>
                <strong class="search-result-title">
                    <span>${escapeHtml(location.name)}</span>
                    ${renderUnitMarkup(location.units)}
                </strong>
                <small>
                    ${escapeHtml(location.parent || "Fakultas Teknik UISU")}
                    ${location.floor ? " • Lantai " + location.floor : ""}
                </small>
            </span>
            <span class="search-type">${type}</span>
        `;

        button.addEventListener("click", () =>
            callback(location)
        );

        container.appendChild(button);
    });
}

/* GLOBAL SEARCH */
on("globalSearch", "input", event => {
    const value = event.target.value;

    if (!value.trim()) {
        hide("globalSearchResults");
        return;
    }

    renderSearchResults(
        searchLocations(value),
        byId("globalSearchResults"),
        location => {
            state.globalSelection = location;

            setText(
                "globalSelectedName",
                location.name
            );

            byId("globalSearch").value = location.name;

            hide("globalSearchResults");
            show("globalSelected");
        }
    );

    show("globalSearchResults");
});

on("clearGlobalSearch", "click", () => {
    if (byId("globalSearch")) {
        byId("globalSearch").value = "";
    }

    state.globalSelection = null;

    hide("globalSearchResults");
    hide("globalSelected");
});

/* =========================================================
   MODAL INFORMASI
========================================================= */

function openInfo(location) {
    if (!location) return;

    state.infoLocation = location;

    setText("infoTitle", location.name);

    const units = byId("infoUnits");

    if (units) {
        units.innerHTML =
            renderUnitMarkup(location.units);

        units.classList.toggle(
            "hidden",
            !Array.isArray(location.units) ||
            !location.units.length
        );
    }

    setText(
        "infoDescription",
        location.description || "Informasi belum tersedia."
    );

    show("infoModal");
}

function closeInfo() {
    hide("infoModal");
}

on("closeInfoModal", "click", closeInfo);
on("infoBackdrop", "click", closeInfo);

on("globalInfoButton", "click", () => {
    openInfo(state.globalSelection);
});

on("globalNavButton", "click", () => {
    openNavigationWithDestination(
        state.globalSelection
    );
});

/* =========================================================
   TENDIK — REVISI 9

   DIDUKUNG:
   - UNIT BIRO
   - PERPUSTAKAAN
   - RUANG SERBAGUNA (BARU)
========================================================= */

function normalizeWhatsappNumber(phone) {
    let digits = String(phone || "")
        .replace(/\D/g, "");

    if (!digits) return "";

    if (digits.startsWith("0")) {
        digits = "62" + digits.slice(1);
    }

    return digits;
}

function whatsappUrl(phone) {
    const number =
        normalizeWhatsappNumber(phone);

    return number
        ? `https://wa.me/${number}`
        : "";
}

function openTendik(location) {
    if (!location) return;

    const isBiroRoom =
        location.buildingId === "biro-ft";

    const isLibrary =
        location.id === "perpustakaan-ft";

    /* REVISI 9: RUANG SERBAGUNA */
    const isSerbaguna =
        location.id === "serbaguna-ft";

    const contacts = Array.isArray(location.tendik)
        ? location.tendik
        : [];

    if (
        (!isBiroRoom && !isLibrary && !isSerbaguna) ||
        !contacts.length
    ) {
        return;
    }

    setText("tendikRoomTitle", location.name);
    hide("tendikRoomParent");

    const list = byId("tendikList");
    if (!list) return;

    list.replaceChildren();

    contacts.forEach(contact => {
        const card = document.createElement("article");
        card.className = "tendik-card";

        const jabatan =
            String(contact.jabatan || "-").trim() || "-";

        const name =
            String(contact.name || "-").trim() || "-";

        const phone =
            String(contact.phone || "-").trim() || "-";

        const photo =
            String(contact.photo || "").trim();

        const wa =
            phone !== "-"
                ? whatsappUrl(phone)
                : "";

        const photoMarkup = photo
            ? `
                <div class="tendik-photo-wrap">
                    <img
                        class="tendik-photo"
                        src="${escapeHtml(photo)}"
                        alt="Foto ${escapeHtml(name)}"
                        loading="lazy"
                        decoding="async"
                        onerror="this.parentNode.classList.add('tendik-photo-empty');this.remove()">
                </div>
            `
            : `
                <div class="tendik-photo-wrap tendik-photo-empty"
                     aria-label="Foto tidak tersedia">
                    -
                </div>
            `;

        card.innerHTML = `
            <p class="tendik-jabatan">
                ${escapeHtml(jabatan)}
            </p>

            ${photoMarkup}

            <h3 class="tendik-name">
                ${escapeHtml(name)}
            </h3>

            ${
                wa
                    ? `
                        <a class="tendik-whatsapp"
                           href="${wa}"
                           target="_blank"
                           rel="noopener noreferrer"
                           aria-label="WhatsApp ${escapeHtml(name)}">
                            <span class="tendik-whatsapp-label">
                                KONTAK (WhatsApp)
                            </span>
                            <strong>${escapeHtml(phone)}</strong>
                        </a>
                    `
                    : `
                        <div class="tendik-whatsapp tendik-contact-empty">
                            <span class="tendik-whatsapp-label">
                                KONTAK
                            </span>
                            <strong>-</strong>
                        </div>
                    `
            }
        `;

        list.appendChild(card);
    });

    show("tendikModal");
}

function closeTendik() {
    hide("tendikModal");
}

on("closeTendikModal", "click", closeTendik);
on("tendikBackdrop", "click", closeTendik);

/* =========================================================
   PILIH GEDUNG DAN VARIAN 3D
========================================================= */

function populateBuildingSelect(select) {
    if (!select) return;

    select.innerHTML = `
        <option value="">-- Pilih Gedung --</option>
    `;

    buildings.slice()
        .sort((a, b) =>
            (a.modelMenuOrder ?? 99) -
            (b.modelMenuOrder ?? 99)
        )
        .forEach(building => {
            const option =
                document.createElement("option");

            option.value = building.id;
            option.textContent =
                building.modelMenuName || building.name;

            select.appendChild(option);
        });
}

const viewerBuildingSelect =
    byId("viewerBuildingSelect");

const arBuildingSelect =
    byId("arBuildingSelect");

populateBuildingSelect(viewerBuildingSelect);
populateBuildingSelect(arBuildingSelect);

function renderModelSwitch({
    building,
    activeModelId,
    containerId,
    singleBadgeId,
    onChange
}) {
    const container = byId(containerId);
    const badge = byId(singleBadgeId);

    if (!container || !badge || !building) return;

    const models = building.models || [];
    container.innerHTML = "";

    if (models.length <= 1) {
        hide(containerId);

        if (models[0]) {
            badge.textContent = models[0].name;
            show(singleBadgeId);
        } else {
            hide(singleBadgeId);
        }

        return;
    }

    hide(singleBadgeId);
    show(containerId);

    models.forEach(model => {
        const button =
            document.createElement("button");

        button.type = "button";
        button.className = "model-switch-button";
        button.textContent = model.name;

        button.classList.toggle(
            "active",
            model.id === activeModelId
        );

        button.addEventListener("click", () => {
            onChange(model.id);
        });

        container.appendChild(button);
    });
}

/* =========================================================
   3D VIEWER
========================================================= */

const main3DViewer = byId("main3DViewer");

let current3DModel = {
    buildingId: null,
    modelId: null,
    src: null
};

function updateViewerText(building, model) {
    const title =
        model.viewerTitle || building.name;

    setText("viewerTitle", title);

    setText(
        "viewerCurrentModelName",
        title + " - " + model.name
    );

    setText(
        "viewerPreloadDescription",
        model.viewerDescription
    );
}

function setViewerLoading(building, model) {
    updateViewerText(building, model);

    setText(
        "viewerLoadStatus",
        "MEMUAT MODEL 3D..."
    );

    byId("viewerLoadingDot").className =
        "loading-dot loading";

    show("viewerLoadingOverlay");
    hide("viewerUnavailable");
}

function setViewerReady(building, model) {
    updateViewerText(building, model);

    setText(
        "viewerLoadStatus",
        "MODEL 3D SIAP"
    );

    byId("viewerLoadingDot").className =
        "loading-dot ready";

    hide("viewerLoadingOverlay");
    hide("viewerUnavailable");
}

function setViewerUnavailable(building, model) {
    updateViewerText(building, model);

    setText(
        "viewerLoadStatus",
        "MODEL BELUM TERSEDIA"
    );

    byId("viewerLoadingDot").className =
        "loading-dot error";

    hide("viewerLoadingOverlay");
    show("viewerUnavailable");
}

function applyModelDefaultCamera(model, jump = true) {
    if (!main3DViewer || !model) return;

    main3DViewer.cameraOrbit =
        model.defaultCameraOrbit ||
        "0deg 75deg auto";

    main3DViewer.cameraTarget =
        model.defaultCameraTarget ||
        "auto auto auto";

    main3DViewer.fieldOfView =
        model.defaultFieldOfView ||
        "35deg";

    if (
        jump &&
        typeof main3DViewer.jumpCameraToGoal === "function"
    ) {
        main3DViewer.jumpCameraToGoal();
    }
}

on("resetCamera", "click", () => {
    const model = getModelVariant(
        current3DModel.buildingId,
        current3DModel.modelId
    );

    if (model) {
        applyModelDefaultCamera(model, true);
    }
});

function load3DModel(building, model) {
    if (!building || !model || !main3DViewer) return;

    state.viewerBuildingId = building.id;
    state.viewerModelId = model.id;

    current3DModel = {
        buildingId: building.id,
        modelId: model.id,
        src: model.src
    };

    applyModelDefaultCamera(model, true);

    renderModelSwitch({
        building,
        activeModelId: model.id,
        containerId: "viewerModelSwitch",
        singleBadgeId: "viewerSingleModeBadge",
        onChange: modelId => {
            const next =
                getModelVariant(building.id, modelId);

            if (next) {
                load3DModel(building, next);
            }
        }
    });

    setViewerLoading(building, model);
    cacheModel(model.src);

    if (
        main3DViewer.getAttribute("src") !== model.src
    ) {
        main3DViewer.setAttribute("src", model.src);
    } else {
        setViewerReady(building, model);
    }

    applyDestinationMarker();
}

main3DViewer?.addEventListener("load", () => {
    const building =
        getBuildingById(current3DModel.buildingId);

    const model = getModelVariant(
        current3DModel.buildingId,
        current3DModel.modelId
    );

    if (building && model) {
        setViewerReady(building, model);
        applyModelDefaultCamera(model, true);
    }
});

main3DViewer?.addEventListener("error", () => {
    const building =
        getBuildingById(current3DModel.buildingId);

    const model = getModelVariant(
        current3DModel.buildingId,
        current3DModel.modelId
    );

    if (building && model) {
        setViewerUnavailable(building, model);
    }
});

function prepareViewerBuilding(
    buildingId,
    preferredModelId = null,
    scroll = true
) {
    const building =
        getBuildingById(buildingId);

    if (!building) {
        toast("Gedung tidak ditemukan.");
        return;
    }

    const models = building.models || [];

    if (!models.length) {
        toast("Model belum tersedia.");
        return;
    }

    preloadBuildingModels(building);
    show("viewerCard");

    const model =
        getModelVariant(building.id, preferredModelId) ||
        getDefaultModelVariant(building.id) ||
        models[0];

    load3DModel(building, model);

    if (scroll) {
        setTimeout(() => {
            byId("viewerCard")?.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }, 50);
    }
}

on("show3DModel", "click", () => {
    const id = viewerBuildingSelect?.value;

    if (!id) {
        setText(
            "viewerMessage",
            "Pilih gedung terlebih dahulu."
        );
        return;
    }

    setText("viewerMessage", "");
    state.pending3DMarker = null;

    prepareViewerBuilding(id);
});

function applyDestinationMarker() {
    hide("destination3DHotspot");

    if (!state.pending3DMarker) return;

    const marker =
        state.pending3DMarker.marker;

    const element =
        byId("destination3DHotspot");

    if (!element) return;

    element.dataset.position =
        `${marker.x}m ${marker.y}m ${marker.z}m`;

    setText(
        "destination3DLabel",
        state.pending3DMarker.label
    );

    show("destination3DHotspot");
}

/* =========================================================
   AR PREVIEW — PILIH INDOOR / OUTDOOR
========================================================= */

const mainARViewer = byId("mainARViewer");

function setARLoading(building, model) {
    const title = model.viewerTitle || building.name;

    setText("arViewerTitle", title);
    setText(
        "arCurrentModelName",
        title + " - " + model.name
    );
    setText(
        "arPreloadDescription",
        model.viewerDescription
    );
    setText("arLoadStatus", "MEMUAT MODEL AR...");

    byId("arLoadingDot").className =
        "loading-dot loading";

    show("arLoadingOverlay");
    hide("arUnavailable");

    const launch = byId("launchARCamera");
    if (launch) launch.disabled = true;
}

function setARReady(building, model) {
    const title = model.viewerTitle || building.name;

    setText("arViewerTitle", title);
    setText(
        "arCurrentModelName",
        title + " - " + model.name
    );
    setText(
        "arPreloadDescription",
        model.viewerDescription
    );
    setText("arLoadStatus", "MODEL AR SIAP");

    byId("arLoadingDot").className =
        "loading-dot ready";

    hide("arLoadingOverlay");
    hide("arUnavailable");

    const launch = byId("launchARCamera");
    if (launch) launch.disabled = false;
}

function setARUnavailable(building, model) {
    const title = model.viewerTitle || building.name;

    setText("arViewerTitle", title);
    setText(
        "arCurrentModelName",
        title + " - " + model.name
    );
    setText(
        "arLoadStatus",
        "MODEL BELUM TERSEDIA"
    );

    byId("arLoadingDot").className =
        "loading-dot error";

    hide("arLoadingOverlay");
    show("arUnavailable");

    const launch = byId("launchARCamera");
    if (launch) launch.disabled = true;
}

function loadARModel(buildingId, modelId) {
    const building = getBuildingById(buildingId);
    if (!building) return;

    const model =
        getModelVariant(buildingId, modelId) ||
        getDefaultModelVariant(buildingId);

    if (!model) return;

    state.arBuildingId = building.id;
    state.arModelId = model.id;

    preloadBuildingModels(building);
    show("arViewerCard");

    renderModelSwitch({
        building,
        activeModelId: model.id,
        containerId: "arModelSwitch",
        singleBadgeId: "arSingleModeBadge",
        onChange: id => loadARModel(building.id, id)
    });

    setARLoading(building, model);

    if (mainARViewer) {
        if (
            mainARViewer.getAttribute("src") !== model.src
        ) {
            mainARViewer.setAttribute("src", model.src);
        } else if (mainARViewer.loaded) {
            setARReady(building, model);
        }
    }
}

mainARViewer?.addEventListener("load", () => {
    const building =
        getBuildingById(state.arBuildingId);

    const model = getModelVariant(
        state.arBuildingId,
        state.arModelId
    );

    if (!building || !model) return;

    if (
        mainARViewer.getAttribute("src") !== model.src
    ) {
        return;
    }

    setARReady(building, model);
});

mainARViewer?.addEventListener("error", () => {
    const building =
        getBuildingById(state.arBuildingId);

    const model = getModelVariant(
        state.arBuildingId,
        state.arModelId
    );

    if (building && model) {
        setARUnavailable(building, model);
    }
});

on("prepareMainAR", "click", () => {
    const buildingId =
        arBuildingSelect?.value;

    if (!buildingId) {
        setText(
            "arMessage",
            "Pilih gedung terlebih dahulu."
        );
        return;
    }

    setText("arMessage", "");

    const model =
        getModelVariant(buildingId, "outdoor") ||
        getDefaultModelVariant(buildingId);

    if (!model) return;

    loadARModel(buildingId, model.id);

    setTimeout(() => {
        byId("arViewerCard")?.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }, 60);
});

on("launchARCamera", "click", () => {
    const building =
        getBuildingById(state.arBuildingId);

    const model = getModelVariant(
        state.arBuildingId,
        state.arModelId
    );

    if (!building || !model) return;

    if (byId("launchARCamera")?.disabled) {
        return;
    }

    window.FT_WEBAR?.start(
        model.src,
        `${building.name} • ${model.name}`
    );
});

/* =========================================================
   DIREKTORI — SINGLE ACCORDION
========================================================= */

function locationForBuilding(building) {
    return locations.find(item =>
        item.type === "building" &&
        item.id === building.id
    ) || null;
}

function locationForRoom(room) {
    return locations.find(item =>
        item.type === "room" &&
        item.id === room.id
    ) || null;
}

function closeDirectoryRoomItem(item) {
    if (!item) return;

    item.classList.remove("open");

    item.querySelector(".room-toggle-button")
        ?.setAttribute("aria-expanded", "false");

    item.querySelector(".room-actions")
        ?.classList.add("hidden");
}

function closeDirectoryBuildingCard(article) {
    if (!article) return;

    article.classList.remove("open");

    article.querySelector(".building-button")
        ?.setAttribute("aria-expanded", "false");

    article.querySelectorAll(".room-item.open")
        .forEach(closeDirectoryRoomItem);
}

function closeOtherDirectoryRooms(current) {
    document.querySelectorAll(
        ".directory .room-item.open"
    ).forEach(item => {
        if (item !== current) {
            closeDirectoryRoomItem(item);
        }
    });
}

function closeOtherDirectoryBuildings(current) {
    document.querySelectorAll(
        ".directory .building-card.open"
    ).forEach(article => {
        if (article !== current) {
            closeDirectoryBuildingCard(article);
        }
    });
}

/* DAFTAR RUANGAN */
function renderRoomList(roomList, container) {
    if (!container) return;

    container.innerHTML = "";
    if (!roomList.length) return;

    const grid = document.createElement("div");
    grid.className = "room-grid";

    roomList.forEach(room => {
        const location = locationForRoom(room);
        const item = document.createElement("div");

        item.className = "room-item";

        const actionsId =
            `directory-room-actions-${room.id}`;

        const hasTendik =
            room.buildingId === "biro-ft" &&
            Array.isArray(room.tendik) &&
            room.tendik.length > 0;

        item.innerHTML = `
            <button
                type="button"
                class="room-row room-toggle-button"
                aria-expanded="false"
                aria-controls="${actionsId}">

                <span class="room-name-wrap">
                    <span class="room-name"></span>
                    <span class="room-unit-slot"></span>
                </span>

                <span class="room-chevron"
                      aria-hidden="true">›</span>
            </button>

            <div id="${actionsId}"
                 class="room-actions hidden">

                <button type="button"
                        class="room-info">
                    Informasi
                </button>

                <button type="button"
                        class="room-nav">
                    Petunjuk Arah
                </button>

                ${
                    hasTendik
                        ? `
                            <button
                                type="button"
                                class="room-tendik">
                                Tendik
                            </button>
                        `
                        : ""
                }

            </div>
        `;

        item.querySelector(".room-name")
            .textContent = room.name;

        item.querySelector(".room-unit-slot")
            .innerHTML = renderUnitMarkup(room.units);

        const toggle =
            item.querySelector(".room-toggle-button");

        const actions =
            item.querySelector(".room-actions");

        toggle.addEventListener("click", () => {
            const expanded =
                toggle.getAttribute("aria-expanded") !==
                "true";

            closeOtherDirectoryRooms(item);

            toggle.setAttribute(
                "aria-expanded",
                String(expanded)
            );

            actions.classList.toggle(
                "hidden",
                !expanded
            );

            item.classList.toggle(
                "open",
                expanded
            );
        });

        item.querySelector(".room-info")
            .addEventListener("click", () => {
                openInfo(location);
            });

        item.querySelector(".room-nav")
            .addEventListener("click", () => {
                openNavigationWithDestination(location);
            });

        item.querySelector(".room-tendik")
            ?.addEventListener("click", () => {
                openTendik(room);
            });

        grid.appendChild(item);
    });

    container.appendChild(grid);
}

/* LABORATORIUM PER LANTAI */
function renderLaboratory(roomList, container) {
    const floorButtons =
        document.createElement("div");

    floorButtons.className = "floor-buttons";

    const roomContainer =
        document.createElement("div");

    [1, 2, 3].forEach(floor => {
        const button =
            document.createElement("button");

        button.type = "button";
        button.className = "floor-button";
        button.textContent = `Lantai ${floor}`;

        button.addEventListener("click", () => {
            Array.from(
                floorButtons.children
            ).forEach(element => {
                element.classList.remove("active");
            });

            button.classList.add("active");

            renderRoomList(
                roomList.filter(
                    room => room.floor === floor
                ),
                roomContainer
            );
        });

        floorButtons.appendChild(button);
    });

    container.appendChild(floorButtons);
    container.appendChild(roomContainer);

    floorButtons.firstElementChild?.click();
}

/* =========================================================
   RENDER DIREKTORI — REVISI 9

   TENDIK:
   - PERPUSTAKAAN
   - RUANG SERBAGUNA
   - RUANG TERPILIH DI BIRO
========================================================= */

function renderDirectory() {
    const container =
        byId("directoryContainer");

    if (!container) return;

    container.innerHTML = "";

    buildings.forEach((building, index) => {
        const buildingRooms = rooms.filter(
            room => room.buildingId === building.id
        );

        const location =
            locationForBuilding(building);

        const article =
            document.createElement("article");

        article.className = "building-card";

        article.innerHTML = `
            <button
                class="building-button"
                type="button"
                aria-expanded="false"
                aria-controls="directory-building-content-${building.id}">

                <span class="building-number">
                    ${String(index + 1).padStart(2, "0")}
                </span>

                <span>
                    <strong>${escapeHtml(building.name)}</strong>
                </span>

                <span>›</span>
            </button>

            <div
                id="directory-building-content-${building.id}"
                class="building-content">
            </div>
        `;

        const header =
            article.querySelector(".building-button");

        const content =
            article.querySelector(".building-content");

        header.addEventListener("click", () => {
            const expanded =
                !article.classList.contains("open");

            closeOtherDirectoryBuildings(article);

            article.classList.toggle(
                "open",
                expanded
            );

            header.setAttribute(
                "aria-expanded",
                String(expanded)
            );
        });

        /* REVISI 9:
           TOMBOL TENDIK SEKARANG ADA JUGA
           DI RUANG SERBAGUNA.
        */
        const hasBuildingTendik =
            (
                building.id === "perpustakaan-ft" ||
                building.id === "serbaguna-ft"
            ) &&
            Array.isArray(building.tendik) &&
            building.tendik.length > 0;

        const actions =
            document.createElement("div");

        actions.className = "building-actions";

        actions.innerHTML = `
            <button
                class="button button-primary building-info"
                type="button">
                Informasi
            </button>

            <button
                class="button button-primary building-nav"
                type="button">
                Petunjuk Arah
            </button>

            ${
                hasBuildingTendik
                    ? `
                        <button
                            class="button button-primary building-tendik"
                            type="button">
                            Tendik
                        </button>
                    `
                    : ""
            }
        `;

        content.appendChild(actions);

        actions.querySelector(".building-info")
            .addEventListener("click", () => {
                openInfo(location);
            });

        actions.querySelector(".building-nav")
            .addEventListener("click", () => {
                openNavigationWithDestination(location);
            });

        actions.querySelector(".building-tendik")
            ?.addEventListener("click", () => {
                openTendik(location);
            });

        if (buildingRooms.length) {
            const roomHolder =
                document.createElement("div");

            content.appendChild(roomHolder);

            if (building.id === "laboratorium-ft") {
                renderLaboratory(
                    buildingRooms,
                    roomHolder
                );
            } else {
                renderRoomList(
                    buildingRooms,
                    roomHolder
                );
            }
        }

        container.appendChild(article);
    });
}

/* =========================================================
   NAVIGATION ENGINE — DIPERTAHANKAN
========================================================= */

function setStep(step) {
    [
        "stepTarget",
        "stepPosition",
        "stepRoute",
        "stepNavigation"
    ].forEach((id, index) => {
        byId(id)?.classList.toggle(
            "active",
            index + 1 <= step
        );
    });
}

function getImageContentBox(container, image) {
    if (!container || !image) return null;

    const cw = container.clientWidth;
    const ch = container.clientHeight;

    const nw = image.naturalWidth || cw;
    const nh = image.naturalHeight || ch;

    if (!cw || !ch || !nw || !nh) return null;

    const scale = Math.min(
        cw / nw,
        ch / nh
    );

    const width = nw * scale;
    const height = nh * scale;

    return {
        left: (cw - width) / 2,
        top: (ch - height) / 2,
        width,
        height
    };
}

function fitContainerToImage(container, image) {
    if (
        !container ||
        !image?.naturalWidth ||
        !image.naturalHeight
    ) return;

    container.style.aspectRatio =
        `${image.naturalWidth} / ${image.naturalHeight}`;
}

function fitSvgToImage(svg, container, image) {
    if (!svg || !container || !image) return;

    const box = getImageContentBox(
        container,
        image
    );

    if (!box) return;

    Object.assign(svg.style, {
        inset: "auto",
        left: box.left + "px",
        top: box.top + "px",
        width: box.width + "px",
        height: box.height + "px"
    });

    svg.setAttribute(
        "viewBox",
        `0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`
    );

    svg.setAttribute(
        "preserveAspectRatio",
        "none"
    );
}

function positionElementOnImage(
    element,
    point,
    container,
    image
) {
    if (
        !element ||
        !point ||
        !container ||
        !image
    ) return;

    const box =
        getImageContentBox(container, image);

    if (!box) return;

    element.style.left =
        box.left +
        point.x / MAP_WIDTH * box.width +
        "px";

    element.style.top =
        box.top +
        point.y / MAP_HEIGHT * box.height +
        "px";
}

function positionSelectionMapElement(
    element,
    point
) {
    positionElementOnImage(
        element,
        point,
        byId("navigationMap"),
        byId("navigationMapImage")
    );
}

function positionLiveMapElement(
    element,
    point
) {
    const container =
        byId("liveMapContent");

    if (!container) return;

    positionElementOnImage(
        element,
        point,
        container,
        container.querySelector(
            ".live-map-background"
        )
    );
}

function syncNavigationMapGeometry() {
    const container = byId("navigationMap");
    const image = byId("navigationMapImage");

    if (!container || !image) return;

    fitContainerToImage(container, image);

    fitSvgToImage(
        container.querySelector(".route-svg"),
        container,
        image
    );

    if (state.routeResult) {
        positionSelectionMapElement(
            byId("userMarker"),
            state.routeResult.startSnap.point
        );

        positionSelectionMapElement(
            byId("entranceMarker"),
            state.routeResult.entrance
        );
    }
}

function syncLiveMapGeometry() {
    const container =
        byId("liveMapContent");

    const image = container?.querySelector(
        ".live-map-background"
    );

    if (!container || !image) return;

    fitContainerToImage(container, image);

    fitSvgToImage(
        container.querySelector(".live-route-svg"),
        container,
        image
    );

    if (state.routeResult) {
        positionLiveMapElement(
            byId("liveUserMarker"),
            state.routeResult.startSnap.point
        );

        positionLiveMapElement(
            byId("liveDestinationMarker"),
            state.routeResult.entrance
        );

        renderLiveBuildingMarkers();
    }
}

function syncAllMapGeometry() {
    syncNavigationMapGeometry();
    syncLiveMapGeometry();
}

function resetNavigation() {
    stopGpsTracking();

    state.destination = null;
    state.clickedPosition = null;
    state.routeResult = null;

    if (byId("navigationSearch")) {
        byId("navigationSearch").value = "";
    }

    byId("activeRoute")?.setAttribute(
        "points",
        ""
    );

    [
        "mapSection",
        "selectedDestination",
        "routeFoundBox",
        "userMarker",
        "entranceMarker",
        "resetPosition"
    ].forEach(hide);

    show("mapInstructionArea");
    setStep(1);

    const results =
        byId("navigationSearchResults");

    if (results) {
        results.innerHTML = `
            <div class="search-empty">
                Ketik nama gedung atau ruangan tujuan.
            </div>
        `;
    }
}

function selectDestination(location) {
    if (!location) return;

    state.destination = location;

    if (byId("navigationSearch")) {
        byId("navigationSearch").value =
            location.name;
    }

    setText(
        "selectedDestinationName",
        location.name
    );

    setText(
        "selectedDestinationParent",
        location.parent || "Fakultas Teknik UISU"
    );

    show("selectedDestination");

    byId("navigationSearchResults").innerHTML = "";

    setText(
        "mapHeadingTitle",
        `Tap pada denah sesuai posisi Anda sekarang, lalu sistem akan memberikan jalur terdekat menuju ${location.name}.`
    );

    show("mapInstructionArea");
    show("mapSection");

    [
        "routeFoundBox",
        "userMarker",
        "entranceMarker",
        "resetPosition"
    ].forEach(hide);

    byId("activeRoute")?.setAttribute(
        "points",
        ""
    );

    setStep(2);

    setTimeout(() => {
        syncNavigationMapGeometry();

        byId("mapSection")?.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }, 80);
}

on("navigationSearch", "input", event => {
    const query = event.target.value;
    const container =
        byId("navigationSearchResults");

    if (!container) return;

    if (!query.trim()) {
        container.innerHTML = `
            <div class="search-empty">
                Ketik nama gedung atau ruangan tujuan.
            </div>
        `;
        return;
    }

    renderSearchResults(
        searchLocations(query),
        container,
        selectDestination
    );
});

/* DIJKSTRA */
function pointDistance(a, b) {
    return Math.hypot(
        a.x - b.x,
        a.y - b.y
    );
}

const graph = {};

Object.keys(mapNodes).forEach(id => {
    graph[id] = [];
});

const preparedEdges = mapEdges.map(edge => {
    const points = edge.points.map(p => ({
        x: p[0],
        y: p[1]
    }));

    let length = 0;
    const cumulative = [0];

    for (let i = 0; i < points.length - 1; i++) {
        length += pointDistance(
            points[i],
            points[i + 1]
        );

        cumulative.push(length);
    }

    return {
        ...edge,
        points,
        length,
        cumulative
    };
});

const edgeById = {};

preparedEdges.forEach(edge => {
    edgeById[edge.id] = edge;

    graph[edge.from]?.push({
        node: edge.to,
        edgeId: edge.id,
        weight: edge.length
    });

    graph[edge.to]?.push({
        node: edge.from,
        edgeId: edge.id,
        weight: edge.length
    });
});

function projectPointToSegment(point, a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;

    const lengthSquared =
        dx * dx + dy * dy;

    const t = lengthSquared
        ? Math.max(
            0,
            Math.min(
                1,
                (
                    (point.x - a.x) * dx +
                    (point.y - a.y) * dy
                ) / lengthSquared
            )
        )
        : 0;

    const projected = {
        x: a.x + dx * t,
        y: a.y + dy * t
    };

    return {
        point: projected,
        t,
        distance: pointDistance(
            point,
            projected
        )
    };
}

function snapToRoute(point) {
    let best = null;

    preparedEdges.forEach(edge => {
        for (
            let i = 0;
            i < edge.points.length - 1;
            i++
        ) {
            const a = edge.points[i];
            const b = edge.points[i + 1];

            const projection =
                projectPointToSegment(point, a, b);

            const segmentLength =
                pointDistance(a, b);

            const along =
                edge.cumulative[i] +
                segmentLength * projection.t;

            if (
                !best ||
                projection.distance < best.distance
            ) {
                best = {
                    edge,
                    segmentIndex: i,
                    point: projection.point,
                    distance: projection.distance,
                    along,
                    distanceToFrom: along,
                    distanceToTo:
                        edge.length - along
                };
            }
        }
    });

    return best;
}

function dijkstra(start, target) {
    const ids = Object.keys(graph);

    if (
        !ids.includes(start) ||
        !ids.includes(target)
    ) {
        return null;
    }

    const distance = {};
    const previous = {};
    const previousEdge = {};

    ids.forEach(id => {
        distance[id] = Infinity;
        previous[id] = null;
        previousEdge[id] = null;
    });

    distance[start] = 0;

    const remaining = new Set(ids);

    while (remaining.size) {
        let current = null;
        let minimum = Infinity;

        remaining.forEach(id => {
            if (distance[id] < minimum) {
                minimum = distance[id];
                current = id;
            }
        });

        if (current === null || minimum === Infinity) {
            break;
        }

        if (current === target) break;

        remaining.delete(current);

        graph[current].forEach(next => {
            if (!remaining.has(next.node)) return;

            const cost =
                distance[current] + next.weight;

            if (cost < distance[next.node]) {
                distance[next.node] = cost;
                previous[next.node] = current;
                previousEdge[next.node] =
                    next.edgeId;
            }
        });
    }

    if (distance[target] === Infinity) {
        return null;
    }

    const nodes = [];
    const edges = [];

    let cursor = target;

    while (cursor) {
        nodes.unshift(cursor);

        if (cursor === start) break;

        edges.unshift(previousEdge[cursor]);
        cursor = previous[cursor];
    }

    return {
        distance: distance[target],
        nodes,
        edges
    };
}

function pointsFromSnapToEndpoint(
    snap,
    endpoint
) {
    const points = snap.edge.points;
    const output = [{ ...snap.point }];

    if (endpoint === snap.edge.from) {
        output.push(
            points[snap.segmentIndex]
        );

        for (
            let i = snap.segmentIndex - 1;
            i >= 0;
            i--
        ) {
            output.push(points[i]);
        }
    } else {
        output.push(
            points[snap.segmentIndex + 1]
        );

        for (
            let i = snap.segmentIndex + 2;
            i < points.length;
            i++
        ) {
            output.push(points[i]);
        }
    }

    return output;
}

function routeNodePolyline(route) {
    const output = [];

    route.edges.forEach((edgeId, index) => {
        const edge = edgeById[edgeId];
        if (!edge) return;

        const forward =
            edge.from === route.nodes[index];

        let points = forward
            ? edge.points.slice()
            : edge.points.slice().reverse();

        if (output.length) {
            points = points.slice(1);
        }

        output.push(...points);
    });

    return output;
}

function dedupePoints(points) {
    const output = [];

    points.forEach(point => {
        const last =
            output[output.length - 1];

        if (
            !last ||
            pointDistance(last, point) > .5
        ) {
            output.push(point);
        }
    });

    return output;
}

function buildRoute(clickedPoint) {
    if (!state.destination) return null;

    const entrance =
        getNavigationEntrance(state.destination);

    if (!entrance) return null;

    const snap = snapToRoute(clickedPoint);
    if (!snap) return null;

    const fromRoute = dijkstra(
        snap.edge.from,
        entrance.nodeId
    );

    const toRoute = dijkstra(
        snap.edge.to,
        entrance.nodeId
    );

    const candidates = [];

    if (fromRoute) {
        candidates.push({
            endpoint: snap.edge.from,
            route: fromRoute,
            cost:
                snap.distanceToFrom +
                fromRoute.distance
        });
    }

    if (toRoute) {
        candidates.push({
            endpoint: snap.edge.to,
            route: toRoute,
            cost:
                snap.distanceToTo +
                toRoute.distance
        });
    }

    if (!candidates.length) return null;

    candidates.sort((a, b) =>
        a.cost - b.cost
    );

    const best = candidates[0];

    const startPart =
        pointsFromSnapToEndpoint(
            snap,
            best.endpoint
        );

    const graphPart =
        routeNodePolyline(best.route);

    return {
        startSnap: snap,
        entrance,
        graphDistance: best.cost,
        points: dedupePoints([
            ...startPart,
            ...graphPart,
            {
                x: entrance.x,
                y: entrance.y
            }
        ])
    };
}

on("navigationMap", "pointerdown", event => {
    if (!state.destination) return;

    const map = byId("navigationMap");
    const image = byId("navigationMapImage");

    const rect =
        map.getBoundingClientRect();

    const box =
        getImageContentBox(map, image);

    if (!box) return;

    const x =
        event.clientX - rect.left;

    const y =
        event.clientY - rect.top;

    if (
        x < box.left ||
        x > box.left + box.width ||
        y < box.top ||
        y > box.top + box.height
    ) {
        return;
    }

    const point = {
        x:
            (x - box.left) /
            box.width * MAP_WIDTH,
        y:
            (y - box.top) /
            box.height * MAP_HEIGHT
    };

    const route = buildRoute(point);

    if (!route) {
        toast("Rute belum ditemukan.");
        return;
    }

    state.clickedPosition = point;
    state.routeResult = route;

    byId("activeRoute")?.setAttribute(
        "points",
        route.points.map(
            p => `${p.x},${p.y}`
        ).join(" ")
    );

    positionSelectionMapElement(
        byId("userMarker"),
        route.startSnap.point
    );

    positionSelectionMapElement(
        byId("entranceMarker"),
        route.entrance
    );

    show("userMarker");
    show("entranceMarker");

    hide("mapInstructionArea");

    show("routeFoundBox");
    show("resetPosition");

    setStep(3);
});

on("resetPosition", "click", () => {
    state.clickedPosition = null;
    state.routeResult = null;

    byId("activeRoute")?.setAttribute(
        "points",
        ""
    );

    [
        "userMarker",
        "entranceMarker",
        "routeFoundBox",
        "resetPosition"
    ].forEach(hide);

    show("mapInstructionArea");
    setStep(2);
});

/* PETUNJUK RUTE */
function turnAngle(a, b, c) {
    const ax = b.x - a.x;
    const ay = b.y - a.y;

    const bx = c.x - b.x;
    const by = c.y - b.y;

    return Math.atan2(
        ax * by - ay * bx,
        ax * bx + ay * by
    ) * 180 / Math.PI;
}

function simplifyInstructionPoints(points) {
    if (!points || points.length <= 2) {
        return points?.slice() || [];
    }

    const result = [points[0]];

    for (
        let i = 1;
        i < points.length - 1;
        i++
    ) {
        if (
            Math.abs(
                turnAngle(
                    points[i - 1],
                    points[i],
                    points[i + 1]
                )
            ) >= 28
        ) {
            result.push(points[i]);
        }
    }

    result.push(
        points[points.length - 1]
    );

    return result;
}

function createNavigationInstructions() {
    if (
        !state.routeResult ||
        !state.destination
    ) {
        return [];
    }

    const points =
        simplifyInstructionPoints(
            state.routeResult.points
        );

    const output = [{
        icon: "●",
        title: "Lokasi Anda saat ini",
        description:
            "Mulai dari posisi yang Anda tandai pada denah."
    }];

    for (
        let i = 1;
        i < points.length - 1;
        i++
    ) {
        const angle = turnAngle(
            points[i - 1],
            points[i],
            points[i + 1]
        );

        if (angle > 28) {
            output.push({
                icon: "↱",
                title: "Belok kanan",
                description:
                    "Ikuti jalur hingga persimpangan berikutnya."
            });
        } else if (angle < -28) {
            output.push({
                icon: "↰",
                title: "Belok kiri",
                description:
                    "Ikuti jalur hingga persimpangan berikutnya."
            });
        }
    }

    output.push({
        icon: "◎",
        title: "Entrance tujuan di depan",
        description:
            state.routeResult.entrance.name
    });

    output.push({
        icon: "✓",
        title: "Anda sudah tiba",
        description:
            `Anda sudah tiba di entrance menuju ${state.destination.name}.`
    });

    return output;
}

function renderLiveBuildingMarkers() {
    const container =
        byId("liveBuildingMarkers");

    if (!container) return;

    container.innerHTML = "";

    buildings.forEach(building => {
        if (!building.liveMarker) return;

        const marker =
            document.createElement("div");

        marker.className =
            "live-building-marker";

        marker.innerHTML = `
            <span></span>
            <label>
                ${escapeHtml(building.name)}
            </label>
        `;

        container.appendChild(marker);

        positionLiveMapElement(
            marker,
            building.liveMarker
        );
    });
}

function renderRouteDetail() {
    const container =
        byId("routeInstructionList");

    if (!container) return;

    container.innerHTML = "";

    state.liveInstructions.forEach(item => {
        const row =
            document.createElement("div");

        row.className =
            "route-instruction-item";

        row.innerHTML = `
            <div class="route-step-icon">
                ${item.icon}
            </div>
            <div class="route-step-copy">
                <strong>
                    ${escapeHtml(item.title)}
                </strong>
                <span>
                    ${escapeHtml(item.description)}
                </span>
            </div>
        `;

        container.appendChild(row);
    });
}

function renderLiveNavigation() {
    if (
        !state.routeResult ||
        !state.destination
    ) {
        return;
    }

    const route = state.routeResult;

    byId("liveRoute")?.setAttribute(
        "points",
        route.points.map(
            p => `${p.x},${p.y}`
        ).join(" ")
    );

    syncLiveMapGeometry();

    positionLiveMapElement(
        byId("liveUserMarker"),
        route.startSnap.point
    );

    positionLiveMapElement(
        byId("liveDestinationMarker"),
        route.entrance
    );

    show("liveUserMarker");
    show("liveDestinationMarker");

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
        state.liveInstructions.find(item =>
            item.title !== "Lokasi Anda saat ini"
        );

    if (next) {
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

/* GPS KALIBRASI */
function solveAffine(
    calibration,
    lat,
    lon
) {
    if (
        !Array.isArray(calibration) ||
        calibration.length < 3
    ) {
        return null;
    }

    const [p1, p2, p3] = calibration;

    const determinant =
        p1.lon * (p2.lat - p3.lat) -
        p1.lat * (p2.lon - p3.lon) +
        (p2.lon * p3.lat -
         p3.lon * p2.lat);

    if (
        Math.abs(determinant) < 1e-12
    ) {
        return null;
    }

    function solve(v1, v2, v3) {
        const a = (
            v1 * (p2.lat - p3.lat) +
            v2 * (p3.lat - p1.lat) +
            v3 * (p1.lat - p2.lat)
        ) / determinant;

        const b = (
            v1 * (p3.lon - p2.lon) +
            v2 * (p1.lon - p3.lon) +
            v3 * (p2.lon - p1.lon)
        ) / determinant;

        const c = (
            v1 * (
                p2.lon * p3.lat -
                p3.lon * p2.lat
            ) +
            v2 * (
                p3.lon * p1.lat -
                p1.lon * p3.lat
            ) +
            v3 * (
                p1.lon * p2.lat -
                p2.lon * p1.lat
            )
        ) / determinant;

        return { a, b, c };
    }

    const cx = solve(
        p1.x,
        p2.x,
        p3.x
    );

    const cy = solve(
        p1.y,
        p2.y,
        p3.y
    );

    return {
        x:
            cx.a * lon +
            cx.b * lat +
            cx.c,
        y:
            cy.a * lon +
            cy.b * lat +
            cy.c
    };
}

function stopGpsTracking() {
    if (
        state.gpsWatchId !== null &&
        navigator.geolocation
    ) {
        navigator.geolocation.clearWatch(
            state.gpsWatchId
        );
    }

    state.gpsWatchId = null;
}

function startGpsTracking() {
    stopGpsTracking();

    if (mapCalibration.length < 3) return;
    if (!navigator.geolocation) return;

    state.gpsWatchId =
        navigator.geolocation.watchPosition(
            position => {
                const point = solveAffine(
                    mapCalibration,
                    position.coords.latitude,
                    position.coords.longitude
                );

                if (!point) return;

                const snap =
                    snapToRoute(point);

                positionLiveMapElement(
                    byId("liveUserMarker"),
                    snap?.point || point
                );
            },
            error => {
                console.warn("GPS:", error);
            },
            {
                enableHighAccuracy: true,
                maximumAge: 1000,
                timeout: 10000
            }
        );
}

on("startNavigation", "click", () => {
    if (
        !state.routeResult ||
        !state.destination
    ) {
        toast("Pilih posisi terlebih dahulu.");
        return;
    }

    showPage("navigationActive");

    setTimeout(() => {
        syncLiveMapGeometry();
        renderLiveNavigation();
        startGpsTracking();
    }, 80);

    setStep(4);
});

on("toggleRouteDetail", "click", () => {
    byId("routeDetailPanel")
        ?.classList.toggle("hidden");
});

on("endRoute", "click", () => {
    stopGpsTracking();
    resetNavigation();

    state.pageHistory = [];

    showPage("navigation", false);

    toast("Navigasi telah diakhiri.");
});

function showDestinationIn3D() {
    if (!state.destination) return;

    const location =
        state.destination;

    const buildingId =
        location.buildingId || location.id;

    const building =
        getBuildingById(buildingId);

    if (!building) return;

    let model = location.type === "room"
        ? getModelVariant(
            building.id,
            "indoor"
        )
        : null;

    if (!model) {
        model =
            getDefaultModelVariant(building.id);
    }

    showPage("viewer");

    if (viewerBuildingSelect) {
        viewerBuildingSelect.value =
            building.id;
    }

    state.pending3DMarker =
        location.modelMarker
            ? {
                marker: location.modelMarker,
                label: location.name
            }
            : null;

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
   MENU UTAMA
========================================================= */

function openNavigationWithDestination(
    location = null
) {
    if (!NAVIGATION_ENABLED) return;

    showPage("navigation");
    resetNavigation();

    if (location) {
        selectDestination(location);
    }
}

["menu3D", "feature3D"].forEach(id => {
    on(id, "click", () =>
        showPage("viewer")
    );
});

["menuAR", "featureAR"].forEach(id => {
    on(id, "click", () =>
        showPage("ar")
    );
});

["menuDirectory", "featureDirectory"]
    .forEach(id => {
        on(id, "click", () =>
            showPage("directory")
        );
    });

["menuNavigation", "featureNav"]
    .forEach(id => {
        on(id, "click", () =>
            openNavigationWithDestination()
        );
    });

/* TOAST */
let toastTimer = null;

function toast(message) {
    const element = byId("toast");
    if (!element) return;

    element.textContent = message;
    element.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
        element.classList.remove("show");
    }, 2600);
}

document.addEventListener(
    "keydown",
    event => {
        if (event.key !== "Escape") return;

        closeDrawer();

        if (
            !byId("tendikModal")
                ?.classList.contains("hidden")
        ) {
            closeTendik();
            return;
        }

        if (
            !byId("infoModal")
                ?.classList.contains("hidden")
        ) {
            closeInfo();
            return;
        }

        if (state.currentPage !== "home") {
            goBack();
        }
    }
);

/* =========================================================
   MAP RESIZE
========================================================= */

function registerMapImageEvents() {
    const selection =
        byId("navigationMapImage");

    if (selection) {
        if (
            selection.complete &&
            selection.naturalWidth
        ) {
            syncNavigationMapGeometry();
        } else {
            selection.addEventListener(
                "load",
                syncNavigationMapGeometry
            );
        }
    }

    const live =
        byId("liveMapContent")
            ?.querySelector(
                ".live-map-background"
            );

    if (live) {
        if (
            live.complete &&
            live.naturalWidth
        ) {
            syncLiveMapGeometry();
        } else {
            live.addEventListener(
                "load",
                syncLiveMapGeometry
            );
        }
    }
}

let resizeTimer = null;

window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);

    resizeTimer = setTimeout(
        syncAllMapGeometry,
        80
    );
});

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
   INITIALIZATION
========================================================= */

function startApp() {
    renderDirectory();
    applyFeatureVisibility();

    showSlide(0);
    showLandingModel(0);
    showPage("home", false);

    registerMapImageEvents();
    registerServiceWorker();

    const preload =
        () => preloadPriorityModels();

    if ("requestIdleCallback" in window) {
        requestIdleCallback(
            preload,
            { timeout: 2000 }
        );
    } else {
        setTimeout(preload, 1000);
    }

    setTimeout(
        syncAllMapGeometry,
        120
    );

    console.log(
        "FT UISU Explorer — Revisi 9 (No Navigate)"
    );
}

startApp();

})();

/* =========================================================
   FULLSCREEN 3D VIEWER
   MEKANISME REVISI 8 DIPERTAHANKAN
========================================================= */

(function () {
"use strict";

const card =
    document.getElementById("viewerCard");

const page =
    document.getElementById("viewerPage");

const viewer =
    document.getElementById("main3DViewer");

const status =
    document.getElementById("viewerLoadingDot");

const openButton =
    document.getElementById("viewerFullscreenButton");

const closeButton =
    document.getElementById("viewerFullscreenExit");

if (
    !card ||
    !page ||
    !viewer ||
    !status ||
    !openButton ||
    !closeButton
) {
    return;
}

if (card.dataset.fullscreenInitialized) {
    return;
}

card.dataset.fullscreenInitialized = "true";

const root = document.documentElement;

const nativeElement = () =>
    document.fullscreenElement ||
    document.webkitFullscreenElement;

const visible = () =>
    page.classList.contains("active") &&
    !card.classList.contains("hidden");

const ready = () =>
    visible() &&
    status.classList.contains("ready");

let session = null;

function updateButtons() {
    if (session && !visible()) {
        closeFullscreen(false);
        return;
    }

    openButton.classList.toggle(
        "hidden",
        !ready() || !!session
    );

    closeButton.classList.toggle(
        "hidden",
        !session
    );

    closeButton.disabled =
        !!session?.closing;
}

function finish(current) {
    if (session !== current) return;

    session = null;

    card.classList.remove(
        "viewer-is-fullscreen"
    );

    root.classList.remove(
        "viewer-fullscreen-open"
    );

    root.style.removeProperty(
        "--viewer-fullscreen-scroll-top"
    );

    card.removeAttribute("role");
    card.removeAttribute("aria-modal");
    card.removeAttribute("aria-labelledby");

    updateButtons();

    if (current.restore && visible()) {
        window.scrollTo({
            left: current.x,
            top: current.y,
            behavior: "instant"
        });

        (ready() ? openButton : viewer)
            .focus({
                preventScroll: true
            });
    }
}

function exitNativeQuietly() {
    const exit =
        document.exitFullscreen ||
        document.webkitExitFullscreen;

    if (
        exit &&
        nativeElement() === card
    ) {
        try {
            Promise.resolve(
                exit.call(document)
            ).catch(() => {});
        } catch (error) {}
    }
}

async function openFullscreen() {
    if (
        session ||
        !ready() ||
        nativeElement()
    ) {
        return;
    }

    const current = {
        x: window.scrollX,
        y: window.scrollY,
        pending: true,
        fallback: false,
        closing: false,
        restore: true
    };

    session = current;

    root.style.setProperty(
        "--viewer-fullscreen-scroll-top",
        `${-current.y}px`
    );

    root.classList.add(
        "viewer-fullscreen-open"
    );

    card.classList.add(
        "viewer-is-fullscreen"
    );

    card.setAttribute("role", "dialog");
    card.setAttribute("aria-modal", "true");

    card.setAttribute(
        "aria-labelledby",
        "viewerTitle"
    );

    updateButtons();

    closeButton.focus({
        preventScroll: true
    });

    const request =
        card.requestFullscreen ||
        card.webkitRequestFullscreen;

    const enabled =
        document.fullscreenEnabled ??
        document.webkitFullscreenEnabled ??
        true;

    if (!request || !enabled) {
        current.pending = false;
        current.fallback = true;
        return;
    }

    try {
        await request.call(card);

        if (session !== current) {
            if (!session) {
                exitNativeQuietly();
            }
            return;
        }

        current.pending = false;
        current.fallback =
            nativeElement() !== card;
    } catch (error) {
        if (session !== current) return;

        current.pending = false;
        current.fallback = true;
    }

    closeButton.focus({
        preventScroll: true
    });

    updateButtons();
}

async function closeFullscreen(
    restore = true
) {
    const current = session;
    if (!current) return;

    if (!restore) {
        current.restore = false;
    }

    if (current.closing) return;

    current.closing = true;
    updateButtons();

    if (nativeElement() === card) {
        const exit =
            document.exitFullscreen ||
            document.webkitExitFullscreen;

        try {
            if (!exit) {
                throw new Error(
                    "Fullscreen exit unavailable"
                );
            }

            await exit.call(document);
        } catch (error) {
            if (
                session === current &&
                nativeElement() === card
            ) {
                current.closing = false;
                closeButton.disabled = false;
                return;
            }
        }
    }

    finish(current);
}

function onNativeChange() {
    if (nativeElement() === card) {
        if (!session) {
            exitNativeQuietly();
            return;
        }

        session.pending = false;
        session.fallback = false;
    } else if (
        session &&
        !session.pending &&
        !session.fallback
    ) {
        if (!visible()) {
            session.restore = false;
        }

        finish(session);
    }
}

openButton.addEventListener(
    "click",
    openFullscreen
);

closeButton.addEventListener(
    "click",
    () => closeFullscreen()
);

document.addEventListener(
    "fullscreenchange",
    onNativeChange
);

document.addEventListener(
    "webkitfullscreenchange",
    onNativeChange
);

document.addEventListener(
    "keydown",
    event => {
        if (!session) return;

        if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            closeFullscreen();
        } else if (event.key === "Tab") {
            const controls = Array.from(
                card.querySelectorAll(
                    "button:not([disabled]), select:not([disabled]), a[href], [tabindex], model-viewer"
                )
            ).filter(element =>
                element.tabIndex >= 0 &&
                element.getClientRects().length
            );

            if (!controls.length) return;

            const first = controls[0];
            const last =
                controls[controls.length - 1];

            if (
                event.shiftKey &&
                document.activeElement === first
            ) {
                event.preventDefault();
                last.focus();
            } else if (
                !event.shiftKey &&
                document.activeElement === last
            ) {
                event.preventDefault();
                first.focus();
            } else if (
                !card.contains(
                    document.activeElement
                )
            ) {
                event.preventDefault();
                closeButton.focus();
            }
        }
    },
    true
);

const observer =
    new MutationObserver(updateButtons);

[page, card, status].forEach(element => {
    observer.observe(element, {
        attributes: true,
        attributeFilter: ["class"]
    });
});

viewer.addEventListener(
    "load",
    updateButtons
);

viewer.addEventListener(
    "error",
    updateButtons
);

updateButtons();

})();

/* =========================================================
   WEBAR MARKERLESS — SISTEM REVISI 8
   DIPERTAHANKAN UNTUK REVISI 9

   LAPISAN 1: KAMERA VIDEO
   LAPISAN 2: XR8 SLAM
   LAPISAN 3: THREE.JS TRANSPARAN
========================================================= */

(function () {
"use strict";

const byId = id =>
    document.getElementById(id);

const overlay =
    byId("webarOverlay");

const feed =
    byId("webarPreview");

const stage =
    byId("webarCamera");

const xrCanvas =
    byId("webarEngineCanvas");

if (
    !overlay ||
    !feed ||
    !stage ||
    !xrCanvas
) {
    return;
}

const XR_URL =
    "https://cdn.jsdelivr.net/npm/@8thwall/engine-binary@1/dist/xr.js";

const THREE_MODULE = "three";

const clamp = (value, low, high) =>
    Math.min(high, Math.max(low, value));

const mobile = () =>
    /Android|iPhone|iPad|iPod/i.test(
        navigator.userAgent
    ) ||
    (
        navigator.platform === "MacIntel" &&
        navigator.maxTouchPoints > 1
    );

const state = {
    active: false,
    token: 0,
    src: "",
    title: "",
    mode: "idle",
    previewStream: null,
    xrStream: null,
    cameraReady: false,
    xrReady: false,
    engineStarted: false,
    librariesReady: false,
    motionRequired: false,
    motionGranted: false,
    prepared: false,
    xrTimer: null,
    frameCount: 0,
    lastUpdate: 0,
    lastStatus: 0,
    tracking: false,
    trackedFrames: 0,
    stableFrames: 0,
    hit: null,
    placed: false,
    modelReady: false,
    modelError: null,
    modelRoot: null,
    THREE: null,
    loaderClass: null,
    dracoClass: null,
    ktxClass: null,
    draco: null,
    ktx: null,
    renderer: null,
    scene: null,
    camera: null,
    anchor: null,
    turntable: null,
    reticle3d: null,
    rotation: 0,
    zoom: 1,
    pointers: new Map(),
    pinch: 0,
    diagnosticTimer: null
};

function tokenAlive(token) {
    return (
        state.active &&
        state.token === token
    );
}

function control(id, visible) {
    byId(id)?.classList.toggle(
        "hidden",
        !visible
    );
}

function status(message, detail) {
    if (!state.active) return;

    byId("webarStatus").textContent =
        message;

    if (detail !== undefined) {
        byId("webarInstructions").textContent =
            detail;
    }
}

function updateDiagnostics() {
    if (!state.active) return;

    const target =
        byId("webarDiagnostic");

    if (!target) return;

    target.textContent =
        `Kamera: ${
            state.cameraReady
                ? "aktif"
                : "menunggu"
        } · ` +
        `SLAM: ${
            state.tracking
                ? "normal"
                : "mencari"
        } · ` +
        `GLB: ${
            state.modelReady
                ? "siap"
                : state.modelError
                    ? "gagal"
                    : "memuat"
        } · ` +
        `Render: ${
            state.renderer
                ? "siap"
                : "menunggu"
        }`;
}

function describe(error) {
    if (
        error?.name === "NotAllowedError" ||
        error?.name === "PermissionDeniedError"
    ) {
        return (
            "Akses kamera ditolak. Izinkan kamera pada " +
            "pengaturan Safari/Chrome untuk situs ini."
        );
    }

    if (error?.name === "NotReadableError") {
        return (
            "Kamera digunakan aplikasi lain. Tutup aplikasi " +
            "kamera, kemudian coba lagi."
        );
    }

    if (error?.name === "NotFoundError") {
        return (
            "Perangkat tidak memiliki kamera " +
            "yang bisa digunakan."
        );
    }

    return (
        error?.message ||
        String(error) ||
        "Kesalahan tidak dikenal"
    );
}

function resetControls() {
    [
        "webarPlace",
        "webarRetry",
        "webarMotion",
        "webarReset",
        "webarReticle"
    ].forEach(id => control(id, false));

    if (state.reticle3d) {
        state.reticle3d.visible = false;
    }
}

function stopPreviewTracks() {
    if (state.previewStream) {
        state.previewStream
            .getTracks()
            .forEach(track => track.stop());

        state.previewStream = null;
    }
}

function unlinkFeed() {
    try {
        feed.pause();
    } catch (error) {}

    feed.srcObject = null;
    state.cameraReady = false;
}

async function attachStream(
    stream,
    token,
    source
) {
    if (
        !tokenAlive(token) ||
        !stream
    ) {
        return;
    }

    if (feed.srcObject !== stream) {
        feed.srcObject = stream;
        feed.muted = true;
        feed.playsInline = true;
        feed.setAttribute(
            "playsinline",
            ""
        );
    }

    try {
        await feed.play();
    } catch (error) {
        console.warn(
            "AR video play:",
            error
        );
    }

    if (!tokenAlive(token)) return;

    state.cameraReady =
        feed.readyState >= 2 &&
        feed.videoWidth > 0;

    if (!state.cameraReady) {
        await Promise.race([
            new Promise(resolve => {
                feed.addEventListener(
                    "loadeddata",
                    resolve,
                    { once: true }
                );
            }),
            new Promise(resolve => {
                setTimeout(resolve, 3000);
            })
        ]);
    }

    if (!tokenAlive(token)) return;

    state.cameraReady =
        feed.readyState >= 2 &&
        feed.videoWidth > 0;

    if (
        state.cameraReady &&
        source === "xr"
    ) {
        status(
            "Kamera aktif — mulai tracking",
            "Arahkan kamera ke lantai dengan detail/tekstur dan gerakkan perlahan."
        );
    }

    updateDiagnostics();
}

async function openPreview(token) {
    if (
        !navigator.mediaDevices?.getUserMedia ||
        !window.isSecureContext
    ) {
        throw new Error(
            "Kamera memerlukan situs HTTPS dan browser yang mendukung getUserMedia."
        );
    }

    const stream =
        await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
                facingMode: {
                    ideal: "environment"
                }
            }
        });

    if (!tokenAlive(token)) {
        stream.getTracks().forEach(
            track => track.stop()
        );
        return;
    }

    state.previewStream = stream;

    await attachStream(
        stream,
        token,
        "preview"
    );
}

function loadScript(
    url,
    globalName,
    timeoutMs = 35000
) {
    if (window[globalName]) {
        return Promise.resolve(
            window[globalName]
        );
    }

    return new Promise((resolve, reject) => {
        const script =
            document.createElement("script");

        script.src = url;
        script.async = true;
        script.crossOrigin = "anonymous";
        script.dataset.preloadChunks = "slam";

        let settled = false;

        const handle = () => {
            if (window[globalName]) {
                finish();
            }
        };

        const fail = () => finish(
            new Error(
                "Paket engine tidak dapat diunduh. Periksa sambungan internet."
            )
        );

        const timer = setTimeout(() => {
            finish(new Error(
                "Paket engine melewati batas waktu pemuatan."
            ));
        }, timeoutMs);

        function finish(error) {
            if (settled) return;

            settled = true;

            clearTimeout(timer);

            window.removeEventListener(
                "xrloaded",
                handle
            );

            script.removeEventListener(
                "load",
                handle
            );

            script.removeEventListener(
                "error",
                fail
            );

            if (error) {
                script.remove();
                reject(error);
            } else {
                resolve(window[globalName]);
            }
        }

        script.addEventListener(
            "load",
            handle
        );

        script.addEventListener(
            "error",
            fail
        );

        window.addEventListener(
            "xrloaded",
            handle
        );

        document.head.appendChild(script);

        handle();
    });
}

async function loadDependencies() {
    if (!state.THREE) {
        const [
            three,
            gltf,
            draco,
            ktx
        ] = await Promise.all([
            import(THREE_MODULE),
            import("three/addons/loaders/GLTFLoader.js"),
            import("three/addons/loaders/DRACOLoader.js"),
            import("three/addons/loaders/KTX2Loader.js")
        ]);

        state.THREE = three;
        state.loaderClass = gltf.GLTFLoader;
        state.dracoClass = draco.DRACOLoader;
        state.ktxClass = ktx.KTX2Loader;

        window.THREE = three;
    }

    await loadScript(
        XR_URL,
        "XR8"
    );

    const xr = window.XR8;

    if (
        !xr?.XrController?.pipelineModule ||
        !xr?.GlTextureRenderer?.pipelineModule
    ) {
        throw new Error(
            "XR8 dimuat tetapi modul pelacakan dunia tidak tersedia."
        );
    }

    if (
        typeof xr.loadChunk === "function"
    ) {
        await xr.loadChunk("slam");
    }

    state.librariesReady = true;
}

/* =========================================================
   THREE.JS RENDERER
========================================================= */

function sceneSetup() {
    if (state.renderer) return;

    const T = state.THREE;

    const renderer = new T.WebGLRenderer({
        canvas: stage,
        alpha: true,
        antialias: true,
        powerPreference: "high-performance"
    });

    renderer.setClearColor(
        0x000000,
        0
    );

    renderer.setPixelRatio(
        Math.min(
            window.devicePixelRatio || 1,
            1.75
        )
    );

    renderer.outputColorSpace =
        T.SRGBColorSpace;

    renderer.toneMapping =
        T.ACESFilmicToneMapping;

    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;

    state.renderer = renderer;
    state.scene = new T.Scene();

    state.camera =
        new T.PerspectiveCamera(
            60,
            1,
            0.01,
            200
        );

    state.camera.position.set(
        0,
        1.6,
        0
    );

    state.scene.add(
        new T.HemisphereLight(
            0xffffff,
            0x9eabb0,
            2.1
        )
    );

    const sun =
        new T.DirectionalLight(
            0xffffff,
            2.1
        );

    sun.position.set(3, 6, 4);
    state.scene.add(sun);

    state.anchor = new T.Group();
    state.anchor.visible = false;
    state.scene.add(state.anchor);

    state.turntable = new T.Group();
    state.anchor.add(state.turntable);

    const disc = new T.Mesh(
        new T.RingGeometry(
            .34,
            .36,
            72
        ),
        new T.MeshBasicMaterial({
            color: 0x3addc4,
            side: T.DoubleSide,
            transparent: true,
            opacity: .8,
            depthWrite: false
        })
    );

    disc.rotation.x =
        -Math.PI / 2;

    disc.position.y = .006;

    state.anchor.add(disc);
    state.reticle3d = disc;

    resize();
}

function resize() {
    if (
        !state.active ||
        !state.renderer ||
        !state.camera
    ) {
        return;
    }

    const width = Math.max(
        2,
        overlay.clientWidth
    );

    const height = Math.max(
        2,
        overlay.clientHeight
    );

    state.renderer.setSize(
        width,
        height,
        false
    );

    state.camera.aspect =
        width / height;

    if (!state.xrReady) {
        state.camera.updateProjectionMatrix();
    }
}

/* =========================================================
   GLB LOADER
========================================================= */

function loadGLB(token) {
    if (
        !tokenAlive(token) ||
        !state.renderer
    ) {
        return;
    }

    const T = state.THREE;
    const loader =
        new state.loaderClass();

    state.draco?.dispose();
    state.ktx?.dispose();

    state.draco =
        new state.dracoClass();

    state.draco.setDecoderPath(
        "https://www.gstatic.com/draco/v1/decoders/"
    );

    loader.setDRACOLoader(
        state.draco
    );

    state.ktx =
        new state.ktxClass();

    state.ktx.setTranscoderPath(
        "https://cdn.jsdelivr.net/npm/three@0.160.1/examples/jsm/libs/basis/"
    );

    state.ktx.detectSupport(
        state.renderer
    );

    loader.setKTX2Loader(
        state.ktx
    );

    const url = new URL(
        state.src,
        document.baseURI
    );

    /* WebAR tetap berdasarkan Revisi 8. */
    url.searchParams.set(
        "r",
        "8"
    );

    loader.load(
        url.href,
        gltf => {
            if (!tokenAlive(token)) return;

            try {
                const root = gltf.scene;

                root.updateMatrixWorld(
                    true
                );

                const bbox =
                    new T.Box3().setFromObject(
                        root
                    );

                if (bbox.isEmpty()) {
                    throw new Error(
                        "Berkas GLB tidak mengandung mesh 3D."
                    );
                }

                const size =
                    bbox.getSize(
                        new T.Vector3()
                    );

                const center =
                    bbox.getCenter(
                        new T.Vector3()
                    );

                const scale =
                    .8 / Math.max(
                        size.x,
                        size.z,
                        size.y * .65,
                        .001
                    );

                root.scale.multiplyScalar(
                    scale
                );

                root.position.set(
                    -center.x * scale,
                    -bbox.min.y * scale,
                    -center.z * scale
                );

                root.traverse(object => {
                    if (!object.isMesh) return;

                    object.frustumCulled = false;

                    const materials =
                        Array.isArray(object.material)
                            ? object.material
                            : [object.material];

                    materials.filter(Boolean)
                        .forEach(material => {
                            material.needsUpdate =
                                true;
                        });
                });

                state.turntable.add(root);

                state.modelRoot = root;
                state.modelReady = true;

                updateDiagnostics();

                status(
                    "Objek 3D siap",
                    "Cari lantai dengan tekstur. Tunggu hingga pelacakan normal agar model dapat ditempatkan."
                );
            } catch (error) {
                state.modelError =
                    describe(error);

                status(
                    "File model 3D tidak dapat digunakan",
                    state.modelError
                );

                control(
                    "webarRetry",
                    true
                );

                updateDiagnostics();
            }
        },
        undefined,
        error => {
            if (!tokenAlive(token)) return;

            state.modelError =
                describe(error);

            status(
                "GLB gagal dimuat",
                state.modelError
            );

            control(
                "webarRetry",
                true
            );

            updateDiagnostics();
        }
    );
}

/* =========================================================
   CAMERA POSE DAN FLOOR TRACKING
========================================================= */

function applyPose(reality) {
    if (
        !state.camera ||
        !reality
    ) {
        return;
    }

    const {
        position,
        rotation,
        intrinsics
    } = reality;

    if (
        position &&
        [
            position.x,
            position.y,
            position.z
        ].every(Number.isFinite)
    ) {
        state.camera.position.set(
            position.x,
            position.y,
            position.z
        );
    }

    if (
        rotation &&
        [
            rotation.x,
            rotation.y,
            rotation.z,
            rotation.w
        ].every(Number.isFinite)
    ) {
        state.camera.quaternion.set(
            rotation.x,
            rotation.y,
            rotation.z,
            rotation.w
        );
    }

    if (
        intrinsics &&
        intrinsics.length === 16
    ) {
        state.camera.projectionMatrix
            .fromArray(intrinsics);

        state.camera.projectionMatrixInverse
            .copy(
                state.camera.projectionMatrix
            ).invert();
    }

    state.camera.updateMatrixWorld(
        true
    );
}

function findFloorCandidate(reality) {
    if (
        !state.camera ||
        !state.THREE ||
        reality?.trackingStatus !== "NORMAL"
    ) {
        return null;
    }

    const T = state.THREE;
    const ray = new T.Raycaster();

    ray.setFromCamera(
        new T.Vector2(0, .15),
        state.camera
    );

    const point =
        new T.Vector3();

    const hit =
        ray.ray.intersectPlane(
            new T.Plane(
                new T.Vector3(
                    0,
                    1,
                    0
                ),
                0
            ),
            point
        );

    if (!hit) return null;

    const distance =
        state.camera.position.distanceTo(
            point
        );

    if (
        distance < .35 ||
        distance > 5.5
    ) {
        return null;
    }

    if (
        point.y >
        state.camera.position.y - .25
    ) {
        return null;
    }

    return point;
}

function updateTracking(reality) {
    if (
        !state.active ||
        !state.xrReady ||
        !state.renderer
    ) {
        return;
    }

    state.tracking =
        reality?.trackingStatus ===
        "NORMAL";

    if (reality) {
        applyPose(reality);
    }

    if (
        !state.tracking ||
        !state.cameraReady
    ) {
        state.trackedFrames = 0;
        state.stableFrames = 0;

        if (!state.placed) {
            state.hit = null;

            control(
                "webarPlace",
                false
            );

            control(
                "webarReticle",
                false
            );
        }

        if (state.anchor) {
            state.anchor.visible = false;
        }

        if (
            performance.now() -
            state.lastStatus > 1800
        ) {
            state.lastStatus =
                performance.now();

            status(
                state.cameraReady
                    ? "Mencari pelacakan SLAM..."
                    : "Menunggu video kamera...",
                "Pilih permukaan berpola, pencahayaan cukup, gerakkan perangkat perlahan."
            );
        }

        return;
    }

    state.trackedFrames++;

    if (state.placed) {
        state.anchor.visible = true;
        return;
    }

    const candidate =
        findFloorCandidate(reality);

    if (
        !candidate ||
        !state.modelReady
    ) {
        state.hit = null;
        state.stableFrames = 0;

        control(
            "webarPlace",
            false
        );

        control(
            "webarReticle",
            false
        );

        if (
            performance.now() -
            state.lastStatus > 1700
        ) {
            state.lastStatus =
                performance.now();

            status(
                state.modelReady
                    ? "Cari bidang datar yang dapat dilacak..."
                    : "Memuat model 3D...",
                "Arahkan kamera perlahan ke permukaan lantai dengan pola/tekstur."
            );
        }

        return;
    }

    if (
        state.hit &&
        state.hit.distanceTo(candidate) < .17
    ) {
        state.hit.lerp(
            candidate,
            .25
        );

        state.stableFrames++;
    } else {
        state.hit =
            candidate.clone();

        state.stableFrames = 1;
    }

    const ready =
        state.stableFrames > 5;

    control(
        "webarPlace",
        ready
    );

    control(
        "webarReticle",
        ready
    );

    if (
        ready &&
        performance.now() -
        state.lastStatus > 1500
    ) {
        state.lastStatus =
            performance.now();

        status(
            "Permukaan terlacak — siap menempatkan model",
            "Tekan Tempatkan Model. Setelah itu, gerakkan kamera untuk melihat objek dari sudut lain."
        );
    }
}

function place() {
    if (
        !state.active ||
        !state.cameraReady ||
        !state.tracking ||
        !state.xrReady ||
        !state.modelReady ||
        !state.hit ||
        state.stableFrames <= 5 ||
        !state.anchor
    ) {
        return;
    }

    state.anchor.position.copy(
        state.hit
    );

    state.anchor.visible = true;
    state.placed = true;

    control(
        "webarPlace",
        false
    );

    control(
        "webarReticle",
        false
    );

    control(
        "webarReset",
        true
    );

    status(
        "Model telah ditempatkan",
        "Putar objek dengan satu jari, zoom dengan dua jari. Untuk mengubah posisinya, gerakkan kamera atau gunakan Ulangi Penempatan."
    );
}

/* =========================================================
   XR8 PIPELINE
========================================================= */

function pipeline(token) {
    return {
        name: "ft-uisu-r8-ground-tracker",

        onCameraStatusChange: ({
            status: cameraStatus,
            error,
            stream
        }) => {
            if (!tokenAlive(token)) return;

            if (stream) {
                void attachStream(
                    stream,
                    token,
                    "xr"
                );
            }

            if (
                cameraStatus === "requesting"
            ) {
                status(
                    "Mesin AR meminta izin kamera...",
                    "Izinkan kamera pada Safari atau Chrome."
                );
            }

            if (
                cameraStatus === "failed"
            ) {
                recover(
                    token,
                    describe(error)
                );
            }
        },

        onAttach: ({
            stream,
            video
        }) => {
            if (!tokenAlive(token)) return;

            const activeStream =
                stream ||
                video?.srcObject;

            if (activeStream) {
                state.xrStream =
                    activeStream;

                void attachStream(
                    activeStream,
                    token,
                    "xr"
                );
            }
        },

        onStart: ({
            stream,
            video
        }) => {
            if (!tokenAlive(token)) return;

            const activeStream =
                stream ||
                video?.srcObject;

            if (activeStream) {
                state.xrStream =
                    activeStream;

                void attachStream(
                    activeStream,
                    token,
                    "xr"
                );
            }

            try {
                sceneSetup();

                state.xrReady = true;

                window.XR8.XrController
                    .updateCameraProjectionMatrix({
                        origin:
                            state.camera.position,
                        facing:
                            state.camera.quaternion
                    });

                loadGLB(token);
            } catch (error) {
                recover(
                    token,
                    "Renderer model 3D: " +
                    describe(error)
                );
            }
        },

        onCanvasSizeChange: () => {
            resize();
        },

        onUpdate: ({
            processCpuResult
        }) => {
            if (!tokenAlive(token)) return;

            state.lastUpdate =
                performance.now();

            updateTracking(
                processCpuResult?.reality
            );
        },

        onRender: () => {
            if (
                !tokenAlive(token) ||
                !state.renderer ||
                !state.scene ||
                !state.camera
            ) {
                return;
            }

            state.frameCount++;

            state.renderer.render(
                state.scene,
                state.camera
            );
        },

        onException: error => {
            recover(
                token,
                "Kesalahan engine: " +
                describe(error)
            );
        }
    };
}

async function runXR(token) {
    if (!tokenAlive(token)) return;

    if (!mobile()) {
        state.mode = "preview";

        status(
            "Pratinjau kamera desktop",
            "AR dengan tracking SLAM dijalankan pada Safari iOS atau Chrome Android. Kamera desktop tidak dipakai untuk penempatan 3D."
        );

        updateDiagnostics();
        return;
    }

    const xr = window.XR8;

    state.mode = "starting";

    status(
        "Memulai mesin SLAM...",
        "Mengalihkan kamera pratinjau ke kamera pelacakan. Harap tunggu beberapa detik."
    );

    stopPreviewTracks();
    unlinkFeed();

    xr.stop?.();
    xr.clearCameraPipelineModules?.();

    xr.XrController.configure({
        disableWorldTracking: false,
        enableWorldPoints: true,
        scale: "absolute"
    });

    const dpr = Math.min(
        window.devicePixelRatio || 1,
        1.5
    );

    xrCanvas.width = Math.max(
        2,
        Math.round(
            overlay.clientWidth * dpr
        )
    );

    xrCanvas.height = Math.max(
        2,
        Math.round(
            overlay.clientHeight * dpr
        )
    );

    xr.addCameraPipelineModules([
        xr.GlTextureRenderer.pipelineModule(),
        xr.XrController.pipelineModule(),
        pipeline(token)
    ]);

    state.engineStarted = true;

    const runResult = xr.run({
        canvas: xrCanvas,
        cameraConfig: {
            direction:
                xr.XrConfig.camera().BACK
        },
        allowedDevices:
            xr.XrConfig.device().MOBILE
    });

    if (runResult?.then) {
        await runResult;
    }

    state.mode = "xr";

    state.xrTimer = setTimeout(() => {
        if (
            tokenAlive(token) &&
            (
                !state.cameraReady ||
                state.frameCount < 2
            )
        ) {
            recover(
                token,
                !state.cameraReady
                    ? "Video kamera XR tidak diterima browser."
                    : "Pipeline AR tidak menghasilkan frame."
            );
        }
    }, 16000);
}

/* =========================================================
   INITIALIZATION AR
========================================================= */

async function begin() {
    if (
        state.motionRequired &&
        !state.motionGranted
    ) {
        control(
            "webarMotion",
            true
        );

        status(
            "Izin sensor gerak iPhone diperlukan",
            "Tekan Izinkan Sensor Gerak agar SLAM memperoleh data orientasi perangkat."
        );

        return;
    }

    const token = state.token;

    try {
        await runXR(token);
    } catch (error) {
        if (tokenAlive(token)) {
            recover(
                token,
                describe(error)
            );
        }
    }
}

function start(src, title) {
    if (state.active) return;

    state.token++;

    const token = state.token;

    Object.assign(state, {
        active: true,
        src,
        title,
        mode: "preview",
        cameraReady: false,
        xrReady: false,
        engineStarted: false,
        modelReady: false,
        modelError: null,
        frameCount: 0,
        placed: false,
        hit: null,
        stableFrames: 0,
        trackedFrames: 0,
        tracking: false,
        librariesReady: false,
        motionGranted: false,
        lastStatus: 0,
        renderer: null,
        scene: null,
        camera: null,
        anchor: null,
        turntable: null
    });

    state.motionRequired = Boolean(
        window.DeviceOrientationEvent
            ?.requestPermission ||
        window.DeviceMotionEvent
            ?.requestPermission
    );

    byId("webarTitle").textContent =
        title;

    resetControls();

    overlay.classList.remove(
        "hidden"
    );

    document.documentElement.classList.add(
        "webar-open"
    );

    document.querySelectorAll(
        "model-viewer"
    ).forEach(viewer => {
        try {
            viewer.pause?.();
        } catch (error) {}
    });

    status(
        "Meminta akses kamera...",
        "Izinkan kamera belakang ketika diminta oleh browser."
    );

    updateDiagnostics();

    const cameraPromise =
        window.isSecureContext &&
        navigator.mediaDevices?.getUserMedia
            ? navigator.mediaDevices.getUserMedia({
                audio: false,
                video: {
                    facingMode: {
                        ideal: "environment"
                    }
                }
            })
            : Promise.reject(
                new Error(
                    "Akses kamera hanya tersedia melalui HTTPS."
                )
            );

    (async () => {
        try {
            const stream =
                await cameraPromise;

            if (!tokenAlive(token)) {
                stream.getTracks()
                    .forEach(track =>
                        track.stop()
                    );

                return;
            }

            state.previewStream =
                stream;

            await attachStream(
                stream,
                token,
                "preview"
            );

            if (!tokenAlive(token)) return;

            status(
                "Pratinjau kamera berhasil",
                "Menyiapkan mesin XR dan pustaka GLB..."
            );

            await loadDependencies();

            if (!tokenAlive(token)) return;

            await begin();
        } catch (error) {
            if (tokenAlive(token)) {
                recover(
                    token,
                    describe(error)
                );
            }
        }
    })();
}

async function grantMotion() {
    if (!state.active) return;

    try {
        const tasks = [];

        if (
            typeof window.DeviceMotionEvent
                ?.requestPermission ===
            "function"
        ) {
            tasks.push(
                window.DeviceMotionEvent
                    .requestPermission()
            );
        }

        if (
            typeof window.DeviceOrientationEvent
                ?.requestPermission ===
            "function"
        ) {
            tasks.push(
                window.DeviceOrientationEvent
                    .requestPermission()
            );
        }

        const results =
            await Promise.all(tasks);

        if (
            results.some(
                result =>
                    result !== "granted"
            )
        ) {
            throw new Error(
                "Izin sensor tidak diberikan."
            );
        }

        state.motionGranted = true;

        control(
            "webarMotion",
            false
        );

        await begin();
    } catch (error) {
        status(
            "Sensor gerak belum diizinkan",
            describe(error)
        );
    }
}

/* =========================================================
   RECOVERY
========================================================= */

async function recover(token, reason) {
    if (
        !tokenAlive(token) ||
        state.mode === "recovering"
    ) {
        return;
    }

    state.mode = "recovering";

    clearTimeout(
        state.xrTimer
    );

    if (state.engineStarted) {
        try {
            window.XR8?.stop?.();
        } catch (error) {}

        state.engineStarted = false;
    }

    state.xrReady = false;
    state.tracking = false;
    state.placed = false;

    control(
        "webarPlace",
        false
    );

    control(
        "webarReset",
        false
    );

    control(
        "webarRetry",
        true
    );

    status(
        "AR belum berhasil dimulai",
        `${reason} Kamera biasa akan ditampilkan; ini belum merupakan pelacakan AR.`
    );

    if (state.xrStream) {
        state.xrStream = null;
        unlinkFeed();
    }

    if (!state.cameraReady) {
        try {
            await openPreview(token);
        } catch (error) {
            status(
                "Kamera gagal diakses",
                describe(error)
            );
        }
    }

    updateDiagnostics();
}

function reset() {
    if (
        !state.active ||
        !state.xrReady
    ) {
        return;
    }

    state.placed = false;
    state.hit = null;
    state.stableFrames = 0;
    state.zoom = 1;
    state.rotation = 0;

    state.pointers.clear();

    if (state.anchor) {
        state.anchor.visible = false;
    }

    if (state.turntable) {
        state.turntable.rotation.y = 0;
        state.turntable.scale.setScalar(1);
    }

    control("webarReset", false);
    control("webarPlace", false);

    status(
        "Mencari bidang baru...",
        "Arahkan kamera ke lantai dengan detail tekstur yang jelas."
    );

    try {
        window.XR8
            ?.XrController
            ?.recenter?.();
    } catch (error) {}
}

function close() {
    if (!state.active) return;

    state.active = false;
    state.token++;

    clearTimeout(
        state.xrTimer
    );

    if (state.engineStarted) {
        try {
            window.XR8?.stop?.();
        } catch (error) {}

        try {
            window.XR8
                ?.clearCameraPipelineModules?.();
        } catch (error) {}
    }

    state.engineStarted = false;

    state.previewStream
        ?.getTracks()
        .forEach(track => track.stop());

    state.previewStream = null;
    state.xrStream = null;

    unlinkFeed();

    state.renderer?.dispose();
    state.draco?.dispose();
    state.ktx?.dispose();

    state.renderer = null;
    state.scene = null;
    state.camera = null;
    state.anchor = null;
    state.turntable = null;

    state.pointers.clear();

    overlay.classList.add(
        "hidden"
    );

    document.documentElement.classList.remove(
        "webar-open"
    );

    document.querySelectorAll(
        "model-viewer"
    ).forEach(viewer => {
        try {
            viewer.play?.();
        } catch (error) {}
    });
}

function retry() {
    if (!state.active) return;

    const {
        src,
        title
    } = state;

    close();
    start(src, title);
}

/* =========================================================
   ROTASI DAN ZOOM
========================================================= */

function pinchDistance() {
    const points =
        [...state.pointers.values()];

    if (points.length !== 2) return 0;

    return Math.hypot(
        points[0].x - points[1].x,
        points[0].y - points[1].y
    );
}

stage.addEventListener(
    "pointerdown",
    event => {
        if (!state.placed) return;

        event.preventDefault();

        try {
            stage.setPointerCapture(
                event.pointerId
            );
        } catch (error) {}

        state.pointers.set(
            event.pointerId,
            {
                x: event.clientX,
                y: event.clientY
            }
        );

        state.pinch =
            pinchDistance();
    }
);

stage.addEventListener(
    "pointermove",
    event => {
        if (
            !state.placed ||
            !state.turntable ||
            !state.pointers.has(
                event.pointerId
            )
        ) {
            return;
        }

        event.preventDefault();

        const previous =
            state.pointers.get(
                event.pointerId
            );

        state.pointers.set(
            event.pointerId,
            {
                x: event.clientX,
                y: event.clientY
            }
        );

        if (
            state.pointers.size === 2
        ) {
            const distance =
                pinchDistance();

            if (
                state.pinch > 0
            ) {
                state.zoom = clamp(
                    state.zoom *
                    distance /
                    state.pinch,
                    .4,
                    3
                );

                state.turntable.scale
                    .setScalar(
                        state.zoom
                    );
            }

            state.pinch = distance;
        } else if (
            state.pointers.size === 1
        ) {
            state.rotation +=
                (
                    event.clientX -
                    previous.x
                ) * .008;

            state.turntable.rotation.y =
                state.rotation;
        }
    },
    { passive: false }
);

[
    "pointerup",
    "pointercancel",
    "lostpointercapture"
].forEach(eventName => {
    stage.addEventListener(
        eventName,
        event => {
            state.pointers.delete(
                event.pointerId
            );

            state.pinch =
                pinchDistance();
        }
    );
});

stage.addEventListener(
    "wheel",
    event => {
        if (
            !state.placed ||
            !state.turntable
        ) {
            return;
        }

        event.preventDefault();

        state.zoom = clamp(
            state.zoom *
            (
                event.deltaY > 0
                    ? .92
                    : 1.08
            ),
            .4,
            3
        );

        state.turntable.scale
            .setScalar(state.zoom);
    },
    { passive: false }
);

/* =========================================================
   EVENTS WEBAR
========================================================= */

byId("webarClose")
    ?.addEventListener(
        "click",
        close
    );

byId("webarBackBottom")
    ?.addEventListener(
        "click",
        close
    );

byId("webarPlace")
    ?.addEventListener(
        "click",
        place
    );

byId("webarReset")
    ?.addEventListener(
        "click",
        reset
    );

byId("webarRetry")
    ?.addEventListener(
        "click",
        retry
    );

byId("webarMotion")
    ?.addEventListener(
        "click",
        grantMotion
    );

window.addEventListener(
    "resize",
    resize
);

window.visualViewport
    ?.addEventListener(
        "resize",
        resize
    );

document.addEventListener(
    "keydown",
    event => {
        if (
            state.active &&
            event.key === "Escape"
        ) {
            event.preventDefault();
            event.stopImmediatePropagation();
            close();
        }
    },
    true
);

document.addEventListener(
    "visibilitychange",
    () => {
        if (
            document.hidden &&
            state.active
        ) {
            close();
        }
    }
);

state.diagnosticTimer = setInterval(
    updateDiagnostics,
    850
);

window.FT_WEBAR = {
    start,
    close,
    reset
};

})();
