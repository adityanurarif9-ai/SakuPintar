# 🌱 SakuPintar Web

Teman uang saku untuk siswa SMP. Dashboard responsif, pencatatan satu ketukan, celengan impian, riwayat, XP, lencana, dan tiga kuis singkat literasi keuangan.

## Menjalankan di VS Code

Install Node.js, buka folder proyek, lalu jalankan:

```sh
npm run dev
```

Buka http://127.0.0.1:7357. Tidak perlu `npm install`: tidak ada dependensi eksternal. Atau sajikan folder `dist/` menggunakan server statis.

## Struktur

```text
dist/
  index.html           Halaman aplikasi
  styles.css           Desain responsif
  app.js               Interaksi, navigasi, form, grafik
  core.mjs             Model dan perhitungan saldo
  sw.js                Cache aplikasi untuk penggunaan offline
  manifest.webmanifest Metadata aplikasi web
  icon.svg             Ikon lokal
tools/serve.mjs         Server pengembangan
tests/core.test.mjs     Tes perhitungan dan persistensi
```

## Mulai memakai

1. Tambah uang saku yang diterima; saldo awal Rp0.
2. Ketuk kategori untuk langsung mencatat nominal yang tertera. Gunakan Nominal lain untuk nominal berbeda.
3. Isi celengan Rp5.000 sekali ketuk, atau gunakan tombol pensil untuk nominal lain. Alokasi tabungan mengurangi saldo jajan dan tidak dihitung sebagai pengeluaran konsumsi.
4. Buat target baru di Celengan impian.
5. Atur nama, frekuensi, dan tanggal uang saku lewat tombol profil. Uang saku dicatat manual saat benar-benar diterima.
6. Dapatkan 25 XP per tanggal menabung dan 10 XP per kuis baru; tiap 100 XP naik level. Lencana tiga hari dihitung dari tiga tanggal berbeda.
7. Unduh/pulihkan cadangan lewat pengaturan. Data contoh hanya dimuat setelah dipilih secara eksplisit.

## Penyimpanan dan offline

Data disimpan di `localStorage` browser pada origin yang sama. Tidak ada akun aplikasi, backend, sinkronisasi, font online, atau analitik. Data bisa hilang ketika data browser dibersihkan; gunakan cadangan JSON. Profil browser, alamat hosting, dan port berbeda memiliki penyimpanan terpisah. Dua tab memuat perubahan lewat event storage; penggunaan serentak persis pada saat yang sama belum memiliki penguncian database.

Service worker menyimpan aset aplikasi setelah kunjungan pertama pada HTTPS/localhost. Tunggu pemasangan worker selesai sebelum mencoba mode offline. Login awal ke hosting privat tetap perlu koneksi; cache browser dapat dibersihkan oleh perangkat. Versi web ini terpisah dari source Flutter sebelumnya dan belum berbagi data dengannya.

## Memeriksa

```sh
npm run check
```

Tes mencakup konsistensi saldo, batas target, nominal, XP harian, jadwal manual, kegagalan tulis, cadangan, dan pergantian hari.

## Hosting

Sajikan seluruh isi `dist/` sebagai website statis. File `.openai/hosting.json` digunakan oleh Sites. Untuk GitHub Pages, workflow yang disediakan mengunggah folder `dist/`; aktifkan **Settings → Pages → Source: GitHub Actions** pada repository. Publikasi Pages bergantung izin dan pengaturan akun GitHub. Tidak perlu API key untuk aplikasi ini.
