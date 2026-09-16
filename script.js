import * as THREE from "three";


/* ===================================================== */
/* MODEL PATH */
/* ===================================================== */

const MODEL_PATH =
    "assets/models/biro-fakultas-teknik.glb";



/* ===================================================== */
/* DATA GEDUNG */
/* ===================================================== */

const buildings = [

    {

        id:
            "biro",

        name:
            "Gedung Biro Fakultas Teknik",

        description:
            "Gedung Biro Fakultas Teknik Universitas Islam Sumatera Utara.",

        rooms: [

            "Gudang Mini",

            "Program Studi Teknik Industri",

            "Program Studi Mesin",

            "Program Studi Teknik Sipil",

            "Program Studi Teknik Informatika",

            "Program Studi Teknik Elektro",

            "LPMF",

            "WD3-KAK",

            "WD2-STK",

            "WD1-ADI",

            "Ruang Dekan",

            "Loket Pembayaran Mahasiswa",

            "KaSubBag Akademik IT dan Kerjasama",

            "KaSubBag Keuangan",

            "KaSubBag Kemahasiswaan",

            "KaSubBag SIAKAD",

            "KTU",

            "KaSubBag Umum Perlengkapan Kerumahtanggaan",

            "Mushola",

            "Dapur",

            "Toilet"

        ].map(

            (

                name,
                index

            ) => ({

                id:
                    "biro-room-" +
                    (index + 1),

                name,

                floor:
                    1,

                description:

                    "Detail informasi " +

                    name +

                    " akan dilengkapi kemudian."

            })

        )

    },



    {

        id:
            "perpustakaan",

        name:
            "Perpustakaan Fakultas Teknik",

        description:
            "Perpustakaan Fakultas Teknik Universitas Islam Sumatera Utara.",

        rooms:
            []

    },



    {

        id:
            "serbaguna",

        name:
            "Gedung Serbaguna Fakultas Teknik",

        description:
            "Gedung Serbaguna Fakultas Teknik Universitas Islam Sumatera Utara.",

        rooms:
            []

    },



    {

        id:
            "perkuliahan",

        name:
            "Gedung Perkuliahan Fakultas Teknik",

        description:
            "Gedung Perkuliahan Fakultas Teknik Universitas Islam Sumatera Utara.",

        rooms:

            Array.from(

                {

                    length:
                        8

                },

                (

                    _,
                    index

                ) => ({

                    id:
                        "kuliah-" +
                        (index + 1),

                    name:
                        "Ruang Kuliah " +
                        (index + 1),

                    floor:
                        1,

                    description:

                        "Ruang Kuliah " +

                        (index + 1) +

                        " berada di Gedung Perkuliahan Fakultas Teknik."

                })

            )

    },



    {

        id:
            "laboratorium",

        name:
            "Gedung Laboratorium Fakultas Teknik",

        description:
            "Gedung Laboratorium Fakultas Teknik terdiri dari 3 lantai.",

        floors:
            3,

        rooms: [


            /* LANTAI 1 */

            {

                id:
                    "lab-foundry",

                name:
                    "Lab. Foundry",

                floor:
                    1

            },


            {

                id:
                    "lab-teknologi-mekanik",

                name:
                    "Lab. Teknologi Mekanik",

                floor:
                    1

            },


            {

                id:
                    "lab-beton",

                name:
                    "Lab. Beton",

                floor:
                    1

            },


            {

                id:
                    "lab-mekanika-tanah",

                name:
                    "Lab. Mekanika Tanah",

                floor:
                    1

            },


            {

                id:
                    "lab-jalan-raya",

                name:
                    "Lab. Jalan Raya",

                floor:
                    1

            },


            {

                id:
                    "lab-hidrolika",

                name:
                    "Lab. Hidrolika",

                floor:
                    1

            },



            /* LANTAI 2 */

            {

                id:
                    "lab-rangkaian-listrik",

                name:
                    "Lab. Rangkaian Listrik",

                floor:
                    2

            },


            {

                id:
                    "lab-dasar-elektronika",

                name:
                    "Lab. Dasar Elektronika",

                floor:
                    2

            },


            {

                id:
                    "lab-sistem-pengukuran",

                name:
                    "Lab. Sistem Pengukuran",

                floor:
                    2

            },


            {

                id:
                    "lab-pengukuran-listrik",

                name:
                    "Lab. Pengukuran Listrik",

                floor:
                    2

            },


            {

                id:
                    "lab-dasar-telekomunikasi",

                name:
                    "Lab. Dasar Sistem Telekomunikasi",

                floor:
                    2

            },


            {

                id:
                    "lab-ilmu-ukur-tanah",

                name:
                    "Lab. Ilmu Ukur Tanah",

                floor:
                    2

            },


            {

                id:
                    "lab-komputasi",

                name:
                    "Lab. Komputasi",

                floor:
                    2

            },


            {

                id:
                    "lab-pengukuran-statistik",

                name:
                    "Lab. Pengukuran & Statistik",

                floor:
                    2

            },


            {

                id:
                    "lab-faktor-manusia",

                name:
                    "Lab. Teknik Faktor Manusia",

                floor:
                    2

            },


            {

                id:
                    "lab-jaringan-komputer",

                name:
                    "Lab. Jaringan Komputer Mikro",

                floor:
                    2

            },


            ...Array.from(

                {

                    length:
                        5

                },

                (

                    _,
                    index

                ) => ({

                    id:
                        "kuliah-" +
                        (index + 9),

                    name:
                        "Ruang Kuliah " +
                        (index + 9),

                    floor:
                        2

                })

            ),



            /* LANTAI 3 */

            {

                id:
                    "lab-sistem-digital",

                name:
                    "Lab. Sistem Digital",

                floor:
                    3

            },


            {

                id:
                    "lab-teknik-produksi",

                name:
                    "Lab. Teknik Produksi",

                floor:
                    3

            },


            {

                id:
                    "lab-menggambar",

                name:
                    "Lab. Menggambar",

                floor:
                    3

            }


        ].map(

            room => ({

                ...room,

                description:

                    room.name +

                    " berada di Gedung Laboratorium Fakultas Teknik, Lantai " +

                    room.floor +

                    "."

            })

        )

    }

];



