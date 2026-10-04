/* =========================================================
   FT UISU EXPLORER - MAP DATA v12
   Fokus: Navigasi outdoor Fakultas Teknik UISU

   Denah tampilan  : Denah V1 (bersih, hanya logo/nama lokasi)
   Denah referensi : Denah V3 (jaringan jalur & entrance)
   Contoh hasil    : Denah V2 (rute aktif ke Perpustakaan)

   Sistem koordinat memakai kanvas 1400 x 787 agar posisi
   tetap konsisten di desktop maupun mobile.
========================================================= */

export const MAP_WIDTH = 1400;
export const MAP_HEIGHT = 787;

export const buildings = [
  {
    id: "biro-ft",
    name: "Gedung Biro Fakultas Teknik",
    shortName: "Biro FT",
    description:
      "Gedung Biro Fakultas Teknik berada di lantai 2 pada gedung yang sama dengan Fakultas Agama Islam di lantai 1 dan Fakultas Sastra di lantai 3.",
    actualFloor: 2,
    floorCount: 1,
    mapMarker: { x: 879, y: 397 },
    entrances: [
      { id: "biro-main", x: 854, y: 378 }
    ],
    modelPath: "./assets/models/biro-fakultas-teknik.glb"
  },
  {
    id: "perpustakaan-ft",
    name: "Perpustakaan Fakultas Teknik",
    shortName: "Perpustakaan FT",
    description:
      "Perpustakaan Fakultas Teknik berada di lantai 1 pada gedung yang berbeda dan terletak di sudut seberang lapangan.",
    actualFloor: 1,
    floorCount: 1,
    mapMarker: { x: 888, y: 214 },
    entrances: [
      { id: "library-main", x: 886, y: 261 }
    ],
    modelPath: null
  },
  {
    id: "serbaguna-ft",
    name: "Gedung Serbaguna Fakultas Teknik",
    shortName: "Serbaguna FT",
    description:
      "Gedung Serbaguna Fakultas Teknik berada di lantai 1 pada gedung yang berbeda, yaitu gedung Fakultas Hukum.",
    actualFloor: 1,
    floorCount: 1,
    mapMarker: { x: 848, y: 126 },
    entrances: [
      { id: "serbaguna-main", x: 845, y: 186 }
    ],
    modelPath: null
  },
  {
    id: "perkuliahan-ft",
    name: "Gedung Perkuliahan Fakultas Teknik",
    shortName: "Perkuliahan FT",
    description:
      "Gedung Perkuliahan Fakultas Teknik berada di lantai 3 pada gedung yang terletak di seberang Gedung Biro Fakultas Teknik.",
    actualFloor: 3,
    floorCount: 1,
    mapMarker: { x: 709, y: 492 },
    entrances: [
      { id: "class-main", x: 692, y: 378 }
    ],
    modelPath: null
  },
  {
    id: "laboratorium-ft",
    name: "Gedung Laboratorium Fakultas Teknik",
    shortName: "Laboratorium FT",
    description:
      "Gedung Laboratorium Fakultas Teknik terdiri dari tiga lantai dan berada di dekat Gedung Perkuliahan Fakultas Teknik.",
    actualFloor: null,
    floorCount: 3,
    mapMarker: { x: 646, y: 563 },
    entrances: [
      { id: "lab-west", x: 624, y: 573 },
      { id: "lab-south", x: 752, y: 626 }
    ],
    modelPath: null
  }
];

