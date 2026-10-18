# TKJ OnE — Web Galeri Kelas

Situs statis (tanpa framework, tanpa build step) untuk galeri foto/video kelas, plus satu halaman upload yang **dipanggil dari aplikasi Android** lewat in-app browser.

Repo web: `Jirankun/tkj1` · Situs: `https://tkj1.pages.dev`

---

## 1. Status & verifikasi

- Semua halaman web lolos cek sintaks, id DOM, dan link lokal.
- Alur upload diuji di DOM (jsdom): pilih foto → validasi → progress inline → hasil → link foto.
- Kompresi diuji: file > 10 MB dikompres, hasil kompresi yang diunggah; file kecil tidak disentuh; fallback ke file asli bila kompresi gagal.
- Aplikasi Android (`Jirankun/TKJ-One`) berhasil `assembleDebug`.
- **Belum diuji**: upload jaringan nyata (ImgBB + GitHub) dan tampilan di perangkat/emulator.
- Upload di server **baru aktif setelah `upload/config.js` diinjeksi**. Tanpa injeksi, tombol upload sengaja nonaktif dan menampilkan pesan.

---

## 2. Struktur file

```
tkj1/
├── index.html                  # Galeri: pencarian, filter, grid, banner unduh app
├── photo/index.html            # Pratinjau media (gaya aplikasi): bar atas + info bawah
├── story/index.html            # Cerita (media terbaru), progress bar, nav bawah
├── upload/                     # Halaman upload (app-only, noindex)
│   ├── index.html              # Pilih foto → form → progress inline → hasil
│   ├── style.css               # Tema gelap + aksen biru, tanpa kartu popup
│   ├── script.js               # Kompresi, ImgBB, GitHub Contents API, bridge
│   ├── config.js               # Placeholder; diisi lewat injeksi/env
│   └── vendor/
│       ├── compressor.min.js   # compressorjs 1.4.0 (MIT)
│       └── LICENSE.compressorjs
├── assets/theme.css            # Token warna, komponen, nav bawah, banner
├── assets/fa/                  # Font Awesome 7 (CSS + webfonts, lokal)
├── DB/photos.json              # Sumber data galeri (array JSON)
├── sw.js                       # Service worker (cache v3)
├── _redirects                  # /photo/:name → /photo/?name=:name (301)
├── robots.txt · sitemap.xml
└── .github/workflows/
    ├── add-photo.yml           # Tambah entri ke DB/photos.json (ubuntu-latest + python3)
    └── web-deploy.yml          # Injeksi config + deploy Cloudflare Pages
```

Aplikasi Android berada di repo terpisah (`Jirankun/TKJ-One`): `app/src/main/assets/upload/` adalah salinan halaman upload untuk pemakaian lokal WebView, sedangkan alur produksi memakai URL server.

---

## 3. Routing & URL

| URL                 | Isi                            | Catatan                                          |
| ------------------- | ------------------------------ | ------------------------------------------------ |
| `/`                 | Galeri                         | Kartu menuju `/photo/?name=ID`                   |
| `/photo/?name=<ID>` | Pratinjau foto/video           | Bentuk **kanonik**, langsung tanpa lewat beranda |
| `/photo/<ID>`       | Redirect 301 ke bentuk kanonik | Link lama                                        |
| `/story/`           | Cerita                         | `noindex`                                        |
| `/upload/`          | Upload                         | `noindex`, tidak ditautkan dari web              |

Nav bawah (`Galeri · Cerita`) tampil di galeri & cerita. Halaman pratinjau sengaja tanpa nav (gaya viewer aplikasi).

### Anti-copy & anti-save

- `contextmenu`, drag gambar, dan shortcut simpan/cetak (`Ctrl/Cmd+S`, `Ctrl/Cmd+P`) diblokir.
- Gambar diberi `pointer-events: none` + `-webkit-touch-callout: none` agar long-press tidak memunculkan menu simpan.
- Video memakai `controlsList="nodownload"` dan PiP dimatikan.
- Untuk mengunduh foto, user diarahkan ke aplikasi: CTA di halaman pratinjau menuju `https://github.com/Jirankun/TKJ-One/releases/latest`, sama seperti banner di beranda.

### Ikon

Semua ikon web memakai **Font Awesome 7 Free** yang di-vendor di `assets/fa/` (tanpa CDN, tidak ada ikon rusak saat offline). Tidak ada lagi SVG inline.

---

## 4. Sumber data — `DB/photos.json`

Berupa **array**. Setiap entri:

```json
{
    "name": "17",
    "type": "photo",
    "url": "https://i.ibb.co.com/xxxx/foto.jpg",
    "date": "2026-10-19",
    "uploader": "admin"
}
```