/* ===================================================== */
/* SEARCH INDEX */
/* ===================================================== */

const locations =
    [];


buildings
.forEach(

    building => {


        locations
        .push({

            id:
                building.id,

            type:
                "building",

            name:
                building.name,

            parent:
                "Fakultas Teknik UISU",

            description:
                building.description,

            buildingId:
                building.id

        });



        building
        .rooms
        .forEach(

            room => {


                locations
                .push({

                    ...room,

                    type:
                        "room",

                    parent:
                        building.name,

                    buildingId:
                        building.id

                });


            }

        );


    }

);



/* ===================================================== */
/* STATE */
/* ===================================================== */

const state = {

    selectedSearch:
        null,

    destination:
        null,

    navigationMode:
        null,

    mapStart:
        null,

    mapDestination:
        null,

    mapStep:
        "start",

    currentSlide:
        0,


    /* WEBXR */

    xrSession:
        null,

    renderer:
        null,

    scene:
        null,

    camera:
        null,

    reticle:
        null,

    hitTestSource:
        null,

    hitTestRequested:
        false,

    routeGroup:
        null,

    destinationWorld:
        null,

    routePlaced:
        false,

    arrived:
        false

};



/* ===================================================== */
/* DOM HELPER */
/* ===================================================== */

const $ =
    selector =>

        document
        .querySelector(
            selector
        );


const $$ =
    selector =>

        [

            ...document
            .querySelectorAll(
                selector
            )

        ];



/* ===================================================== */
/* DRAWER */
/* ===================================================== */

const drawer =
    $("#drawer");


const drawerOverlay =
    $("#drawerOverlay");


$("#hamburgerButton")
.addEventListener(

    "click",

    openDrawer

);


$("#closeDrawer")
.addEventListener(

    "click",

    closeDrawer

);


drawerOverlay
.addEventListener(

    "click",

    closeDrawer

);



function openDrawer() {

    drawer
    .classList
    .add(
        "open"
    );


    drawerOverlay
    .classList
    .add(
        "show"
    );


    document
    .body
    .style
    .overflow =
        "hidden";

}



function closeDrawer() {

    drawer
    .classList
    .remove(
        "open"
    );


    drawerOverlay
    .classList
    .remove(
        "show"
    );


    document
    .body
    .style
    .overflow =
        "";

}



/* ===================================================== */
/* PAGE SYSTEM */
/* ===================================================== */

function showPage(
    page
) {

    $$(".page")
    .forEach(

        item => {


            item
            .classList
            .remove(
                "active"
            );


        }

    );


    const target =
        $("#" + page + "Page");


    if(target) {

        target
        .classList
        .add(
            "active"
        );

    }


    $$(".header-link")
    .forEach(

        link => {


            link
            .classList
            .toggle(

                "active",

                link
                .dataset
                .page ===
                page

            );


        }

    );


    closeDrawer();


    if(

        page !==
        "arNavigation"

    ) {

        window
        .scrollTo({

            top:
                0,

            behavior:
                "smooth"

        });

    }

}



$$("[data-page]")
.forEach(

    button => {


        button
        .addEventListener(

            "click",

            () => {


                showPage(

                    button
                    .dataset
                    .page

                );


            }

        );


    }

);



$("#logoHome")
.addEventListener(

    "click",

    () => {

        showPage(
            "home"
        );

    }

);



/* ===================================================== */
/* SLIDER */
/* ===================================================== */

const slides =
    $$(".slide");


let sliderTimer;



function showSlide(
    index
) {

    index =

        (

            index +

            slides.length

        )

        %

        slides.length;


    state.currentSlide =
        index;



    slides
    .forEach(

        (

            slide,
            slideIndex

        ) => {


            slide
            .classList
            .toggle(

                "active",

                slideIndex ===
                index

            );


        }

    );



    $$(".dot")
    .forEach(

        (

            dot,
            dotIndex

        ) => {


            dot
            .classList
            .toggle(

                "active",

                dotIndex ===
                index

            );


        }

    );

}



/* ===================================================== */
/* AUTO SLIDER 20 DETIK */
/* ===================================================== */

function startSliderTimer() {

    clearInterval(
        sliderTimer
    );


    sliderTimer =

        setInterval(

            () => {


                showSlide(

                    state
                    .currentSlide +

                    1

                );


            },

            20000

        );

}



$("#nextSlide")
.addEventListener(

    "click",

    () => {


        showSlide(

            state
            .currentSlide +

            1

        );


        startSliderTimer();


    }

);



$("#prevSlide")
.addEventListener(

    "click",

    () => {


        showSlide(

            state
            .currentSlide -

            1

        );


        startSliderTimer();


    }

);



$$(".dot")
.forEach(

    dot => {


        dot
        .addEventListener(

            "click",

            () => {


                showSlide(

                    Number(

                        dot
                        .dataset
                        .slide

                    )

                );


                startSliderTimer();


            }

        );


    }

);


startSliderTimer();



/* ===================================================== */
/* SEARCH */
/* ===================================================== */

function searchLocation(
    value
) {

    value =

        value
        .toLowerCase()
        .trim();


    if(!value) {

        return [];

    }


    return locations

    .filter(

        location => {


            const text =

                (

                    location.name +

                    " " +

                    location.parent

                )

                .toLowerCase();


            return text
            .includes(
                value
            );


        }

    )

    .slice(
        0,
        15
    );

}



function renderResults(

    results,

    container,

    callback

) {

    container
    .innerHTML =
        "";


    if(

        results.length ===
        0

    ) {

        container
        .innerHTML =

            `

            <div class="empty-search">

                Lokasi tidak ditemukan.

            </div>

            `;


        container
        .classList
        .remove(
            "hidden"
        );


        return;

    }



    results
    .forEach(

        location => {


            const button =

                document
                .createElement(
                    "button"
                );


            button.type =
                "button";


            button
            .className =
                "search-result";


            button
            .innerHTML =

                `

                <span>

                    <strong>

                        ${location.name}

                    </strong>

                    <small>

                        ${location.parent}

                    </small>

                </span>


                <span class="type-badge">

                    ${
                        location.type ===
                        "building"

                        ?

                        "Gedung"

                        :

                        "Ruangan"
                    }

                </span>

                `;


            button
            .addEventListener(

                "click",

                () => {


                    callback(
                        location
                    );


                }

            );


            container
            .appendChild(
                button
            );


        }

    );


    container
    .classList
    .remove(
        "hidden"
    );

}



