/* ============================================================
   TKJ OnE — Upload Otomatis (ImgBB + GitHub JSON)
   ------------------------------------------------------------
   ALUR BARU:
     1. User pilih foto
     2. User isi: Nama Foto, Tanggal, Uploader (nama dia sendiri)
     3. User klik UPLOAD → progress otomatis:
        a. Upload gambar ke ImgBB
        b. Ambil DB/photos.json terbaru dari branch
        c. Tambah entri baru (name,type,url,date,gender,uploader)
        d. Commit balik ke repo via GitHub API
   SELESAI — tanpa WhatsApp, tanpa kontak admin.

   ⚠️ CATATAN KEAMANAN PENTING:
   Halaman statis tidak bisa menyembunyikan token. Token yang
   dipakai di sini HARUS fine-grained PAT dengan akses:
     - Contents: Read & Write  pada SATU repo ini saja
     - Expire: 30/90 hari (wajib)
   Simpan idealnya lewat GitHub Actions/Secrets (lihat README).
   ============================================================ */
'use strict';

// ==================== KONFIGURASI ====================
const INJ = window.__TJK_CONFIG__ || {};       // injeksi dari aplikasi pendamping (WebView)
const DEF = window.TJK_DEFAULTS   || {};       // fallback dari ./config.js

const IMGBB_API_KEY = INJ.IMGBB_API_KEY || DEF.IMGBB_API_KEY || "";
const GITHUB_TOKEN  = INJ.GITHUB_TOKEN  || DEF.GITHUB_TOKEN  || "";
const GITHUB_REPO   = INJ.GITHUB_REPO   || DEF.GITHUB_REPO   || "";
const GITHUB_BRANCH = INJ.GITHUB_BRANCH || DEF.GITHUB_BRANCH || "main";
const PHOTOS_PATH   = INJ.PHOTOS_PATH   || DEF.PHOTOS_PATH   || "DB/photos.json";

// ==================== ELEMEN ====================
const $ = id => document.getElementById(id);
const triggerBtn     = $("triggerBtn");
const fileInput      = $("fileInput");
const mainContent    = $("mainContent");
const formSection    = $("formSection");
const uploadedImg    = $("uploadedImg");
const photoNameInput = $("photoName");
const photoDateInput = $("photoDate");
const uploaderInput  = $("uploaderName");
const genderInputs   = document.querySelectorAll('input[name="gender"]');
const codePreview    = $("codePreview");
const submitBtn      = $("submitBtn");
const overlay        = $("progressOverlay");
const progressIcon   = $("progressIcon");
const progressStep   = $("progressStep");
const progressFill   = $("progressFill");
const progressPct    = $("progressPercent");
const resultSection  = $("resultSection");
const resultIcon     = $("resultIcon");
const resultTitle    = $("resultTitle");
const resultDesc     = $("resultDesc");
const resultLink     = $("resultLink");
const againBtn       = $("againBtn");

// ==================== STATE ====================
let selectedFile = null;
let imgbbUrl     = "";
let busy         = false;

// ==================== UTIL ====================
function todayISO() {
  const n = new Date();
  return n.getFullYear() + "-" +
    String(n.getMonth() + 1).padStart(2, "0") + "-" +
    String(n.getDate()).padStart(2, "0");
}

function setProgress(pct, stepText, icon) {
  progressFill.style.width = Math.max(0, Math.min(100, pct)) + "%";
  progressPct.textContent  = Math.round(Math.max(0, Math.min(100, pct))) + "%";
  if (stepText) progressStep.textContent = stepText;
  if (icon)     progressIcon.textContent = icon;
}

function showOverlay(on) {
  overlay.classList.toggle("active", on);
  overlay.setAttribute("aria-hidden", String(!on));
  busy = on;
}

function getGender() {
  const sel = document.querySelector('input[name="gender"]:checked');
  return sel ? sel.value : "all";
}

function buildEntry() {
  return {
    name:     photoNameInput.value.trim(),
    type:     "photo",
    url:      imgbbUrl,
    date:     photoDateInput.value || todayISO(),
    gender:   getGender(),
    uploader: uploaderInput.value.trim()
  };
}

function updatePreview() {
  codePreview.textContent = JSON.stringify(buildEntry(), null, 2);
}

function validateForm() {
  const ok = !!selectedFile &&
             photoNameInput.value.trim().length > 0 &&
             !!photoDateInput.value &&
             uploaderInput.value.trim().length > 0 &&
             !busy;
  submitBtn.className = ok ? "submit-btn enabled" : "submit-btn disabled";
}

function resetAll() {
  selectedFile = null;
  imgbbUrl = "";
  fileInput.value = "";
  photoNameInput.value = "";
  photoDateInput.value = todayISO();
  uploaderInput.value  = localStorage.getItem("tjk_uploader") || "";
  document.querySelector('input[name="gender"][value="all"]').checked = true;
  mainContent.style.display  = "flex";
  formSection.style.display  = "none";
  resultSection.style.display = "none";
  updatePreview();
  validateForm();
}

