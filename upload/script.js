/* ============================================================
   TKJ OnE — Upload Foto (ImgBB + GitHub Contents API)
   ------------------------------------------------------------
   Alur:
     1. Pilih foto
     2. Isi nama foto, tanggal, uploader
     3. Upload -> progress inline di halaman:
        a. foto ke ImgBB
        b. baca DB/photos.json terbaru
        c. entri { name, type, url, date, uploader } ditambahkan
        d. commit ke repo lewat GitHub Contents API

   Konfigurasi berasal dari window.TJK_DEFAULTS di config.js.
   ============================================================ */
'use strict';

(function () {
  /* ---------------- Konfigurasi ---------------- */
  const DEF = window.TJK_DEFAULTS || {};

  const str = (v) => String(v == null ? '' : v).trim();

  const IMGBB_KEY = str(DEF.IMGBB_API_KEY);
  const TOKEN = str(DEF.GITHUB_TOKEN);
  const REPO = str(DEF.GITHUB_REPO);
  const BRANCH = str(DEF.GITHUB_BRANCH) || 'main';
  const PHOTOS_PATH = str(DEF.PHOTOS_PATH) || 'DB/photos.json';

  /* ---------------- Elemen ---------------- */
  const $ = (id) => document.getElementById(id);

  const triggerBtn = $('triggerBtn');
  const changeBtn = $('changeBtn');
  const fileInput = $('fileInput');
  const mainContent = $('mainContent');
  const formSection = $('formSection');
  const uploadedImg = $('uploadedImg');
  const photoName = $('photoName');
  const photoDate = $('photoDate');
  const uploaderName = $('uploaderName');
  const formError = $('formError');
  const submitBtn = $('submitBtn');
  const submitText = $('submitText');
  const submitHint = $('submitHint');
  const compressNote = $('compressNote');

  const progressBox = $('progressBox');
  const progressStep = $('progressStep');
  const progressFill = $('progressFill');
  const progressPercent = $('progressPercent');

  const resultSection = $('resultSection');
  const resultIcon = $('resultIcon');
  const resultTitle = $('resultTitle');
  const resultDesc = $('resultDesc');
  const resultLink = $('resultLink');
  const againBtn = $('againBtn');

  /* ---------------- State ---------------- */
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const ALLOWED_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  const UPLOADER_KEY = 'tjk_uploader';

  function getSlugFromUrl() {
    try {
      const qs = new URLSearchParams(location.search);
      return (qs.get('u') || qs.get('user') || qs.get('slug') || qs.get('username') || qs.get('uname') || '').trim();
    } catch (e) {
      return '';
    }
  }
  const urlSlug = getSlugFromUrl();

  // Foto di atas ambang ini dikompresi otomatis di perangkat user.
  const COMPRESS_LIMIT = 10 * 1024 * 1024;
  const COMPRESS_STEPS = [
    { maxSize: 2560, quality: 0.85 },
    { maxSize: 2048, quality: 0.72 },
    { maxSize: 1600, quality: 0.6 },
    { maxSize: 1280, quality: 0.5 }
  ];

  let file = null;        // file asli pilihan user
  let uploadFile = null;  // file yang benar-benar diunggah (hasil kompresi bila ada)
  let compressing = false;
  let previewUrl = '';
  let busy = false;
  let remoteUrl = '';

  /* ---------------- Util ---------------- */
  function todayISO() {
    const d = new Date();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + day;
  }

  function photoLink(name) {
    return location.origin + '/photo/?name=' + encodeURIComponent(name);
  }

  function showError(message) {
    if (!message) {
      formError.textContent = '';
      formError.classList.add('hidden');
      return;
    }
    formError.textContent = message;
    formError.classList.remove('hidden');
  }

  function setProgress(value, text) {
    const v = Math.max(0, Math.min(100, value));
    progressFill.style.width = v + '%';
    progressPercent.textContent = Math.round(v) + '%';
    if (text) progressStep.textContent = text;
  }

  function lockForm(locked) {
    busy = locked;
    [photoName, photoDate, uploaderName, submitBtn].forEach((el) => {
      if (el) el.disabled = locked;
    });
    if (changedFileBtn) changedFileBtn.disabled = locked;
    if (submitText) submitText.textContent = locked ? 'Mengunggah…' : 'Upload Sekarang';
    if (locked) {
      progressBox.classList.remove('hidden');
      submitBtn.classList.remove('enabled');
      submitBtn.classList.add('disabled');
    } else {
      progressBox.classList.add('hidden');
      refreshSubmit();
    }
  }

  const changedFileBtn = changeBtn;

  function formatMB(bytes) {
    return (bytes / (1024 * 1024)).toFixed(1).replace('.', ',') + ' MB';
  }

  function setCompressNote(text, kind) {
    if (!compressNote) return;
    compressNote.textContent = text || '';
    compressNote.classList.toggle('hidden', !text);
    compressNote.classList.toggle('done', kind === 'done');
    compressNote.classList.toggle('warn', kind === 'warn');
  }

  function valid() {
    return !compressing
      && !!(uploadFile || file)
      && photoName.value.trim().length > 0
      && photoDate.value.length > 0
      && uploaderName.value.trim().length > 0;
  }

  function refreshSubmit() {
    if (busy) return;
    const ok = valid();
    submitBtn.disabled = !ok;
    submitBtn.classList.toggle('enabled', ok);
    submitBtn.classList.toggle('disabled', !ok);

    if (compressing) {
      submitHint.textContent = 'Menyiapkan foto… kamu tetap bisa mengisi data di bawah.';
    } else if (ok) {
      submitHint.textContent = 'Siap diunggah. Periksa data sebelum menekan tombol.';
    } else {
      submitHint.textContent = 'Lengkapi nama foto, tanggal, dan uploader.';
    }
  }

  /* ---------------- Pilih foto ---------------- */
  function pickFile() {
    if (!busy) fileInput.click();
  }

  triggerBtn.addEventListener('click', pickFile);
  if (changeBtn) changeBtn.addEventListener('click', pickFile);

  fileInput.addEventListener('change', (e) => {
    const picked = e.target.files && e.target.files[0];
    if (!picked) return;

    const ext = picked.name.slice(picked.name.lastIndexOf('.')).toLowerCase();
    if (!ALLOWED_TYPES.includes(picked.type) && !ALLOWED_EXTS.includes(ext)) {
      showError('Format tidak didukung. Gunakan JPG, PNG, WebP, atau GIF.');
      fileInput.value = '';
      return;
    }

    showError('');
    file = picked;
    uploadFile = picked;
    compressing = false;
    setCompressNote('');
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      uploadedImg.src = String(ev.target.result);
      mainContent.classList.add('hidden');
      formSection.classList.remove('hidden');
      formSection.setAttribute('aria-hidden', 'false');
      if (!photoDate.value) photoDate.value = todayISO();
      refreshSubmit();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      maybeCompress(picked);
    };
    reader.onerror = () => {
      file = null;
      showError('Gagal membaca file. Coba pilih ulang.');
    };
    reader.readAsDataURL(picked);
  });

  /* ---------------- Input ---------------- */
  photoName.addEventListener('input', () => { showError(''); refreshSubmit(); });
  photoDate.addEventListener('change', () => { showError(''); refreshSubmit(); });
  uploaderName.addEventListener('input', () => {
    if (uploaderName.readOnly) return;
    localStorage.setItem(UPLOADER_KEY, uploaderName.value.trim());
    showError('');
    refreshSubmit();
  });

  /* ---------------- Kompresi foto besar ---------------- */
  function compressOnce(srcFile, step) {
    return new Promise((resolve, reject) => {
      if (typeof window.Compressor !== 'function') {
        reject(new Error('Library kompresi tidak tersedia'));
        return;
      }
      new window.Compressor(srcFile, {
        maxWidth: step.maxSize,
        maxHeight: step.maxSize,
        quality: step.quality,
        mimeType: 'image/jpeg',
        success: resolve,
        error: reject
      });
    });
  }

  async function compressToLimit(srcFile) {
    let result = null;
    for (let i = 0; i < COMPRESS_STEPS.length; i++) {
      setCompressNote('Mengompres ' + formatMB(srcFile.size) + '…');
      try {
        result = await compressOnce(srcFile, COMPRESS_STEPS[i]);
      } catch (e) {
        return null;
      }
      if (result && result.size <= COMPRESS_LIMIT) break;
    }
    return result;
  }

  async function maybeCompress(srcFile) {
    if (srcFile.size <= COMPRESS_LIMIT) {
      setCompressNote('');
      return;
    }

    if (srcFile.type === 'image/gif') {
      setCompressNote(
        'GIF ' + formatMB(srcFile.size) + ' tidak dikompresi agar tetap bergerak.',
        'warn'
      );
      return;
    }

    compressing = true;
    refreshSubmit();
    setCompressNote('Foto ' + formatMB(srcFile.size) + ' — mengompres di perangkat…');

    const out = await compressToLimit(srcFile);

    // Abaikan hasil bila user sudah memilih foto lain.
    if (srcFile !== file) return;

    compressing = false;

    if (out && out.size < srcFile.size) {
      uploadFile = out;
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      previewUrl = URL.createObjectURL(out);
      uploadedImg.src = previewUrl;
      setCompressNote(
        'Foto diringkas ' + formatMB(srcFile.size) + ' → ' + formatMB(out.size) + ' ✓',
        'done'
      );
    } else {
      setCompressNote(
        'Kompresi tidak berhasil. Foto asli (' + formatMB(srcFile.size) + ') tetap dipakai.',
        'warn'
      );
    }

    refreshSubmit();
  }

  /* ---------------- ImgBB ---------------- */
  function uploadToImgBB() {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const body = new FormData();

      // Kirim sesuai bentuk yang diterima ImgBB: key + file asli.
      // Jangan ubah Content-Type / jangan konversi ke base64 manual.
      body.append('key', IMGBB_KEY);
      body.append('image', uploadFile || file);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setProgress((e.loaded / e.total) * 70, 'Mengunggah foto…');
        }
      };

      xhr.onload = () => {
        const status = xhr.status || 0;
        let res = null;
        try { res = JSON.parse(xhr.responseText); } catch (e) { /* di bawah */ }

        if (res && res.success && res.data && res.data.url) {
          resolve(String(res.data.url));
          return;
        }

        const msg = (
          (res && res.error && res.error.message) ? res.error.message
          : (res && typeof res.status_txt === 'string' && res.status_txt.trim()) ? res.status_txt.trim()
          : (res && typeof res.status_code === 'number') ? ('ImgBB error ' + res.status_code)
          : ('ImgBB error HTTP ' + status)
        );
        reject(new Error(msg));
      };

      xhr.onerror = () => {
        console.warn('[upload] imgbb request failed, status:', xhr.status);
        reject(new Error('Gagal terhubung ke ImgBB.'));
      };
      xhr.ontimeout = () => {
        console.warn('[upload] imgbb request timeout');
        reject(new Error('Upload ke ImgBB melewati batas waktu.'));
      };

      xhr.open('POST', 'https://api.imgbb.com/1/upload');
      xhr.timeout = 60000;
      xhr.send(body);
    });
  }

  /* ---------------- GitHub ---------------- */
  function b64ToUtf8(b64) {
    const bin = atob(String(b64).replace(/\s/g, ''));
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder('utf-8').decode(bytes);
  }

  function utf8ToB64(text) {
    const bytes = new TextEncoder().encode(text);
    let bin = '';
    bytes.forEach((b) => { bin += String.fromCharCode(b); });
    return btoa(bin);
  }

  function ghHeaders(withAuth) {
    const h = {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    };
    if (withAuth) h.Authorization = 'Bearer ' + TOKEN;
    return h;
  }

  async function readPhotos() {
    const url = 'https://api.github.com/repos/' + REPO +
      '/contents/' + PHOTOS_PATH + '?ref=' + encodeURIComponent(BRANCH);
    const res = await fetch(url + '&t=' + Date.now(), { headers: ghHeaders(!!TOKEN) });

    if (res.status === 404) throw new Error('File ' + PHOTOS_PATH + ' tidak ditemukan di repo.');
    if (!res.ok) throw new Error('Gagal membaca data galeri (HTTP ' + res.status + ').');

    const meta = await res.json();
    if (!meta.content) throw new Error('Isi data galeri kosong.');

    let data;
    try { data = JSON.parse(b64ToUtf8(meta.content)); } catch (e) {
      throw new Error('Data galeri bukan JSON yang valid.');
    }

    const list = Array.isArray(data) ? data
      : (Array.isArray(data.entries) ? data.entries : null);
    if (!list) throw new Error('Struktur data galeri tidak dikenali.');

    return { data, list, sha: meta.sha || null };
  }

  function serialize(data, list) {
    const out = Array.isArray(data) ? list : Object.assign({}, data, { entries: list });
    return JSON.stringify(out, null, 2) + '\n';
  }

  async function commit(text, sha) {
    const entryName = photoName.value.trim();
    const uploader = uploaderName.value.trim();
    const date = photoDate.value;

    const body = {
      message: 'chore(gallery): add "' + entryName + '" by ' + uploader + ' (' + date + ')',
      content: utf8ToB64(text),
      branch: BRANCH
    };
    if (sha) body.sha = sha;

    const res = await fetch(
      'https://api.github.com/repos/' + REPO + '/contents/' + PHOTOS_PATH,
      {
        method: 'PUT',
        headers: Object.assign(ghHeaders(true), { 'Content-Type': 'application/json' }),
        body: JSON.stringify(body)
      }
    );

    if (res.status === 409) {
      const err = new Error('CONFLICT');
      err.conflict = true;
      throw err;
    }

    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(
        'GitHub menolak menyimpan data (' + res.status + ')' +
        (payload && payload.message ? ': ' + payload.message : '.')
      );
    }
    return payload;
  }

  /* ---------------- Bridge aplikasi ---------------- */
  function sendToAppBridge(payload) {
    try {
      if (window.FlutterUploadHandler &&
          typeof window.FlutterUploadHandler.postMessage === 'function') {
        window.FlutterUploadHandler.postMessage(JSON.stringify(payload));
        return true;
      }
    } catch (e) { /* diabaikan */ }

    try {
      if (window.AndroidInterface &&
          typeof window.AndroidInterface.savePhoto === 'function') {
        window.AndroidInterface.savePhoto(JSON.stringify(payload));
        return true;
      }
    } catch (e) { /* diabaikan */ }

    return false;
  }

  /* ---------------- Hasil ---------------- */
  function showResult(ok, title, desc, link) {
    formSection.classList.add('hidden');
    formSection.setAttribute('aria-hidden', 'true');
    mainContent.classList.add('hidden');
    resultSection.classList.remove('hidden');
    resultSection.setAttribute('aria-hidden', 'false');

    resultIcon.classList.toggle('fail', !ok);
    resultIcon.innerHTML = ok
      ? '<i class="fa-solid fa-check" aria-hidden="true"></i>'
      : '<i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>';

    resultTitle.textContent = title;
    resultDesc.textContent = desc;

    if (link) {
      resultLink.href = link;
      resultLink.textContent = 'Buka foto';
      resultLink.classList.remove('hidden');
    } else {
      resultLink.classList.add('hidden');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ---------------- Submit ---------------- */
  submitBtn.addEventListener('click', async () => {
    if (busy || !valid()) {
      showError('Lengkapi nama foto, tanggal, dan uploader dulu.');
      return;
    }

    showError('');
    lockForm(true);
    setProgress(2, 'Menyiapkan…');
    remoteUrl = '';

    const entry = {
      name: photoName.value.trim(),
      type: 'photo',
      url: '',
      date: photoDate.value,
      uploader: uploaderName.value.trim()
    };

    try {
      remoteUrl = await uploadToImgBB();
      entry.url = remoteUrl;
      setProgress(70, 'Foto tersimpan ✓');

      if (!REPO) {
        throw new Error('Repo GitHub belum diatur, data galeri tidak bisa disimpan.');
      }

      setProgress(78, 'Membaca data galeri…');
      let { data, list, sha } = await readPhotos();

      const dup = list.some(
        (p) => String(p && p.name).trim().toLowerCase() === entry.name.toLowerCase()
      );
      if (dup) {
        throw new Error('Nama foto "' + entry.name + '" sudah dipakai. Gunakan nama lain.');
      }

      let nextList = list.concat([entry]);
      setProgress(86, 'Menyimpan entri baru…');

      if (!TOKEN) {
        const payload = {
          repo: REPO,
          branch: BRANCH,
          path: PHOTOS_PATH,
          sha: sha,
          entry: entry,
          content: serialize(data, nextList)
        };
        const sent = sendToAppBridge(payload);
        if (!sent) {
          throw new Error('Token GitHub belum diatur, jadi data tidak bisa disimpan otomatis.');
        }
        setProgress(100, 'Dikirim ke aplikasi ✓');
        lockForm(false);
        showResult(true, 'Terkirim ke aplikasi',
          'Foto "' + entry.name + '" sudah di ImgBB. Data galeri diteruskan ke aplikasi.',
          remoteUrl);
        return;
      }

      let saved = false;
      for (let attempt = 0; attempt < 2 && !saved; attempt++) {
        try {
          await commit(serialize(data, nextList), sha);
          saved = true;
        } catch (err) {
          if (err && err.conflict && attempt === 0) {
            setProgress(80, 'Data berubah, menyegarkan ulang…');
            const fresh = await readPhotos();
            data = fresh.data;
            sha = fresh.sha;
            const stillDup = fresh.list.some(
              (p) => String(p && p.name).trim().toLowerCase() === entry.name.toLowerCase()
            );
            if (stillDup) {
              throw new Error('Nama foto "' + entry.name + '" baru saja dipakai orang lain.');
            }
            nextList = fresh.list.concat([entry]);
            continue;
          }
          throw err;
        }
      }

      if (!saved) throw new Error('Gagal menyimpan data galeri.');

      setProgress(100, 'Selesai ✓');
      lockForm(false);
      showResult(true, 'Upload berhasil',
        'Foto "' + entry.name + '" oleh ' + entry.uploader + ' sudah masuk galeri.',
        photoLink(entry.name));
    } catch (err) {
      lockForm(false);
      showResult(false, 'Upload gagal',
        err && err.message ? err.message : 'Terjadi kesalahan.',
        remoteUrl || null);
    }
  });

  /* ---------------- Upload lagi ---------------- */
  againBtn.addEventListener('click', () => {
    file = null;
    uploadFile = null;
    compressing = false;
    remoteUrl = '';
    fileInput.value = '';
    if (previewUrl) { URL.revokeObjectURL(previewUrl); previewUrl = ''; }
    uploadedImg.removeAttribute('src');
    photoName.value = '';
    photoDate.value = todayISO();
    if (urlSlug) {
      uploaderName.value = urlSlug;
      uploaderName.readOnly = true;
      uploaderName.classList.add('uploader-locked');
    } else {
      uploaderName.readOnly = false;
      uploaderName.classList.remove('uploader-locked');
      uploaderName.value = localStorage.getItem(UPLOADER_KEY) || '';
    }
    showError('');
    setCompressNote('');
    setProgress(0, 'Menyiapkan…');

    resultSection.classList.add('hidden');
    resultSection.setAttribute('aria-hidden', 'true');
    formSection.classList.add('hidden');
    formSection.setAttribute('aria-hidden', 'true');
    mainContent.classList.remove('hidden');

    refreshSubmit();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* ---------------- Init ---------------- */
  photoDate.value = todayISO();
  photoDate.max = todayISO();
  if (urlSlug) {
    uploaderName.value = urlSlug;
    uploaderName.readOnly = true;
    uploaderName.classList.add('uploader-locked');
  } else {
    uploaderName.readOnly = false;
    uploaderName.classList.remove('uploader-locked');
    uploaderName.value = localStorage.getItem(UPLOADER_KEY) || '';
  }
  refreshSubmit();
})();
