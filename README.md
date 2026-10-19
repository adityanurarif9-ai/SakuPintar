# SakuPintar

Uang saku, tertata. Website pengelola uang saku dengan akun ChatGPT, catatan pribadi, celengan, dan pelajaran singkat untuk siswa SMP.

## Versi ini

- Halaman Masuk dan Daftar yang terpisah dari dashboard.
- Login resmi melalui Sign in with ChatGPT; aplikasi tidak meminta atau menyimpan password ChatGPT.
- Pendaftaran profil SakuPintar dengan nama panggilan.
- Catatan disimpan di Cloudflare D1 berdasarkan ID pengguna dari server. Payload browser tidak dapat memilih pemilik catatan.
- Dashboard, quick log, beberapa celengan, riwayat, XP, dan tiga kuis.
- Desain warna kertas dan hijau tua, ikon garis, logo saku dan koin dalam SVG.
- Cadangan JSON serta impor eksplisit data browser dari versi pertama.

## Menjalankan dari VS Code

Memerlukan Node.js 22.13 atau lebih baru.

```sh
npm ci
npm run build
```

Untuk database pengembangan, jalankan migrasi lokal satu kali pada database baru:

```sh
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_perfect_nick_fury.sql
npm run dev -- --port 7357 --hostname 127.0.0.1
```

Buka http://127.0.0.1:7357/app/. Starter resmi menyediakan simulasi login hanya di loopback pengembangan, dengan akun `seedy@sites.test`. Simulasi ini tidak disertakan dalam build produksi. Penerapan asli menggunakan identitas yang diberikan hosting Sites.

## Pemeriksaan

```sh
npm run check
npx tsc --noEmit
npm run build
```

Saat server lokal di port 7357 aktif dan migrasi sudah diterapkan:

```sh
npm run test:accounts
```

Tes akun menggunakan data simulasi pada database lokal, bukan akun atau uang sungguhan. Jika database lokal sudah berisi akun uji, tes melanjutkan profil uji tersebut.

## Struktur

- `public/app/`: tampilan aplikasi, halaman akun, logo, dan perhitungan saldo.
- `app/api/wallet/route.ts`: API profil dan catatan; autentikasi, validasi, dan pemeriksaan pemilik dijalankan di server.
- `app/chatgpt-auth.ts`: integrasi identitas resmi dari starter Sites.
- `db/schema.ts` dan `drizzle/`: skema dan migrasi database akun.
- `build/` dan `scripts/`: integrasi build Vinext/Sites.
- `tests/`: tes logika, antrean sinkronisasi, dan integrasi API akun.

## Catatan penyimpanan

Masuk memerlukan koneksi internet. Setelah sesi aplikasi terbuka, perubahan disimpan pada salinan lokal khusus akun dan dikirim ke server. Jika koneksi putus, indikator menampilkan status offline; perubahan dicoba ulang saat koneksi kembali. Setelah logout atau membuka sesi baru, aplikasi memverifikasi akun ke server terlebih dahulu.

Catatan dengan versi lama ditolak agar tidak menimpa perubahan dari perangkat lain. Jika muncul konflik, buka pengaturan, pilih Selaraskan data, unduh cadangan lokal, lalu muat salinan server. Penggabungan otomatis dua catatan yang berbeda belum tersedia.

Cadangan JSON berisi riwayat uang saku. Simpan cadangan di tempat pribadi. Data lama dari versi pertama tidak dipindahkan otomatis: pilih Impor catatan versi lama pada perangkat/browser yang memiliki catatan tersebut. Tidak ada data nyata atau akun uji lokal yang dimasukkan ke source repository.

## Hosting

Website memakai Worker Vinext dan database D1 melalui Sites. Situs tetap privat sesuai pengaturan sebelumnya; gerbang akses hosting ChatGPT tetap dapat muncul sebelum halaman SakuPintar. Pendaftaran profil aplikasi tidak mengubah izin akses hosting.

GitHub menyimpan source dan menjalankan pemeriksaan. Versi dengan akun dan database ini tidak lagi cocok untuk GitHub Pages yang hanya menyajikan file statis; workflow Pages diganti dengan pemeriksaan CI. Publikasi Sites menerapkan migrasi database dan build yang sama dengan source tersimpan.