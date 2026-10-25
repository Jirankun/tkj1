"use strict";

const DB_URL = "../DB/photos.json";
const MAX_STORIES = 8;
const IMAGE_MS = 5000;
const VIDEO_MS = 10000;

const $ = (id) => document.getElementById(id);
const frame = $("frame");
const bars = $("bars");
const capName = $("capName");
const capMeta = $("capMeta");
const loader = $("loader");
const pauseBtn = $("pauseBtn");
const stage = $("stage");

const state = {
    items: [],
    index: 0,
    timer: null,
    startedAt: 0,
    elapsed: 0,
    duration: IMAGE_MS,
    paused: false,
    video: null,
    player: null,
    current: null,
};

/* ---------- Normalisasi ---------- */
function normUrl(u) {
    let s = String(u || "")
        .replace(/\s+/g, "")
        .trim();
    /* i.ibb.co (tanpa .com) memakai sertifikat TLS domain lain -> browser
               menolaknya dan foto tidak pernah tampil. Pakai i.ibb.co.com. */
    s = s.replace(/^(https?:)?\/\/i\.ibb\.co\//i, "https://i.ibb.co.com/");
    return s;
}

function isVideo(item) {
    const url = normUrl(item.url);
    return String(item.type || "").toLowerCase() === "video" || /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(url);
}

function normalize(raw, limit) {
    const list = Array.isArray(raw) ? raw : raw && Array.isArray(raw.entries) ? raw.entries : [];
    return list
        .filter((p) => p && typeof p === "object" && p.url)
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
        .sort((a, b) => (Date.parse(b.date) || 0) - (Date.parse(a.date) || 0))
        .slice(0, limit || MAX_STORIES);
}

function prettyDate(iso) {
    const t = Date.parse(iso);
    if (!Number.isFinite(t)) return "";
    try {
        return new Date(t).toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    } catch {
        return "";
    }
}

/* ---------- Bridge aplikasi ---------- */
function closeStory() {
    /* Aplikasi Android: tutup layar cerita lewat bridge — jangan navigasi
 (index.html tidak ada di aset aplikasi). */
    try {
        if (window.AndroidInterface) {
            if (typeof window.AndroidInterface.closeStory === "function") {
                window.AndroidInterface.closeStory();
                return;
            }
            if (typeof window.AndroidInterface.postMessage === "function") {
                window.AndroidInterface.postMessage(JSON.stringify({ command: "closeStory" }));
                return;
            }
        }
    } catch (e) {
        /* diabaikan */
    }
    try {
        window.parent.postMessage({ type: "STORY_DONE" }, "*");
    } catch (e) {
        /* diabaikan */
    }
    if (history.length > 1) history.back();
    else location.href = "../galeri/";
}

/* Dipanggil aplikasi Android lewat evaluateJavascript("window.bootFromAndroid(...)") */
window.bootFromAndroid = function (data) {
    try {
        const parsed = typeof data === "string" ? JSON.parse(data) : data;
        const list = normalize(parsed, MAX_STORIES);
        if (list.length) {
            state.items = list;
            state.index = 0;
            start();
        }
    } catch (e) {
        /* payload rusak — biarkan data dari JSON dipakai */
    }
};

/* ---------- Data ---------- */
async function loadItems() {
    // 1) Android interface (opsional)
    try {
        if (window.AndroidInterface && typeof window.AndroidInterface.getStories === "function") {
            const raw = window.AndroidInterface.getStories();
            if (raw) {
                const list = normalize(JSON.parse(raw), MAX_STORIES);
                if (list.length) return list;
            }
        }
    } catch (e) {
        /* lanjut ke JSON */
    }

    // 2) DB/photos.json
    try {
        const res = await fetch(DB_URL + "?t=" + Date.now(), { cache: "no-store" });
        if (res.ok) {
            const list = normalize(await res.json(), MAX_STORIES);
            if (list.length) return list;
        }
    } catch (e) {
        /* ditangani di bawah */
    }

    return [];
}

/* ---------- Render progress ---------- */
function buildBars() {
    bars.innerHTML = "";
    state.items.forEach(() => {
        const b = document.createElement("div");
        b.className = "bar";
        const fill = document.createElement("i");
        b.appendChild(fill);
        bars.appendChild(b);
    });
}

function syncBars() {
    const list = bars.children;
    for (let i = 0; i < list.length; i++) {
        list[i].classList.toggle("done", i < state.index);
        list[i].classList.toggle("active", i === state.index);
        const fill = list[i].firstChild;
        if (i < state.index) fill.style.width = "100%";
        else if (i > state.index) fill.style.width = "0%";
    }
}

/* ---------- Timer ---------- */
function startTimer() {
    stopTimer();
    state.elapsed = 0;
    state.startedAt = Date.now();
    state.timer = setInterval(tick, 60);
    tick();
}

function tick() {
    if (state.paused) return;
    const active = bars.children[state.index];
    if (!active) return;
    const total = state.elapsed + (Date.now() - state.startedAt);
    const ratio = Math.min(total / state.duration, 1);
    active.firstChild.style.width = ratio * 100 + "%";
    if (ratio >= 1) {
        stopTimer();
        next();
    }
}

function stopTimer() {
    if (state.timer) {
        clearInterval(state.timer);
        state.timer = null;
    }
}

function pause() {
    if (state.paused) return;
    state.paused = true;
    state.elapsed += Date.now() - state.startedAt;
    pauseBtn.classList.add("is-paused");
    pauseBtn.setAttribute("aria-label", "Lanjutkan");
    if (state.player) state.player.pause();
    else if (state.video) state.video.pause();
}

function resume() {
    if (!state.paused) return;
    state.paused = false;
    state.startedAt = Date.now();
    pauseBtn.classList.remove("is-paused");
    pauseBtn.setAttribute("aria-label", "Jeda");
    const p = state.player ? state.player.play() : state.video ? state.video.play() : null;
    if (p && typeof p.catch === "function") p.catch(() => {});
}

/* Buang player video sebelumnya (kalau tidak, suara video lama
           tetap berjalan di latar belakang saat cerita berganti). */
function destroyPlayer() {
    if (!state.player) return;
    const original = state.player.elements && state.player.elements.original;
    try {
        state.player.destroy();
    } catch (e) {
        /* diabaikan */
    }
    state.player = null;
    state.video = null;
    if (original && original.parentNode) original.parentNode.removeChild(original);
}

/* ---------- Render item ---------- */
function renderItem() {
    const item = state.items[state.index];
    if (!item) return;

    destroyPlayer();
    state.current = item;
    state.paused = false;
    pauseBtn.classList.remove("is-paused");

    const node = document.createElement("div");
    node.className = "item enter";
    let videoEl = null;

    if (isVideo(item)) {
        const v = document.createElement("video");
        v.src = normUrl(item.url);
        v.playsInline = true;
        v.muted = true;
        v.autoplay = true;
        v.loop = true;
        v.preload = "metadata";
        v.setAttribute("playsinline", "");
        v.setAttribute("muted", "");
        v.setAttribute("controlslist", "nodownload noremoteplayback");
        v.setAttribute("disablepictureinpicture", "");
        v.disableRemotePlayback = true;
        v.addEventListener("contextmenu", (event) => event.preventDefault());
        v.addEventListener("error", () => {
            node.innerHTML = '<p class="msg">Video tidak dapat dimuat.</p>';
        });
        v.addEventListener("loadedmetadata", () => {
            const d = v.duration;
            if (Number.isFinite(d) && d > 0) {
                // Pakai durasi asli video (dibatasi 5-30 detik).
                state.duration = Math.min(Math.max(d + 500, IMAGE_MS), 30000);
            }
        });
        node.appendChild(v);
        videoEl = v;
        state.duration = VIDEO_MS;
    } else {
        const img = new Image();
        img.alt = "Foto " + item.name;
        img.draggable = false;
        img.referrerPolicy = "no-referrer";
        let retried = false;
        img.addEventListener("error", () => {
            if (!retried) {
                retried = true;
                // Coba lagi sekali (koneksi/CDN sempat gagal).
                img.src = normUrl(item.url);
                return;
            }
            node.innerHTML = '<p class="msg">Gambar tidak dapat dimuat.</p>';
        });
        node.appendChild(img);
        img.src = normUrl(item.url);
        state.duration = IMAGE_MS;
    }

    frame.appendChild(node);
    Array.from(frame.querySelectorAll(".item")).forEach((old) => {
        if (old === node) return;
        old.classList.remove("enter");
        old.classList.add("exit");
        setTimeout(() => old.remove(), 300);
    });

    /* Player video dibuat setelah video masuk DOM (Plyr butuh induk).
               Kalau Plyr tidak tersedia/gagal -> video native tetap berjalan. */
    if (videoEl) {
        state.video = videoEl;
        if (typeof Plyr !== "undefined") {
            try {
                state.player = new Plyr(videoEl, {
                    controls: [],
                    invertTime: false,
                    loadSprite: true,
                    clickToPlay: false,
                    keyboard: { focused: false, global: false },
                    hideControls: true,
                });
            } catch (e) {
                state.player = null;
            }
        }
        videoEl.play().catch(() => {});
    }

    capName.textContent = "#" + item.name;
    capMeta.innerHTML = "";
    capMeta.append(document.createTextNode(prettyDate(item.date)));
    if (item.uploader) {
        const s = document.createElement("span");
        s.textContent = " • " + item.uploader;
        capMeta.appendChild(s);
    }

    const counter = state.index + 1 + " / " + state.items.length;
    $("headSub").textContent = counter + " • Cerita terbaru";

    syncBars();
    startTimer();
}

/* ---------- Navigasi ---------- */
function next() {
    if (state.index >= state.items.length - 1) {
        closeStory();
        return;
    }
    state.index += 1;
    renderItem();
}

function prev() {
    if (state.index <= 0) {
        state.index = 0;
        renderItem();
        return;
    }
    state.index -= 1;
    const old = bars.children[state.index + 1];
    if (old) old.firstChild.style.width = "0%";
    renderItem();
}

function start() {
    loader.classList.add("hidden");
    buildBars();
    renderItem();
}

/* ---------- Interaksi ---------- */
let touchPaused = false;
let hiddenPaused = false;

$("zoneNext").addEventListener("click", next);
$("zonePrev").addEventListener("click", prev);
pauseBtn.addEventListener("click", () => (state.paused ? resume() : pause()));

stage.addEventListener(
    "touchstart",
    (e) => {
        if (e.touches.length !== 1) return;
        stage.dataset.startY = String(e.touches[0].clientY);
        stage.dataset.startX = String(e.touches[0].clientX);
        // Hanya jeda bila sedang berjalan; kalau pengguna sudah
        // menjeda manual, tap tidak boleh melanjutkannya.
        if (!state.paused) {
            touchPaused = true;
            pause();
        }
    },
    { passive: true },
);

stage.addEventListener(
    "touchend",
    (e) => {
        const startY = Number(stage.dataset.startY || 0);
        const startX = Number(stage.dataset.startX || 0);
        const t = e.changedTouches[0];
        if (!t) return;
        const dy = t.clientY - startY;
        const dx = t.clientX - startX;

        if (dy > 80 && Math.abs(dy) > Math.abs(dx)) {
            try {
                window.parent.postMessage({ type: "SWIPE_DOWN", deltaY: dy }, "*");
            } catch (err) {}
            closeStory();
            return;
        }
        if (touchPaused) {
            touchPaused = false;
            resume();
        }
    },
    { passive: true },
);

document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") next();
    else if (e.key === "ArrowLeft") prev();
    else if (e.key === "Escape") closeStory();
    else if (e.key === " ") {
        e.preventDefault();
        state.paused ? resume() : pause();
    }
});

document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        hiddenPaused = !state.paused;
        pause();
    } else if (hiddenPaused) {
        hiddenPaused = false;
        resume();
    }
});

/* ---------- Boot ---------- */
(async function boot() {
    const items = await loadItems();
    if (!items.length) {
        loader.innerHTML = '<p class="msg">Belum ada cerita yang bisa ditampilkan.</p>';
        return;
    }
    state.items = items;
    start();
})();
