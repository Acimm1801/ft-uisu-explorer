/* 5 gedung, 10 model, 54 ruangan. Data peta tetap disimpan. */
(function(){"use strict";
const MAP_WIDTH=768,MAP_HEIGHT=1024,NAVIGATION_MAP="./assets/maps/denah-v1.png",FULL_DETAIL_REFERENCE="./assets/maps/denah-full-detail.png";
const BIRO="biro-ft",KELAS="perkuliahan-ft",LAB="laboratorium-ft",PERPUS="perpustakaan-ft",SERBAGUNA="serbaguna-ft";
const TI="Teknik Informatika",TM="Teknik Mesin",TS="Teknik Sipil",TIN="Teknik Industri",TE="Teknik Elektro",FT="Fakultas Teknik";
const namaBiro="Biro Fakultas Teknik UISU",namaKelas="Gedung Perkuliahan Fakultas Teknik UISU",namaLab="Laboratorium Fakultas Teknik UISU",namaPerpus="Perpustakaan Fakultas Teknik UISU",namaSerbaguna="Ruang Serbaguna Fakultas Teknik UISU";
function model(id,name,file,title,description,orbit="0deg 75deg auto",extra={}){return{id,name,viewerTitle:title,src:"./assets/models/"+file+".glb",defaultCameraOrbit:orbit,defaultCameraTarget:"auto auto auto",defaultFieldOfView:"35deg",viewerDescription:description,...extra}}
function kontak(jabatan,file,name,phone){return{jabatan,photo:file?"./assets/images/tendik/"+file+".webp":"",name,phone}}
const buildings=[
{id:BIRO,modelMenuName:namaBiro,modelMenuOrder:1,name:namaBiro,shortName:"Biro FT",description:"Biro Fakultas Teknik UISU merupakan pusat pelayanan administrasi dan pengelolaan akademik fakultas, yang mencakup ruang pimpinan, program studi, dan tata usaha. Biro FT berada di lantai 2, satu gedung dengan Fakultas Agama Islam dan Fakultas Sastra.",actualFloor:2,floorCount:1,defaultEntranceId:"biro-main-e1",defaultModel:"indoor",liveMarker:{x:666,y:532},models:[
model("outdoor","Outdoor","gedung_biro_outdoor",namaBiro,"Model outdoor menampilkan bangunan tempat Biro Fakultas Teknik UISU berada di lantai 2, dengan Fakultas Agama Islam di lantai 1 dan Fakultas Sastra di lantai 3.","0deg 72deg auto"),
model("indoor","Indoor","gedung_biro_indoor",namaBiro,"Model indoor menampilkan interior Biro Fakultas Teknik UISU di lantai 2 beserta susunan ruangannya.","-35deg 68deg auto")
]},
{id:PERPUS,modelMenuName:namaPerpus,modelMenuOrder:5,name:namaPerpus,shortName:"Perpustakaan FT",description:"Ruang belajar dan mencari referensi yang menyediakan bahan bacaan serta sumber informasi untuk mendukung perkuliahan, tugas, dan penelitian skripsi mahasiswa.",actualFloor:1,floorCount:1,tendik:[kontak("Pegawai Pustaka","","Andrian Arif Siagian, ST","0851 7425 1128")],defaultEntranceId:"library-e1",defaultModel:"indoor",liveMarker:{x:686,y:249},models:[
model("indoor","Indoor","perpustakaan_indoor",namaPerpus,"Model indoor menampilkan interior Perpustakaan Fakultas Teknik UISU yang berada di lantai 1, pada gedung di sudut seberang lapangan.","-18deg 68deg auto")
]},
{id:SERBAGUNA,modelMenuName:namaSerbaguna,modelMenuOrder:4,name:namaSerbaguna,shortName:"Serbaguna FT",description:"Ruang yang digunakan untuk berbagai kegiatan fakultas seperti seminar, sidang, rapat, presentasi, pelatihan, kegiatan mahasiswa, dan acara akademik lainnya.",actualFloor:1,floorCount:1,tendik:[
kontak("Pegawai Kerumahtanggaan","gudang-mini-01","M.Hatta Hasibuan","-"),
kontak("Pegawai Kerumahtanggaan","","M.Apif Syahputra Hasibuan","0831 4006 5187")
],defaultEntranceId:"serbaguna-e1",defaultModel:"indoor",liveMarker:{x:644,y:121},models:[
model("indoor","Indoor","serbaguna_indoor",namaSerbaguna,"Model indoor menampilkan interior Ruang Serbaguna FT yang berada di lantai 1 pada gedung Fakultas Hukum.","-12deg 70deg auto")
]},
{id:KELAS,modelMenuName:namaKelas,modelMenuOrder:2,name:namaKelas,shortName:"Perkuliahan FT",description:"Gedung Perkuliahan Fakultas Teknik UISU merupakan fasilitas pembelajaran yang menyediakan ruang kelas untuk kegiatan perkuliahan, diskusi, dan aktivitas akademik mahasiswa. Area perkuliahan ini berada di lantai 3, tepat di seberang Biro Fakultas Teknik UISU.",actualFloor:3,floorCount:1,defaultEntranceId:"class-main-e1",defaultModel:"outdoor",liveMarker:{x:465,y:755},models:[
model("outdoor","Outdoor","gedung_perkuliahan_outdoor",namaKelas,"Model outdoor menampilkan bangunan tempat Gedung Perkuliahan Fakultas Teknik UISU berada di lantai 3, di seberang Biro Fakultas Teknik UISU.","0deg 72deg auto"),
model("indoor","Indoor","gedung_perkuliahan_indoor",namaKelas,"Model indoor menampilkan interior Gedung Perkuliahan Fakultas Teknik UISU di lantai 3, dari Ruang Kuliah 1 sampai Ruang Kuliah 8.")
]},
{id:LAB,modelMenuName:namaLab,modelMenuOrder:3,name:namaLab,shortName:"Laboratorium FT",description:"Laboratorium Fakultas Teknik UISU merupakan fasilitas praktikum dan penelitian yang menunjang pengembangan keterampilan serta penerapan ilmu teknik. Gedung ini terdiri dari tiga lantai dengan berbagai laboratorium sesuai bidang keilmuan program studi Fakultas Teknik.",actualFloor:null,floorCount:3,defaultEntranceId:"lab-main-e1",defaultModel:"outdoor",liveMarker:{x:386,y:850},models:[
model("outdoor","Outdoor","laboratorium_outdoor",namaLab,"Model outdoor menampilkan Laboratorium Fakultas Teknik UISU tiga lantai beserta area laboratorium dan ruang kuliah di dalamnya.","32deg 66deg auto"),
...[1,2,3].map(floor=>model("indoor-lt"+floor,"Indoor Lantai "+floor,"laboratorium_lt"+floor+"_indoor",namaLab,"Model indoor menampilkan interior lantai "+floor+" Laboratorium Fakultas Teknik UISU.","0deg 75deg auto",{mode:"indoor",floor}))
]}
];
const entrances=[
{id:"serbaguna-e1",buildingId:SERBAGUNA,name:"Entrance Ruang Serbaguna Fakultas Teknik UISU",floor:1,x:644,y:210,nodeId:"E_SERBAGUNA",deadEnd:true},
{id:"library-e1",buildingId:PERPUS,name:"Entrance Perpustakaan Fakultas Teknik UISU",floor:1,x:691,y:356,nodeId:"E_LIBRARY",deadEnd:true},
{id:"biro-main-e1",buildingId:BIRO,name:"Entrance Biro Fakultas Teknik UISU",floor:2,x:640,y:527,nodeId:"E_BIRO",deadEnd:false},
{id:"class-main-e1",buildingId:KELAS,name:"Entrance Gedung Perkuliahan Fakultas Teknik UISU",floor:3,x:462,y:685,nodeId:"E_CLASS",deadEnd:false},
{id:"lab-main-e1",buildingId:LAB,name:"Entrance Utama Laboratorium Fakultas Teknik UISU",floor:1,x:384,y:686,nodeId:"E_LAB_MAIN",deadEnd:false},
{id:"lab-west-e1",buildingId:LAB,name:"Entrance Barat Laboratorium Fakultas Teknik UISU",floor:1,x:341,y:805,nodeId:"E_LAB_WEST",deadEnd:true,accessOnly:["lab-hidrolika","lab-teknologi-mekanik"]},
{id:"lab-south-e1",buildingId:LAB,name:"Entrance Selatan Laboratorium Fakultas Teknik UISU",floor:1,x:460,y:953,nodeId:"E_LAB_SOUTH",deadEnd:true,accessOnly:["lab-jalan-raya","lab-beton","lab-mekanika-tanah","lab-ilmu-ukur-tanah"]}
];
function ruang(id,name,buildingId,floor,description,extra={}){return{id,name,buildingId,floor,...(buildingId===BIRO?{tendik:[]}:{}),navigationEntranceId:buildingId===BIRO?"biro-main-e1":buildingId===KELAS?"class-main-e1":"lab-main-e1",description,modelMarker:null,...extra}}
const deskripsiKuliah="Ruang yang digunakan untuk kegiatan perkuliahan, diskusi kelas, presentasi, dan kegiatan pembelajaran mahasiswa.";
function kuliah(n,buildingId,floor,units){return ruang("ruang-kuliah-"+n,"Ruang Kuliah "+n,buildingId,floor,deskripsiKuliah,{units})}
const rooms=[
ruang("ruang-dosen","Ruang Dosen",BIRO,2,"Ruang kerja dosen untuk menyiapkan kegiatan perkuliahan, berdiskusi, melakukan bimbingan, serta melayani kebutuhan akademik mahasiswa."),
ruang("gudang-mini","Gudang Mini",BIRO,2,"Ruang penyimpanan perlengkapan dan barang penunjang kegiatan operasional Fakultas Teknik.",{tendik:[kontak("Pegawai Kerumahtanggaan","gudang-mini-01","M.Hatta Hasibuan","-")]}),
ruang("prodi-industri","Program Studi Teknik Industri",BIRO,2,"Ruang pengelolaan akademik Program Studi Teknik Industri sekaligus tempat mahasiswa mendapatkan informasi dan layanan terkait perkuliahan, kurikulum, serta kegiatan prodi.",{tendik:[kontak("Ketua Program Studi","dekan-01","Ir. Hj. Darlina Tanjung, MT","085358710145"),kontak("Tata Usaha","","M. Fahmi Marzuqi Hsb, S.Pdi","0813 9670 7170")]}),
ruang("prodi-mesin","Program Studi Teknik Mesin",BIRO,2,"Ruang pengelolaan akademik Program Studi Teknik Mesin dan layanan mahasiswa terkait perkuliahan, kegiatan prodi, serta bidang keilmuan teknik mesin.",{tendik:[kontak("Ketua Program Studi","prodi-mesin-01","Ahmad Bakhori, ST, MT","081260660169"),kontak("Tata Usaha","prodi-mesin-02","Iskandar Nasution, ST","0813 7698 6090")]}),
ruang("prodi-sipil","Program Studi Teknik Sipil",BIRO,2,"Ruang pengelolaan akademik Program Studi Teknik Sipil dan layanan mahasiswa terkait perkuliahan, kegiatan prodi, serta bidang konstruksi dan infrastruktur.",{tendik:[kontak("Ketua Program Studi","prodi-sipil-01","Ir. Jupriah Sarifah, MT","081361756472"),kontak("Tata Usaha","prodi-sipil-02","Ismail Ahmad, S. Pd","0813 7600 4006")]}),
ruang("prodi-elektro","Program Studi Teknik Elektro",BIRO,2,"Ruang pengelolaan akademik Program Studi Teknik Elektro dan layanan mahasiswa terkait perkuliahan, kegiatan prodi, serta bidang kelistrikan dan elektronika.",{tendik:[kontak("Ketua Program Studi","prodi-elektro-01","-","-"),kontak("Tata Usaha","","Ir. Sudaryanto","0813 6146 1643")]}),
ruang("prodi-informatika","Program Studi Teknik Informatika",BIRO,2,"Ruang pengelolaan akademik Program Studi Teknik Informatika dan layanan mahasiswa terkait perkuliahan, kegiatan prodi, serta bidang komputasi dan teknologi informasi.",{tendik:[kontak("Ketua Program Studi","prodi-informatika-01","Mhd. Zulfansyuri S.,ST., M.Kom","082277150767"),kontak("Tata Usaha","prodi-informatika-02","Habibi Lubis, SE","0813 7636 4670")]}),
ruang("lpmf","Lembaga Penjamin Mutu Fakultas (LPMF)",BIRO,2,"Unit yang membantu menjaga dan meningkatkan mutu kegiatan akademik melalui pemantauan, evaluasi, dokumentasi mutu, dan persiapan akreditasi di tingkat fakultas."),
ruang("wakil-dekan-adi","Wakil Dekan Akademik dan Dakwah Islamiyah (WD-1 ADI)",BIRO,2,"Ruang Wakil Dekan bidang Akademik dan Dakwah Islamiyah yang membantu mengoordinasikan kegiatan akademik serta pelaksanaan nilai dan kegiatan dakwah Islamiyah di lingkungan fakultas.",{tendik:[kontak("Wakil Dekan Akademik dan Dakwah Islamiyah","wakil-dekan-adi-01","Dr. Hermansyah Alam, MT","081370082893")]}),
ruang("wakil-dekan-stk","Wakil Dekan Sumber Daya dan Tata Kelola (WD-2 STK)",BIRO,2,"Ruang Wakil Dekan bidang Sumber Daya dan Tata Kelola yang membantu mengelola sumber daya, administrasi, sarana, dan tata kelola fakultas.",{tendik:[kontak("Wakil Dekan Sumber Daya dan Tata Kelola","wakil-dekan-stk-01","Ir. Marwan Lubis, MT","081362333359")]}),
ruang("wakil-dekan-kak","Wakil Dekan Kewirausahaan, Alumni dan Kemahasiswaan (WD-3 KAK)",BIRO,2,"Ruang Wakil Dekan yang menangani kegiatan mahasiswa, hubungan dengan alumni, pengembangan kewirausahaan, serta berbagai kegiatan kemahasiswaan fakultas.",{tendik:[kontak("Wakil Dekan Kewirausahaan, Alumni dan Kemahasiswaan","wakil-dekan-kak-01","Ir. Bonar Harahap, MT","081375798333")]}),
ruang("dekan","Dekan",BIRO,2,"Ruang kerja pimpinan Fakultas Teknik yang mengoordinasikan kegiatan akademik, administrasi, pengembangan fakultas, serta pelaksanaan program kerja secara keseluruhan.",{tendik:[kontak("Dekan","dekan-01","Ir. Hj. Darlina Tanjung, MT","085358710145")]}),
ruang("loket-pembayaran","Loket Pembayaran Mahasiswa",BIRO,2,"Tempat mahasiswa memperoleh layanan dan informasi yang berkaitan dengan pembayaran serta administrasi keuangan perkuliahan.",{tendik:[kontak("Pegawai Administrasi Biro","","Indah Rahmawani","0813 6190 9369")]}),
ruang("kasubbag-keuangan","KaSubBag Keuangan",BIRO,2,"Ruang bagian yang menangani administrasi keuangan, anggaran, pembayaran, pencatatan, serta kebutuhan keuangan Fakultas Teknik.",{tendik:[kontak("Ka.Sub.Bag.Keuangan","kasubbag-keuangan-01","Leni Agustina, SE, M.AK","0812 6420 9456")]}),
ruang("kasubbag-akademik","KaSubBag Akademik IT dan Kerjasama",BIRO,2,"Ruang pengelolaan layanan akademik, dukungan sistem dan teknologi informasi, serta administrasi kegiatan kerja sama fakultas.",{tendik:[kontak("Ka.Sub.Bag.Akademik","kasubbag-akademik-01","M. Syahrial Syah, S.Kom","0813 9774 3354")]}),
ruang("kasubbag-kemahasiswaan","KaSubBag Kemahasiswaan",BIRO,2,"Ruang yang menangani administrasi dan layanan kegiatan mahasiswa, organisasi kemahasiswaan, prestasi, serta kebutuhan kemahasiswaan lainnya."),
ruang("kasubbag-siakad","KaSubBag SIAKAD",BIRO,2,"Ruang pengelolaan Sistem Informasi Akademik yang membantu menangani data mahasiswa, mata kuliah, nilai, jadwal, dan administrasi akademik berbasis sistem.",{tendik:[kontak("Operator Siakad","kasubbag-siakad-01","Rajuddin Siregar","0821 6140 0188")]}),
ruang("kasubbag-umum","KaSubBag Umum dan Perlengkapan Kerumahtanggaan",BIRO,2,"Ruang yang menangani kebutuhan umum, perlengkapan, fasilitas, inventaris, dan berbagai kebutuhan operasional Fakultas Teknik.",{tendik:[kontak("Ka.Sub.Bag.Umum Perlengkapan & Kerumahtanggaan","kasubbag-umum-01","Fadil Habib Nasution, ST, M.Kom","0853 7030 7502")]}),
ruang("kepala-tata-usaha-ktu","Kepala Tata Usaha-KTU",BIRO,2,"Ruang Kepala Tata Usaha yang mengoordinasikan layanan administrasi, akademik, keuangan, dokumen, sarana, dan kegiatan tata usaha fakultas.",{tendik:[kontak("Kepala Tata Usaha","kepala-tata-usaha-ktu-01","Zulfan AZ, S. Hi, M.H","0812 6809 4324")]}),
...[1,2,3,4,5,6,7,8].map(n=>kuliah(n,KELAS,3,[n<=4?TS:TI])),
ruang("lab-hidrolika","Lab. Hidrolika",LAB,1,"Laboratorium untuk mempelajari perilaku dan aliran air melalui praktikum seperti pengukuran debit, tekanan, saluran terbuka, dan berbagai fenomena hidrolika.",{units:[TS],sharedLocationGroup:"lab-l1-hidrolika-teknologi-mekanik",navigationEntranceId:"lab-west-e1"}),
ruang("lab-teknologi-mekanik","Lab. Teknologi Mekanik",LAB,1,"Laboratorium untuk praktik proses manufaktur dan pengerjaan material menggunakan berbagai mesin seperti bubut, milling, bor, dan peralatan mekanik lainnya.",{units:[TM],sharedLocationGroup:"lab-l1-hidrolika-teknologi-mekanik",navigationEntranceId:"lab-west-e1"}),
ruang("lab-beton","Lab. Beton",LAB,1,"Laboratorium untuk praktikum dan pengujian bahan beton, semen, agregat, campuran beton, serta pengujian kekuatan material konstruksi.",{units:[TS],sharedLocationGroup:"lab-l1-beton-jalan-raya",navigationEntranceId:"lab-south-e1"}),
ruang("lab-jalan-raya","Lab. Jalan Raya",LAB,1,"Laboratorium untuk mempelajari serta menguji material perkerasan jalan seperti agregat dan aspal dalam kegiatan praktikum maupun penelitian.",{units:[TS],sharedLocationGroup:"lab-l1-beton-jalan-raya",navigationEntranceId:"lab-south-e1"}),
ruang("lab-mekanika-tanah","Lab. Mekanika Tanah",LAB,1,"Laboratorium untuk mempelajari karakteristik dan daya dukung tanah melalui pengujian kadar air, pemadatan, CBR, geser tanah, dan pengujian geoteknik lainnya.",{units:[TS],sharedLocationGroup:"lab-l1-mekanika-tanah-ilmu-ukur-tanah",navigationEntranceId:"lab-south-e1"}),
ruang("lab-ilmu-ukur-tanah","Lab. Ilmu Ukur Tanah",LAB,1,"Laboratorium yang mendukung kegiatan survei dan pemetaan, seperti pengukuran luas, kontur, elevasi, serta penggunaan alat ukur lapangan.",{units:[TS],sharedLocationGroup:"lab-l1-mekanika-tanah-ilmu-ukur-tanah",navigationEntranceId:"lab-south-e1"}),
kuliah(9,LAB,2,[TIN]),kuliah(10,LAB,2,[TIN]),
ruang("lab-fondry","Lab. Fondry",LAB,2,"Laboratorium untuk mempelajari proses pengecoran logam, mulai dari persiapan cetakan dan material hingga proses peleburan, penuangan, dan pemeriksaan hasil cor.",{units:[TIN]}),
ruang("lab-komputasi","Lab. Komputasi",LAB,2,"Laboratorium berbasis komputer yang digunakan untuk praktikum, pemodelan, simulasi, pengolahan data, serta penggunaan perangkat lunak pendukung bidang teknik.",{units:[FT],sharedLocationGroup:"lab-l2-komputasi-sistem-digital"}),
ruang("lab-sistem-digital","Lab. Sistem Digital",LAB,2,"Laboratorium untuk mempelajari dasar sistem digital, logika digital, rangkaian digital, serta penerapannya pada perangkat dan sistem komputasi.",{units:[TI],sharedLocationGroup:"lab-l2-komputasi-sistem-digital"}),
ruang("lab-terintegrasi","Lab. Terintegrasi",LAB,2,"Laboratorium untuk praktikum Teknik Industri yang menggabungkan beberapa bidang keilmuan dalam satu rangkaian proses perancangan, analisis, dan penyelesaian masalah industri.",{units:[TIN],sharedLocationGroup:"lab-l2-terintegrasi-faktor-manusia-sistem-produksi"}),
ruang("lab-faktor-manusia","Lab. Teknik Faktor Manusia",LAB,2,"Laboratorium untuk mempelajari hubungan manusia dengan sistem kerja, termasuk ergonomi, antropometri, beban kerja, lingkungan kerja, dan keselamatan kerja.",{units:[TIN],sharedLocationGroup:"lab-l2-terintegrasi-faktor-manusia-sistem-produksi"}),
ruang("lab-sistem-produksi","Lab. Sistem Produksi",LAB,2,"Laboratorium untuk mempelajari perencanaan dan pengendalian produksi, penjadwalan, tata letak fasilitas, keseimbangan lini, serta peningkatan efisiensi proses produksi.",{units:[TIN],sharedLocationGroup:"lab-l2-terintegrasi-faktor-manusia-sistem-produksi"}),
ruang("lab-rangkaian-listrik","Lab. Rangkaian Listrik",LAB,2,"Laboratorium untuk memahami dasar rangkaian listrik melalui praktik pengukuran tegangan, arus, daya, serta analisis berbagai konfigurasi rangkaian.",{units:[TE],sharedLocationGroup:"lab-l2-elektro"}),
ruang("lab-dasar-telekomunikasi","Lab. Dasar Sistem Telekomunikasi",LAB,2,"Laboratorium untuk mempelajari dasar pengiriman dan penerimaan informasi melalui sinyal, sistem komunikasi, dan perangkat telekomunikasi.",{units:[TE],sharedLocationGroup:"lab-l2-elektro"}),
ruang("lab-pengukur-listrik","Lab. Pengukur Listrik",LAB,2,"Laboratorium untuk mengenal dan menggunakan alat ukur listrik serta melakukan pengukuran tegangan, arus, hambatan, daya, dan besaran listrik lainnya.",{units:[TE],sharedLocationGroup:"lab-l2-elektro"}),
ruang("lab-kontrol","Lab. Kontrol",LAB,2,"Laboratorium untuk mempelajari sistem kendali dan otomasi seperti sensor, aktuator, kontrol digital, mikrokontroler, dan penerapan sistem pengaturan otomatis.",{units:[TE],sharedLocationGroup:"lab-l2-elektro"}),
ruang("lab-dasar-elektronika","Lab. Dasar Elektronika",LAB,2,"Laboratorium untuk mempelajari komponen dan rangkaian elektronika dasar seperti dioda, transistor, sensor, serta rangkaian analog dan digital.",{units:[TE],sharedLocationGroup:"lab-l2-elektro"}),
ruang("lab-plc","Lab. PLC",LAB,2,"Laboratorium untuk mempelajari Programable Logic Controller atau PLC, penggunaan sensor dan aktuator, serta pengendalian mesin dan sistem otomasi industri.",{units:[TE],sharedLocationGroup:"lab-l2-elektro"}),
ruang("lab-instalasi","Lab. Instalasi",LAB,2,"Laboratorium untuk praktik merancang, memasang, mengukur, dan menguji instalasi listrik seperti rangkaian penerangan, tenaga, dan kontrol.",{units:[TE],sharedLocationGroup:"lab-l2-elektro"}),
kuliah(11,LAB,3,[TM,TE]),kuliah(12,LAB,3,[TM,TE]),kuliah(13,LAB,3,[TM,TE]),
ruang("lab-fisika-dasar","Lab. Fisika Dasar",LAB,3,"Laboratorium untuk memahami konsep dasar fisika melalui eksperimen seperti mekanika, listrik, gelombang, optika, pengukuran, dan termodinamika.",{units:[FT]}),
ruang("lab-komputer-jaringan-mikro","Lab. Komputer Jaringan Mikro",LAB,3,"Laboratorium untuk praktik jaringan komputer seperti konfigurasi jaringan, router dan switch, komunikasi data, monitoring jaringan, serta pengembangan sistem berbasis komputer.",{units:[TI]}),
ruang("lab-menggambar","Lab. Menggambar",LAB,3,"Laboratorium untuk mempelajari gambar teknik dan gambar kerja, baik secara manual maupun menggunakan perangkat lunak CAD sebagai dasar perancangan teknik.",{units:[TM]})
];
const people=[],mapCalibration=[];
const mapNodes={
GATE_MAIN:{x:61,y:488},NORTH_WEST:{x:97,y:198},NORTH_JUNCTION_A:{x:333,y:222},NORTH_JUNCTION_B:{x:397,y:217},GATE_EXIT:{x:390,y:31},NORTH_RIGHT:{x:744,y:230},
PARKING_WEST:{x:165,y:492},PARKING_CENTER:{x:326,y:505},PARKING_SOUTHWEST:{x:283,y:555},PARKING_SOUTHEAST:{x:350,y:562},PARKING_EAST:{x:400,y:527},
MOSQUE_EAST:{x:283,y:683},MOSQUE_SOUTHWEST:{x:198,y:817},MOSQUE_WEST:{x:83,y:804},COURT_TOP_LEFT:{x:505,y:356},COURT_TOP_RIGHT:{x:630,y:356},COURT_CENTER_LEFT:{x:495,y:527},COURT_CENTER_RIGHT:{x:631,y:527},COURT_BOTTOM_LEFT:{x:494,y:730},COURT_BOTTOM_RIGHT:{x:603,y:730},
CLASS_LAB_WEST:{x:341,y:684},CLASS_LAB_CENTER:{x:421,y:686},LAB_WEST_LOWER:{x:341,y:944},LAB_SOUTH_CENTER:{x:460,y:944},
E_SERBAGUNA:{x:644,y:210},E_LIBRARY:{x:691,y:356},E_BIRO:{x:640,y:527},E_CLASS:{x:462,y:685},E_LAB_MAIN:{x:384,y:686},E_LAB_WEST:{x:341,y:805},E_LAB_SOUTH:{x:460,y:953}
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
const getBuildingById=id=>buildings.find(b=>b.id===id)||null,getRoomById=id=>rooms.find(r=>r.id===id)||null,getEntranceById=id=>entrances.find(e=>e.id===id)||null;
function getBuildingModels(id){return getBuildingById(id)?.models||[]}
function getModelVariant(id,variant){return getBuildingModels(id).find(m=>m.id===variant)||null}
function getDefaultModelVariant(id){const b=getBuildingById(id);return b&&(getModelVariant(id,b.defaultModel)||b.models?.[0])||null}
function getNavigationEntranceForLocation(location){if(!location)return null;if(location.type==="room"&&location.navigationEntranceId)return getEntranceById(location.navigationEntranceId);const b=getBuildingById(location.buildingId||location.id);return b?getEntranceById(b.defaultEntranceId):null}
window.FT_DATA={MAP_WIDTH,MAP_HEIGHT,NAVIGATION_MAP,FULL_DETAIL_REFERENCE,buildings,rooms,people,entrances,mapNodes,mapEdges,mapCalibration,getBuildingById,getRoomById,getEntranceById,getBuildingModels,getModelVariant,getDefaultModelVariant,getNavigationEntranceForLocation};
})();
