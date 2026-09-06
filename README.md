# IDX Pro Analytics

Aplikasi web (HTML + JS murni, tanpa build tool) untuk analisa saham IDX: candlestick + Fibonacci otomatis, scanner top gainer/loser, pemetaan sektor & grup konglomerasi, serta beberapa "signal" ala bandarmology yang dihitung dari data harga & volume.

## Cara menjalankan

Cukup buka `index.html` di browser (double-click, atau upload ketiga file — `index.html`, `style.css`, `app.js`, `sectors-data.js` — ke hosting statis apa pun: GitHub Pages, Netlify, Vercel, Google Drive+static hosting, dsb). Tidak perlu server backend maupun API key.

Untuk pengalaman terbaik di HP: buka di browser lalu pilih **Tambahkan ke Layar Utama** supaya terasa seperti aplikasi native.

## Sumber data — dan batasannya (mohon dibaca)

Supaya tidak menyesatkan, berikut rincian jujur dari mana tiap fitur mendapatkan datanya:

| Fitur | Sumber data | Status |
|---|---|---|
| Candlestick chart | Yahoo Finance (`query1.finance.yahoo.com`) | Riil, gratis, tanpa key. Delay beberapa menit (bukan tick-by-tick). |
| Fibonacci retracement/extension | Dihitung otomatis dari candle yang sama | Riil, dihitung ulang tiap refresh. |
| Top Movers Scanner | Google Sheet (GOOGLEFINANCE) **atau** pemindaian langsung ke Yahoo Finance | Riil, tapi Yahoo-mode terbatas ke watchlist di `sectors-data.js` agar tidak membebani browser. |
| Sector & Conglomerate Mapping | Watchlist statis + hasil scanner | Klasifikasi sektor mengikuti IDX-IC 2021; grup konglomerasi hanya ditandai untuk kepemilikan yang memang luas diketahui publik. |
| Accumulation & Distribution | Chaikin A/D Line (indikator teknikal standar dari harga+volume) | Riil sebagai indikator teknikal, **bukan** data transaksi broker asli. |
| Bandarmology Signal | Heuristik: lonjakan volume + penyempitan rentang harga + posisi close | Estimasi teknikal, **bukan** pembacaan broker summary sesungguhnya. |
| Retail Behavior Detection | Heuristik: volatilitas + perubahan harga harian | Estimasi, karena data granular per investor tidak tersedia gratis. |
| Net Foreign Flow (Rupiah & %) | Kolom `ForeignNetIDR` / `ForeignNetPct` di Google Sheet Anda | **Kosong secara default.** Data aliran dana asing riil adalah data berbayar milik IDX/vendor (mis. broker summary), tidak tersedia gratis di Yahoo/Google Finance. |

Data "broker summary" per kode broker (yang menjadi basis bandarmology & foreign flow yang sesungguhnya) memang tidak dipublikasikan gratis oleh IDX secara real-time — biasanya lewat vendor berbayar (RTI, Stockbit Pro, dsb). Jika Anda punya akses ke data tersebut, cara termudah menyambungkannya ke aplikasi ini adalah menambahkannya sebagai kolom di Google Sheet (lihat di bawah).

## Menghubungkan Google Sheet (opsional, direkomendasikan untuk Scanner)

1. Buat Google Sheet baru. Baris pertama = header: `Ticker, Price, ChangePct, Volume, ForeignNetIDR, ForeignNetPct`.
2. Isi tiap baris untuk satu kode saham, contoh untuk BBCA di baris 2:
   ```
   A2: BBCA
   B2: =GOOGLEFINANCE("IDX:BBCA","price")
   C2: =GOOGLEFINANCE("IDX:BBCA","changepct")
   D2: =GOOGLEFINANCE("IDX:BBCA","volume")
   E2: (opsional, isi manual/dari data vendor Anda — net asing dalam Rupiah)
   F2: (opsional — net asing dalam %)
   ```
3. Salin baris tersebut untuk setiap kode di `sectors-data.js` yang ingin Anda pantau.
4. **File → Bagikan → Publikasikan ke web** → pilih sheet yang sesuai → format **CSV** → salin link.
5. Tempel link tersebut di aplikasi, menu **⚙ Sumber Data**, kolom "Google Sheet CSV URL", klik **Simpan & Uji Koneksi**.

Catatan: GOOGLEFINANCE menyegarkan datanya setiap beberapa menit (bukan realtime murni), dan versi "Publikasikan ke web" juga di-cache oleh Google selama beberapa menit. Ini adalah batas teknis dari Google Sheets sendiri, bukan dari aplikasi ini.

## Menambah saham ke watchlist

Edit `sectors-data.js`, tambahkan baris baru mengikuti format yang sudah ada:
```js
{ t:"KODE", n:"Nama Emiten", s:"Sektor", sub:"Sub-sektor", g:"Grup / Publik / Independen" }
```

## Keterbatasan teknis yang perlu diketahui

- **CORS**: aplikasi memanggil `query1.finance.yahoo.com` langsung dari browser. Endpoint ini umumnya bisa diakses lintas domain tanpa masalah, tapi beberapa jaringan kantor/ISP atau ekstensi browser tertentu bisa memblokirnya. Jika chart gagal dimuat, coba jaringan lain atau gunakan mode Google Sheet untuk data historis alternatif.
- **Rate limit**: mode pemindaian langsung ke Yahoo (tanpa Google Sheet) melakukan puluhan request sekaligus — cukup untuk watchlist di file ini, tapi jangan memperbesar watchlist terlalu banyak (>150 kode) agar tidak terkena pembatasan.
- Ini bukan aplikasi resmi IDX dan tidak berafiliasi dengan Bursa Efek Indonesia, Yahoo, atau Google. Gunakan sebagai alat bantu analisa teknikal, bukan sebagai satu-satunya dasar keputusan investasi.
