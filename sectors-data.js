/**
 * sectors-data.js
 * Referensi statis klasifikasi saham IDX: sektor (mengikuti IDX-IC 2021),
 * sub-sektor, dan grup/konglomerasi (hanya ditandai jika kepemilikan grup
 * memang luas diketahui publik — selain itu dibiarkan "Publik / Independen"
 * supaya tidak menampilkan klaim kepemilikan yang tidak pasti).
 *
 * Silakan tambah baris baru mengikuti format yang sama untuk memperluas
 * watchlist. Field:
 *  t   = ticker (tanpa suffix .JK)
 *  n   = nama emiten (singkat)
 *  s   = sektor (IDX-IC)
 *  sub = sub-sektor
 *  g   = grup / konglomerasi (atau "Publik / Independen" / "BUMN")
 */
const IDX_WATCHLIST = [
  // ==== Financials - Perbankan ====
  { t:"BBCA", n:"Bank Central Asia",      s:"Financials", sub:"Bank", g:"Djarum / Hartono" },
  { t:"BBRI", n:"Bank Rakyat Indonesia",  s:"Financials", sub:"Bank", g:"BUMN" },
  { t:"BMRI", n:"Bank Mandiri",           s:"Financials", sub:"Bank", g:"BUMN" },
  { t:"BBNI", n:"Bank Negara Indonesia",  s:"Financials", sub:"Bank", g:"BUMN" },
  { t:"BBTN", n:"Bank Tabungan Negara",   s:"Financials", sub:"Bank", g:"BUMN" },
  { t:"BRIS", n:"Bank Syariah Indonesia", s:"Financials", sub:"Bank", g:"BUMN" },
  { t:"ARTO", n:"Bank Jago",              s:"Financials", sub:"Bank Digital", g:"Publik / Independen" },
  { t:"BJBR", n:"Bank Jabar Banten",      s:"Financials", sub:"Bank", g:"Pemda" },
  { t:"BJTM", n:"Bank Jatim",             s:"Financials", sub:"Bank", g:"Pemda" },
  { t:"BNGA", n:"Bank CIMB Niaga",        s:"Financials", sub:"Bank", g:"CIMB Group" },
  { t:"NISP", n:"Bank OCBC NISP",         s:"Financials", sub:"Bank", g:"OCBC Group" },
  { t:"PNBN", n:"Bank Pan Indonesia",     s:"Financials", sub:"Bank", g:"Panin / Gunawan" },
  { t:"MEGA", n:"Bank Mega",              s:"Financials", sub:"Bank", g:"CT Corp" },
  { t:"BNLI", n:"Bank Permata",           s:"Financials", sub:"Bank", g:"Bangkok Bank" },
  { t:"AMAR", n:"Bank Amar Indonesia",    s:"Financials", sub:"Bank Digital", g:"Publik / Independen" },
  // ==== Financials - Multifinance & Sekuritas ====
  { t:"BFIN", n:"BFI Finance",            s:"Financials", sub:"Multifinance", g:"Publik / Independen" },
  { t:"ADMF", n:"Adira Dinamika Multifinance", s:"Financials", sub:"Multifinance", g:"Astra Group" },
  { t:"MFIN", n:"Mandala Multifinance",   s:"Financials", sub:"Multifinance", g:"Publik / Independen" },
  // ==== Consumer Non-Cyclicals ====
  { t:"UNVR", n:"Unilever Indonesia",     s:"Consumer Non-Cyclicals", sub:"Personal Care", g:"Unilever Global" },
  { t:"ICBP", n:"Indofood CBP",           s:"Consumer Non-Cyclicals", sub:"Makanan & Minuman", g:"Salim Group" },
  { t:"INDF", n:"Indofood Sukses Makmur", s:"Consumer Non-Cyclicals", sub:"Makanan & Minuman", g:"Salim Group" },
  { t:"MYOR", n:"Mayora Indah",           s:"Consumer Non-Cyclicals", sub:"Makanan & Minuman", g:"Mayora Group" },
  { t:"GGRM", n:"Gudang Garam",           s:"Consumer Non-Cyclicals", sub:"Rokok", g:"Wonowidjojo" },
  { t:"HMSP", n:"HM Sampoerna",           s:"Consumer Non-Cyclicals", sub:"Rokok", g:"Philip Morris Intl" },
  { t:"KLBF", n:"Kalbe Farma",            s:"Healthcare", sub:"Farmasi", g:"Publik / Independen" },
  { t:"CPIN", n:"Charoen Pokphand Indonesia", s:"Consumer Non-Cyclicals", sub:"Peternakan/Pakan", g:"CP Group (Thailand)" },
  { t:"JPFA", n:"Japfa Comfeed",          s:"Consumer Non-Cyclicals", sub:"Peternakan/Pakan", g:"Japfa Group" },
  { t:"AALI", n:"Astra Agro Lestari",     s:"Consumer Non-Cyclicals", sub:"Perkebunan (CPO)", g:"Astra Group" },
  { t:"LSIP", n:"PP London Sumatra",      s:"Consumer Non-Cyclicals", sub:"Perkebunan (CPO)", g:"Salim Group" },
  { t:"SIMP", n:"Salim Ivomas Pratama",   s:"Consumer Non-Cyclicals", sub:"Perkebunan (CPO)", g:"Salim Group" },
  { t:"SGRO", n:"Sampoerna Agro",         s:"Consumer Non-Cyclicals", sub:"Perkebunan (CPO)", g:"Sampoerna Strategic" },
  { t:"ULTJ", n:"Ultrajaya Milk",         s:"Consumer Non-Cyclicals", sub:"Makanan & Minuman", g:"Publik / Independen" },
  { t:"SIDO", n:"Sido Muncul",            s:"Healthcare", sub:"Farmasi/Jamu", g:"Publik / Independen" },
  { t:"KAEF", n:"Kimia Farma",            s:"Healthcare", sub:"Farmasi", g:"BUMN" },
  { t:"TSPC", n:"Tempo Scan Pacific",     s:"Healthcare", sub:"Farmasi", g:"Tempo Group" },
  // ==== Consumer Cyclicals ====
  { t:"ACES", n:"Ace Hardware Indonesia", s:"Consumer Cyclicals", sub:"Ritel", g:"Kawan Lama Group" },
  { t:"MAPI", n:"Mitra Adiperkasa",       s:"Consumer Cyclicals", sub:"Ritel", g:"Publik / Independen" },
  { t:"LPPF", n:"Matahari Department Store", s:"Consumer Cyclicals", sub:"Ritel", g:"Publik / Independen" },
  { t:"RALS", n:"Ramayana Lestari",       s:"Consumer Cyclicals", sub:"Ritel", g:"Publik / Independen" },
  { t:"ERAA", n:"Erajaya Swasembada",     s:"Consumer Cyclicals", sub:"Ritel Elektronik", g:"Publik / Independen" },
  { t:"MAPA", n:"MAP Aktif Adiperkasa",   s:"Consumer Cyclicals", sub:"Ritel", g:"Publik / Independen" },
  { t:"HRTA", n:"Hartadinata Abadi",      s:"Consumer Cyclicals", sub:"Perhiasan", g:"Publik / Independen" },
  // ==== Energy & Mining ====
  { t:"ADRO", n:"Adaro Energy Indonesia", s:"Energy", sub:"Batu Bara", g:"Garibaldi Thohir" },
  { t:"PTBA", n:"Bukit Asam",             s:"Energy", sub:"Batu Bara", g:"BUMN" },
  { t:"ITMG", n:"Indo Tambangraya Megah", s:"Energy", sub:"Batu Bara", g:"Banpu Group (Thailand)" },
  { t:"MEDC", n:"Medco Energi",           s:"Energy", sub:"Minyak & Gas", g:"Panigoro Family" },
  { t:"AKRA", n:"AKR Corporindo",         s:"Energy", sub:"Distribusi BBM/Kimia", g:"Publik / Independen" },
  { t:"HRUM", n:"Harum Energy",           s:"Energy", sub:"Batu Bara", g:"Publik / Independen" },
  { t:"BUMI", n:"Bumi Resources",         s:"Energy", sub:"Batu Bara", g:"Bakrie Group" },
  { t:"INDY", n:"Indika Energy",          s:"Energy", sub:"Batu Bara", g:"Publik / Independen" },
  { t:"PGAS", n:"Perusahaan Gas Negara",  s:"Energy", sub:"Minyak & Gas", g:"BUMN" },
  // ==== Basic Materials ====
  { t:"TPIA", n:"Chandra Asri Pacific",   s:"Basic Materials", sub:"Petrokimia", g:"Barito Pacific / Prajogo Pangestu" },
  { t:"BRPT", n:"Barito Pacific",         s:"Basic Materials", sub:"Petrokimia/Holding", g:"Barito Pacific / Prajogo Pangestu" },
  { t:"INCO", n:"Vale Indonesia",         s:"Basic Materials", sub:"Nikel", g:"Vale Global / MIND ID" },
  { t:"ANTM", n:"Aneka Tambang",          s:"Basic Materials", sub:"Nikel/Emas/Bauksit", g:"BUMN" },
  { t:"INTP", n:"Indocement Tunggal Prakarsa", s:"Basic Materials", sub:"Semen", g:"Heidelberg Materials" },
  { t:"SMGR", n:"Semen Indonesia",        s:"Basic Materials", sub:"Semen", g:"BUMN" },
  { t:"MDKA", n:"Merdeka Copper Gold",    s:"Basic Materials", sub:"Emas/Tembaga", g:"Publik / Independen" },
  { t:"NCKL", n:"Trimegah Bangun Persada",s:"Basic Materials", sub:"Nikel", g:"Harita Group" },
  { t:"AMMN", n:"Amman Mineral Internasional", s:"Basic Materials", sub:"Tembaga/Emas", g:"Medco Group" },
  // ==== Industrials ====
  { t:"ASII", n:"Astra International",    s:"Industrials", sub:"Otomotif/Holding", g:"Astra Group (Jardine)" },
  { t:"UNTR", n:"United Tractors",        s:"Industrials", sub:"Alat Berat", g:"Astra Group" },
  { t:"HEXA", n:"Hexindo Adiperkasa",     s:"Industrials", sub:"Alat Berat", g:"Hitachi / Hexindo" },
  // ==== Infrastructure & Transportation ====
  { t:"TLKM", n:"Telkom Indonesia",       s:"Infrastructure", sub:"Telekomunikasi", g:"BUMN" },
  { t:"EXCL", n:"XL Axiata",              s:"Infrastructure", sub:"Telekomunikasi", g:"Axiata Group" },
  { t:"ISAT", n:"Indosat Ooredoo Hutchison", s:"Infrastructure", sub:"Telekomunikasi", g:"Ooredoo Group" },
  { t:"TOWR", n:"Sarana Menara Nusantara",s:"Infrastructure", sub:"Menara Telekomunikasi", g:"Sungai Mas Group" },
  { t:"TBIG", n:"Tower Bersama Infrastructure", s:"Infrastructure", sub:"Menara Telekomunikasi", g:"Provident / Wahyuni Bahar" },
  { t:"JSMR", n:"Jasa Marga",             s:"Infrastructure", sub:"Jalan Tol", g:"BUMN" },
  { t:"PGEO", n:"Pertamina Geothermal Energy", s:"Infrastructure", sub:"Energi Panas Bumi", g:"BUMN" },
  { t:"GIAA", n:"Garuda Indonesia",       s:"Transportation & Logistics", sub:"Maskapai Penerbangan", g:"BUMN" },
  { t:"BIRD", n:"Blue Bird",              s:"Transportation & Logistics", sub:"Transportasi Darat", g:"Blue Bird Group" },
  { t:"ASSA", n:"Adi Sarana Armada",      s:"Transportation & Logistics", sub:"Logistik/Rental", g:"Publik / Independen" },
  // ==== Properties & Real Estate ====
  { t:"BSDE", n:"Bumi Serpong Damai",     s:"Properties & Real Estate", sub:"Pengembang Kawasan", g:"Sinar Mas Group" },
  { t:"CTRA", n:"Ciputra Development",    s:"Properties & Real Estate", sub:"Pengembang Kawasan", g:"Ciputra Group" },
  { t:"PWON", n:"Pakuwon Jati",           s:"Properties & Real Estate", sub:"Pengembang Kawasan", g:"Pakuwon Group" },
  { t:"SMRA", n:"Summarecon Agung",       s:"Properties & Real Estate", sub:"Pengembang Kawasan", g:"Summarecon Group" },
  { t:"APLN", n:"Agung Podomoro Land",    s:"Properties & Real Estate", sub:"Pengembang Kawasan", g:"Podomoro Group" },
  { t:"LPKR", n:"Lippo Karawaci",         s:"Properties & Real Estate", sub:"Pengembang Kawasan", g:"Lippo Group" },
  { t:"DMAS", n:"Puradelta Lestari",      s:"Properties & Real Estate", sub:"Kawasan Industri", g:"Sinar Mas Group" },
  // ==== Technology ====
  { t:"GOTO", n:"GoTo Gojek Tokopedia",   s:"Technology", sub:"E-commerce/Fintech", g:"Publik / Independen" },
  { t:"BUKA", n:"Bukalapak.com",          s:"Technology", sub:"E-commerce", g:"Publik / Independen" },
  { t:"EMTK", n:"Elang Mahkota Teknologi",s:"Technology", sub:"Media/Digital Holding", g:"Sariaatmadja Family" },
  { t:"MTDL", n:"Metrodata Electronics",  s:"Technology", sub:"IT Services", g:"Publik / Independen" },
  { t:"DCII", n:"DCI Indonesia",          s:"Technology", sub:"Data Center", g:"Publik / Independen" },
  // ==== Conglomerate holding tambahan ====
  { t:"MNCN", n:"Media Nusantara Citra",  s:"Consumer Cyclicals", sub:"Media", g:"MNC Group / Hary Tanoesoedibjo" },
  { t:"BHIT", n:"MNC Investama",          s:"Financials", sub:"Holding", g:"MNC Group / Hary Tanoesoedibjo" },
  { t:"BRMS", n:"Bumi Resources Minerals",s:"Basic Materials", sub:"Tambang", g:"Bakrie Group" },
  { t:"CUAN", n:"Petrindo Jaya Kreasi",   s:"Energy", sub:"Batu Bara", g:"Prajogo Pangestu" },
  { t:"DSSA", n:"Dian Swastatika Sentosa",s:"Energy", sub:"Energi/Holding", g:"Sinar Mas Group" },
  { t:"FILM", n:"MD Pictures",            s:"Consumer Cyclicals", sub:"Media/Hiburan", g:"Manoj Punjabi" },
  { t:"SCMA", n:"Surya Citra Media",      s:"Consumer Cyclicals", sub:"Media", g:"Elang Mahkota (Sariaatmadja)" },
];

// Grouping default sektor untuk tampilan filter cepat.
const IDX_SECTORS = [...new Set(IDX_WATCHLIST.map(x => x.s))].sort();