// ==================== LANGKAH 1 : PILIH FOTO ====================
triggerBtn.addEventListener("click", () => { if (!busy) fileInput.click(); });

fileInput.addEventListener("change", (e) => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  const fileName = file.name || "";
  const ext = fileName.substring(fileName.lastIndexOf(".")).toLowerCase();
  const allowedExts = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
  if (!allowedTypes.includes(file.type) && !allowedExts.includes(ext)) {
    alert("Format file tidak didukung. Gunakan JPG, PNG, WebP, atau GIF.");
    fileInput.value = "";
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    alert("Ukuran file terlalu besar. Maksimal 10MB.");
    fileInput.value = "";
    return;
  }

  selectedFile = file;
  const reader = new FileReader();
  reader.onload = (ev) => {
    uploadedImg.src = ev.target.result;
    mainContent.style.display = "none";
    formSection.style.display = "block";
    if (!photoDateInput.value) photoDateInput.value = todayISO();
    updatePreview();
    validateForm();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  reader.readAsDataURL(selectedFile);
});

// ==================== BINDINGS FORM ====================
photoNameInput.addEventListener("input", () => { updatePreview(); validateForm(); });
photoDateInput.addEventListener("change", () => { updatePreview(); validateForm(); });
uploaderInput.addEventListener("input", () => {
  localStorage.setItem("tjk_uploader", uploaderInput.value.trim());
  updatePreview();
  validateForm();
});
genderInputs.forEach(r => r.addEventListener("change", () => { updatePreview(); validateForm(); }));

// ==================== UPLOAD IMGEBB (dengan progress) ====================
function uploadToImgBB() {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const fd = new FormData();
    fd.append("key", IMGBB_API_KEY);
    fd.append("image", selectedFile);

    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable) {
        // fase upload ImgBB dipetakan ke 0–70% total
        setProgress((ev.loaded / ev.total) * 70, "Mengunggah foto ke ImgBB...", "📤");
      }
    };
    xhr.onload = () => {
      try {
        const res = JSON.parse(xhr.responseText);
        if (res.success && res.data && res.data.url) resolve(res.data.url);
        else reject(new Error((res.error && res.error.message) || "ImgBB menolak file"));
      } catch { reject(new Error("Respons ImgBB tidak valid")); }
    };
    xhr.onerror = () => reject(new Error("Gagal koneksi ke ImgBB"));
    xhr.open("POST", "https://api.imgbb.com/1/upload");
    xhr.send(fd);
  });
}

// ==================== DECODE BASE64 → UTF-8 ====================
function b64ToUtf8(b64) {
  const bin = atob(b64.replace(/\n/g, ""));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder("utf-8").decode(bytes);
}

// ==================== BACA photos.json TERKINI (+SHA) ====================
async function readPhotosJson(token) {
  const ghEnabled = !!GITHUB_REPO;

  // -- Sumber 1: GitHub Contents API (terbaru di branch, sertakan SHA) --
  if (ghEnabled) {
    const headers = { "Accept": "application/vnd.github+json" };
    if (token) headers["Authorization"] = "Bearer " + token;
    const r = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/${PHOTOS_PATH}?ref=${GITHUB_BRANCH}`,
      { headers }
    );
    if (!r.ok) throw new Error("Gagal membaca photos.json dari GitHub (HTTP " + r.status + ")");
    const meta = await r.json(); // { sha, content(base64), ... }
    const text = meta.content ? b64ToUtf8(meta.content) : null;
    if (!text) throw new Error("Konten photos.json kosong dari GitHub API");
    const arr = JSON.parse(text);
    if (!Array.isArray(arr)) throw new Error("photos.json bukan array valid");
    return { list: arr, sha: meta.sha || null };
  }

  // -- Sumber 2: tanpa repo — pakai file lokal situs yang sama (mode manual/bridge) --
  const paths = ["../DB/photos.json", "/DB/photos.json"];
  for (const p of paths) {
    try {
      const r = await fetch(p + "?t=" + Date.now(), { cache: "no-store" });
      if (r.ok) {
        const arr = await r.json();
        if (Array.isArray(arr)) return { list: arr, sha: null };
      }
    } catch {}
  }
  throw new Error("Tidak dapat memuat photos.json. Isi GITHUB_REPO di config.js.");
}

// ==================== COMMIT KE GITHUB ====================
async function commitToGitHub(contentStr, sha, token) {
  const entry = buildEntry();
  const message = "chore(gallery): add photo \"" + entry.name +
                  "\" by " + entry.uploader + " (" + entry.date + ")";

  const body = {
    message: message,
    branch:  GITHUB_BRANCH,
    content: btoa(unescape(encodeURIComponent(contentStr))),
    committer: { name: entry.uploader, email: entry.uploader.toLowerCase().replace(/[^a-z0-9]/g, "") + "@users.noreply.github.com" }
  };
  if (sha) body.sha = sha;

  const r = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/contents/${PHOTOS_PATH}`,
    {
      method: "PUT",
      headers: {
        "Accept": "application/vnd.github+json",
        "Authorization": "Bearer " + token,
        "X-GitHub-Api-Version": "2022-11-28"
      },
      body: JSON.stringify(body)
    }
  );

  const res = await r.json().catch(() => ({}));
  if (!r.ok) {
    throw new Error("GitHub menolak commit: " + ((res.message || "")) + " (HTTP " + r.status + ")");
  }
  return res;
}