export const rooms = [
  // GEDUNG BIRO FT - LANTAI 2
  { id: "gudang-mini", name: "Gudang Mini", buildingId: "biro-ft", floor: 2 },
  { id: "prodi-industri", name: "Program Studi Teknik Industri", buildingId: "biro-ft", floor: 2 },
  { id: "prodi-mesin", name: "Program Studi Teknik Mesin", buildingId: "biro-ft", floor: 2 },
  { id: "prodi-sipil", name: "Program Studi Teknik Sipil", buildingId: "biro-ft", floor: 2 },
  { id: "prodi-informatika", name: "Program Studi Teknik Informatika", buildingId: "biro-ft", floor: 2 },
  { id: "prodi-elektro", name: "Program Studi Teknik Elektro", buildingId: "biro-ft", floor: 2 },
  { id: "lpmf", name: "LPMF", buildingId: "biro-ft", floor: 2 },
  { id: "wd3-kak", name: "WD3-KAK", buildingId: "biro-ft", floor: 2 },
  { id: "wd2-stk", name: "WD2-STK", buildingId: "biro-ft", floor: 2 },
  { id: "wd1-adi", name: "WD1-ADI", buildingId: "biro-ft", floor: 2 },
  { id: "ruang-dekan", name: "Ruang Dekan", buildingId: "biro-ft", floor: 2 },
  { id: "loket-pembayaran", name: "Loket Pembayaran Mahasiswa", buildingId: "biro-ft", floor: 2 },
  { id: "kasubbag-akademik", name: "KaSubBag Akademik IT dan Kerjasama", buildingId: "biro-ft", floor: 2 },
  { id: "kasubbag-keuangan", name: "KaSubBag Keuangan", buildingId: "biro-ft", floor: 2 },
  { id: "kasubbag-kemahasiswaan", name: "KaSubBag Kemahasiswaan", buildingId: "biro-ft", floor: 2 },
  { id: "kasubbag-siakad", name: "KaSubBag SIAKAD", buildingId: "biro-ft", floor: 2 },
  { id: "ktu", name: "KTU", buildingId: "biro-ft", floor: 2 },
  { id: "kasubbag-umum", name: "KaSubBag Umum Perlengkapan Kerumahtanggaan", buildingId: "biro-ft", floor: 2 },
  { id: "mushola", name: "Mushola", buildingId: "biro-ft", floor: 2 },
  { id: "dapur", name: "Dapur", buildingId: "biro-ft", floor: 2 },
  { id: "toilet-biro", name: "Toilet", buildingId: "biro-ft", floor: 2 },

  // GEDUNG PERKULIAHAN FT - LANTAI 3
  { id: "ruang-kuliah-1", name: "Ruang Kuliah 1", buildingId: "perkuliahan-ft", floor: 3 },
  { id: "ruang-kuliah-2", name: "Ruang Kuliah 2", buildingId: "perkuliahan-ft", floor: 3 },
  { id: "ruang-kuliah-3", name: "Ruang Kuliah 3", buildingId: "perkuliahan-ft", floor: 3 },
  { id: "ruang-kuliah-4", name: "Ruang Kuliah 4", buildingId: "perkuliahan-ft", floor: 3 },
  { id: "ruang-kuliah-5", name: "Ruang Kuliah 5", buildingId: "perkuliahan-ft", floor: 3 },
  { id: "ruang-kuliah-6", name: "Ruang Kuliah 6", buildingId: "perkuliahan-ft", floor: 3 },
  { id: "ruang-kuliah-7", name: "Ruang Kuliah 7", buildingId: "perkuliahan-ft", floor: 3 },
  { id: "ruang-kuliah-8", name: "Ruang Kuliah 8", buildingId: "perkuliahan-ft", floor: 3 },

  // GEDUNG LABORATORIUM FT - LANTAI 1
  { id: "lab-foundry", name: "Lab. Foundry", buildingId: "laboratorium-ft", floor: 1 },
  { id: "lab-teknologi-mekanik", name: "Lab. Teknologi Mekanik", buildingId: "laboratorium-ft", floor: 1 },
  { id: "lab-beton", name: "Lab. Beton", buildingId: "laboratorium-ft", floor: 1 },
  { id: "lab-mekanika-tanah", name: "Lab. Mekanika Tanah", buildingId: "laboratorium-ft", floor: 1 },
  { id: "lab-jalan-raya", name: "Lab. Jalan Raya", buildingId: "laboratorium-ft", floor: 1 },
  { id: "lab-hidrolika", name: "Lab. Hidrolika", buildingId: "laboratorium-ft", floor: 1 },

  // GEDUNG LABORATORIUM FT - LANTAI 2
  { id: "lab-rangkaian-listrik", name: "Lab. Rangkaian Listrik", buildingId: "laboratorium-ft", floor: 2 },
  { id: "lab-dasar-elektronika", name: "Lab. Dasar Elektronika", buildingId: "laboratorium-ft", floor: 2 },
  { id: "lab-sistem-pengukuran", name: "Lab. Sistem Pengukuran", buildingId: "laboratorium-ft", floor: 2 },
  { id: "lab-pengukuran-listrik", name: "Lab. Pengukuran Listrik", buildingId: "laboratorium-ft", floor: 2 },
  { id: "lab-dasar-telekomunikasi", name: "Lab. Dasar Sistem Telekomunikasi", buildingId: "laboratorium-ft", floor: 2 },
  { id: "lab-ilmu-ukur-tanah", name: "Lab. Ilmu Ukur Tanah", buildingId: "laboratorium-ft", floor: 2 },
  { id: "lab-komputasi", name: "Lab. Komputasi", buildingId: "laboratorium-ft", floor: 2 },
  { id: "lab-pengukuran-statistik", name: "Lab. Pengukuran & Statistik", buildingId: "laboratorium-ft", floor: 2 },
  { id: "lab-faktor-manusia", name: "Lab. Teknik Faktor Manusia", buildingId: "laboratorium-ft", floor: 2 },
  { id: "lab-jaringan-komputer-mikro", name: "Lab. Jaringan Komputer Mikro", buildingId: "laboratorium-ft", floor: 2 },
  { id: "ruang-kuliah-9", name: "Ruang Kuliah 9", buildingId: "laboratorium-ft", floor: 2 },
  { id: "ruang-kuliah-10", name: "Ruang Kuliah 10", buildingId: "laboratorium-ft", floor: 2 },

  // GEDUNG LABORATORIUM FT - LANTAI 3
  { id: "ruang-kuliah-11", name: "Ruang Kuliah 11", buildingId: "laboratorium-ft", floor: 3 },
  { id: "ruang-kuliah-12", name: "Ruang Kuliah 12", buildingId: "laboratorium-ft", floor: 3 },
  { id: "ruang-kuliah-13", name: "Ruang Kuliah 13", buildingId: "laboratorium-ft", floor: 3 },
  { id: "lab-sistem-digital", name: "Lab. Sistem Digital", buildingId: "laboratorium-ft", floor: 3 },
  { id: "lab-teknik-produksi", name: "Lab. Teknik Produksi", buildingId: "laboratorium-ft", floor: 3 },
  { id: "lab-menggambar", name: "Lab. Menggambar", buildingId: "laboratorium-ft", floor: 3 }
];

