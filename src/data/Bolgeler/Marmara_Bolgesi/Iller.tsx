// Marmara Bölgesi İlleri
// Format: ID | İsim | Parent_ID | Durum
// ID Başlangıç: 100001

export const MarmaraIlleri = [
  {
    id: 100001,
    name: "İstanbul",
    parent: "Marmara",
    status: "aktif"
  },
  {
    id: 100002,
    name: "Bursa",
    parent: "Marmara", 
    status: "aktif"
  },
  {
    id: 100003,
    name: "Balıkesir",
    parent: "Marmara",
    status: "aktif"
  },
  {
    id: 100004,
    name: "Çanakkale",
    parent: "Marmara",
    status: "aktif"
  },
  {
    id: 100005,
    name: "Edirne",
    parent: "Marmara",
    status: "aktif"
  },
  {
    id: 100006,
    name: "Kırklareli",
    parent: "Marmara",
    status: "aktif"
  },
  {
    id: 100007,
    name: "Tekirdağ",
    parent: "Marmara",
    status: "aktif"
  },
  {
    id: 100008,
    name: "Yalova",
    parent: "Marmara",
    status: "aktif"
  },
  {
    id: 100009,
    name: "Sakarya",
    parent: "Marmara",
    status: "aktif"
  },
  {
    id: 100010,
    name: "Kocaeli",
    parent: "Marmara",
    status: "aktif"
  },
  {
    id: 100011,
    name: "Bilecik",
    parent: "Marmara",
    status: "aktif"
  }
];

// TXT Format (Manual Reference)
/*
100001 | İstanbul | Marmara | aktif
100002 | Bursa | Marmara | aktif
100003 | Balıkesir | Marmara | aktif
100004 | Çanakkale | Marmara | aktif
100005 | Edirne | Marmara | aktif
100006 | Kırklareli | Marmara | aktif
100007 | Tekirdağ | Marmara | aktif
100008 | Yalova | Marmara | aktif
100009 | Sakarya | Marmara | aktif
100010 | Kocaeli | Marmara | aktif
100011 | Bilecik | Marmara | aktif
*/

// İl Sayısı: 11
// Sonraki ID: 100012
export const NEXT_ID = 100012; 