/* ===================================================== */
/* GLOBAL SEARCH */
/* ===================================================== */

$("#globalSearch")
.addEventListener(

    "input",

    event => {


        state.selectedSearch =
            null;


        $("#globalSearchActions")
        .classList
        .add(
            "hidden"
        );


        const value =
            event
            .target
            .value;


        if(!value) {

            $("#globalSearchResults")
            .classList
            .add(
                "hidden"
            );


            return;

        }


        renderResults(

            searchLocation(
                value
            ),

            $("#globalSearchResults"),

            location => {


                state.selectedSearch =
                    location;


                $("#globalSearch")
                .value =
                    location.name;


                $("#globalSearchResults")
                .classList
                .add(
                    "hidden"
                );


                $("#globalSelectedName")
                .textContent =
                    location.name;


                $("#globalSearchActions")
                .classList
                .remove(
                    "hidden"
                );


            }

        );


    }

);



$("#clearSearch")
.addEventListener(

    "click",

    () => {


        $("#globalSearch")
        .value =
            "";


        $("#globalSearchResults")
        .classList
        .add(
            "hidden"
        );


        $("#globalSearchActions")
        .classList
        .add(
            "hidden"
        );


        state.selectedSearch =
            null;


    }

);



/* ===================================================== */
/* INFORMATION MODAL */
/* ===================================================== */

function openInfo(
    location
) {

    closeDrawer();


    state.selectedSearch =
        location;


    $("#infoTitle")
    .textContent =
        location.name;


    $("#infoParent")
    .textContent =
        location.parent;


    $("#infoDescription")
    .textContent =

        location.description

        ||

        "Detail informasi akan dilengkapi kemudian.";


    $("#infoModal")
    .classList
    .remove(
        "hidden"
    );


    document
    .body
    .style
    .overflow =
        "hidden";

}



function closeInfo() {

    $("#infoModal")
    .classList
    .add(
        "hidden"
    );


    document
    .body
    .style
    .overflow =
        "";

}



$("#globalInfoButton")
.addEventListener(

    "click",

    () => {


        if(

            state
            .selectedSearch

        ) {

            openInfo(

                state
                .selectedSearch

            );

        }


    }

);



$("#closeInfoModal")
.addEventListener(

    "click",

    closeInfo

);



/* ===================================================== */
/* GLOBAL PETUNJUK ARAH */
/* ===================================================== */

$("#globalNavigationButton")
.addEventListener(

    "click",

    () => {


        if(

            !state
            .selectedSearch

        ) {

            return;

        }


        selectDestination(

            state
            .selectedSearch

        );


        showPage(
            "navigation"
        );


    }

);



$("#infoNavigationButton")
.addEventListener(

    "click",

    () => {


        if(

            !state
            .selectedSearch

        ) {

            return;

        }


        const destination =

            state
            .selectedSearch;


        closeInfo();


        selectDestination(
            destination
        );


        showPage(
            "navigation"
        );


    }

);



/* ===================================================== */
/* MODAL OVERLAYS */
/* ===================================================== */

$$("[data-modal-close]")
.forEach(

    overlay => {


        overlay
        .addEventListener(

            "click",

            () => {


                if(

                    overlay
                    .dataset
                    .modalClose ===
                    "info"

                ) {

                    closeInfo();

                }


                if(

                    overlay
                    .dataset
                    .modalClose ===
                    "map"

                ) {

                    closeMapPicker();

                }


            }

        );


    }

);



/* ===================================================== */
/* DIRECTORY */
/* ===================================================== */

function renderDirectory() {

    const container =
        $("#directoryContainer");


    container
    .innerHTML =
        "";



    buildings
    .forEach(

        (

            building,
            index

        ) => {


            const card =

                document
                .createElement(
                    "article"
                );


            card
            .className =
                "building-card";


            card
            .innerHTML =

                `

                <button
                    type="button"
                    class="building-header">


                    <span class="building-number">

                        ${String(
                            index + 1
                        ).padStart(
                            2,
                            "0"
                        )}

                    </span>


                    <span>

                        <strong>

                            ${building.name}

                        </strong>

                        <p>

                            ${
                                building.rooms.length

                                ?

                                building.rooms.length +
                                " ruangan"

                                :

                                "Data ruangan belum ditambahkan"
                            }

                        </p>

                    </span>


                    <span class="building-arrow">

                        ›

                    </span>


                </button>


                <div class="building-content">
                </div>

                `;


            const header =

                card
                .querySelector(
                    ".building-header"
                );


            const content =

                card
                .querySelector(
                    ".building-content"
                );


            header
            .addEventListener(

                "click",

                () => {


                    card
                    .classList
                    .toggle(
                        "open"
                    );


                }

            );


            if(

                building.id ===
                "laboratorium"

            ) {

                renderLaboratory(

                    building,
                    content

                );

            }

            else {

                renderRooms(

                    building,
                    content,
                    1

                );

            }


            container
            .appendChild(
                card
            );


        }

    );

}



function renderLaboratory(

    building,
    container

) {

    const floors =

        document
        .createElement(
            "div"
        );


    floors
    .className =
        "floor-buttons";


    const roomContainer =

        document
        .createElement(
            "div"
        );


    [1, 2, 3]
    .forEach(

        floor => {


            const button =

                document
                .createElement(
                    "button"
                );


            button.type =
                "button";


            button
            .className =

                "floor-button" +

                (

                    floor ===
                    1

                    ?

                    " active"

                    :

                    ""

                );


            button
            .textContent =

                "Lantai " +
                floor;


            button
            .addEventListener(

                "click",

                () => {


                    floors
                    .querySelectorAll(
                        "button"
                    )
                    .forEach(

                        item => {


                            item
                            .classList
                            .remove(
                                "active"
                            );


                        }

                    );


                    button
                    .classList
                    .add(
                        "active"
                    );


                    renderRooms(

                        building,
                        roomContainer,
                        floor

                    );


                }

            );


            floors
            .appendChild(
                button
            );


        }

    );


    container
    .appendChild(
        floors
    );


    container
    .appendChild(
        roomContainer
    );


    renderRooms(

        building,
        roomContainer,
        1

    );

}



