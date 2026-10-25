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
- Upload di server **aktif setelah `code/js/gallery/upload-config.js` berisi `IMGBB_API_KEY`**. Sekarang nilai itu ditulis langsung di file config, bukan diinjeksi lewat secret.

---

## 2. Struktur file

```
tkj1/
├── index.html                  # Landing root (layout gaya contoh TKJ-2OfficialWebsite): banner, About & Teacher, Galeri, Team, Members, Achievement, FAQ, Contact, Closing — mandiri, tanpa link ke halaman lain
├── galeri/index.html           # Galeri: pencarian, filter, grid, banner unduh app
├── photo/index.html            # Pratinjau media (gaya aplikasi): bar atas + info bawah
├── story/index.html            # Cerita (media terbaru), progress bar, nav bawah
├── uploaders/index.html        # Data uploader: tab Statistik + Detail User (aktif/suspend + fotonya)
├── upload/index.html           # Halaman upload (app-only, noindex): pilih foto → form → progress inline → hasil
├── code/                       # SEMUA CSS & JS halaman (dipisah per grup)
│   ├── css/root/               # Grup root: / dan /student/
│   │   ├── theme.css           # Tema induk root: token, reset, tipografi retro
│   │   └── landing.css         # UI retro penuh landing + student (hard shadow)
│   ├── css/gallery/            # Grup galeri: /galeri, /photo, /story, /uploaders, /upload
│   │   ├── theme.css           # Tema induk galeri (salinan, app-like)
│   │   ├── photo.css · story.css · uploaders.css · upload.css
│   ├── js/root/                # home.js, student.js, hero-title.js, js-flag.js, komentar.js
│   └── js/gallery/             # galeri.js, photo.js, story.js, uploaders.js, anti-copy.js,
│       │                       # upload.js, upload-config.js
│       └── vendor/             # compressor.min.js (compressorjs 1.4.0, MIT) + lisensi
├── assets/fa/                  # Font Awesome 7 (CSS + webfonts, lokal)
├── assets/plyr/                # Plyr 3.7.8 (self-hosted: plyr.js, plyr.css)
│   └── assets/                 # Sprite ikon (plyr.svg) + blank.mp4 — tanpa CDN
├── functions/api/komentar.js   # POST /api/komentar (Pages Function, token di server)
├── student/index.html          # Halaman anggota kelas (/student/) — template, isinya disuntik dari data/
├── data/                       # Sumber suntikan halaman student/: ld.json + memberlist.html
├── DB/photos.json              # Sumber data galeri (array JSON)
├── DB/komentar.json            # Sumber data Pesan & Kesan (array JSON)
├── sw.js                       # Service worker (cache v5)
├── _redirects                  # /photo/:name → /photo/?name=:name (301)
├── robots.txt · sitemap.xml
└── .github/workflows/
    ├── add-photo.yml           # Tambah entri ke DB/photos.json (ubuntu-latest + python3)
    ├── add-comment.yml         # Bersihkan & append komentar ke DB/komentar.json
    ├── inject-ld-and-memberlist.yml  # Suntik data/ld.json + data/memberlist.html ke student/index.html
    └── web-deploy.yml          # Injeksi config + deploy Cloudflare Pages
```

Aplikasi Android berada di repo terpisah (`Jirankun/TKJ-One`): `app/src/main/assets/upload/` adalah salinan halaman upload untuk pemakaian lokal WebView, sedangkan alur produksi memakai URL server.

---

## 3. Routing & URL

| URL                 | Isi                            | Catatan                                          |
| ------------------- | ------------------------------ | ------------------------------------------------ |
| `/`                 | Landing TKJ 1 SMKN 1 Lembah Melintang (About & Teacher, Galeri, Team, FAQ, Contact) | Mandiri, tanpa link ke halaman lain; data diisi lewat objek `KELAS` di `index.html`; galeri mengambil 9 foto terbaru dari `DB/photos.json` |
| `/galeri/`          | Galeri                         | Kartu menuju `/photo/?name=ID`                   |
| `/photo/?name=<ID>` | Pratinjau foto/video           | Bentuk **kanonik**, langsung tanpa lewat beranda |
| `/photo/<ID>`       | Redirect 301 ke bentuk kanonik | Link lama                                        |
| `/story/`           | Cerita                         | `noindex`                                        |
| `/uploaders/`       | Data uploader (Statistik + Detail User) | `noindex`, `Disallow` di robots          |
| `/upload/`          | Upload                         | `noindex`, tidak ditautkan dari web              |