/* =========================================================
   JARINGAN JALAN INTERNAL
   Catatan: jaringan ini TIDAK pernah digambar seluruhnya ke
   pengguna. Ia hanya dipakai untuk menghitung rute aktif.

   Koordinat diambil dari jalur hijau Denah V3. Tiap edge
   menyimpan polyline agar rute mengikuti belokan asli.
========================================================= */

export const routeNodes = {
  N0:  { x: 664.0, y: 106.0 },
  N1:  { x: 660.8, y: 186.0 },
  N2:  { x: 747.3, y: 261.3 },
  N3:  { x: 876.2, y: 267.0 },
  N4:  { x: 367.0, y: 351.0 },
  N5:  { x: 500.0, y: 361.2 },
  N6:  { x: 624.0, y: 370.2 },
  N7:  { x: 650.0, y: 370.8 },
  N8:  { x: 670.0, y: 372.2 },
  N9:  { x: 746.0, y: 375.0 },
  N10: { x: 754.7, y: 374.7 },
  N11: { x: 618.5, y: 470.0 },
  N12: { x: 648.0, y: 470.2 },
  N13: { x: 647.0, y: 480.0 },
  N14: { x: 833.8, y: 500.0 },
  N15: { x: 613.3, y: 572.7 },
  N16: { x: 623.0, y: 572.0 },
  N17: { x: 753.0, y: 628.0 },
  N18: { x: 751.7, y: 638.7 }
};

export const routeEdges = [
  { id: "E01", from: "N0", to: "N1", points: [[664,106],[661,185]] },
  { id: "E02", from: "N1", to: "N7", points: [[660,187],[650,370]] },
  { id: "E03", from: "N1", to: "N3", points: [[662,186],[855,190],[938,196],[941,200],[941,266],[937,269],[877,267]] },
  { id: "E04", from: "N2", to: "N9", points: [[747,262],[746,374]] },
  { id: "E05", from: "N2", to: "N3", points: [[747,261],[876,266]] },
  { id: "E06", from: "N3", to: "N10", points: [[876,268],[755,374]] },
  { id: "E07", from: "N4", to: "N5", points: [[367,351],[499,361]] },
  { id: "E08", from: "N5", to: "N11", points: [[500,362],[572,470],[617,470]] },
  { id: "E09", from: "N5", to: "N6", points: [[501,361],[623,370]] },
  { id: "E10", from: "N6", to: "N7", points: [[625,370],[649,371]] },
  { id: "E11", from: "N6", to: "N11", points: [[624,371],[619,469]] },
  { id: "E12", from: "N7", to: "N8", points: [[651,371],[669,372]] },
  { id: "E13", from: "N8", to: "N9", points: [[671,372],[745,375]] },
  { id: "E14", from: "N8", to: "N12", points: [[670,373],[672,469],[649,470]] },
  { id: "E15", from: "N9", to: "N10", points: [[747,376],[754,375]] },
  { id: "E16", from: "N9", to: "N14", points: [[747,376],[745,495],[833,500]] },
  { id: "E17", from: "N10", to: "N14", points: [[755,375],[847,381],[834,499]] },
  { id: "E18", from: "N11", to: "N15", points: [[618,471],[613,572]] },
  { id: "E19", from: "N11", to: "N12", points: [[620,470],[647,470]] },
  { id: "E20", from: "N12", to: "N13", points: [[648,471],[647,480]] },
  { id: "E21", from: "N14", to: "N18", points: [[834,501],[818,640],[809,643],[752,639]] },
  { id: "E22", from: "N15", to: "N18", points: [[613,573],[612,632],[751,639]] },
  { id: "E23", from: "N15", to: "N16", points: [[614,573],[623,572]] },
  { id: "E24", from: "N17", to: "N18", points: [[753,628],[752,638]] }
];

export function getBuildingById(id) {
  return buildings.find((building) => building.id === id) || null;
}

export function getRoomById(id) {
  return rooms.find((room) => room.id === id) || null;
}