function renderRooms(

    building,
    container,
    floor

) {

    container
    .innerHTML =
        "";


    let rooms =
        building.rooms;


    if(

        building.id ===
        "laboratorium"

    ) {

        rooms =

            rooms
            .filter(

                room =>

                    room.floor ===
                    floor

            );

    }


    if(

        rooms.length ===
        0

    ) {

        container
        .innerHTML =

            `

            <div class="empty-search">

                Data ruangan belum tersedia.

            </div>

            `;


        return;

    }


    const grid =

        document
        .createElement(
            "div"
        );


    grid
    .className =
        "room-grid";


    rooms
    .forEach(

        room => {


            const item =

                document
                .createElement(
                    "div"
                );


            item
            .className =
                "room";


            item
            .innerHTML =

                `

                <span>

                    ${room.name}

                </span>

                <button
                    type="button">

                    Informasi

                </button>

                `;


            item
            .querySelector(
                "button"
            )
            .addEventListener(

                "click",

                () => {


                    openInfo({

                        ...room,

                        type:
                            "room",

                        parent:
                            building.name,

                        buildingId:
                            building.id

                    });


                }

            );


            grid
            .appendChild(
                item
            );


        }

    );


    container
    .appendChild(
        grid
    );

}



renderDirectory();



/* ===================================================== */
/* MODEL VIEWERS */
/* ===================================================== */

const mainModelViewer =
    $("#mainModelViewer");


const heroModelViewer =
    $("#heroModelViewer");


const arModelViewer =
    $("#arModelViewer");



mainModelViewer.src =
    MODEL_PATH;


heroModelViewer.src =
    MODEL_PATH;


arModelViewer.src =
    MODEL_PATH;



mainModelViewer
.addEventListener(

    "load",

    () => {


        $("#modelStatus")
        .textContent =
            "Model berhasil dimuat";


    }

);



mainModelViewer
.addEventListener(

    "error",

    () => {


        $("#modelStatus")
        .textContent =
            "Model gagal dimuat";


        toast(

            "Pastikan biro-fakultas-teknik.glb berada di assets/models/"

        );


    }

);



$("#resetCamera")
.addEventListener(

    "click",

    () => {


        mainModelViewer
        .cameraOrbit =
            "0deg 75deg 105%";


        mainModelViewer
        .cameraTarget =
            "auto auto auto";


        toast(
            "Kamera 3D direset."
        );


    }

);



/* ===================================================== */
/* OPEN 3D */
/* ===================================================== */

function open3DViewer() {

    mainModelViewer.src =
        MODEL_PATH;


    $("#modelStatus")
    .textContent =
        "Memuat Gedung Biro Fakultas Teknik...";


    showPage(
        "viewer"
    );

}



/* ===================================================== */
/* OPEN NAVIGATION */
/* ===================================================== */

function openNavigation() {

    showPage(
        "navigation"
    );


    setTimeout(

        () => {


            $("#navigationSearch")
            .focus();


        },

        300

    );

}



/* ===================================================== */
/* FEATURE BUTTONS */
/* ===================================================== */

$("#feature3DButton")
.addEventListener(

    "click",

    open3DViewer

);



$("#featureARButton")
.addEventListener(

    "click",

    () => {


        showPage(
            "ar"
        );


    }

);



$("#featureNavigationButton")
.addEventListener(

    "click",

    openNavigation

);



/* ===================================================== */
/* HOME BUTTONS */
/* ===================================================== */

$("#home3DButton")
.addEventListener(

    "click",

    open3DViewer

);



$("#homeARButton")
.addEventListener(

    "click",

    () => {


        showPage(
            "ar"
        );


    }

);



$("#homeNavigationButton")
.addEventListener(

    "click",

    openNavigation

);



$("#homeDirectoryButton")
.addEventListener(

    "click",

    () => {


        showPage(
            "directory"
        );


    }

);



/* ===================================================== */
/* DRAWER BUTTONS */
/* ===================================================== */

$("#menu3D")
.addEventListener(

    "click",

    open3DViewer

);



$("#menuAR")
.addEventListener(

    "click",

    () => {


        showPage(
            "ar"
        );


        setTimeout(

            () => {

                launchSimpleAR();

            },

            300

        );


    }

);



$("#menuNavigation")
.addEventListener(

    "click",

    openNavigation

);



$("#menuDirectory")
.addEventListener(

    "click",

    () => {


        showPage(
            "directory"
        );


    }

);



/* ===================================================== */
/* AR MAP */
/* ===================================================== */

$("#launchAR")
.addEventListener(

    "click",

    launchSimpleAR

);



async function launchSimpleAR() {

    $("#trackingStatus")
    .textContent =
        "Membuka kamera...";


    $("#trackingHint")
    .textContent =
        "Berikan izin kamera jika browser meminta.";


    try {

        await arModelViewer
        .activateAR();

    }

    catch(error) {

        console.error(
            error
        );


        $("#trackingStatus")
        .textContent =
            "AR gagal dibuka";


        $("#trackingHint")
        .textContent =
            "Pastikan website menggunakan HTTPS dan perangkat mendukung AR.";


        toast(

            "AR tidak tersedia pada perangkat/browser ini."

        );

    }

}



