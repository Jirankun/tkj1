"use strict";

const DB_URL = "../DB/photos.json";

const el = {
    grid: document.getElementById("grid"),
    search: document.getElementById("searchInput"),
    chips: Array.from(document.querySelectorAll(".chip")),
    count: document.getElementById("countLine"),
    state: document.getElementById("stateBox"),
    stateTitle: document.getElementById("stateTitle"),
    stateText: document.getElementById("stateText"),
    retry: document.getElementById("retryBtn"),
    toast: document.getElementById("toast"),
};

let allItems = [];
let query = "";
let filter = "all";
let toastTimer = null;

function showToast(msg) {
    if (!el.toast) return;
    el.toast.textContent = msg;
    el.toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.toast.classList.remove("show"), 2200);
}

function normUrl(u) {
    let s = String(u || "")
        .replace(/\s+/g, "")
        .trim();
    /* i.ibb.co (tanpa .com) kini memakai sertifikat TLS milik domain lain
               (internetbaik.telkomsel.com) -> browser menolaknya sebagai koneksi
               tidak aman dan foto TIDAK pernah tampil meskipun link-nya terlihat sehat.
               Arahkan ke i.ibb.co.com yang resmi. */
    s = s.replace(/^(https?:)?\/\/i\.ibb\.co\//i, "https://i.ibb.co.com/");
    return s;
}

function isVideo(item) {
    const url = normUrl(item.url);
    return String(item.type || "").toLowerCase() === "video" || /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(url);
}

function normalize(raw) {
    const list = Array.isArray(raw) ? raw : raw && Array.isArray(raw.entries) ? raw.entries : [];
    return list
        .filter((p) => p && typeof p === "object")
        .map((p) => ({
            name: String(p.name ?? "").trim() || "Tanpa Nama",
            url: normUrl(p.url),
            date: String(p.date ?? "").trim(),
            uploader: String(p.uploader ?? "").trim(),
            type:
                String(p.type ?? "")
                    .trim()
                    .toLowerCase() || "photo",
        }))
        .filter((p) => p.url);
}

function dateValue(item) {
    const t = Date.parse(item.date);
    return Number.isFinite(t) ? t : 0;
}

function sortItems(list) {
    return list.slice().sort((a, b) => {
        const d = dateValue(b) - dateValue(a);
        if (d !== 0) return d;
        return a.name.localeCompare(b.name, "id", { numeric: true });
    });
}

function prettyDate(iso) {
    const t = Date.parse(iso);
    if (!Number.isFinite(t)) return iso || "";
    try {
        return new Date(t).toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    } catch {
        return iso;
    }
}

function matches(item) {
    if (filter === "photo" && isVideo(item)) return false;
    if (filter === "video" && !isVideo(item)) return false;
    if (!query) return true;
    const q = query.toLowerCase();
    return item.name.toLowerCase().includes(q) || item.uploader.toLowerCase().includes(q);
}

function cardNode(item) {
    const a = document.createElement("a");
    a.className = "card";
    a.href = "../photo/?name=" + encodeURIComponent(item.name);

    const thumb = document.createElement("div");
    thumb.className = "card-thumb";

    if (isVideo(item)) {
        /* Video tidak punya thumbnail gambar -> jangan pakai <img>
                   (pasti gagal dimuat). Pakai ikon film + badge VIDEO. */
        thumb.style.display = "flex";
        thumb.style.alignItems = "center";
        thumb.style.justifyContent = "center";
        thumb.innerHTML = '<i class="fa-solid fa-film" aria-hidden="true"></i>';

        const badge = document.createElement("span");
        badge.className = "card-badge";
        badge.innerHTML = '<i class="fa-solid fa-play" aria-hidden="true"></i>VIDEO';
        thumb.appendChild(badge);
    } else {
        const img = document.createElement("img");
        img.loading = "lazy";
        img.decoding = "async";
        img.draggable = false;
        img.alt = "Foto " + item.name;
        img.referrerPolicy = "no-referrer";

        let retried = false;
        // Listener dipasang sebelum src supaya event load dari cache tidak terlewat
        // (penyebab kartu kadang kosong walau gambar sebenarnya berhasil dimuat).
        img.addEventListener("load", () => {
            if (img.naturalWidth > 0) img.classList.add("loaded");
        });
        img.addEventListener("error", () => {
            if (!retried) {
                retried = true;
                // Coba lagi sekali: koneksi sempat gagal (TLS/CDN) sering
                // berhasil pada percobaan kedua.
                img.src = normUrl(item.url);
                return;
            }
            img.remove();
            thumb.style.display = "flex";
            thumb.style.alignItems = "center";
            thumb.style.justifyContent = "center";
            thumb.innerHTML = '<i class="fa-solid fa-image" aria-hidden="true"></i>';
        });
        thumb.appendChild(img);
        // Minta URL yang sudah dinormalisasi sejak awal: host rusak
        // (mis. i.ibb.co tanpa .com) akan ditolak browser karena
        // sertifikat TLS-nya tidak cocok, bukan karena link-nya mati.
        img.src = normUrl(item.url);
        if (img.complete && img.naturalWidth > 0) img.classList.add("loaded");
    }

    const body = document.createElement("div");
    body.className = "card-body";

    const name = document.createElement("div");
    name.className = "card-name";
    name.textContent = "#" + item.name;

    const meta = document.createElement("div");
    meta.className = "card-meta";
    meta.textContent = prettyDate(item.date);

    body.append(name, meta);

    if (item.uploader) {
        const up = document.createElement("div");
        up.className = "card-uploader";
        up.innerHTML = '<i class="fa-solid fa-user" aria-hidden="true"></i>';
        up.append(document.createTextNode(item.uploader));
        body.appendChild(up);
    }

    a.append(thumb, body);
    return a;
}

function render() {
    const list = allItems.filter(matches);
    el.grid.innerHTML = "";

    const videos = allItems.filter(isVideo).length;
    el.count.textContent = allItems.length
        ? list.length +
          " dari " +
          allItems.length +
          " media · " +
          (allItems.length - videos) +
          " foto · " +
          videos +
          " video"
        : "";

    if (!list.length) {
        el.state.classList.remove("hidden");
        el.retry.classList.add("hidden");
        if (!allItems.length) {
            el.stateTitle.textContent = "Belum ada media";
            el.stateText.textContent = "Galeri kelas masih kosong.";
        } else {
            el.stateTitle.textContent = "Tidak ditemukan";
            el.stateText.textContent = "Coba kata kunci atau filter lain.";
        }
        return;
    }

    el.state.classList.add("hidden");
    const frag = document.createDocumentFragment();
    list.forEach((item) => frag.appendChild(cardNode(item)));
    el.grid.appendChild(frag);
}

function showLoading() {
    el.grid.innerHTML = "";
    el.state.classList.add("hidden");
    for (let i = 0; i < 6; i++) {
        const box = document.createElement("div");
        box.className = "card skeleton";
        box.style.aspectRatio = "3 / 4";
        el.grid.appendChild(box);
    }
}

function showError(message) {
    el.grid.innerHTML = "";
    el.count.textContent = "";
    el.state.classList.remove("hidden");
    el.retry.classList.remove("hidden");
    el.stateTitle.textContent = "Gagal memuat galeri";
    el.stateText.textContent = message || "Periksa koneksi internet lalu coba lagi.";
}

async function load() {
    showLoading();
    try {
        const res = await fetch(DB_URL + "?t=" + Date.now(), { cache: "no-store" });
        if (!res.ok) throw new Error("HTTP " + res.status);
        const data = await res.json();
        const items = normalize(data);
        if (!items.length) throw new Error("Data galeri kosong");
        allItems = sortItems(items);
        render();
    } catch (err) {
        showError(
            err && err.message && err.message.indexOf("HTTP") === 0
                ? "Server galeri tidak merespons (" + err.message + ")."
                : "",
        );
    }
}

el.search.addEventListener("input", (e) => {
    query = e.target.value.trim();
    render();
});

el.chips.forEach((chip) => {
    chip.addEventListener("click", () => {
        filter = chip.dataset.filter;
        el.chips.forEach((c) => c.setAttribute("aria-pressed", String(c === chip)));
        render();
    });
});

el.retry.addEventListener("click", load);

load();

/* Service worker: cache aset statis, data tetap network-first */
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").catch(() => {});
    });
}
