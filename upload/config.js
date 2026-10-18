/* ============================================================
   TKJ OnE — Konfigurasi Upload (di-load SEBELUM script.js)
   ------------------------------------------------------------
   File ini cuma berisi FALLBACK. Nilai asli sebaiknya disuntik
   oleh aplikasi pendamping (WebView) lewat:
       window.__TJK_CONFIG__ = { ... }
   atau lewat GitHub Actions / environment secrets saat build.

   Kenapa? Halaman statis tidak bisa menyembunyikan rahasia.
   Token yang dipakai di browser HARUS:
     - GitHub: fine-grained PAT, Contents: Read & Write,
       hanya untuk SATU repo ini, kedaluwarsa 30/90 hari.
     - ImgBB: API key biasa dari https://api.imgbb.com

   Komentar di bawah ini adalah petunjuk untuk MASUKKAN nilainya
   ke GitHub Actions env / secrets.
   ============================================================ */

window.TJK_DEFAULTS = {
  // Nilai asli TIDAK boleh di-commit. Kosongkan di repo, isi lewat
  // window.__TJK_CONFIG__ (WebView) atau workflow deploy.
  IMGBB_API_KEY: "",
  GITHUB_TOKEN: "",
  GITHUB_REPO: "",
  GITHUB_BRANCH: "main",
  PHOTOS_PATH: "DB/photos.json"
};


/*
   ============================================================
   PETUNJUK ENTRY KE GITHUB ACTIONS / ENV
   ============================================================

   Simpan secret di repo GitHub:
     Settings -> Secrets and variables -> Actions -> New repository secret

   Secret yang dibutuhkan:
     IMGBB_API_KEY   -> API key ImgBB kamu
     GH_REPO         -> "username/repo" (repo tempat DB/photos.json)
     GH_BRANCH       -> "main" (atau branch tujuan lain)
     GITHUB_TOKEN    -> (opsional) fine-grained PAT berisi Contents: Read & Write
                        untuk satu repo ini. Bisa juga pakai ${{ secrets.GITHUB_TOKEN }}
                        bawaan Actions kalau workflow berjalan di repo yang sama.

   Contoh step di workflow (yaitu di file .github/workflows/*.yml):
------------------------------------------------------------
# Contoh workflow (bukan copy-paste siap jalan — sesuaikan dengan.yml kalian)

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Inject upload secrets ke config.js
        env:
          IMGBB_API_KEY: ${{ secrets.IMGBB_API_KEY }}
          GH_REPO:       ${{ secrets.GH_REPO }}
          GH_BRANCH:     ${{ secrets.GH_BRANCH }}
          GITHUB_TOKEN:  ${{ secrets.GITHUB_TOKEN }}
        run: |
          # Ganti nilai di config.js dengan secret dari GitHub
          # (hanya dilakukan di build environment, tidak masuk ke kode sumber)

          perl -0pi -e 's/IMGBB_API_KEY:\s*"[^"]*"/IMGBB_API_KEY: "$ENV{IMGBB_API_KEY}"/'             app/src/main/assets/upload/config.js

          perl -0pi -e 's/GITHUB_REPO:\s*"[^"]*"/GITHUB_REPO: "$ENV{GH_REPO}"/'             app/src/main/assets/upload/config.js

          perl -0pi -e 's/GITHUB_BRANCH:\s*"[^"]*"/GITHUB_BRANCH: "$ENV{GH_BRANCH}"/'             app/src/main/assets/upload/config.js

          # Kalau mau, inject juga GITHUB_TOKEN lewat window.__TJK_CONFIG__
          # (lebih aman daripada menulisnya ke file statis)
------------------------------------------------------------

   Catatan penting:
     - JANGAN commit config.js yang sudah berisi API key / token asli.
     - Kalau aplikasi pendamping (Android/WebView) injeksi config lewat
       JavaScript sebelum halaman upload jalan, CONFIG di bawah boleh kosong.
     - File DB/photos.json harus sudah ada di repo dan branch yang benar.
*/