arModelViewer
.addEventListener(

    "ar-status",

    event => {


        const status =
            event
            .detail
            .status;


        if(

            status ===
            "session-started"

        ) {

            $("#trackingStatus")
            .textContent =
                "Kamera AR aktif";


            $("#trackingHint")
            .textContent =
                "Gerakkan kamera perlahan untuk mencari bidang datar.";

        }


        else if(

            status ===
            "object-placed"

        ) {

            $("#trackingStatus")
            .textContent =
                "Model berhasil ditempatkan";


            $("#trackingHint")
            .textContent =
                "Tracking aktif.";

        }


        else if(

            status ===
            "failed"

        ) {

            $("#trackingStatus")
            .textContent =
                "AR tidak didukung";

        }


        else if(

            status ===
            "not-presenting"

        ) {

            $("#trackingStatus")
            .textContent =
                "Sesi AR selesai";

        }


    }

);



arModelViewer
.addEventListener(

    "ar-tracking",

    event => {


        if(

            event.detail.status ===
            "tracking"

        ) {

            $("#trackingStatus")
            .textContent =
                "Tracking bidang aktif";

        }

        else {

            $("#trackingStatus")
            .textContent =
                "Mencari bidang...";

        }


    }

);



$("#resetAR")
.addEventListener(

    "click",

    () => {


        $("#trackingStatus")
        .textContent =
            "AR direset";


        $("#trackingHint")
        .textContent =
            "Buka kamera kembali untuk melakukan tracking ulang.";


        toast(
            "State AR direset."
        );


    }

);



/* ===================================================== */
/* NAVIGATION SEARCH */
/* ===================================================== */

$("#navigationSearch")
.addEventListener(

    "input",

    event => {


        const value =
            event
            .target
            .value;


        if(!value) {

            $("#navigationResults")
            .innerHTML =

                `

                <div class="empty-search">

                    Ketik lokasi tujuan.

                </div>

                `;


            return;

        }


        renderResults(

            searchLocation(
                value
            ),

            $("#navigationResults"),

            selectDestination

        );


    }

);



function selectDestination(
    location
) {

    state.destination =
        location;


    $("#navigationSearch")
    .value =
        location.name;


    $("#navigationResults")
    .innerHTML =
        "";


    $("#destinationName")
    .textContent =
        location.name;


    $("#destinationParent")
    .textContent =
        location.parent;


    $("#selectedDestinationBox")
    .classList
    .remove(
        "hidden"
    );


    $("#navigate3D")
    .disabled =
        false;


    $("#navigateAR")
    .disabled =
        false;

}



/* ===================================================== */
/* LOCAL STORAGE MAP POINTS */
/* ===================================================== */

function getStoredPoints() {

    try {

        return JSON.parse(

            localStorage
            .getItem(
                "ftUisuPoints"
            )

            ||

            "{}"

        );

    }

    catch {

        return {};

    }

}



function getDestinationPoint(
    id
) {

    const points =
        getStoredPoints();


    return points[id]
        || null;

}



function saveDestinationPoint(

    id,
    point

) {

    const points =
        getStoredPoints();


    points[id] =
        point;


    localStorage
    .setItem(

        "ftUisuPoints",

        JSON.stringify(
            points
        )

    );

}



/* ===================================================== */
/* NAVIGATION MODE */
/* ===================================================== */

$("#navigate3D")
.addEventListener(

    "click",

    () => {


        state.navigationMode =
            "3d";


        openMapPicker();


    }

);



$("#navigateAR")
.addEventListener(

    "click",

    () => {


        state.navigationMode =
            "ar";


        openMapPicker();


    }

);



/* ===================================================== */
/* MAP PICKER */
/* ===================================================== */

function openMapPicker() {

    if(

        !state.destination

    ) {

        return;

    }


    state.mapStart =
        null;


    state.mapDestination =

        getDestinationPoint(

            state
            .destination
            .id

        );


    state.mapStep =
        "start";


    $("#startMarker")
    .classList
    .add(
        "hidden"
    );


    if(

        state
        .mapDestination

    ) {

        positionMarker(

            $("#destinationMarker"),

            state
            .mapDestination

        );


        $("#destinationMarker")
        .classList
        .remove(
            "hidden"
        );


        $("#targetStatus")
        .textContent =
            state
            .destination
            .name;

    }

    else {

        $("#destinationMarker")
        .classList
        .add(
            "hidden"
        );


        $("#targetStatus")
        .textContent =
            "Belum dipetakan";

    }


    $("#startStatus")
    .textContent =
        "Belum dipilih";


    $("#mapModalTitle")
    .textContent =
        "Tandai posisi Anda sekarang";


    $("#mapInstruction")
    .textContent =
        "Tap pada denah sesuai posisi Anda saat ini.";


    $("#confirmRoute")
    .disabled =
        true;


    updateMapLine();


    $("#mapModal")
    .classList
    .remove(
        "hidden"
    );


    document
    .body
    .style
    .overflow =
        "hidden";

}



function closeMapPicker() {

    $("#mapModal")
    .classList
    .add(
        "hidden"
    );


    document
    .body
    .style
    .overflow =
        "";

}



$("#closeMapModal")
.addEventListener(

    "click",

    closeMapPicker

);



$("#mapCanvas")
.addEventListener(

    "pointerdown",

    event => {


        if(

            event
            .target
            .closest(
                ".map-point"
            )

        ) {

            return;

        }


        const rect =

            $("#mapCanvas")
            .getBoundingClientRect();


        const point = {


            x:

                (

                    (

                        event.clientX -

                        rect.left

                    )

                    /

                    rect.width

                )

                *

                1000,


            y:

                (

                    (

                        event.clientY -

                        rect.top

                    )

                    /

                    rect.height

                )

                *

                600


        };


        if(

            state.mapStep ===
            "start"

        ) {


            state.mapStart =
                point;


            positionMarker(

                $("#startMarker"),

                point

            );


            $("#startMarker")
            .classList
            .remove(
                "hidden"
            );


            $("#startStatus")
            .textContent =
                "Posisi dipilih";


            if(

                !state
                .mapDestination

            ) {


                state.mapStep =
                    "destination";


                $("#mapModalTitle")
                .textContent =
                    "Tandai titik tujuan";


                $("#mapInstruction")
                .textContent =

                    state
                    .destination
                    .name +

                    " belum mempunyai titik pada denah. Tap lokasi tujuan.";

            }


        }

        else {


            state.mapDestination =
                point;


            saveDestinationPoint(

                state
                .destination
                .id,

                point

            );


            positionMarker(

                $("#destinationMarker"),

                point

            );


            $("#destinationMarker")
            .classList
            .remove(
                "hidden"
            );


            $("#targetStatus")
            .textContent =
                state
                .destination
                .name;


            state.mapStep =
                "done";


            $("#mapModalTitle")
            .textContent =
                "Rute siap";


            $("#mapInstruction")
            .textContent =
                "Tekan Lanjutkan untuk memulai navigasi.";


        }


        updateMapLine();


        $("#confirmRoute")
        .disabled =

            !(

                state.mapStart

                &&

                state.mapDestination

            );


    }

);



