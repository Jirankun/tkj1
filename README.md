---

# 📸 Dokumentasi Album Foto Kelas – TKJ OnE

> Sebuah proyek ringan namun bermakna untuk mendokumentasikan kebersamaan kelas, dibangun dengan prinsip performa, aksesibilitas, dan kemudahan pemeliharaan — sesuai semangat **TKJ OnE**: *One Team, One Spirit, One Excellence*.

---

## 🗂️ Struktur Folder

```
Album kelas/
├── index.html                 # Halaman utama – responsif, tema gelap/terang, fitur interaktif
├── DB/
│   └── photos.json           # Database foto dalam format JSON (satu-satunya sumber data)
└── README.md                 # Dokumentasi ini – panduan lengkap untuk kontributor
```

---

## ➕ Cara Menambahkan Foto Baru

### 1. Edit File `DB/photos.json`

File ini adalah **satu-satunya sumber kebenaran** (*single source of truth*) untuk semua foto. Tidak ada gambar disimpan lokal — semuanya di-host eksternal untuk efisiensi dan kompatibilitas offline-first jika diperlukan di masa depan.

Contoh entri dasar:
```json
{
  "photos": [
    {
      "name": "Nama Siswa",
      "gender": "male",
      "url": "https://link-ke-gambar.jpg"
    }
  ]
}
```

### 2. Format Data yang Valid

| Field     | Tipe    | Nilai yang Diizinkan                     | Catatan |
|-----------|---------|------------------------------------------|--------|
| `name`    | String  | Nama lengkap atau panggilan              | Unik & mudah dikenali |
| `gender`  | String  | `"male"` atau `"female"`                 | Digunakan untuk filter |
| `url`     | String  | URL publik ke gambar (HTTPS)             | Gunakan CDN seperti ImgBB |

### 3. Contoh Penambahan Multi-Foto

```json
{
  "photos": [
    {
      "name": "Zhyllan",
      "gender": "male",
      "url": "https://i.ibb.co/Fqy0Dgdj/4-Nov-14-35-lmc-8-4-1.jpg"
    },
    {
      "name": "Thallita",
      "gender": "female",
      "url": "https://i.ibb.co/8xYtK6m/thallita.jpg"
    },
    {
      "name": "Siswa Baru",
      "gender": "male",
      "url": "https://i.ibb.co/new-id/photo.jpg"
    }
  ]
}
```

> 💡 **Best Practice**: Simpan ID unik di path URL (misal: `i.ibb.co/<ID>/nama.jpg`) agar mudah dilacak.

---

## ☁️ Rekomendasi Hosting Gambar

Untuk menjaga **performa dan stabilitas**, gunakan layanan berikut:

- ✅ **[ImgBB](https://imgbb.com)** *(rekomendasi utama)*  
  - Gratis, tanpa watermark, mendukung HTTPS, dan stabil.
- Alternatif: Imgur, Postimages.org  
  - Hindari layanan yang memblokir hotlinking atau menambahkan iklan.

> ⚠️ Pastikan link **langsung ke gambar** (bukan halaman web). Contoh benar: `https://i.ibb.co/xxx/image.jpg`

---

## 🧩 Format JSON yang Benar

Pastikan struktur JSON **valid**:

```json
{
  "photos": [
    { "name": "Ali", "gender": "male", "url": "https://..." },
    { "name": "Bella", "gender": "female", "url": "https://..." }
  ]
}
```

### Aturan Penting:
- Gunakan **kutip ganda (`"`)** — bukan kutip tunggal.
- **Tidak ada koma** setelah item terakhir dalam array.
- Validasi dengan [JSONLint](https://jsonlint.com/) jika ragu.

---

## 📤 Sistem Upload Otomatis (halaman `/upload`)

Alur baru — **tanpa WhatsApp, tanpa kontak admin**, semua otomatis:

1. User **pilih foto** dari galeri.
2. User isi **Nama Foto**, **Tanggal**, dan **Uploader** (nama dia sendiri).
3. User klik **UPLOAD** → progress bar berjalan otomatis:
   - Foto diunggah ke **ImgBB** (progress real-time).
   - `DB/photos.json` terbaru dibaca langsung dari branch via **GitHub Contents API**.
   - Entri baru ditambahkan + **di-commit balik ke repo** (langsung tampil di galeri web & aplikasi setelah deploy).

Format entri baru di `DB/photos.json`:

```json
{
  "name": "Kenangan kelas XI",
  "type": "photo",
  "url": "https://i.ibb.co.com/xxxx.jpg",
  "date": "2026-10-19",
  "gender": "all",
  "uploader": "Nama Si Pengunggah"
}
```

Field **`uploader`** ditampilkan oleh halaman `/photo` (footer) dan bisa dipakai aplikasi pendamping.

### ⚙️ Konfigurasi (`upload/config.js`)

| Key | Isi | Keterangan |
|-----|-----|------------|
| `IMGBB_API_KEY` | key ImgBB kamu | https://api.imgbb.com |
| `GITHUB_REPO` | `"username/repo"` | repo tempat `DB/photos.json` berada |
| `GITHUB_BRANCH` | `"main"` | branch tujuan commit |
| `PHOTOS_PATH` | `"DB/photos.json"` | path file data |

Aplikasi pendamping (WebView) boleh menyuntik config dinamis sebelum `script.js` jalan:

```js
webView.evaluateJavascript("window.__TJK_CONFIG__={IMGBB_API_KEY:'...',GITHUB_TOKEN:'...',GITHUB_REPO:'user/repo',GITHUB_BRANCH:'main'}");
```

Bridge yang dipertahankan: `window.FlutterUploadHandler.postMessage(payload)` (mode tanpa token → payload JSON siap-commit dikirim ke aplikasi), dan deep link URI `tkjone://photo/<nama>` dari halaman `/photo`.

### 🔐 GitHub Secrets / ENV (untuk Actions)

Simpan di **Settings → Secrets and variables → Actions**:

| Nama Secret | Nilai |
|-------------|-------|
| `IMGBB_API_KEY` | API key ImgBB |
| `GITHUB_TOKEN` | fine-grained PAT (Contents: Read & Write, satu repo saja) — atau `${{ secrets.GITHUB_TOKEN }}` bawaan Actions |
| `GH_REPO` | `username/repo` |
| `GH_BRANCH` | `main` |

Lalu pada workflow deploy, sematkan nilainya ke `upload/config.js` (contoh step):

```yaml
- name: Inject secrets into upload config
  env:
    IMGBB_API_KEY: ${{ secrets.IMGBB_API_KEY }}   # <-- API KEY IMGEBB MASUK KE SINI
    GH_REPO:       ${{ secrets.GH_REPO }}         # <-- "username/repo" MASUK KE SINI
    GH_BRANCH:     ${{ secrets.GH_BRANCH }}       # <-- nama branch MASUK KE SINI
  run: |
    sed -i "s|IMGBB_API_KEY: \"[^\"]*\"|IMGBB_API_KEY: \"$IMGBB_API_KEY\"|" upload/config.js
    sed -i "s|GITHUB_REPO:   \"[^\"]*\"|GITHUB_REPO:   \"$GH_REPO\"|"           upload/config.js
    sed -i "s|GITHUB_BRANCH: \"[^\"]*\"|GITHUB_BRANCH: \"$GH_BRANCH\"|"         upload/config.js
```

> ⚠️ Halaman statis tidak bisa menyembunyikan rahasia. Token yang dipakai browser **harus** fine-grained PAT berumur pendek dengan akses *Contents: Read & Write* hanya ke repo ini. Untuk keamanan maksimal, suruh aplikasi pendamping yang menyuntik `window.__TJK_CONFIG__` (token tidak pernah tertulis di file publik).

---

## 🌟 Fitur Website (TKJ OnE Edition)

| Fitur                          | Deskripsi |
|-------------------------------|----------|
| 🔤 Sortir Otomatis            | Foto diurutkan A–Z berdasarkan nama |
| 🚻 Filter Gender              | Tampilkan hanya laki-laki/perempuan |
| 🔍 Pencarian Real-time        | Cari berdasarkan nama (case-insensitive) |
| 🌓 Toggle Tema                | Simpan preferensi tema (gelap/terang) di localStorage |
| 📱 Responsive Design          | Tampil sempurna di HP, tablet, desktop |
| ⏳ Lazy Loading               | Gambar dimuat saat scroll — hemat kuota & RAM |
| 💾 Download Foto              | Tombol unduh dengan timestamp otomatis |
| 📞 Menu Developer             | Akses cepat ke kontak WhatsApp (untuk kolaborasi & feedback) |
| 🧠 Persistensi Preferensi     | Filter, pencarian, dan tema diingat antar kunjungan |

> Semua fitur dibangun **tanpa framework berat** — murni HTML, CSS, dan Vanilla JavaScript — demi efisiensi dan kompatibilitas jangka panjang.

---

## 🛠️ Tips & Best Practices

1. **Nama Siswa**: Gunakan nama yang **unik dan konsisten** (hindari duplikat).
2. **Ukuran Gambar**: Kompres ke **200–500 KB** (gunakan [TinyPNG](https://tinypng.com/) atau [Squoosh](https://squoosh.app/)).
3. **Format**: `.jpg` lebih ringan; `.png` jika butuh transparansi.
4. **Link Aktif**: Uji setiap URL sebelum commit — pastikan bisa diakses publik.
5. **Git Friendly**: Setiap perubahan di `photos.json` bisa dilacak via version control.

---

## 🚨 Troubleshooting

| Masalah                     | Solusi |
|----------------------------|--------|
| Foto tidak muncul          | - Cek URL (harus langsung ke gambar)<br>- Validasi JSON<br>- Buka DevTools → tab Network → cek error 404/403 |
| Website error / blank      | - Buka **Console (F12)**<br>- Pastikan `DB/photos.json` tersedia dan format valid |
| Perubahan tidak terlihat   | - **Hard refresh**: `Ctrl + F5` (Windows) / `Cmd + Shift + R` (Mac)<br>- Clear cache browser |
| Filter/search tidak bekerja| - Pastikan tidak ada typo di field `gender` atau `name` |

---

## 🤝 Dukungan & Kolaborasi

Proyek ini dibuat untuk **komunitas TKJ OnE** — terbuka untuk kontribusi, saran, dan pengembangan bersama.

💬 **Butuh bantuan?**  
Gunakan tombol **"Hubungi Developer"** di website untuk langsung terhubung via WhatsApp.

🌐 Ingin berkontribusi?  
- Fork repositori  
- Edit `photos.json`  
- Submit pull request  

> *"Satu kelas, satu keluarga. Dokumentasi ini adalah warisan digital kita."*

---

✨ **Dibangun dengan semangat TKJ OnE — teknologi, kolaborasi, dan kebanggaan kelas.**  
🛠️ *Optimized for learning, sharing, and preserving memories.*