Nav bawah (`Galeri · Cerita`) tampil di galeri & cerita. Halaman pratinjau sengaja tanpa nav (gaya viewer aplikasi).

### Anti-copy & anti-save

Blok proteksi yang sama (inline, identik di setiap halaman) dipasang di **semua halaman yang memuat data dari `DB/`**: `/galeri/`, `/photo/`, `/story/`, `/uploaders/`, dan `/upload/`.

- **Klik kanan** diblokir (`contextmenu`) — menu simpan/salin/cetak tidak muncul.
- **Teks halaman tidak bisa disalin/dipilih**: event `copy`, `cut`, dan `selectstart` diblokir, ditambah gaya `user-select: none` (kecuali `input`/`textarea`/`[contenteditable]`, supaya form upload dan kotak pencarian tetap normal).
- **Seret & lepas** diblokir (`dragstart`, `dragover`, `drop`) — foto tidak bisa di-drag ke disk. Gambar juga diberi `draggable="false"`, `-webkit-user-drag: none`, dan `-webkit-touch-callout: none` agar long-press tidak memunculkan menu simpan.
- **Shortcut** diblokir: salin/potong/pilih semua (`Ctrl/Cmd+C`, `X`, `A`), simpan/cetak/lihat sumber (`Ctrl/Cmd+S`, `P`, `U`).
- Video memakai `controlsList="nodownload"` dan PiP dimatikan.
- Untuk mengunduh foto, user diarahkan ke aplikasi: CTA di halaman pratinjau **mendeteksi apakah aplikasi terpasang** — skema `tkjone://photo/<ID>` dicoba lewat iframe tersembunyi; kalau tab kehilangan fokus dalam 1,3 detik, berarti aplikasi terbuka (toast "Membuka TKJ OnE"); kalau tidak, user **langsung diarahkan ke `https://github.com/Jirankun/TKJ-One/releases/latest`**. Banner di beranda tetap menuju halaman rilis itu langsung.

### Ikon

Semua ikon web memakai **Font Awesome 7 Free** yang di-vendor di `assets/fa/` (tanpa CDN, tidak ada ikon rusak saat offline). Tidak ada lagi SVG inline.

### Player video — Plyr self-hosted

Semua player video (pratinjau `/photo/`, cerita `/story/`, pratinjau inline `/uploaders/`) memakai **Plyr 3.7.8** yang di-vendor penuh di `assets/plyr/`:

- `assets/plyr/plyr.js` + `assets/plyr/plyr.css` — tanpa request ke `cdn.plyr.io`.
- `assets/plyr/assets/plyr.svg` (sprite ikon) dan `assets/plyr/assets/blank.mp4` — aset default Plyr diambil dari folder lokal, bukan CDN.
- Nilai default `iconUrl` / `blankVideo` di `plyr.js` sudah diarahkan ke path absolut `/assets/plyr/assets/...`, jadi aman dipakai dari halaman di subfolder (`/photo/`, `/story/`, `/uploaders/`).
- Kalau `Plyr` gagal dimuat, video tetap berjalan dengan kontrol native (fallback).

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

Data saat ini: **303 entri** (301 foto + 2 video), dari 2 uploader (`admin` 297, `Zhyllan Fyllah` 6). File ditulis ulang dengan indentasi 2 spasi dan newline akhir.

Dibaca oleh galeri, cerita, pratinjau, dan aplikasi Android (`PHOTOS_JSON_URL`) memakai cache-buster `?t=<timestamp>`.

> **Host gambar:** `i.ibb.co` (tanpa `.com`) kini memakai sertifikat TLS milik domain lain (`internetbaik.telkomsel.com`), jadi browser menolaknya dan foto tidak pernah tampil meski link-nya kelihatan sehat. Semua entri sudah diubah ke `i.ibb.co.com`, dan setiap halaman juga menormalisasi URL saat runtime (`i.ibb.co/` → `i.ibb.co.com/`) supaya data lama/baru tetap aman. Alur upload (`code/js/gallery/upload.js`) dan workflow `add-photo.yml` menerapkan normalisasi yang sama sebelum menyimpan.

### Halaman `/uploaders/` — data uploader

Halaman statis (tanpa header) yang merangkum data `DB/photos.json` + `DB/status.json`:

- **Tanpa header**, isi dikelompokkan lewat 2 tab: **Statistik** (6 kartu ringkasan: **Media / Foto / Video / Aktif / Suspend / User**, lalu grafik batang "Uploader") dan **Detail User** (daftar user **aktif** & **suspend** beserta fotonya).
- **Pil Total mengambang** di pojok kanan bawah (`position: fixed`): `<jumlah> media` dengan rincian `<jumlah> video · <jumlah> foto` di bawahnya. Video ikut terhitung di semua angka (baris uploader, kartu statistik, progress bar, dan daftar media user).
- Baris uploader: `avatar · nama · status · › · jumlah/persen di ujung kanan`, dengan **progress bar** porsi foto di bawahnya. Angka memakai `tabular-nums` dengan lebar kolom tetap, jadi semua baris lurus.
- **Accordion**: hanya **1 user** yang boleh terbuka; membuka user lain otomatis menutup yang sebelumnya.
- **Foto expand di dalam** (expand di dalam expand): mengetuk baris foto membuka pratinjau **di halaman ini** (bukan navigasi ke halaman lain); mengetuk lagi menutupnya. Hanya **1 foto** yang boleh terbuka. Baris video memakai **Plyr** (self-hosted) di dalam pratinjau yang sama.
- Di dalam pratinjau ada link sekunder “Halaman foto” (`/photo/?name=<ID>`) untuk membuka viewer penuh.
- `DB/status.json` dibaca dengan `cache: "no-store"`; bila gagal, halaman tetap jalan tanpa profil user.

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

`code/js/gallery/upload-config.js` berisi nilai statis:

| Key             | Isi                                                        |
| --------------- | ---------------------------------------------------------- |
| `IMGBB_API_KEY` | API key ImgBB (ditulis langsung di `code/js/gallery/upload-config.js`) |
| `G_TOKEN`       | fine-grained PAT, `Contents: Read & Write`, hanya repo web |
| `G_REPO`        | `Jirankun/tkj1`                                            |
| `G_BRANCH`      | `main`                                                     |
| `PHOTOS_PATH`   | `DB/photos.json`                                           |

ImgBB API key sudah disimpan di file config secara langsung, jadi tidak perlu secret GitHub Actions untuk upload.

### Bridge aplikasi (jika tanpa token)

```js
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

- Cache `tkjone-v7`; precache: `/`, `/galeri/`, `/photo/`, `/story/`, `/uploaders/`, aset statis, `/DB/photos.json`.
- Galeri pindah dari `/` ke `/galeri/`; link "beranda" di `/photo/` dan `/story/` (serta salinan aset aplikasi) menunjuk ke `/galeri/`.
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

### 8.2 `web-deploy.yml` — deploy Cloudflare Pages

- Trigger: push ke `main` / manual.
- Inject `G_UPLOAD_TOKEN` ke `code/js/gallery/upload-config.js`, lalu deploy.
- Secret: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_PROJECT_NAME`.

### 8.3 `inject-ld-and-memberlist.yml` — mengisi halaman `/student/`

Halaman `/student/` adalah **template**. Dua komentar di dalam `student/index.html` menandai titik suntikan, dan isinya selalu diambil dari folder `data/`:

- `data/ld.json` → isi `<script type="application/ld+json">` di `<head>` (CollectionPage + ItemList anggota, untuk SEO/Google).
- `data/memberlist.html` → blok kartu anggota di dalam `.container` `section#daftar`, dibungkus penanda `<!-- memberlist:start -->` … `<!-- memberlist:end -->`.

- Trigger: push ke `main` yang mengubah `data/**`, atau manual lewat Actions → "Inject LD & memberlist" → Run workflow. `student/**` sengaja tidak ikut agar commit hasil suntikan tidak memicu run kedua; kalau `student/index.html` diedit manual, jalankan workflow sekali dari tab Actions.
- Aksi: validasi `ld.json` (JSON valid, tanpa `</script`), validasi `memberlist.html` memuat `id="membersList"`, indentasi 12 spasi untuk JSON-LD dan 20 spasi untuk blok memberlist, lalu tulis `student/index.html` hanya bila isinya berubah (**idempoten** — tanpa perubahan tidak ada commit).
- Commit: bot `tkjone-bot` (`chore(seo): suntik JSON-LD dan memberlist ke student/index.html`), `git pull --rebase` lalu push memakai `G_UPLOAD_TOKEN` (fallback `github.token`).
- Workflow ini hanya menyentuh `student/index.html`: tidak mengubah galeri/`DB/photos.json` dan tidak menambah tautan navigasi di beranda. Alur upload foto (`add-photo.yml`) tidak memicunya karena `DB/**` di luar `paths`.
- Catatan token: commit dengan `github.token` bawaan tidak memicu workflow lain, jadi isi secret `G_UPLOAD_TOKEN` agar `web-deploy.yml` ikut jalan setelah suntikan.
- Cara mengubah daftar anggota: edit `data/memberlist.html` (dan `data/ld.json` bila perlu). Jangan edit blok hasil suntikan di `student/index.html` karena akan ditimpa pada run berikutnya.