function positionMarker(

    element,
    point

) {

    element
    .style
    .left =

        (

            point.x /

            1000 *

            100

        )

        +

        "%";


    element
    .style
    .top =

        (

            point.y /

            600 *

            100

        )

        +

        "%";

}



function updateMapLine() {

    const line =
        $("#mapRouteLine");


    if(

        state.mapStart

        &&

        state.mapDestination

    ) {

        line
        .setAttribute(

            "x1",

            state
            .mapStart
            .x

        );


        line
        .setAttribute(

            "y1",

            state
            .mapStart
            .y

        );


        line
        .setAttribute(

            "x2",

            state
            .mapDestination
            .x

        );


        line
        .setAttribute(

            "y2",

            state
            .mapDestination
            .y

        );

    }

    else {

        line
        .setAttribute(
            "x1",
            0
        );


        line
        .setAttribute(
            "y1",
            0
        );


        line
        .setAttribute(
            "x2",
            0
        );


        line
        .setAttribute(
            "y2",
            0
        );

    }

}



$("#resetMap")
.addEventListener(

    "click",

    () => {


        state.mapStart =
            null;


        state.mapStep =
            "start";


        $("#startMarker")
        .classList
        .add(
            "hidden"
        );


        $("#startStatus")
        .textContent =
            "Belum dipilih";


        $("#confirmRoute")
        .disabled =
            true;


        $("#mapModalTitle")
        .textContent =
            "Tandai posisi Anda sekarang";


        $("#mapInstruction")
        .textContent =
            "Tap pada denah sesuai posisi Anda saat ini.";


        updateMapLine();


    }

);



$("#confirmRoute")
.addEventListener(

    "click",

    async () => {


        if(

            !state.mapStart

            ||

            !state.mapDestination

        ) {

            return;

        }


        closeMapPicker();


        if(

            state.navigationMode ===
            "3d"

        ) {

            start3DNavigation();

        }

        else {

            await startARNavigation();

        }


    }

);



/* ===================================================== */
/* 3D NAVIGATION */
/* ===================================================== */

function start3DNavigation() {

    showPage(
        "viewer"
    );


    $("#viewerDestinationText")
    .textContent =
        state
        .destination
        .name;


    $("#viewerHUDDestination")
    .textContent =
        state
        .destination
        .name;


    $("#viewerDestinationMarker")
    .classList
    .remove(
        "hidden"
    );


    $("#viewerRoute")
    .classList
    .remove(
        "hidden"
    );


    $("#viewerMiniMap")
    .classList
    .remove(
        "hidden"
    );


    $("#viewerNavigationHUD")
    .classList
    .remove(
        "hidden"
    );

}



$("#stop3DNavigation")
.addEventListener(

    "click",

    () => {


        $("#viewerDestinationMarker")
        .classList
        .add(
            "hidden"
        );


        $("#viewerRoute")
        .classList
        .add(
            "hidden"
        );


        $("#viewerMiniMap")
        .classList
        .add(
            "hidden"
        );


        $("#viewerNavigationHUD")
        .classList
        .add(
            "hidden"
        );


        toast(
            "Navigasi 3D selesai."
        );


    }

);



/* ===================================================== */
/* WEBXR CONFIG */
/* ===================================================== */

const XR_CONFIG = {

    mapPixelsPerMeter:
        70,

    arrowSpacing:
        1,

    arrivalDistance:
        .8,

    maxDistance:
        30

};



/* ===================================================== */
/* START WEBXR NAVIGATION */
/* ===================================================== */

async function startARNavigation() {

    if(

        !window.isSecureContext

    ) {

        toast(

            "Navigasi AR WebXR membutuhkan HTTPS."

        );


        return;

    }


    if(

        !navigator.xr

    ) {

        toast(

            "Browser ini tidak mendukung WebXR."

        );


        return;

    }


    let supported =
        false;


    try {

        supported =

            await navigator
            .xr
            .isSessionSupported(
                "immersive-ar"
            );

    }

    catch(error) {

        console.error(
            error
        );

    }


    if(!supported) {

        toast(

            "Perangkat tidak mendukung WebXR immersive-ar."

        );


        return;

    }


    showPage(
        "arNavigation"
    );


    $("#arDestinationName")
    .textContent =
        state
        .destination
        .name;


    $("#arrivalName")
    .textContent =
        state
        .destination
        .name;


    state.routePlaced =
        false;


    state.arrived =
        false;


    try {

        const session =

            await navigator
            .xr
            .requestSession(

                "immersive-ar",

                {

                    requiredFeatures: [

                        "hit-test"

                    ],

                    optionalFeatures: [

                        "local-floor",

                        "dom-overlay"

                    ],

                    domOverlay: {

                        root:
                            document.body

                    }

                }

            );


        state.xrSession =
            session;


        await setupXR(
            session
        );

    }

    catch(error) {

        console.error(
            error
        );


        toast(

            "Gagal membuka sesi AR."

        );


        showPage(
            "navigation"
        );

    }

}



/* ===================================================== */
/* SETUP XR */
/* ===================================================== */