| Field      | Wajib | Keterangan                                        |
| ---------- | ----- | ------------------------------------------------- |
| `name`     | ya    | ID unik (dipakai di URL). Duplikat ditolak        |
| `url`      | ya    | URL gambar/video (https)                          |
| `type`     | tidak | `photo` (default) atau `video`                    |
| `date`     | tidak | `YYYY-MM-DD`                                      |
| `uploader` | tidak | Nama pengunggah, ditampilkan di kartu & pratinjau |

Data saat ini: **284 entri**, semuanya `uploader: "admin"`. File ditulis ulang dengan indentasi 2 spasi dan newline akhir.

Dibaca oleh galeri, cerita, pratinjau, dan aplikasi Android (`PHOTOS_JSON_URL`) memakai cache-buster `?t=<timestamp>`.

---

## 5. Alur upload

1. User memilih foto (JPG/PNG/WebP/GIF).
2. Pratinjau tampil. Jika ukuran > **10 MB** dan bukan GIF, kompresi jalan otomatis di perangkat sambil user mengisi form:
    - library `compressorjs`, output JPEG, empat tahap: 2560px/0.85 → 2048px/0.72 → 1600px/0.6 → 1280px/0.5;
    - berhenti saat hasil ≤ 10 MB;
    - pratinjau diganti blob hasil kompresi, status inline menunjukkan “18,4 MB → 2,9 MB”;
    - GIF tidak dikompresi (agar animasi tetap); jika kompresi gagal, file asli tetap dipakai.
3. Form: **Nama Foto**, **Tanggal**, **Uploader** (nama user). Nama uploader disimpan di `localStorage` (`tjk_uploader`).
4. Klik Upload → progress inline (bukan popup):
    - `POST https://api.imgbb.com/1/upload` (form: `key`, `image`), progress 0–70%;
    - `GET` GitHub Contents API untuk `DB/photos.json` + `sha`;
    - cek duplikat `name` (case-insensitive);
    - `PUT` GitHub Contents API untuk commit entri baru; jika 409 → baca ulang + coba sekali lagi;
    - hasil menampilkan tautan langsung `/photo/?name=<ID>`.
5. Tanpa `G_TOKEN`: data tidak di-commit; payload dikirim ke aplikasi lewat bridge.

### Konfigurasi (wajib untuk produksi)

`upload/config.js` hanya placeholder. Nilai dibaca dari `window.__TJK_CONFIG__` (prioritas) atau `window.TJK_DEFAULTS`:

| Key             | Isi                                                        |
| --------------- | ---------------------------------------------------------- |
| `IMGBB_API_KEY` | API key ImgBB                                              |
| `G_TOKEN`       | fine-grained PAT, `Contents: Read & Write`, hanya repo web |
| `G_REPO`        | `Jirankun/tkj1`                                            |
| `G_BRANCH`      | `main`                                                     |
| `PHOTOS_PATH`   | `DB/photos.json`                                           |

Jangan pernah commit nilai asli. `web-deploy.yml` mengisi file ini di runner sebelum deploy.

### Bridge aplikasi (jika tanpa token)

```js
window.FlutterUploadHandler.postMessage(JSON.stringify(payload));
// atau
window.AndroidInterface.savePhoto(JSON.stringify(payload));
```

Payload: `{ repo, branch, path, sha, entry: { name, type, url, date, uploader }, content }`.

### Kontrak GitHub Contents API

`GET /repos/Jirankun/tkj1/contents/DB/photos.json?ref=main` → `{ content (base64), sha }`

`PUT /repos/Jirankun/tkj1/contents/DB/photos.json`

```json
{
    "message": "chore(gallery): add \"17\" by admin (2026-10-19)",
    "content": "<base64 JSON baru>",
    "branch": "main",
    "sha": "<sha lama>"
}
```

---

## 6. Integrasi aplikasi Android

- **Halaman upload**: `AppConfig.UPLOAD_URL` = `https://tkj1.pages.dev/upload`, dibuka lewat Custom Tab / in-app browser.
- **Link foto** (share/copy): `https://tkj1.pages.dev/photo/?name=<ID>` (URL-encoded). Aplikasi juga menerima `tkjone://photo/<ID>`.
- **AndroidManifest** (`UriViewerActivity`) menangkap:
    - `https://tkj1.pages.dev/photo...` (`pathPrefix="/photo"`), dan
    - skema `tkjone`.
- **Ekstraksi ID** (`UriViewerActivity.extractPhotoName`) mendukung:
    - `?name=ID` / `?id=ID`;
    - `https://host/photo/<ID>`;
    - `tkjone://photo/<ID>`;
    - `tkjone://photo?name=<ID>`.
- **Model** `Photo` punya `uploader`; kartu galeri dan detail foto (viewer & deep link) menampilkan “Diunggah oleh …”.
- **Urutan data**: aplikasi mengurutkan `date` terbaru di atas lalu `name` numerik — sama seperti web. Berlaku untuk data jaringan maupun cache.
- **Swipe**: viewer foto bisa digeser; player video juga mendukung swipe kiri/kanan untuk pindah media (video lain tetap di player, foto membuka viewer).
- **Custom Tab** hanya dipakai untuk 3 link: upload, portofolio, dan GitHub. Link lain (termasuk link foto dari kartu) dibuka di browser/handler luar.
- Data aplikasi diambil dari `PHOTOS_JSON_URL` (`.../DB/photos.json`).

