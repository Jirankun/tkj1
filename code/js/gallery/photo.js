"use strict";

const DB_URL = "../DB/photos.json";
const APP_SCHEME = "tkjone";
const APP_HOST = "photo";

const $ = (id) => document.getElementById(id);
const stage = $("stage");
const spinner = $("spinner");
const toast = $("toast");

let items = [];
let index = -1;
let mediaEl = null;
let plyr = null;
let toastTimer = null;
let swipeStartX = 0;
let swipeStartY = 0;
let swipePointerId = null;
let swipePointerMoved = false;

function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
}

function normUrl(u) {
    let s = String(u || "")
        .replace(/\s+/g, "")
        .trim();
    /* i.ibb.co (tanpa .com) memakai sertifikat TLS domain lain -> browser
               menolaknya dan media tidak pernah tampil. Pakai i.ibb.co.com. */
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

function prettyDate(iso) {
    const t = Date.parse(iso);
    if (!Number.isFinite(t)) return iso || "—";
    try {
        return new Date(t).toLocaleDateString("id-ID", {
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric",
        });
    } catch {
        return iso;
    }
}

/* Nama foto bisa datang dari ?name=ID (kanonik) atau /photo/ID (link lama). */
function requestedName() {
    const params = new URLSearchParams(location.search);
    const direct = (params.get("name") || params.get("id") || "").trim();
    if (direct) return direct;

    const m = location.pathname.match(/\/photo\/([^/]+)\/?$/);
    if (m) {
        try {
            return decodeURIComponent(m[1]);
        } catch {
            return m[1];
        }
    }
    return "";
}

function shareUrl() {
    return location.origin + "/photo/?name=" + encodeURIComponent(items[index].name);
}

function appUri() {
    return APP_SCHEME + "://" + APP_HOST + "/" + encodeURIComponent(items[index].name);
}

/* Buang instance Plyr + elemennya (destroy() mengganti wrapper dengan
           kloning video, jadi kloning itu ikut dibersihkan). */
function destroyPlayer() {
    if (!plyr) return;
    const original = plyr.elements && plyr.elements.original;
    try {
        plyr.destroy();
    } catch (e) {
        /* diabaikan */
    }
    plyr = null;
    if (original && original.parentNode) original.parentNode.removeChild(original);
}

function showStageError(text) {
    const msg = $("stageMsg");
    if (!msg) return;
    $("stageMsgText").textContent = text || "Gagal memuat media";
    msg.classList.remove("hidden");
}

function clearStage() {
    destroyPlayer();
    if (mediaEl) {
        if (mediaEl.tagName === "VIDEO") {
            mediaEl.pause();
            mediaEl.removeAttribute("src");
            mediaEl.load();
        }
        mediaEl.remove();
        mediaEl = null;
    }
    swipePointerId = null;
    swipePointerMoved = false;
    spinner.classList.remove("hidden");
    $("stageMsg").classList.add("hidden");
}

function show(i, push) {
    if (i < 0 || i >= items.length) return;
    index = i;
    const item = items[i];
    const video = isVideo(item);
    clearStage();

    if (video) {
        const v = document.createElement("video");
        v.src = normUrl(item.url);
        v.setAttribute("controlslist", "nodownload noremoteplayback");
        v.setAttribute("disablepictureinpicture", "");
        v.disableRemotePlayback = true;
        v.playsInline = true;
        v.preload = "metadata";
        v.setAttribute("playsinline", "");
        v.addEventListener("contextmenu", (event) => event.preventDefault());
        v.addEventListener("loadeddata", () => spinner.classList.add("hidden"));
        v.addEventListener("error", () => {
            spinner.classList.add("hidden");
            showStageError("Video gagal dimuat");
        });
        mediaEl = v;
        stage.insertBefore(v, spinner);

        /* Player video memakai Plyr (self-hosted, tanpa CDN).
                   Kalau Plyr tidak tersedia/gagal -> kontrol native sebagai cadangan. */
        if (typeof Plyr !== "undefined") {
            try {
                plyr = new Plyr(v, {
                    invertTime: false,
                    loadSprite: true,
                    clickToPlay: true,
                    keyboard: { focused: true, global: false },
                    controls: [
                        "play-large",
                        "play",
                        "progress",
                        "current-time",
                        "duration",
                        "mute",
                        "volume",
                        "fullscreen",
                    ],
                    settings: ["speed"],
                    tooltips: { controls: true, seek: true },
                });
            } catch (e) {
                plyr = null;
                v.controls = true;
            }
        } else {
            v.controls = true;
        }

        v.play().catch(() => {});
    } else {
        const img = document.createElement("img");
        img.alt = "Foto " + item.name;
        img.decoding = "async";
        img.draggable = false;
        img.referrerPolicy = "no-referrer";

        let retried = false;
        const finishLoading = () => spinner.classList.add("hidden");

        // Listener dipasang SEBELUM src: kalau gambar sudah ada di cache,
        // event load bisa selesai sangat cepat dan handler yang dipasang
        // belakangan akan terlewat (foto tampak tidak muncul).
        img.addEventListener("load", () => {
            if (img.naturalWidth > 0) finishLoading();
        });
        img.addEventListener("error", () => {
            if (!retried) {
                retried = true;
                // Coba lagi sekali (koneksi/CDN sempat gagal).
                img.src = normUrl(item.url);
                return;
            }
            finishLoading();
            showStageError("Gambar gagal dimuat");
        });

        mediaEl = img;
        stage.insertBefore(img, spinner);
        img.src = normUrl(item.url);

        // Fallback kalau event load sudah lewat sebelum handler terpasang.
        if (img.complete && img.naturalWidth > 0) finishLoading();
    }

    $("topTitle").textContent = "#" + item.name;
    $("topCounter").textContent = items.length > 1 ? i + 1 + "/" + items.length : "";
    $("detailName").textContent = "#" + item.name;
    $("detailBadge").textContent = video ? "VIDEO" : "FOTO";
    $("detailDate").textContent = prettyDate(item.date);

    const row = $("uploaderRow");
    if (item.uploader) {
        $("detailUploader").textContent = "Diunggah oleh " + item.uploader;
        row.classList.remove("hidden");
    } else {
        row.classList.add("hidden");
    }

    document.title = "TKJ OnE — #" + item.name;

    if (push !== false) {
        const url = "/photo/?name=" + encodeURIComponent(item.name);
        if (location.pathname + location.search !== url) {
            history.replaceState({ name: item.name }, "", url);
        }
    }
}

function step(delta) {
    const next = index + delta;
    if (next < 0 || next >= items.length) {
        showToast(delta < 0 ? "Ini media pertama" : "Ini media terakhir");
        return;
    }
    show(next);
}

async function boot() {
    try {
        const res = await fetch(DB_URL + "?t=" + Date.now(), { cache: "no-store" });
        if (!res.ok) throw new Error("HTTP " + res.status);
        items = normalize(await res.json());
        if (!items.length) throw new Error("kosong");

        const name = requestedName();
        let i = items.findIndex((p) => p.name.toLowerCase() === name.toLowerCase());
        if (i < 0) i = 0;
        show(i, false);
    } catch (err) {
        spinner.classList.add("hidden");
        showToast("Gagal memuat data galeri");
    }
}

/* ---------- Interaksi ---------- */
$("backBtn").addEventListener("click", () => {
    if (history.length > 1) history.back();
    else location.href = "../galeri/";
});

async function copyShareUrl(url) {
    try {
        await navigator.clipboard.writeText(url);
        showToast("Tautan disalin");
    } catch {
        const ta = document.createElement("textarea");
        ta.value = url;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        // focus() dulu: execCommand("copy") menyalin dari kontrol yang
        // sedang fokus, dan proteksi anti-copy mengizinkan isian user.
        ta.focus();
        ta.select();
        try {
            if (!document.execCommand("copy")) throw new Error("Clipboard unavailable");
            showToast("Tautan disalin");
        } catch {
            showToast("Gagal membagikan tautan");
        }
        ta.remove();
    }
}

$("shareBtn").addEventListener("click", async () => {
    if (index < 0) return;
    const url = shareUrl();
    if (navigator.share) {
        try {
            await navigator.share({ title: document.title, url });
            return;
        } catch (err) {
            if (err && err.name === "AbortError") return;
        }
    }
    await copyShareUrl(url);
});

/* Download: deteksi aplikasi — ada → buka aplikasi; tidak ada → langsung
   ke halaman rilis APK di GitHub. */
const RELEASE_URL = "https://github.com/Jirankun/TKJ-One/releases/latest";
let checkingApp = false;

function openAppOrRelease() {
    if (index < 0 || checkingApp) return;
    checkingApp = true;

    let appOpened = false;
    const markOpened = () => {
        appOpened = true;
    };
    document.addEventListener("visibilitychange", markOpened);
    window.addEventListener("blur", markOpened);

    const frame = document.createElement("iframe");
    frame.style.display = "none";
    frame.src = appUri();
    document.body.appendChild(frame);

    setTimeout(() => {
        document.removeEventListener("visibilitychange", markOpened);
        window.removeEventListener("blur", markOpened);
        frame.remove();
        checkingApp = false;
        if (appOpened) {
            showToast("Membuka TKJ OnE");
        } else {
            // Aplikasi tidak terbuka → langsung ke rilis terbaru
            window.location.href = RELEASE_URL;
        }
    }, 1300);
}

$("downloadCta").addEventListener("click", (e) => {
    e.preventDefault();
    openAppOrRelease();
});

document.addEventListener("keydown", (e) => {
    /* Kalau fokus ada di player Plyr, panah kiri/kanan dipakai untuk
               seek (bukan ganti media). */
    if (e.target && e.target.closest && e.target.closest(".plyr")) return;
    if (e.key === "ArrowLeft") step(-1);
    else if (e.key === "ArrowRight") step(1);
    else if (e.key === "Escape") location.href = "../galeri/";
});

function beginSwipe(target, x, y) {
    // Jangan mulai swipe dari tombol/link (mis. tombol download).
    if (!mediaEl || mediaEl.tagName !== "IMG") return false;
    if (target && target.closest && target.closest("a,button")) return false;
    swipeStartX = x;
    swipeStartY = y;
    swipePointerMoved = false;
    return true;
}

function endSwipe(x, y) {
    const dx = x - swipeStartX;
    const dy = y - swipeStartY;
    const threshold = Math.min(72, Math.max(44, window.innerWidth * 0.12));
    const shouldStep = swipePointerMoved && Math.abs(dx) >= threshold && Math.abs(dx) > Math.abs(dy) * 1.25;
    swipePointerMoved = false;
    if (shouldStep) step(dx < 0 ? 1 : -1);
}

if (window.PointerEvent) {
    stage.addEventListener("pointerdown", (event) => {
        if (event.pointerType === "mouse" && event.button !== 0) return;
        if (!beginSwipe(event.target, event.clientX, event.clientY)) return;
        swipePointerId = event.pointerId;
        try {
            event.target.setPointerCapture(event.pointerId);
        } catch (_error) {}
    });

    stage.addEventListener("pointermove", (event) => {
        if (event.pointerId !== swipePointerId) return;
        const dx = event.clientX - swipeStartX;
        const dy = event.clientY - swipeStartY;
        if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) * 1.2) swipePointerMoved = true;
    });

    stage.addEventListener("pointerup", (event) => {
        if (event.pointerId !== swipePointerId) return;
        swipePointerId = null;
        endSwipe(event.clientX, event.clientY);
    });

    stage.addEventListener("pointercancel", () => {
        swipePointerId = null;
        swipePointerMoved = false;
    });
} else {
    stage.addEventListener(
        "touchstart",
        (event) => {
            if (event.touches.length !== 1) return;
            const touch = event.touches[0];
            beginSwipe(event.target, touch.clientX, touch.clientY);
        },
        { passive: true },
    );

    stage.addEventListener(
        "touchmove",
        (event) => {
            if (event.touches.length !== 1 || !mediaEl) return;
            const touch = event.touches[0];
            const dx = touch.clientX - swipeStartX;
            const dy = touch.clientY - swipeStartY;
            if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) * 1.2) swipePointerMoved = true;
        },
        { passive: true },
    );

    stage.addEventListener(
        "touchend",
        (event) => {
            const touch = event.changedTouches[0];
            if (touch) endSwipe(touch.clientX, touch.clientY);
        },
        { passive: true },
    );
    stage.addEventListener(
        "touchcancel",
        () => {
            swipePointerMoved = false;
        },
        { passive: true },
    );
}

window.addEventListener("popstate", () => {
    const name = requestedName();
    const i = items.findIndex((p) => p.name.toLowerCase() === name.toLowerCase());
    if (i >= 0) show(i, false);
});

boot();