### 8.4 `android-ci.yml`

Berada di repo aplikasi (`Jirankun/TKJ-One`), bukan repo web. Menangani versi, build APK, dan release.

### 8.5 `add-comment.yml` — Pesan & Kesan

Komentar dikirim dari landing (section **Pesan & Kesan**, di bawah "Ikuti Kami") lewat `POST /api/komentar`, bukan langsung dari browser ke GitHub:

1. `functions/api/komentar.js` memeriksa ukuran/tipe body, honeypot, asal request, dan panjang pesan, lalu memanggil `repository_dispatch` tipe `add-comment` memakai `G_UPLOAD_TOKEN` dari env Cloudflare Pages. Token tidak pernah dikirim ke browser.
2. `add-comment.yml` membersihkan HTML (allowlist `b/strong/i/em/u/s/strike/del/br`; `span`/`font` hanya atribut warna), membatasi 500 karakter, lalu **append** entri ke `DB/komentar.json`.
3. Push bot memicu `web-deploy.yml`, jadi entri baru tampil setelah deploy (biasanya 10–30 detik). Selama menunggu, pesan sendiri tampil sebagai bubble "mengirim…" dari state di halaman.

Bentuk entri:

```json
{
    "id": "a1b2c3d4e5f6",
    "name": "Zhyllan",
    "comment": "Halo <b>semua</b>!<br>Semangat TKJ 1",
    "status": true,
    "time": "2026-10-24T18:30:00Z"
}
```

- `name` boleh kosong → tampil sebagai **Anonim**.
- `status`: `true` tampil, `false` disembunyikan. Tidak ada jalur hapus dari web; admin mengubah status atau menghapus entri manual di repo.
- Gambar dan tautan tidak didukung (tag `img`/`a` dan tag berbahaya dibuang). Pembersihan dilakukan dua kali: di workflow dan lagi saat render (`code/js/root/komentar.js`).
- Env Cloudflare Pages: **`G_UPLOAD_TOKEN`** (wajib, PAT fine-grained `Contents: Read and write` untuk repo ini) dan **`KOMENTAR_KV`** (opsional, binding KV untuk batas 1 pesan / 60 detik per IP).
- Tanpa captcha: hanya honeypot, batas panjang, validasi asal request, dan (bila KV aktif) throttle per IP. Aktifkan KV kalau mulai ada spam.
- Service worker di-*bump* (`tkjone-v15`) setiap ada perubahan CSS/JS landing agar pengunjung lama tidak memakai cache lama.

---

## 9. Checklist sebelum push

- [ ] `code/js/gallery/upload-config.js` berisi `IMGBB_API_KEY` yang benar.
- [ ] Secret Actions sudah diisi (untuk `web-deploy.yml`, jika dipakai).
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
node --check code/js/gallery/upload.js
node --check code/js/root/home.js
node --check sw.js
```

Untuk mencoba upload lokal, isi `code/js/gallery/upload-config.js` dengan `IMGBB_API_KEY` yang benar.

---

## 11. Keamanan

- Halaman statis tidak bisa menyembunyikan token. Token di browser wajib fine-grained, hanya repo ini, hanya `Contents: Read & Write`, masa aktif pendek.
- `/upload/` diberi `noindex, nofollow` dan `Disallow` di robots.
- `DB/photos.json` sengaja `Disallow` untuk crawler, tetapi tetap dapat diakses langsung (dibutuhkan aplikasi).

---

## 12. Keterbatasan & langkah berikutnya

- Belum ada uji upload nyata ke ImgBB/GitHub dari browser/perangkat.
- Kompresi baru diuji dengan stub di jsdom; perlu dicek sekali di ponsel (terutama foto besar & GIF).
- Halaman upload versi aset Android harus disinkronkan manual jika web berubah.
- Pratinjau web sudah tanpa nav bawah (gaya aplikasi); jika ingin nav kembali khusus web, tambahkan di `photo/index.html`.
- Anti-copy bersifat sisi klien (tidak bisa 100% mencegah screenshot/save dari browser modifikasi); tujuannya mencegah simpan/unduh biasa, menyalin teks halaman, dan mengarahkan user ke aplikasi.
- UI aplikasi memakai ripple + elevasi ringan (gaya Material 2) pada kartu galeri; belum ada uji visual di perangkat.
