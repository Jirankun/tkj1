# Dokumentasi Album Foto Kelas

## Struktur Folder

```
Album kelas/
├── index.html                 # File utama website
├── DB/
│   └── photos.json           # File database foto
└── README.md                 # File dokumentasi ini
```

## Cara Menambahkan Foto Baru

### 1. Edit File `DB/photos.json`

File `photos.json` berisi semua data foto dalam format JSON. Untuk menambahkan foto baru, ikuti langkah berikut:

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

### 2. Format Data Foto

Setiap foto harus memiliki struktur berikut:

| Field | Tipe | Keterangan |
|-------|------|-----------|
| `name` | String | Nama siswa (tampil di galeri) |
| `gender` | String | Jenis kelamin: `"male"` atau `"female"` |
| `url` | String | Link URL ke gambar (gunakan imgbb atau hosting lainnya) |

### 3. Contoh Penambahan Foto

```json
{
  "photos": [
    {
      "name": "Zhyllan",
      "gender": "male",
      "url": "https://i.ibb.co.com/Fqy0Dgdj/4-Nov-14-35-lmc-8-4-1.jpg"
    },
    {
      "name": "Thallita",
      "gender": "female",
      "url": "https://i.ibb.co/8xYtK6m/thallita.jpg"
    },
    {
      "name": "Siswa Baru",
      "gender": "male",
      "url": "https://link-foto-baru.jpg"
    }
  ]
}
```

### 4. Cara Upload Foto ke Internet

1. **Menggunakan ImgBB** (Rekomendasi):
   - Kunjungi https://imgbb.com
   - Upload foto Anda
   - Copy link URL
   - Paste di file `photos.json`

2. **Alternatif Lain**:
   - Imgur
   - Postimage
   - Tinypic
   - atau hosting image lainnya

## Format JSON yang Benar

Pastikan file JSON memiliki format yang valid:

```json
{
  "photos": [
    { "name": "...", "gender": "...", "url": "..." },
    { "name": "...", "gender": "...", "url": "..." }
  ]
}
```

⚠️ **Penting**: 
- Setiap item dipisahkan dengan koma (`,`)
- Item terakhir TIDAK memiliki koma
- Gunakan tanda kutip ganda (`"`) untuk string

## Fitur Website

✨ **Fitur yang Tersedia**:
- ✓ Galeri foto otomatis tersusun A-Z
- ✓ Filter berdasarkan jenis kelamin
- ✓ Search/pencarian nama siswa
- ✓ Download foto dengan tanggal
- ✓ Tema gelap dan terang
- ✓ Mode mobile responsive
- ✓ Lazy loading untuk performa optimal
- ✓ Menu developer dengan kontak WhatsApp
- ✓ Ingat preferensi user (filter, search, tema)

## Tips dan Trik

1. **Nama Siswa**: Gunakan nama yang unik agar mudah dibedakan
2. **Ukuran Foto**: Optimal 200-500KB per foto
3. **Format Foto**: JPG atau PNG
4. **Link URL**: Pastikan link masih aktif dan dapat diakses

## Troubleshooting

### Foto Tidak Muncul
- Periksa URL gambar - pastikan masih valid
- Cek format JSON - gunakan JSON validator online

### Website Error
- Buka browser DevTools (F12)
- Cek Console untuk pesan error
- Pastikan file `photos.json` ada di folder `DB/`

### Perubahan Tidak Terlihat
- Refresh browser dengan Ctrl+F5
- Clear browser cache
- Tunggu beberapa detik setelah save

## Support
Untuk bantuan lebih lanjut, hubungi developer melalui fitur WhatsApp di website.
