/* ============================================================
   TKJ OnE — Konfigurasi Upload (file ini di-include duluan)
   ------------------------------------------------------------
   ⚠️ PENTING — GANTI NILAI DI BAWAH INI SEBELUM DEPLOY:

   1. IMGBB_API_KEY : API key ImgBB kamu.
        - Dapatkan di: https://api.imgbb.com/
        - Kosongkan string "" jika ingin ambil dari GitHub Secrets.

   2. GITHUB_REPO   : "pemilik/nama-repo" tempat DB/photos.json berada.
        Contoh: "Jirankun/tkj1"

   3. GITHUB_BRANCH : Nama branch tujuan commit (umumnya "main").

   ------------------------------------------------------------
   📌 REKOMENDASI UNTUK GITHUB ACTIONS / ENV:
   Nilai di bawah adalah FALLBACK saja. Sebaiknya simpan API key
   di GitHub Secrets dengan nama:
        IMGBB_API_KEY   → API key ImgBB
        GITHUB_TOKEN    → token bawaan Actions (auto, tidak perlu dibuat)
        GH_REPO         → "pemilik/repo"
        GH_BRANCH       → "main"
   lalu isi file config.js ini lewat workflow saat build/deploy,
   atau biarkan kosong agar halaman memakai window.__TJK_CONFIG__
   yang bisa disuntikkan oleh aplikasi pendamping (WebView).
   ============================================================ */
window.TJK_DEFAULTS = {
  IMGBB_API_KEY: "0a202282d915d3289d5132ceec0f758a",  // <-- API key ImgBB kamu (lihat README untuk cara pindah ke GitHub Secrets)
  GITHUB_REPO:   "",            // <-- ISI "username/repo" DI SINI
  GITHUB_BRANCH: "main",        // <-- branch tujuan commit
  PHOTOS_PATH:   "DB/photos.json"
};
