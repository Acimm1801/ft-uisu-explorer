/* =========================================================
   FT UISU EXPLORER — REVISI 4 (NO NAVIGATION)

   Seluruh database Revisi 44 dipertahankan:
   - 5 gedung
   - 7 model 3D
   - Database ruangan dan Tendik
   - Entrance
   - Graph navigasi
   - Kalibrasi GPS

   Navigasi hanya disembunyikan oleh script.js/style.css.
========================================================= */

(function(){
"use strict";

const MAP_WIDTH=768;
const MAP_HEIGHT=1024;

const NAVIGATION_MAP="./assets/maps/denah-v1.png";
const FULL_DETAIL_REFERENCE="./assets/maps/denah-full-detail.png";

const buildings=[
    {
        id:"biro-ft",
        modelMenuName:"Biro Fakultas Teknik UISU",
        modelMenuOrder:1,
        name:"Biro Fakultas Teknik UISU",
        shortName:"Biro FT",
        description:"Biro Fakultas Teknik UISU berada di lantai 2 pada gedung yang sama dengan Fakultas Agama Islam di lantai 1 dan Fakultas Sastra di lantai 3.",
        actualFloor:2,
        floorCount:1,
        defaultEntranceId:"biro-main-e1",
        defaultModel:"indoor",
        liveMarker:{x:666,y:532},
        models:[
            {
                id:"outdoor",
                name:"Outdoor",
                viewerTitle:"Biro Fakultas Teknik UISU",
                src:"./assets/models/gedung_biro_outdoor.glb",
                defaultCameraOrbit:"0deg 72deg auto",
                defaultCameraTarget:"auto auto auto",
                defaultFieldOfView:"35deg",
                viewerDescription:"Model outdoor menampilkan bangunan tempat Biro Fakultas Teknik UISU berada di lantai 2, dengan Fakultas Agama Islam di lantai 1 dan Fakultas Sastra di lantai 3."
            },
            {
                id:"indoor",
                name:"Indoor",
                viewerTitle:"Biro Fakultas Teknik UISU",
                src:"./assets/models/gedung_biro_indoor.glb",
                defaultCameraOrbit:"-35deg 68deg auto",
                defaultCameraTarget:"auto auto auto",
                defaultFieldOfView:"35deg",
                viewerDescription:"Model indoor menampilkan interior Biro Fakultas Teknik UISU di lantai 2 beserta susunan ruangannya."
            }
        ]
    },
    {
        id:"perpustakaan-ft",
        modelMenuName:"Perpustakaan Fakultas Teknik UISU",
        modelMenuOrder:5,
        name:"Perpustakaan Fakultas Teknik UISU",
        shortName:"Perpustakaan FT",
        description:"Ruang belajar dan mencari referensi yang menyediakan bahan bacaan serta sumber informasi untuk mendukung perkuliahan, tugas, dan penelitian skripsi mahasiswa.",
        actualFloor:1,
        floorCount:1,
        tendik:[],
        defaultEntranceId:"library-e1",
        defaultModel:"indoor",
        liveMarker:{x:686,y:249},
        models:[
            {
                id:"indoor",
                name:"Indoor",
                viewerTitle:"Perpustakaan Fakultas Teknik UISU",
                src:"./assets/models/perpustakaan_indoor.glb",
                defaultCameraOrbit:"-18deg 68deg auto",
                defaultCameraTarget:"auto auto auto",
                defaultFieldOfView:"35deg",
                viewerDescription:"Model indoor menampilkan interior Perpustakaan Fakultas Teknik UISU yang berada di lantai 1, pada gedung di sudut seberang lapangan."
            }
        ]
    },
    {
        id:"serbaguna-ft",
        modelMenuName:"Ruang Serbaguna Fakultas Teknik UISU",
        modelMenuOrder:4,
        name:"Ruang Serbaguna Fakultas Teknik UISU",
        shortName:"Serbaguna FT",
        description:"Ruang yang digunakan untuk berbagai kegiatan fakultas seperti seminar, sidang, rapat, presentasi, pelatihan, kegiatan mahasiswa, dan acara akademik lainnya.",
        actualFloor:1,
        floorCount:1,
        defaultEntranceId:"serbaguna-e1",
        defaultModel:"indoor",
        liveMarker:{x:644,y:121},
        models:[
            {
                id:"indoor",
                name:"Indoor",
                viewerTitle:"Ruang Serbaguna Fakultas Teknik UISU",
                src:"./assets/models/serbaguna_indoor.glb",
                defaultCameraOrbit:"-12deg 70deg auto",
                defaultCameraTarget:"auto auto auto",
                defaultFieldOfView:"35deg",
                viewerDescription:"Model indoor menampilkan interior Ruang Serbaguna FT yang berada di lantai 1 pada gedung Fakultas Hukum."
            }
        ]
    },
    {
        id:"perkuliahan-ft",
        modelMenuName:"Gedung Perkuliahan Fakultas Teknik UISU",
        modelMenuOrder:2,
        name:"Gedung Perkuliahan Fakultas Teknik UISU",
        shortName:"Perkuliahan FT",
        description:"Gedung Perkuliahan Fakultas Teknik UISU berada di lantai 3 pada gedung di seberang Biro Fakultas Teknik UISU.",
        actualFloor:3,
        floorCount:1,
        defaultEntranceId:"class-main-e1",
        defaultModel:"outdoor",
        liveMarker:{x:465,y:755},
        models:[
            {
                id:"outdoor",
                name:"Outdoor",
                viewerTitle:"Gedung Perkuliahan Fakultas Teknik UISU",
                src:"./assets/models/gedung_perkuliahan_outdoor.glb",
                defaultCameraOrbit:"0deg 72deg auto",
                defaultCameraTarget:"auto auto auto",
                defaultFieldOfView:"35deg",
                viewerDescription:"Model outdoor menampilkan bangunan tempat Gedung Perkuliahan Fakultas Teknik UISU berada di lantai 3, di seberang Biro Fakultas Teknik UISU."
            },
            {
                id:"indoor",
                name:"Indoor",
                viewerTitle:"Gedung Perkuliahan Fakultas Teknik UISU",
                src:"./assets/models/gedung_perkuliahan_indoor.glb",
                defaultCameraOrbit:"0deg 75deg auto",
                defaultCameraTarget:"auto auto auto",
                defaultFieldOfView:"35deg",
                viewerDescription:"Model indoor menampilkan interior Gedung Perkuliahan Fakultas Teknik UISU di lantai 3, dari Ruang Kuliah 1 sampai Ruang Kuliah 8."
            }
        ]
    },
    {
        id:"laboratorium-ft",
        modelMenuName:"Laboratorium Fakultas Teknik UISU",
        modelMenuOrder:3,
        name:"Laboratorium Fakultas Teknik UISU",
        shortName:"Laboratorium FT",
        description:"Laboratorium Fakultas Teknik UISU terdiri dari tiga lantai dan berada di dekat Gedung Perkuliahan Fakultas Teknik UISU.",
        actualFloor:null,
        floorCount:3,
        defaultEntranceId:"lab-main-e1",
        defaultModel:"outdoor",
        liveMarker:{x:386,y:850},
        models:[
            {
                id:"outdoor",
                name:"Outdoor",
                viewerTitle:"Laboratorium Fakultas Teknik UISU",
                src:"./assets/models/laboratorium_outdoor.glb",
                defaultCameraOrbit:"32deg 66deg auto",
                defaultCameraTarget:"auto auto auto",
                defaultFieldOfView:"35deg",
                viewerDescription:"Model outdoor menampilkan Laboratorium Fakultas Teknik UISU tiga lantai beserta area laboratorium dan ruang kuliah di dalamnya."
            }
        ]
    }
];

/* ENTRANCE NAVIGASI TETAP DIPERTAHANKAN */

const entrances=[
    {
        id:"serbaguna-e1",
        buildingId:"serbaguna-ft",
        name:"Entrance Ruang Serbaguna Fakultas Teknik UISU",
        floor:1,
        x:644,y:210,
        nodeId:"E_SERBAGUNA",
        deadEnd:true
    },
    {
        id:"library-e1",
        buildingId:"perpustakaan-ft",
        name:"Entrance Perpustakaan Fakultas Teknik UISU",
        floor:1,
        x:691,y:356,
        nodeId:"E_LIBRARY",
        deadEnd:true
    },
    {
        id:"biro-main-e1",
        buildingId:"biro-ft",
        name:"Entrance Biro Fakultas Teknik UISU",
        floor:2,
        x:640,y:527,
        nodeId:"E_BIRO",
        deadEnd:false
    },
    {
        id:"class-main-e1",
        buildingId:"perkuliahan-ft",
        name:"Entrance Gedung Perkuliahan Fakultas Teknik UISU",
        floor:3,
        x:462,y:685,
        nodeId:"E_CLASS",
        deadEnd:false
    },
    {
        id:"lab-main-e1",
        buildingId:"laboratorium-ft",
        name:"Entrance Utama Laboratorium Fakultas Teknik UISU",
        floor:1,
        x:384,y:686,
        nodeId:"E_LAB_MAIN",
        deadEnd:false
    },
    {
        id:"lab-west-e1",
        buildingId:"laboratorium-ft",
        name:"Entrance Barat Laboratorium Fakultas Teknik UISU",
        floor:1,
        x:341,y:805,
        nodeId:"E_LAB_WEST",
        deadEnd:true,
        accessOnly:[
            "lab-hidrolika",
            "lab-teknologi-mekanik"
        ]
    },
    {
        id:"lab-south-e1",
        buildingId:"laboratorium-ft",
        name:"Entrance Selatan Laboratorium Fakultas Teknik UISU",
        floor:1,
        x:460,y:953,
        nodeId:"E_LAB_SOUTH",
        deadEnd:true,
        accessOnly:[
            "lab-jalan-raya",
            "lab-beton",
            "lab-mekanika-tanah",
            "lab-ilmu-ukur-tanah"
        ]
    }
];

/* =========================================================
   ROOM DATABASE

   Format pengisian Tendik:

   tendik:[
       {
           name:"Nama Lengkap",
           phone:"081234567890",
           photo:"./assets/images/tendik/nama-file.jpg"
       }
   ]
========================================================= */

const rooms=[

/* BIRO FAKULTAS TEKNIK */

{
    id:"ruang-dosen",
    name:"Ruang Dosen",
    buildingId:"biro-ft",
    floor:2,
    tendik:[],
    navigationEntranceId:"biro-main-e1",
    description:"Ruang kerja dosen untuk menyiapkan kegiatan perkuliahan, berdiskusi, melakukan bimbingan, serta melayani kebutuhan akademik mahasiswa.",
    modelMarker:null
},
{
    id:"gudang-mini",
    name:"Gudang Mini",
    buildingId:"biro-ft",
    floor:2,
    tendik:[],
    navigationEntranceId:"biro-main-e1",
    description:"Ruang penyimpanan perlengkapan dan barang penunjang kegiatan operasional Fakultas Teknik.",
    modelMarker:null
},
{
    id:"prodi-industri",
    name:"Program Studi Teknik Industri",
    buildingId:"biro-ft",
    floor:2,
    tendik:[],
    navigationEntranceId:"biro-main-e1",
    description:"Ruang pengelolaan akademik Program Studi Teknik Industri sekaligus tempat mahasiswa mendapatkan informasi dan layanan terkait perkuliahan, kurikulum, serta kegiatan prodi.",
    modelMarker:null
},
{
    id:"prodi-mesin",
    name:"Program Studi Teknik Mesin",
    buildingId:"biro-ft",
    floor:2,
    tendik:[],
    navigationEntranceId:"biro-main-e1",
    description:"Ruang pengelolaan akademik Program Studi Teknik Mesin dan layanan mahasiswa terkait perkuliahan, kegiatan prodi, serta bidang keilmuan teknik mesin.",
    modelMarker:null
},
{
    id:"prodi-sipil",
    name:"Program Studi Teknik Sipil",
    buildingId:"biro-ft",
    floor:2,
    tendik:[],
    navigationEntranceId:"biro-main-e1",
    description:"Ruang pengelolaan akademik Program Studi Teknik Sipil dan layanan mahasiswa terkait perkuliahan, kegiatan prodi, serta bidang konstruksi dan infrastruktur.",
    modelMarker:null
},
{
    id:"prodi-elektro",
    name:"Program Studi Teknik Elektro",
    buildingId:"biro-ft",
    floor:2,
    tendik:[],
    navigationEntranceId:"biro-main-e1",
    description:"Ruang pengelolaan akademik Program Studi Teknik Elektro dan layanan mahasiswa terkait perkuliahan, kegiatan prodi, serta bidang kelistrikan dan elektronika.",
    modelMarker:null
},
{
    id:"prodi-informatika",
    name:"Program Studi Teknik Informatika",
    buildingId:"biro-ft",
    floor:2,
    tendik:[],
    navigationEntranceId:"biro-main-e1",
    description:"Ruang pengelolaan akademik Program Studi Teknik Informatika dan layanan mahasiswa terkait perkuliahan, kegiatan prodi, serta bidang komputasi dan teknologi informasi.",
    modelMarker:null
},
{
    id:"lpmf",
    name:"Lembaga Penjamin Mutu Fakultas (LPMF)",
    buildingId:"biro-ft",
    floor:2,
    tendik:[],
    navigationEntranceId:"biro-main-e1",
    description:"Unit yang membantu menjaga dan meningkatkan mutu kegiatan akademik melalui pemantauan, evaluasi, dokumentasi mutu, dan persiapan akreditasi di tingkat fakultas.",
    modelMarker:null
},
{
    id:"wakil-dekan-adi",
    name:"Wakil Dekan Akademik dan Dakwah Islamiyah (WD-1 ADI)",
    buildingId:"biro-ft",
    floor:2,
    tendik:[],
    navigationEntranceId:"biro-main-e1",
    description:"Ruang Wakil Dekan bidang Akademik dan Dakwah Islamiyah yang membantu mengoordinasikan kegiatan akademik serta pelaksanaan nilai dan kegiatan dakwah Islamiyah di lingkungan fakultas.",
    modelMarker:null
},
{
    id:"wakil-dekan-stk",
    name:"Wakil Dekan Sumber Daya dan Tata Kelola (WD-2 STK)",
    buildingId:"biro-ft",
    floor:2,
    tendik:[],
    navigationEntranceId:"biro-main-e1",
    description:"Ruang Wakil Dekan bidang Sumber Daya dan Tata Kelola yang membantu mengelola sumber daya, administrasi, sarana, dan tata kelola fakultas.",
    modelMarker:null
},
{
    id:"wakil-dekan-kak",
    name:"Wakil Dekan Kewirausahaan, Alumni dan Kemahasiswaan (WD-3 KAK)",
    buildingId:"biro-ft",
    floor:2,
    tendik:[],
    navigationEntranceId:"biro-main-e1",
    description:"Ruang Wakil Dekan yang menangani kegiatan mahasiswa, hubungan dengan alumni, pengembangan kewirausahaan, serta berbagai kegiatan kemahasiswaan fakultas.",
    modelMarker:null
},
{
    id:"dekan",
    name:"Dekan",
    buildingId:"biro-ft",
    floor:2,
    tendik:[],
    navigationEntranceId:"biro-main-e1",
    description:"Ruang kerja pimpinan Fakultas Teknik yang mengoordinasikan kegiatan akademik, administrasi, pengembangan fakultas, serta pelaksanaan program kerja secara keseluruhan.",
    modelMarker:null
},
{
    id:"loket-pembayaran",
    name:"Loket Pembayaran Mahasiswa",
    buildingId:"biro-ft",
    floor:2,
    tendik:[],
    navigationEntranceId:"biro-main-e1",
    description:"Tempat mahasiswa memperoleh layanan dan informasi yang berkaitan dengan pembayaran serta administrasi keuangan perkuliahan.",
    modelMarker:null
},
{
    id:"kasubbag-keuangan",
    name:"KaSubBag Keuangan",
    buildingId:"biro-ft",
    floor:2,
    tendik:[],
    navigationEntranceId:"biro-main-e1",
    description:"Ruang bagian yang menangani administrasi keuangan, anggaran, pembayaran, pencatatan, serta kebutuhan keuangan Fakultas Teknik.",
    modelMarker:null
},
{
    id:"kasubbag-akademik",
    name:"KaSubBag Akademik IT dan Kerjasama",
    buildingId:"biro-ft",
    floor:2,
    tendik:[],
    navigationEntranceId:"biro-main-e1",
    description:"Ruang pengelolaan layanan akademik, dukungan sistem dan teknologi informasi, serta administrasi kegiatan kerja sama fakultas.",
    modelMarker:null
},
{
    id:"kasubbag-kemahasiswaan",
    name:"KaSubBag Kemahasiswaan",
    buildingId:"biro-ft",
    floor:2,
    tendik:[],
    navigationEntranceId:"biro-main-e1",
    description:"Ruang yang menangani administrasi dan layanan kegiatan mahasiswa, organisasi kemahasiswaan, prestasi, serta kebutuhan kemahasiswaan lainnya.",
    modelMarker:null
},
{
    id:"kasubbag-siakad",
    name:"KaSubBag SIAKAD",
    buildingId:"biro-ft",
    floor:2,
    tendik:[],
    navigationEntranceId:"biro-main-e1",
    description:"Ruang pengelolaan Sistem Informasi Akademik yang membantu menangani data mahasiswa, mata kuliah, nilai, jadwal, dan administrasi akademik berbasis sistem.",
    modelMarker:null
},
{
    id:"kasubbag-umum",
    name:"KaSubBag Umum dan Perlengkapan Kerumahtanggaan",
    buildingId:"biro-ft",
    floor:2,
    tendik:[],
    navigationEntranceId:"biro-main-e1",
    description:"Ruang yang menangani kebutuhan umum, perlengkapan, fasilitas, inventaris, dan berbagai kebutuhan operasional Fakultas Teknik.",
    modelMarker:null
},
{
    id:"kepala-tata-usaha-ktu",
    name:"Kepala Tata Usaha-KTU",
    buildingId:"biro-ft",
    floor:2,
    tendik:[],
    navigationEntranceId:"biro-main-e1",
    description:"Ruang Kepala Tata Usaha yang mengoordinasikan layanan administrasi, akademik, keuangan, dokumen, sarana, dan kegiatan tata usaha fakultas.",
    modelMarker:null
},

/* GEDUNG PERKULIAHAN */

{
    id:"ruang-kuliah-1",
    name:"Ruang Kuliah 1",
    buildingId:"perkuliahan-ft",
    floor:3,
    units:["Teknik Sipil"],
    navigationEntranceId:"class-main-e1",
    description:"Ruang yang digunakan untuk kegiatan perkuliahan, diskusi kelas, presentasi, dan kegiatan pembelajaran mahasiswa.",
    modelMarker:null
},
{
    id:"ruang-kuliah-2",
    name:"Ruang Kuliah 2",
    buildingId:"perkuliahan-ft",
    floor:3,
    units:["Teknik Sipil"],
    navigationEntranceId:"class-main-e1",
    description:"Ruang yang digunakan untuk kegiatan perkuliahan, diskusi kelas, presentasi, dan kegiatan pembelajaran mahasiswa.",
    modelMarker:null
},
{
    id:"ruang-kuliah-3",
    name:"Ruang Kuliah 3",
    buildingId:"perkuliahan-ft",
    floor:3,
    units:["Teknik Sipil"],
    navigationEntranceId:"class-main-e1",
    description:"Ruang yang digunakan untuk kegiatan perkuliahan, diskusi kelas, presentasi, dan kegiatan pembelajaran mahasiswa.",
    modelMarker:null
},
{
    id:"ruang-kuliah-4",
    name:"Ruang Kuliah 4",
    buildingId:"perkuliahan-ft",
    floor:3,
    units:["Teknik Sipil"],
    navigationEntranceId:"class-main-e1",
    description:"Ruang yang digunakan untuk kegiatan perkuliahan, diskusi kelas, presentasi, dan kegiatan pembelajaran mahasiswa.",
    modelMarker:null
},
{
    id:"ruang-kuliah-5",
    name:"Ruang Kuliah 5",
    buildingId:"perkuliahan-ft",
    floor:3,
    units:["Teknik Informatika"],
    navigationEntranceId:"class-main-e1",
    description:"Ruang yang digunakan untuk kegiatan perkuliahan, diskusi kelas, presentasi, dan kegiatan pembelajaran mahasiswa.",
    modelMarker:null
},
{
    id:"ruang-kuliah-6",
    name:"Ruang Kuliah 6",
    buildingId:"perkuliahan-ft",
    floor:3,
    units:["Teknik Informatika"],
    navigationEntranceId:"class-main-e1",
    description:"Ruang yang digunakan untuk kegiatan perkuliahan, diskusi kelas, presentasi, dan kegiatan pembelajaran mahasiswa.",
    modelMarker:null
},
{
    id:"ruang-kuliah-7",
    name:"Ruang Kuliah 7",
    buildingId:"perkuliahan-ft",
    floor:3,
    units:["Teknik Informatika"],
    navigationEntranceId:"class-main-e1",
    description:"Ruang yang digunakan untuk kegiatan perkuliahan, diskusi kelas, presentasi, dan kegiatan pembelajaran mahasiswa.",
    modelMarker:null
},
{
    id:"ruang-kuliah-8",
    name:"Ruang Kuliah 8",
    buildingId:"perkuliahan-ft",
    floor:3,
    units:["Teknik Informatika"],
    navigationEntranceId:"class-main-e1",
    description:"Ruang yang digunakan untuk kegiatan perkuliahan, diskusi kelas, presentasi, dan kegiatan pembelajaran mahasiswa.",
    modelMarker:null
},

/* LABORATORIUM LANTAI 1 */

{
    id:"lab-hidrolika",
    name:"Lab. Hidrolika",
    buildingId:"laboratorium-ft",
    floor:1,
    units:["Teknik Sipil"],
    sharedLocationGroup:"lab-l1-hidrolika-teknologi-mekanik",
    navigationEntranceId:"lab-west-e1",
    description:"Laboratorium untuk mempelajari perilaku dan aliran air melalui praktikum seperti pengukuran debit, tekanan, saluran terbuka, dan berbagai fenomena hidrolika.",
    modelMarker:null
},
{
    id:"lab-teknologi-mekanik",
    name:"Lab. Teknologi Mekanik",
    buildingId:"laboratorium-ft",
    floor:1,
    units:["Teknik Mesin"],
    sharedLocationGroup:"lab-l1-hidrolika-teknologi-mekanik",
    navigationEntranceId:"lab-west-e1",
    description:"Laboratorium untuk praktik proses manufaktur dan pengerjaan material menggunakan berbagai mesin seperti bubut, milling, bor, dan peralatan mekanik lainnya.",
    modelMarker:null
},
{
    id:"lab-beton",
    name:"Lab. Beton",
    buildingId:"laboratorium-ft",
    floor:1,
    units:["Teknik Sipil"],
    sharedLocationGroup:"lab-l1-beton-jalan-raya",
    navigationEntranceId:"lab-south-e1",
    description:"Laboratorium untuk praktikum dan pengujian bahan beton, semen, agregat, campuran beton, serta pengujian kekuatan material konstruksi.",
    modelMarker:null
},
{
    id:"lab-jalan-raya",
    name:"Lab. Jalan Raya",
    buildingId:"laboratorium-ft",
    floor:1,
    units:["Teknik Sipil"],
    sharedLocationGroup:"lab-l1-beton-jalan-raya",
    navigationEntranceId:"lab-south-e1",
    description:"Laboratorium untuk mempelajari serta menguji material perkerasan jalan seperti agregat dan aspal dalam kegiatan praktikum maupun penelitian.",
    modelMarker:null
},
{
    id:"lab-mekanika-tanah",
    name:"Lab. Mekanika Tanah",
    buildingId:"laboratorium-ft",
    floor:1,
    units:["Teknik Sipil"],
    sharedLocationGroup:"lab-l1-mekanika-tanah-ilmu-ukur-tanah",
    navigationEntranceId:"lab-south-e1",
    description:"Laboratorium untuk mempelajari karakteristik dan daya dukung tanah melalui pengujian kadar air, pemadatan, CBR, geser tanah, dan pengujian geoteknik lainnya.",
    modelMarker:null
},
{
    id:"lab-ilmu-ukur-tanah",
    name:"Lab. Ilmu Ukur Tanah",
    buildingId:"laboratorium-ft",
    floor:1,
    units:["Teknik Sipil"],
    sharedLocationGroup:"lab-l1-mekanika-tanah-ilmu-ukur-tanah",
    navigationEntranceId:"lab-south-e1",
    description:"Laboratorium yang mendukung kegiatan survei dan pemetaan, seperti pengukuran luas, kontur, elevasi, serta penggunaan alat ukur lapangan.",
    modelMarker:null
},

/* LABORATORIUM LANTAI 2 */

{
    id:"ruang-kuliah-9",
    name:"Ruang Kuliah 9",
    buildingId:"laboratorium-ft",
    floor:2,
    units:["Teknik Industri"],
    navigationEntranceId:"lab-main-e1",
    description:"Ruang yang digunakan untuk kegiatan perkuliahan, diskusi kelas, presentasi, dan kegiatan pembelajaran mahasiswa.",
    modelMarker:null
},
{
    id:"ruang-kuliah-10",
    name:"Ruang Kuliah 10",
    buildingId:"laboratorium-ft",
    floor:2,
    units:["Teknik Industri"],
    navigationEntranceId:"lab-main-e1",
    description:"Ruang yang digunakan untuk kegiatan perkuliahan, diskusi kelas, presentasi, dan kegiatan pembelajaran mahasiswa.",
    modelMarker:null
},
{
    id:"lab-fondry",
    name:"Lab. Fondry",
    buildingId:"laboratorium-ft",
    floor:2,
    units:["Teknik Industri"],
    navigationEntranceId:"lab-main-e1",
    description:"Laboratorium untuk mempelajari proses pengecoran logam, mulai dari persiapan cetakan dan material hingga proses peleburan, penuangan, dan pemeriksaan hasil cor.",
    modelMarker:null
},
{
    id:"lab-komputasi",
    name:"Lab. Komputasi",
    buildingId:"laboratorium-ft",
    floor:2,
    units:["Fakultas Teknik"],
    sharedLocationGroup:"lab-l2-komputasi-sistem-digital",
    navigationEntranceId:"lab-main-e1",
    description:"Laboratorium berbasis komputer yang digunakan untuk praktikum, pemodelan, simulasi, pengolahan data, serta penggunaan perangkat lunak pendukung bidang teknik.",
    modelMarker:null
},
{
    id:"lab-sistem-digital",
    name:"Lab. Sistem Digital",
    buildingId:"laboratorium-ft",
    floor:2,
    units:["Teknik Informatika"],
    sharedLocationGroup:"lab-l2-komputasi-sistem-digital",
    navigationEntranceId:"lab-main-e1",
    description:"Laboratorium untuk mempelajari dasar sistem digital, logika digital, rangkaian digital, serta penerapannya pada perangkat dan sistem komputasi.",
    modelMarker:null
},
{
    id:"lab-terintegrasi",
    name:"Lab. Terintegrasi",
    buildingId:"laboratorium-ft",
    floor:2,
    units:["Teknik Industri"],
    sharedLocationGroup:"lab-l2-terintegrasi-faktor-manusia-sistem-produksi",
    navigationEntranceId:"lab-main-e1",
    description:"Laboratorium untuk praktikum Teknik Industri yang menggabungkan beberapa bidang keilmuan dalam satu rangkaian proses perancangan, analisis, dan penyelesaian masalah industri.",
    modelMarker:null
},
{
    id:"lab-faktor-manusia",
    name:"Lab. Teknik Faktor Manusia",
    buildingId:"laboratorium-ft",
    floor:2,
    units:["Teknik Industri"],
    sharedLocationGroup:"lab-l2-terintegrasi-faktor-manusia-sistem-produksi",
    navigationEntranceId:"lab-main-e1",
    description:"Laboratorium untuk mempelajari hubungan manusia dengan sistem kerja, termasuk ergonomi, antropometri, beban kerja, lingkungan kerja, dan keselamatan kerja.",
    modelMarker:null
},
{
    id:"lab-sistem-produksi",
    name:"Lab. Sistem Produksi",
    buildingId:"laboratorium-ft",
    floor:2,
    units:["Teknik Industri"],
    sharedLocationGroup:"lab-l2-terintegrasi-faktor-manusia-sistem-produksi",
    navigationEntranceId:"lab-main-e1",
    description:"Laboratorium untuk mempelajari perencanaan dan pengendalian produksi, penjadwalan, tata letak fasilitas, keseimbangan lini, serta peningkatan efisiensi proses produksi.",
    modelMarker:null
},
{
    id:"lab-rangkaian-listrik",
    name:"Lab. Rangkaian Listrik",
    buildingId:"laboratorium-ft",
    floor:2,
    units:["Teknik Elektro"],
    sharedLocationGroup:"lab-l2-elektro",
    navigationEntranceId:"lab-main-e1",
    description:"Laboratorium untuk memahami dasar rangkaian listrik melalui praktik pengukuran tegangan, arus, daya, serta analisis berbagai konfigurasi rangkaian.",
    modelMarker:null
},
{
    id:"lab-dasar-telekomunikasi",
    name:"Lab. Dasar Sistem Telekomunikasi",
    buildingId:"laboratorium-ft",
    floor:2,
    units:["Teknik Elektro"],
    sharedLocationGroup:"lab-l2-elektro",
    navigationEntranceId:"lab-main-e1",
    description:"Laboratorium untuk mempelajari dasar pengiriman dan penerimaan informasi melalui sinyal, sistem komunikasi, dan perangkat telekomunikasi.",
    modelMarker:null
},
{
    id:"lab-pengukur-listrik",
    name:"Lab. Pengukur Listrik",
    buildingId:"laboratorium-ft",
    floor:2,
    units:["Teknik Elektro"],
    sharedLocationGroup:"lab-l2-elektro",
    navigationEntranceId:"lab-main-e1",
    description:"Laboratorium untuk mengenal dan menggunakan alat ukur listrik serta melakukan pengukuran tegangan, arus, hambatan, daya, dan besaran listrik lainnya.",
    modelMarker:null
},
{
    id:"lab-kontrol",
    name:"Lab. Kontrol",
    buildingId:"laboratorium-ft",
    floor:2,
    units:["Teknik Elektro"],
    sharedLocationGroup:"lab-l2-elektro",
    navigationEntranceId:"lab-main-e1",
    description:"Laboratorium untuk mempelajari sistem kendali dan otomasi seperti sensor, aktuator, kontrol digital, mikrokontroler, dan penerapan sistem pengaturan otomatis.",
    modelMarker:null
},
{
    id:"lab-dasar-elektronika",
    name:"Lab. Dasar Elektronika",
    buildingId:"laboratorium-ft",
    floor:2,
    units:["Teknik Elektro"],
    sharedLocationGroup:"lab-l2-elektro",
    navigationEntranceId:"lab-main-e1",
    description:"Laboratorium untuk mempelajari komponen dan rangkaian elektronika dasar seperti dioda, transistor, sensor, serta rangkaian analog dan digital.",
    modelMarker:null
},
{
    id:"lab-plc",
    name:"Lab. PLC",
    buildingId:"laboratorium-ft",
    floor:2,
    units:["Teknik Elektro"],
    sharedLocationGroup:"lab-l2-elektro",
    navigationEntranceId:"lab-main-e1",
    description:"Laboratorium untuk mempelajari Programable Logic Controller atau PLC, penggunaan sensor dan aktuator, serta pengendalian mesin dan sistem otomasi industri.",
    modelMarker:null
},
{
    id:"lab-instalasi",
    name:"Lab. Instalasi",
    buildingId:"laboratorium-ft",
    floor:2,
    units:["Teknik Elektro"],
    sharedLocationGroup:"lab-l2-elektro",
    navigationEntranceId:"lab-main-e1",
    description:"Laboratorium untuk praktik merancang, memasang, mengukur, dan menguji instalasi listrik seperti rangkaian penerangan, tenaga, dan kontrol.",
    modelMarker:null
},

/* LABORATORIUM LANTAI 3 */

{
    id:"ruang-kuliah-11",
    name:"Ruang Kuliah 11",
    buildingId:"laboratorium-ft",
    floor:3,
    units:["Teknik Mesin","Teknik Elektro"],
    navigationEntranceId:"lab-main-e1",
    description:"Ruang yang digunakan untuk kegiatan perkuliahan, diskusi kelas, presentasi, dan kegiatan pembelajaran mahasiswa.",
    modelMarker:null
},
{
    id:"ruang-kuliah-12",
    name:"Ruang Kuliah 12",
    buildingId:"laboratorium-ft",
    floor:3,
    units:["Teknik Mesin","Teknik Elektro"],
    navigationEntranceId:"lab-main-e1",
    description:"Ruang yang digunakan untuk kegiatan perkuliahan, diskusi kelas, presentasi, dan kegiatan pembelajaran mahasiswa.",
    modelMarker:null
},
{
    id:"ruang-kuliah-13",
    name:"Ruang Kuliah 13",
    buildingId:"laboratorium-ft",
    floor:3,
    units:["Teknik Mesin","Teknik Elektro"],
    navigationEntranceId:"lab-main-e1",
    description:"Ruang yang digunakan untuk kegiatan perkuliahan, diskusi kelas, presentasi, dan kegiatan pembelajaran mahasiswa.",
    modelMarker:null
},
{
    id:"lab-fisika-dasar",
    name:"Lab. Fisika Dasar",
    buildingId:"laboratorium-ft",
    floor:3,
    units:["Fakultas Teknik"],
    navigationEntranceId:"lab-main-e1",
    description:"Laboratorium untuk memahami konsep dasar fisika melalui eksperimen seperti mekanika, listrik, gelombang, optika, pengukuran, dan termodinamika.",
    modelMarker:null
},
{
    id:"lab-komputer-jaringan-mikro",
    name:"Lab. Komputer Jaringan Mikro",
    buildingId:"laboratorium-ft",
    floor:3,
    units:["Teknik Informatika"],
    navigationEntranceId:"lab-main-e1",
    description:"Laboratorium untuk praktik jaringan komputer seperti konfigurasi jaringan, router dan switch, komunikasi data, monitoring jaringan, serta pengembangan sistem berbasis komputer.",
    modelMarker:null
},
{
    id:"lab-menggambar",
    name:"Lab. Menggambar",
    buildingId:"laboratorium-ft",
    floor:3,
    units:["Teknik Mesin"],
    navigationEntranceId:"lab-main-e1",
    description:"Laboratorium untuk mempelajari gambar teknik dan gambar kerja, baik secara manual maupun menggunakan perangkat lunak CAD sebagai dasar perancangan teknik.",
    modelMarker:null
}

];

const people=[];

/* =========================================================
   NAVIGATION GRAPH
   TETAP DIPERTAHANKAN WALAUPUN NAVIGASI DIHIDE
========================================================= */

const mapNodes={
    GATE_MAIN:{x:61,y:488},
    NORTH_WEST:{x:97,y:198},
    NORTH_JUNCTION_A:{x:333,y:222},
    NORTH_JUNCTION_B:{x:397,y:217},
    GATE_EXIT:{x:390,y:31},
    NORTH_RIGHT:{x:744,y:230},
    PARKING_WEST:{x:165,y:492},
    PARKING_CENTER:{x:326,y:505},
    PARKING_SOUTHWEST:{x:283,y:555},
    PARKING_SOUTHEAST:{x:350,y:562},
    PARKING_EAST:{x:400,y:527},
    MOSQUE_EAST:{x:283,y:683},
    MOSQUE_SOUTHWEST:{x:198,y:817},
    MOSQUE_WEST:{x:83,y:804},
    COURT_TOP_LEFT:{x:505,y:356},
    COURT_TOP_RIGHT:{x:630,y:356},
    COURT_CENTER_LEFT:{x:495,y:527},
    COURT_CENTER_RIGHT:{x:631,y:527},
    COURT_BOTTOM_LEFT:{x:494,y:730},
    COURT_BOTTOM_RIGHT:{x:603,y:730},
    CLASS_LAB_WEST:{x:341,y:684},
    CLASS_LAB_CENTER:{x:421,y:686},
    LAB_WEST_LOWER:{x:341,y:944},
    LAB_SOUTH_CENTER:{x:460,y:944},
    E_SERBAGUNA:{x:644,y:210},
    E_LIBRARY:{x:691,y:356},
    E_BIRO:{x:640,y:527},
    E_CLASS:{x:462,y:685},
    E_LAB_MAIN:{x:384,y:686},
    E_LAB_WEST:{x:341,y:805},
    E_LAB_SOUTH:{x:460,y:953}
};

const mapEdges=[
    {id:"R01",from:"GATE_MAIN",to:"PARKING_WEST",points:[[61,488],[112,488],[165,492]]},
    {id:"R02",from:"PARKING_WEST",to:"PARKING_CENTER",points:[[165,492],[245,498],[326,505]]},
    {id:"R03",from:"PARKING_WEST",to:"PARKING_SOUTHWEST",points:[[165,492],[218,523],[283,555]]},
    {id:"R04",from:"PARKING_SOUTHWEST",to:"PARKING_CENTER",points:[[283,555],[326,505]]},
    {id:"R05",from:"PARKING_CENTER",to:"PARKING_SOUTHEAST",points:[[326,505],[350,562]]},
    {id:"R06",from:"PARKING_SOUTHEAST",to:"PARKING_EAST",points:[[350,562],[400,527]]},
    {id:"R07",from:"PARKING_CENTER",to:"PARKING_EAST",points:[[326,505],[400,527]]},
    {id:"R08",from:"NORTH_WEST",to:"NORTH_JUNCTION_A",points:[[97,198],[214,211],[333,222]]},
    {id:"R09",from:"NORTH_JUNCTION_A",to:"NORTH_JUNCTION_B",points:[[333,222],[397,217]]},
    {id:"R10",from:"NORTH_JUNCTION_B",to:"NORTH_RIGHT",points:[[397,217],[520,219],[644,210],[744,230]]},
    {id:"R11",from:"GATE_EXIT",to:"NORTH_JUNCTION_B",points:[[390,31],[393,111],[397,217]]},
    {id:"R12",from:"NORTH_JUNCTION_A",to:"PARKING_CENTER",points:[[333,222],[332,350],[326,505]]},
    {id:"R13",from:"NORTH_JUNCTION_B",to:"PARKING_EAST",points:[[397,217],[399,370],[400,527]]},
    {id:"R14",from:"NORTH_JUNCTION_B",to:"E_SERBAGUNA",points:[[397,217],[520,217],[644,210]]},
    {id:"R15",from:"E_SERBAGUNA",to:"NORTH_RIGHT",points:[[644,210],[700,219],[744,230]]},
    {id:"R16",from:"NORTH_RIGHT",to:"E_LIBRARY",points:[[744,230],[744,300],[744,356],[691,356]]},
    {id:"R17",from:"COURT_TOP_LEFT",to:"COURT_TOP_RIGHT",points:[[505,356],[568,356],[630,356]]},
    {id:"R18",from:"COURT_TOP_RIGHT",to:"E_LIBRARY",points:[[630,356],[691,356]]},
    {id:"R19",from:"PARKING_EAST",to:"COURT_TOP_LEFT",points:[[400,527],[449,441],[505,356]]},
    {id:"R20",from:"PARKING_EAST",to:"COURT_TOP_RIGHT",points:[[400,527],[518,442],[630,356]]},
    {id:"R21",from:"PARKING_EAST",to:"COURT_CENTER_LEFT",points:[[400,527],[495,527]]},
    {id:"R22",from:"COURT_CENTER_LEFT",to:"COURT_CENTER_RIGHT",points:[[495,527],[564,527],[631,527]]},
    {id:"R23",from:"COURT_CENTER_RIGHT",to:"E_BIRO",points:[[631,527],[640,527]]},
    {id:"R24",from:"COURT_TOP_LEFT",to:"COURT_CENTER_LEFT",points:[[505,356],[500,442],[495,527]]},
    {id:"R25",from:"COURT_TOP_RIGHT",to:"COURT_CENTER_RIGHT",points:[[630,356],[631,441],[631,527]]},
    {id:"R26",from:"COURT_CENTER_LEFT",to:"COURT_BOTTOM_LEFT",points:[[495,527],[495,625],[494,730]]},
    {id:"R27",from:"COURT_CENTER_RIGHT",to:"COURT_BOTTOM_RIGHT",points:[[631,527],[620,626],[603,730]]},
    {id:"R28",from:"COURT_BOTTOM_LEFT",to:"COURT_BOTTOM_RIGHT",points:[[494,730],[550,730],[603,730]]},
    {id:"R29",from:"PARKING_SOUTHWEST",to:"MOSQUE_EAST",points:[[283,555],[283,621],[283,683]]},
    {id:"R30",from:"PARKING_WEST",to:"MOSQUE_EAST",points:[[165,492],[222,580],[283,683]]},
    {id:"R31",from:"MOSQUE_EAST",to:"MOSQUE_SOUTHWEST",points:[[283,683],[241,751],[198,817]]},
    {id:"R32",from:"MOSQUE_SOUTHWEST",to:"MOSQUE_WEST",points:[[198,817],[138,812],[83,804]]},
    {id:"R33",from:"MOSQUE_EAST",to:"CLASS_LAB_WEST",points:[[283,683],[341,684]]},
    {id:"R34",from:"CLASS_LAB_WEST",to:"CLASS_LAB_CENTER",points:[[341,684],[381,685],[421,686]]},
    {id:"R35",from:"CLASS_LAB_CENTER",to:"E_CLASS",points:[[421,686],[462,685]]},
    {id:"R36",from:"CLASS_LAB_CENTER",to:"E_LAB_MAIN",points:[[421,686],[384,686]]},
    {id:"R37",from:"CLASS_LAB_WEST",to:"E_LAB_WEST",points:[[341,684],[341,744],[341,805]]},
    {id:"R38",from:"CLASS_LAB_WEST",to:"LAB_WEST_LOWER",points:[[341,684],[341,815],[341,944]]},
    {id:"R39",from:"LAB_WEST_LOWER",to:"LAB_SOUTH_CENTER",points:[[341,944],[400,944],[460,944]]},
    {id:"R40",from:"LAB_SOUTH_CENTER",to:"E_LAB_SOUTH",points:[[460,944],[460,953]]}
];

const mapCalibration=[];

/* HELPERS */

function getBuildingById(id){
    return buildings.find(building=>building.id===id)||null;
}
function getRoomById(id){
    return rooms.find(room=>room.id===id)||null;
}
function getEntranceById(id){
    return entrances.find(entrance=>entrance.id===id)||null;
}
function getBuildingModels(buildingId){
    const building=getBuildingById(buildingId);
    return building?building.models||[]:[];
}
function getModelVariant(buildingId,modelId){
    return getBuildingModels(buildingId)
        .find(model=>model.id===modelId)||null;
}
function getDefaultModelVariant(buildingId){
    const building=getBuildingById(buildingId);
    if(!building){return null;}
    return getModelVariant(buildingId,building.defaultModel)
        ||building.models[0]||null;
}
function getNavigationEntranceForLocation(location){
    if(!location){return null;}
    if(location.type==="room"&&location.navigationEntranceId){
        return getEntranceById(location.navigationEntranceId);
    }
    const building=getBuildingById(
        location.buildingId||location.id
    );
    if(!building){return null;}
    return getEntranceById(building.defaultEntranceId);
}

/* GLOBAL DATABASE */

window.FT_DATA={
    MAP_WIDTH,
    MAP_HEIGHT,
    NAVIGATION_MAP,
    FULL_DETAIL_REFERENCE,
    buildings,
    rooms,
    people,
    entrances,
    mapNodes,
    mapEdges,
    mapCalibration,
    getBuildingById,
    getRoomById,
    getEntranceById,
    getBuildingModels,
    getModelVariant,
    getDefaultModelVariant,
    getNavigationEntranceForLocation
};

})();