async function setupXR(
    session
) {

    const container =
        $("#arCanvasContainer");


    container
    .innerHTML =
        "";


    const scene =
        new THREE.Scene();


    state.scene =
        scene;


    const camera =
        new THREE
        .PerspectiveCamera();


    state.camera =
        camera;


    scene
    .add(

        new THREE
        .HemisphereLight(

            0xffffff,

            0x888888,

            2.5

        )

    );


    const renderer =

        new THREE
        .WebGLRenderer({

            alpha:
                true,

            antialias:
                true

        });


    renderer
    .xr
    .enabled =
        true;


    renderer
    .setPixelRatio(

        Math.min(

            window
            .devicePixelRatio,

            2

        )

    );


    renderer
    .setSize(

        window
        .innerWidth,

        window
        .innerHeight

    );


    container
    .appendChild(

        renderer
        .domElement

    );


    state.renderer =
        renderer;


    await renderer
    .xr
    .setSession(
        session
    );


    const geometry =

        new THREE
        .RingGeometry(

            .08,

            .11,

            32

        );


    geometry
    .rotateX(

        -Math.PI /
        2

    );


    const material =

        new THREE
        .MeshBasicMaterial({

            color:
                0x33d5b8

        });


    const reticle =

        new THREE
        .Mesh(

            geometry,

            material

        );


    reticle
    .matrixAutoUpdate =
        false;


    reticle
    .visible =
        false;


    scene
    .add(
        reticle
    );


    state.reticle =
        reticle;


    const controller =

        renderer
        .xr
        .getController(
            0
        );


    controller
    .addEventListener(

        "select",

        () => {


            if(

                !state
                .routePlaced

                &&

                reticle
                .visible

            ) {

                placeARRoute(

                    reticle
                    .matrix

                );

            }


        }

    );


    scene
    .add(
        controller
    );


    session
    .addEventListener(

        "end",

        cleanupXR

    );


    renderer
    .setAnimationLoop(

        onXRFrame

    );

}



/* ===================================================== */
/* XR FRAME */
/* ===================================================== */

async function onXRFrame(

    time,
    frame

) {

    const renderer =
        state.renderer;


    const session =
        state.xrSession;


    if(

        !renderer

        ||

        !session

    ) {

        return;

    }


    const referenceSpace =

        renderer
        .xr
        .getReferenceSpace();


    if(

        !state
        .hitTestRequested

    ) {

        try {

            const viewerSpace =

                await session
                .requestReferenceSpace(
                    "viewer"
                );


            state.hitTestSource =

                await session
                .requestHitTestSource({

                    space:
                        viewerSpace

                });


            state.hitTestRequested =
                true;

        }

        catch(error) {

            console.error(
                error
            );

        }

    }


    if(

        state.hitTestSource

        &&

        state.reticle

    ) {

        const results =

            frame
            .getHitTestResults(

                state
                .hitTestSource

            );


        if(

            results.length >
            0

        ) {

            const pose =

                results[0]
                .getPose(

                    referenceSpace

                );


            if(pose) {

                state.reticle
                .visible =

                    !state
                    .routePlaced;


                state.reticle
                .matrix
                .fromArray(

                    pose
                    .transform
                    .matrix

                );


                if(

                    !state
                    .routePlaced

                ) {

                    $("#arTrackingBadge")
                    .textContent =
                        "Bidang ditemukan";

                }

            }

        }

        else {

            if(

                !state
                .routePlaced

            ) {

                state.reticle
                .visible =
                    false;


                $("#arTrackingBadge")
                .textContent =
                    "Mencari bidang...";

            }

        }

    }


    if(

        state.routePlaced

        &&

        state.destinationWorld

        &&

        !state.arrived

    ) {

        checkArrival();

    }


    renderer
    .render(

        state.scene,

        state.camera

    );

}



/* ===================================================== */
/* CREATE AR ROUTE */
/* ===================================================== */

function placeARRoute(
    matrix
) {

    if(

        !state.mapStart

        ||

        !state.mapDestination

    ) {

        return;

    }


    const origin =
        new THREE.Vector3();


    const quaternion =
        new THREE.Quaternion();


    const scale =
        new THREE.Vector3();


    matrix
    .decompose(

        origin,

        quaternion,

        scale

    );


    let dx =

        (

            state
            .mapDestination
            .x

            -

            state
            .mapStart
            .x

        )

        /

        XR_CONFIG
        .mapPixelsPerMeter;


    let dz =

        (

            state
            .mapDestination
            .y

            -

            state
            .mapStart
            .y

        )

        /

        XR_CONFIG
        .mapPixelsPerMeter;


    let routeLength =

        Math.hypot(

            dx,
            dz

        );


    if(

        routeLength >

        XR_CONFIG
        .maxDistance

    ) {

        const factor =

            XR_CONFIG
            .maxDistance

            /

            routeLength;


        dx *= factor;

        dz *= factor;


        routeLength =

            XR_CONFIG
            .maxDistance;

    }


    const destination =

        new THREE
        .Vector3(

            dx,

            .02,

            -dz

        );


    const routeGroup =

        new THREE
        .Group();


    const arrowCount =

        Math.max(

            1,

            Math.floor(

                routeLength

                /

                XR_CONFIG
                .arrowSpacing

            )

        );


    for(

        let index = 1;

        index <=
        arrowCount;

        index++

    ) {

        const progress =

            index /

            arrowCount;


        const arrow =
            createArrow();


        arrow
        .position
        .copy(

            destination
            .clone()
            .multiplyScalar(
                progress
            )

        );


        const angle =

            Math.atan2(

                destination.x,

                destination.z

            );


        arrow
        .rotation
        .y =
            angle;


        routeGroup
        .add(
            arrow
        );

    }


    /* DESTINATION MARKER */

    const marker =

        new THREE
        .Group();


    const ring =

        new THREE
        .Mesh(

            new THREE
            .TorusGeometry(

                .28,

                .05,

                16,

                40

            )
            .rotateX(

                Math.PI /
                2

            ),

            new THREE
            .MeshStandardMaterial({

                color:
                    0x18aa68

            })

        );


    marker
    .add(
        ring
    );


    const pole =

        new THREE
        .Mesh(

            new THREE
            .CylinderGeometry(

                .035,

                .035,

                .8,

                16

            ),

            new THREE
            .MeshStandardMaterial({

                color:
                    0x18aa68

            })

        );


    pole
    .position
    .y =
        .4;


    marker
    .add(
        pole
    );


    const head =

        new THREE
        .Mesh(

            new THREE
            .SphereGeometry(

                .11,

                20,

                20

            ),

            new THREE
            .MeshStandardMaterial({

                color:
                    0x49e39c

            })

        );


    head
    .position
    .y =
        .83;


    marker
    .add(
        head
    );


    marker
    .position
    .copy(
        destination
    );


    routeGroup
    .add(
        marker
    );


    routeGroup
    .position
    .copy(
        origin
    );


    const rotation =

        new THREE
        .Euler()
        .setFromQuaternion(

            quaternion,

            "YXZ"

        );


    routeGroup
    .rotation
    .y =
        rotation.y;


    state.scene
    .add(
        routeGroup
    );


    routeGroup
    .updateMatrixWorld(
        true
    );


    state.destinationWorld =

        marker
        .getWorldPosition(

            new THREE
            .Vector3()

        );


    state.routeGroup =
        routeGroup;


    state.routePlaced =
        true;


    state.reticle
    .visible =
        false;


    $("#placementInstruction")
    .classList
    .add(
        "hidden"
    );


    $("#arDirectionBox")
    .classList
    .remove(
        "hidden"
    );


    $("#arTrackingBadge")
    .textContent =
        "Tracking aktif";

}