// ==================== KLIK UPLOAD ====================
submitBtn.addEventListener("click", async () => {
  if (submitBtn.classList.contains("disabled") || busy) return;

  if (!IMGBB_API_KEY) {
    alert("IMGBB_API_KEY belum diisi. Buka upload/config.js dan isi API key ImgBB kamu.");
    return;
  }

  showOverlay(true);
  setProgress(2, "Menyiapkan...", "📤");

  try {
    // ── 1. Upload ke ImgBB ─────────────────────────────
    imgbbUrl = await uploadToImgBB();
    setProgress(72, "Foto tersimpan di ImgBB ✔", "🖼️");

    // ── 2. Baca photos.json terkini ────────────────────
    const hasToken = !!GITHUB_TOKEN;
    const canCommit = hasToken && !!GITHUB_REPO;
    const token = hasToken ? GITHUB_TOKEN : "";
    const { list, sha } = await readPhotosJson(token);
    setProgress(80, "Data galeri dimuat ✔", "🗂️");

    // Validasi duplikat nama
    const entry = buildEntry();
    if (list.some(p => String(p.name).trim().toLowerCase() === entry.name.toLowerCase())) {
      throw new Error("Nama foto \"" + entry.name + "\" sudah ada di galeri. Ganti nama lain ya.");
    }

    // ── 3. Tambah entri baru ───────────────────────────
    list.push(entry);
    const jsonStr = JSON.stringify(list, null, 2) + "\n";
    setProgress(88, "Entri baru ditambahkan ✔", "🧾");

    // ── 4. Commit ke GitHub ────────────────────────────
    if (canCommit) {
      if (!sha) throw new Error("SHA photos.json tidak ditemukan — tidak bisa commit aman.");
      await commitToGitHub(jsonStr, sha, token);
      setProgress(100, "Berhasil di-commit ke GitHub! 🎉", "✅");
    } else {
      // Mode tanpa token (misal dijalankan oleh GitHub Actions / aplikasi pendukung):
      // hasilkan payload siap kirim ke bridge aplikasi.
      setProgress(100, "Payload siap dikirim ke aplikasi", "📦");
      const payload = { repo: GITHUB_REPO, branch: GITHUB_BRANCH, path: PHOTOS_PATH, sha, message: "chore(gallery): add photo \"" + entry.name + "\"", content: jsonStr };
      if (window.FlutterUploadHandler) {
        window.FlutterUploadHandler.postMessage(JSON.stringify(payload));
      } else {
        console.warn("[TKJ Upload] GITHUB_TOKEN/GITHUB_REPO kosong. Payload manual:", payload);
      }
    }

    // ── 5. Tampilkan hasil ─────────────────────────────
    setTimeout(() => {
      showOverlay(false);
      formSection.style.display = "none";
      resultIcon.textContent = "✅";
      resultIcon.classList.remove("fail");
      resultTitle.textContent = "Upload Berhasil!";
      resultDesc.textContent =
        "Foto \"" + entry.name + "\" oleh " + entry.uploader +
        (canCommit ? " sudah masuk galeri TKJ OnE." : " menunggu sinkronisasi oleh aplikasi pendukung.");
      resultLink.textContent = imgbbUrl;
      resultSection.style.display = "block";
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 600);

  } catch (err) {
    showOverlay(false);
    resultIcon.textContent = "⚠️";
    resultIcon.classList.add("fail");
    resultTitle.textContent = "Upload Gagal";
    resultDesc.textContent = err.message || "Terjadi kesalahan tidak diketahui.";
    resultLink.textContent = imgbbUrl || "-";
    formSection.style.display = "none";
    resultSection.style.display = "block";
  }
});

// ==================== UPLOAD LAGI ====================
againBtn.addEventListener("click", resetAll);

// ==================== INIT ====================
(function init() {
  photoDateInput.value = todayISO();
  photoDateInput.max   = todayISO();
  uploaderInput.value  = localStorage.getItem("tjk_uploader") || "";
  updatePreview();
  validateForm();
})();