---

## 7. Service worker (`sw.js`)

- Cache `tkjone-v3`; precache: `/`, `/index.html`, `/photo/`, `/story/`, `/assets/theme.css`, `/DB/photos.json`.
- Navigasi & file `.json` → **network-first** (data selalu segar).
- Aset statis → cache-first.
- Request ke origin lain (gambar ImgBB) tidak disentuh.

---

## 8. GitHub Actions

Semua workflow web ada di **repo web** (`Jirankun/tkj1`), berjalan di `ubuntu-latest` dan memakai `python3` bawaan runner.

### 8.1 `add-photo.yml` — menambah hasil upload ke JSON

- Trigger: `workflow_dispatch` (input: name, url, date, uploader, type) dan `repository_dispatch` tipe `add-photo`.
- Aksi: validasi (URL http(s), tanggal `YYYY-MM-DD`, tipe photo/video), cek duplikat nama, **append entri baru di akhir array**, commit `DB/photos.json`, `git pull --rebase` lalu push.
- Permission: `contents: write`; concurrency `add-photo` agar tidak balapan.

Dispatch manual via API:

```bash
curl -X POST \
  -H "Authorization: Bearer $GH_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  https://api.github.com/repos/Jirankun/tkj1/dispatches \
  -d '{
    "event_type": "add-photo",
    "client_payload": {
      "name": "17",
      "url": "https://i.ibb.co.com/xxxx/foto.jpg",
      "date": "2026-10-19",
      "uploader": "admin",
      "type": "photo"
    }
  }'
```

### 8.2 `web-deploy.yml` — injeksi config + deploy

- Trigger: push ke `main` / manual.
- Menolak jalan bila secret wajib kosong.
- Mengisi `upload/config.js` **hanya di runner** (tidak di-commit), lalu `wrangler pages deploy`.
- Secret: `IMGBB_API_KEY`, `GH_UPLOAD_TOKEN`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_PROJECT_NAME`.

> Jika Cloudflare Pages sudah terhubung otomatis ke GitHub, workflow ini opsional — tetapi tanpa injeksi config, halaman upload tidak bisa dipakai.

### 8.3 `android-ci.yml`

Berada di repo aplikasi (`Jirankun/TKJ-One`), bukan repo web. Menangani versi, build APK, dan release.

---

## 9. Checklist sebelum push

- [ ] `upload/config.js` tetap kosong (tanpa key/token).
- [ ] Secret Actions sudah diisi (untuk `web-deploy.yml`).
- [ ] `_redirects` ikut ter-deploy (Cloudflare Pages).
- [ ] `DB/photos.json` valid & nama unik.
- [ ] File lama yang sudah dihapus (`spam/`, `reader.html`, `banner/`, dll.) memang tidak dipakai lagi.
- [ ] `ads.txt` dan file verifikasi Google Search Console — jika masih dibutuhkan — dipulihkan sebelum push.

---

## 10. Menjalankan & menguji lokal

```bash
# server statis
python3 -m http.server 8123

# cek sintaks
node --check upload/script.js
node --check sw.js
```

Untuk mencoba upload lokal tanpa menyentuh rahasia, isi `upload/config.js` sementara atau set `window.__TJK_CONFIG__` lewat console, lalu **jangan commit** nilainya.

---

## 11. Keamanan

- Halaman statis tidak bisa menyembunyikan token. Token di browser wajib fine-grained, hanya repo ini, hanya `Contents: Read & Write`, masa aktif pendek.
- API key ImgBB pernah ter-commit pada riwayat lama — **rotasi key tersebut**.
- `/upload/` diberi `noindex, nofollow` dan `Disallow` di robots.
- `DB/photos.json` sengaja `Disallow` untuk crawler, tetapi tetap dapat diakses langsung (dibutuhkan aplikasi).

---

## 12. Keterbatasan & langkah berikutnya

- Belum ada uji upload nyata ke ImgBB/GitHub dari browser/perangkat.
- Kompresi baru diuji dengan stub di jsdom; perlu dicek sekali di ponsel (terutama foto besar & GIF).
- Halaman upload versi aset Android harus disinkronkan manual jika web berubah.
- Pratinjau web sudah tanpa nav bawah (gaya aplikasi); jika ingin nav kembali khusus web, tambahkan di `photo/index.html`.
- Anti-copy bersifat sisi klien (tidak bisa 100% mencegah screenshot/save dari browser modifikasi); tujuannya mencegah simpan/unduh biasa dan mengarahkan user ke aplikasi.
- UI aplikasi memakai ripple + elevasi ringan (gaya Material 2) pada kartu galeri; belum ada uji visual di perangkat.