/* ===================================================== */
/* CREATE ARROW */
/* ===================================================== */

function createArrow() {

    const group =

        new THREE
        .Group();


    const shaft =

        new THREE
        .Mesh(

            new THREE
            .BoxGeometry(

                .12,

                .025,

                .40

            ),

            new THREE
            .MeshStandardMaterial({

                color:
                    0x26cba8,

                emissive:
                    0x052d27

            })

        );


    shaft
    .position
    .z =
        .08;


    group
    .add(
        shaft
    );


    const head =

        new THREE
        .Mesh(

            new THREE
            .ConeGeometry(

                .20,

                .35,

                4

            ),

            new THREE
            .MeshStandardMaterial({

                color:
                    0x2da4d0

            })

        );


    head
    .rotation
    .x =

        Math.PI /
        2;


    head
    .rotation
    .z =

        Math.PI /
        4;


    head
    .position
    .z =
        -.24;


    group
    .add(
        head
    );


    group
    .position
    .y =
        .03;


    return group;

}



/* ===================================================== */
/* CHECK ARRIVAL */
/* ===================================================== */

function checkArrival() {

    if(

        !state.renderer

        ||

        !state.destinationWorld

    ) {

        return;

    }


    const xrCamera =

        state
        .renderer
        .xr
        .getCamera();


    const cameraPosition =

        new THREE
        .Vector3();


    xrCamera
    .getWorldPosition(

        cameraPosition

    );


    const distance =

        Math.hypot(

            cameraPosition.x

            -

            state
            .destinationWorld
            .x,


            cameraPosition.z

            -

            state
            .destinationWorld
            .z

        );


    $("#arDistanceText")
    .textContent =

        "Jarak ke tujuan: "

        +

        distance
        .toFixed(
            1
        )

        +

        " meter";


    if(

        distance <=

        XR_CONFIG
        .arrivalDistance

    ) {

        state.arrived =
            true;


        $("#arrivalScreen")
        .classList
        .remove(
            "hidden"
        );


        $("#arDirectionBox")
        .classList
        .add(
            "hidden"
        );


        $("#arTrackingBadge")
        .textContent =
            "Tujuan tercapai";


        setTimeout(

            () => {


                endXR();


                showPage(
                    "navigation"
                );


                toast(

                    "Navigasi selesai. Anda sudah sampai di tujuan."

                );


            },

            2500

        );

    }

}



/* ===================================================== */
/* CLOSE AR NAVIGATION */
/* ===================================================== */

$("#closeARNavigation")
.addEventListener(

    "click",

    () => {


        endXR();


        showPage(
            "navigation"
        );


    }

);



function endXR() {

    if(

        state.xrSession

    ) {

        try {

            state
            .xrSession
            .end();

        }

        catch(error) {

            console.log(
                error
            );

        }

    }

    else {

        cleanupXR();

    }

}



/* ===================================================== */
/* CLEANUP XR */
/* ===================================================== */

function cleanupXR() {

    if(

        state.renderer

    ) {

        state.renderer
        .setAnimationLoop(
            null
        );


        state.renderer
        .dispose();

    }


    if(

        state.hitTestSource

    ) {

        try {

            state
            .hitTestSource
            .cancel();

        }

        catch {

        }

    }


    state.xrSession =
        null;


    state.renderer =
        null;


    state.scene =
        null;


    state.camera =
        null;


    state.reticle =
        null;


    state.hitTestSource =
        null;


    state.hitTestRequested =
        false;


    state.routeGroup =
        null;


    state.destinationWorld =
        null;


    state.routePlaced =
        false;


    $("#arCanvasContainer")
    .innerHTML =
        "";


    $("#placementInstruction")
    .classList
    .remove(
        "hidden"
    );


    $("#arDirectionBox")
    .classList
    .add(
        "hidden"
    );


    $("#arrivalScreen")
    .classList
    .add(
        "hidden"
    );

}



/* ===================================================== */
/* TOAST */
/* ===================================================== */

let toastTimer;


function toast(
    message
) {

    const element =
        $("#toast");


    element
    .textContent =
        message;


    element
    .classList
    .add(
        "show"
    );


    clearTimeout(
        toastTimer
    );


    toastTimer =

        setTimeout(

            () => {


                element
                .classList
                .remove(
                    "show"
                );


            },

            3500

        );

}



/* ===================================================== */
/* ESCAPE */
/* ===================================================== */

document
.addEventListener(

    "keydown",

    event => {


        if(

            event.key ===
            "Escape"

        ) {


            closeDrawer();


            if(

                !$("#infoModal")
                .classList
                .contains(
                    "hidden"
                )

            ) {

                closeInfo();

            }


            if(

                !$("#mapModal")
                .classList
                .contains(
                    "hidden"
                )

            ) {

                closeMapPicker();

            }


        }


    }

);