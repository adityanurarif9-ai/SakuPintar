# SakuPintar

Uang saku, tertata. Website pengelola uang saku, celengan impian, dan pelajaran singkat untuk siswa SMP.

## Versi ini

- Daftar dengan nama panggilan, email, dan kata sandi; masuk menggunakan email dan kata sandi.
- Autentikasi Better Auth, hash kata sandi, sesi cookie HttpOnly, pemeriksaan origin, dan pembatasan percobaan masuk.
- Catatan pribadi di Cloudflare D1. Pemilik catatan ditentukan dari sesi server, bukan payload browser.
- Dashboard, catat cepat, beberapa celengan, riwayat, XP, dan tiga kuis.
- Desain hijau tua dan kertas, logo saku/koin SVG, tulisan isi 16 px dan form yang mudah dibaca.
- Cadangan JSON dan impor eksplisit catatan browser versi pertama.

## Menjalankan dari VS Code

Memerlukan Node.js 22.13 atau lebih baru. Edit sumber di `public/app/`; `dist/` adalah hasil build.

```sh
npm ci
npm run build
```

Untuk database lokal baru, jalankan kedua migrasi secara berurutan satu kali. Jika migrasi pertama sudah pernah diterapkan, jalankan hanya migrasi kedua.

```sh
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_perfect_nick_fury.sql
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0001_fair_magdalene.sql
npm run dev -- --port 7357 --hostname 127.0.0.1
```

Buka http://127.0.0.1:7357/app/ dan buat akun uji sendiri. Akun email lokal memakai database lokal. Kunci pengembangan hanya berlaku pada loopback. Produksi wajib memiliki runtime secret `BETTER_AUTH_SECRET`, yang diatur melalui pengelola rahasia hosting dan tidak dimasukkan ke repository.

## Pemeriksaan

```sh
npm run check
npx tsc --noEmit
npm run build
```

Saat server lokal port 7357 aktif dan migrasi sudah diterapkan:

```sh
npm run test:accounts
```

Tes akun membuat dua akun sintetis dengan kredensial acak yang tidak dicetak. Tes memeriksa daftar, masuk, keluar, pemisahan akun, penolakan origin asing, dan konflik revisi. Database pengujian tidak disertakan dalam source.

## Struktur

- `public/app/`: tampilan, logo, perhitungan saldo, dan sinkronisasi.
- `public/app/email-entry.js`: form masuk/daftar dan alur sesi.
- `public/app/readability.css`: ukuran tulisan dan penyempurnaan tampilan responsif.
- `lib/auth.ts` dan `app/api/auth/`: autentikasi email dan sesi.
- `app/api/wallet/route.ts`: profil dan catatan dengan validasi serta pemeriksaan pemilik di server.
- `db/schema.ts` dan `drizzle/`: skema dan migrasi database.
- `build/` dan `scripts/`: integrasi build Vinext/Sites.
- `tests/`: pemeriksaan logika, sinkronisasi, dan integrasi akun.

## Penyimpanan dan batas fitur

Masuk memerlukan internet. Saat sesi aplikasi terbuka, perubahan disimpan pada salinan lokal khusus akun lalu dikirim ke server. Perubahan saat koneksi putus dicoba kembali ketika koneksi pulih. Setelah keluar atau membuka sesi baru, aplikasi memverifikasi sesi ke server.

Revisi lama ditolak agar tidak menimpa perubahan perangkat lain. Jika ada konflik, unduh cadangan lokal melalui Pengaturan, lalu pilih salinan server. Penggabungan otomatis belum tersedia.

Akun email baru memiliki ruang catatan tersendiri. Catatan akun ChatGPT sebelumnya tetap disimpan tetapi tidak otomatis ditautkan ke alamat email baru. Cadangan JSON dapat diimpor melalui Pengaturan. Simpan cadangan di tempat pribadi.

Verifikasi email dan pemulihan kata sandi lewat email belum tersedia; versi ini belum menggunakan layanan pengiriman email.

## Hosting

Website menggunakan Worker Vinext dan Cloudflare D1 melalui Sites. Pengaturan akses hosting terpisah dari akun aplikasi: situs privat masih dapat menampilkan gerbang ChatGPT sebelum halaman SakuPintar. Menghilangkan gerbang itu memerlukan izin pemilik untuk membuka halaman masuk kepada siapa saja yang memiliki tautan. Catatan tetap memerlukan sesi akun dan dilindungi API.

GitHub menyimpan source dan menjalankan CI. Aplikasi server dengan database ini memerlukan hosting Worker; GitHub Pages tidak menjalankan API akun. Publikasi Sites menerapkan migrasi dan build dari source tersimpan.
