(function () {
    "use strict";
    const PHOTOS_URL = "../DB/photos.json";
    const STATUS_URL = "../DB/status.json";
    const PANEL_STATS = document.getElementById("panelStats");
    const PANEL_DETAIL = document.getElementById("panelDetail");
    const PILL = document.getElementById("totalPill");
    const PILL_MEDIA = document.getElementById("pillMedia");
    const PILL_BREAKDOWN = document.getElementById("pillBreakdown");
    const PILL_USERS = document.getElementById("pillUsers");

    let ALL_PHOTOS = [];
    let USERS = [];
    let TOTAL_COUNT = 0;

    function esc(s) {
        const d = document.createElement("div");
        d.appendChild(document.createTextNode(String(s)));
        return d.innerHTML;
    }
    function animateNumber(el, target, duration = 1000) {
        const start = performance.now();
        function tick(now) {
            const p = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            el.textContent = Math.round(target * eased);
            if (p < 1) requestAnimationFrame(tick);
            else el.textContent = target;
        }
        requestAnimationFrame(tick);
    }
    function animatePercent(el, target, duration = 1000) {
        const start = performance.now();
        function tick(now) {
            const p = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            el.textContent = (target * eased).toFixed(1) + "%";
            if (p < 1) requestAnimationFrame(tick);
            else el.textContent = target.toFixed(1) + "%";
        }
        requestAnimationFrame(tick);
    }
    function getField(obj, keys) {
        for (let i = 0; i < keys.length; i++) {
            const v = obj[keys[i]];
            if (v !== undefined && v !== null && v !== "") return v;
        }
        return "";
    }
    function formatDate(d) {
        if (!d) return "—";
        let dt;
        if (typeof d === "number") {
            dt = new Date(d < 1e12 ? d * 1000 : d);
        } else {
            dt = new Date(d);
        }
        if (!isNaN(dt.getTime()) && dt.getFullYear() > 1970) {
            try {
                return dt.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
            } catch (e) {
                return String(d);
            }
        }
        return String(d);
    }

    /* status.json: true = aktif, false = suspend */
    function isSuspended(u) {
        const s = u && u.status;
        if (s === undefined || s === null) return false;
        if (typeof s === "boolean") return !s;
        const v = String(s).trim().toLowerCase();
        return v === "false" || v === "0" || v === "no" || v === "suspend" || v === "suspended";
    }

    /* ── Data: user (aktif & suspend) + fotonya ── */
    function buildUsers(photos, status) {
        const map = {};
        const users = (status && status.users) || (Array.isArray(status) ? status : []);
        users.forEach((u) => {
            const n = (u.name || "").trim();
            if (n) map[n.toLowerCase()] = u;
        });

        const byUploader = {};
        photos.forEach((p) => {
            const orig = (p.uploader || "Tidak diketahui").trim();
            const key = orig.toLowerCase();
            if (!byUploader[key]) byUploader[key] = [];
            byUploader[key].push(p);
        });

        const list = [];
        Object.keys(map).forEach((key) => {
            const u = map[key];
            const name = (u.name || "").trim();
            if (!name) return;
            list.push({
                key: key,
                name: name,
                suspended: isSuspended(u),
                unregistered: false,
                reason: (u.suspend_reason || "").trim(),
                profile: u.profile || u.avatar || u.photo || u.image || "",
                photos: byUploader[key] || [],
            });
        });

        // Pengunggah yang tidak terdaftar di status.json — tetap ditampilkan agar data tidak hilang.
        Object.keys(byUploader).forEach((key) => {
            if (map[key]) return;
            const arr = byUploader[key];
            list.push({
                key: key,
                name: (arr[0].uploader || "Tidak diketahui").trim(),
                suspended: false,
                unregistered: true,
                reason: "",
                profile: "",
                photos: arr,
            });
        });

        list.sort((a, b) => b.photos.length - a.photos.length || a.name.localeCompare(b.name, "id"));
        return list;
    }

    /* ── Helper foto ── */
    function photoName(p, i) {
        return getField(p, ["name", "title", "filename", "file", "photo", "caption", "fileName"]) || `Foto ${i + 1}`;
    }
    function photoDate(p) {
        return formatDate(
            getField(p, ["date", "timestamp", "created_at", "time", "uploaded_at", "createdAt", "uploadDate"]),
        );
    }
    function photoUrl(p) {
        const raw = getField(p, [
            "url",
            "src",
            "image",
            "link",
            "path",
            "file_url",
            "photoUrl",
            "imageUrl",
            "download_url",
        ]);
        return normalizeMediaUrl(raw);
    }
    /* i.ibb.co (tanpa .com) memakai sertifikat TLS domain lain -> browser
               menolaknya dan media tidak pernah tampil. Pakai i.ibb.co.com. */
    function normalizeMediaUrl(u) {
        let s = String(u || "")
            .replace(/\s+/g, "")
            .trim();
        s = s.replace(/^(https?:)?\/\/i\.ibb\.co\//i, "https://i.ibb.co.com/");
        return s;
    }
    function photoIsVideo(p) {
        const url = String(photoUrl(p));
        return String(p.type || "").toLowerCase() === "video" || /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(url);
    }

    function avatarHTML(u) {
        const initial = (u.name || "?").charAt(0).toUpperCase();
        if (u.profile) {
            return `<img class="row-avatar" src="${esc(u.profile)}" alt="${esc(u.name)}" loading="lazy" draggable="false" referrerpolicy="no-referrer">`;
        }
        return `<div class="row-avatar fallback">${esc(initial)}</div>`;
    }
    function badgeHTML(u) {
        if (u.suspended) return `<span class="user-badge is-suspend">Suspend</span>`;
        if (u.unregistered) return `<span class="user-badge is-unreg">Tidak Terdaftar</span>`;
        return `<span class="user-badge is-active">Aktif</span>`;
    }

    /* ── Tab: Statistik ── */
    function renderStats() {
        const total = TOTAL_COUNT;
        const active = USERS.filter((u) => !u.suspended && !u.unregistered);
        const suspended = USERS.filter((u) => u.suspended);
        const videos = ALL_PHOTOS.filter(photoIsVideo).length;
        const photos = total - videos;

        const cards = [
            { label: "Media", value: total, mod: "" },
            { label: "Foto", value: photos, mod: "" },
            { label: "Video", value: videos, mod: "" },
            { label: "Aktif", value: active.length, mod: "is-active" },
            { label: "Suspend", value: suspended.length, mod: "is-suspend" },
            { label: "User", value: USERS.length, mod: "" },
        ]
            .map(
                (c) => `
      <div class="stat-card ${c.mod}">
        <div class="stat-value" data-n="${c.value}">0</div>
        <div class="stat-label">${c.label}</div>
      </div>`,
            )
            .join("");

        const rows = USERS.filter((u) => u.photos.length)
            .map((u) => {
                const pct = total ? (u.photos.length / total) * 100 : 0;
                const userVideos = u.photos.filter(photoIsVideo).length;
                return `
    <div class="chart-row user-row" data-key="${esc(u.key)}">
      <div class="row-head">
        ${avatarHTML(u)}
        <div class="row-info">
          <div class="row-name">${esc(u.name)}</div>
          ${userVideos ? `<div class="row-media">${userVideos} video</div>` : ""}
        </div>
        ${badgeHTML(u)}
        <span class="row-caret" aria-hidden="true">›</span>
        <div class="row-value">
          <span class="row-count" data-n="${u.photos.length}">0</span>
          <span class="row-pct" data-p="${pct}">0%</span>
        </div>
      </div>
      <div class="row-bar"><div class="row-bar-fill" data-w="${pct}"></div></div>
    </div>`;
            })
            .join("");

        PANEL_STATS.innerHTML = `
  <div class="stat-grid">${cards}</div>
  <div class="chart">
    <div class="chart-head"><span>Uploader</span><span>Distribusi</span></div>
    <div class="chart-rows">${rows}</div>
  </div>`;

        PANEL_STATS.querySelectorAll("[data-n]").forEach((el) => animateNumber(el, parseInt(el.dataset.n, 10)));
        PANEL_STATS.querySelectorAll("[data-p]").forEach((el) => animatePercent(el, parseFloat(el.dataset.p)));
        setTimeout(applyBars, 150);

        // Klik baris -> pindah ke tab Detail & buka user tsb.
        PANEL_STATS.querySelectorAll(".chart-row.user-row").forEach((row) => {
            row.addEventListener("click", () => {
                switchTab("detail");
                focusUser(row.dataset.key);
            });
        });
    }

    /* Isi lebar progress bar (chart + daftar user) */
    function applyBars() {
        document.querySelectorAll("[data-w]").forEach((el) => {
            el.style.width = el.dataset.w + "%";
        });
    }

    /* ── Tab: Detail User (aktif & suspend, beserta fotonya) ── */
    function renderDetail() {
        const active = USERS.filter((u) => !u.suspended && !u.unregistered);
        const suspended = USERS.filter((u) => u.suspended);
        const unregistered = USERS.filter((u) => u.unregistered);

        const group = (title, dot, arr) => {
            if (!arr.length) return "";
            const items = arr.map((u) => userItemHTML(u)).join("");
            return `
  <div class="user-group">
    <div class="user-group-head">
      <span class="group-dot ${dot}"></span>
      <span>${title}</span>
      <span class="group-count">${arr.length}</span>
    </div>
    ${items}
  </div>`;
        };

        PANEL_DETAIL.innerHTML = `
  ${group("User Aktif", "is-active", active)}
  ${group("User Suspend", "is-suspend", suspended)}
  ${group("Tidak Terdaftar", "is-unreg", unregistered)}`;

        PANEL_DETAIL.querySelectorAll(".user-row").forEach((btn) => {
            btn.addEventListener("click", () => {
                const item = btn.closest(".user-item");
                if (!item) return;
                toggleUser(item.dataset.key);
            });
        });
        PANEL_DETAIL.querySelectorAll(".up-row").forEach((btn) => {
            btn.addEventListener("click", () => {
                const item = btn.closest(".up-item");
                if (!item) return;
                togglePhoto(item.dataset.pid);
            });
        });
        initPlayers(PANEL_DETAIL);
        setTimeout(applyBars, 150);
    }

    /* ── Player video: Plyr (self-hosted, tanpa CDN) ── */
    function initPlayers(root) {
        if (typeof Plyr === "undefined") return;
        root.querySelectorAll("video[data-plyr]").forEach((v) => {
            if (v.__plyr) return;
            v.__plyr = new Plyr(v, {
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
                tooltips: { controls: true, seek: true },
            });
        });
    }

    function userItemHTML(u) {
        const pct = TOTAL_COUNT ? (u.photos.length / TOTAL_COUNT) * 100 : 0;
        const videos = u.photos.filter(photoIsVideo).length;
        const reason = u.suspended && u.reason ? `<div class="user-reason">${esc(u.reason)}</div>` : "";
        const photos = u.photos.length
            ? `<div class="user-photos">${u.photos.map((p, i) => upRowHTML(p, i, u.key)).join("")}</div>`
            : `<div class="user-empty">Belum ada media</div>`;
        const breakdown = u.photos.length
            ? `${u.photos.length} media${videos ? " · " + videos + " video" : ""} · ` +
              `<span class="row-pct-inline">${pct.toFixed(1)}%</span>`
            : "";

        return `
  <div class="user-item" data-key="${esc(u.key)}">
    <button class="user-row" type="button" aria-expanded="false">
      <span class="user-row-main">
        ${avatarHTML(u)}
        <span class="row-info">
          <span class="row-name">${esc(u.name)}</span>
          <span class="row-sub">${breakdown}</span>
        </span>
        ${badgeHTML(u)}
        <span class="user-caret">›</span>
      </span>
      <span class="user-bar"><span class="user-bar-fill" data-w="${pct}"></span></span>
    </button>
    ${reason}
    <div class="user-expand"><div class="user-expand-inner">${photos}</div></div>
  </div>`;
    }

    function upRowHTML(p, i, userKey) {
        const name = photoName(p, i);
        const date = photoDate(p);
        const url = photoUrl(p);
        const isVideo = photoIsVideo(p);
        const id = String(p.name == null ? "" : p.name).trim();
        const pid = (userKey || "") + "::" + i;

        const thumb = !url
            ? `<span class="up-thumb"></span>`
            : isVideo
              ? `<span class="up-thumb"><span class="up-video">VIDEO</span></span>`
              : `<span class="up-thumb"><img src="${esc(url)}" alt="" loading="lazy" decoding="async" draggable="false" referrerpolicy="no-referrer"></span>`;

        const info = `
      <span class="up-info">
        <span class="up-name">#${esc(name)}</span>
        <span class="up-date">${esc(date)}</span>
      </span>`;

        // Pratinjau dibuka DI DALAM halaman ini (expand di dalam expand),
        // bukan navigasi ke halaman lain.
        let preview = "";
        if (url) {
            const media = isVideo
                ? `<video class="up-full" data-plyr src="${esc(url)}" playsinline preload="metadata" controlslist="nodownload noplaybackrate" disablepictureinpicture></video>`
                : `<img class="up-full" src="${esc(url)}" alt="#${esc(name)}" loading="lazy" decoding="async" draggable="false" referrerpolicy="no-referrer">`;
            preview = `
      <div class="up-view"><div class="up-view-inner">
        ${media}
        <div class="up-view-actions">
          <span class="up-date">#${esc(name)} · ${esc(date)}</span>
          ${id ? `<a class="up-link" href="/photo/?name=${encodeURIComponent(id)}" target="_blank" rel="noopener">Halaman foto</a>` : ""}
        </div>
      </div></div>`;
        }

        return `
  <div class="up-item" data-pid="${esc(pid)}">
    <button class="up-row" type="button" aria-expanded="false">
      ${thumb}${info}
      <span class="up-caret" aria-hidden="true">›</span>
    </button>${preview}
  </div>`;
    }

    /* ── Tab switching ── */
    function switchTab(name) {
        document.querySelectorAll(".tab-btn").forEach((b) => {
            const on = b.dataset.tab === name;
            b.classList.toggle("is-active", on);
            b.setAttribute("aria-selected", String(on));
        });
        PANEL_STATS.classList.toggle("hidden", name !== "stats");
        PANEL_DETAIL.classList.toggle("hidden", name !== "detail");
    }

    function focusUser(key) {
        let target = null;
        PANEL_DETAIL.querySelectorAll(".user-item").forEach((it) => {
            if (it.dataset.key === key) target = it;
        });
        if (!target) return;
        closePhotos();
        closeUsers();
        target.classList.add("open");
        const btn = target.querySelector(".user-row");
        if (btn) btn.setAttribute("aria-expanded", "true");
        target.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    /* ── Accordion: hanya 1 user yang boleh terbuka ── */
    function closePhotos() {
        PANEL_DETAIL.querySelectorAll(".up-item.open").forEach((el) => {
            el.classList.remove("open");
            const b = el.querySelector(".up-row");
            if (b) b.setAttribute("aria-expanded", "false");
            // Jeda video supaya suara tidak tetap berbunyi saat ditutup.
            const v = el.querySelector("video");
            if (v) {
                try {
                    v.pause();
                } catch (e) {
                    /* diabaikan */
                }
            }
        });
    }
    function closeUsers() {
        PANEL_DETAIL.querySelectorAll(".user-item.open").forEach((el) => {
            el.classList.remove("open");
            const b = el.querySelector(".user-row");
            if (b) b.setAttribute("aria-expanded", "false");
        });
    }
    function toggleUser(key) {
        const items = Array.from(PANEL_DETAIL.querySelectorAll(".user-item"));
        const target = items.find((el) => el.dataset.key === key);
        if (!target) return;
        const wasOpen = target.classList.contains("open");
        closePhotos();
        closeUsers();
        if (!wasOpen) {
            target.classList.add("open");
            const b = target.querySelector(".user-row");
            if (b) b.setAttribute("aria-expanded", "true");
        }
    }
    /* ── Accordion di dalam: hanya 1 foto yang boleh terbuka ── */
    function togglePhoto(pid) {
        const items = Array.from(PANEL_DETAIL.querySelectorAll(".up-item"));
        const target = items.find((el) => el.dataset.pid === pid);
        if (!target) return;
        const wasOpen = target.classList.contains("open");
        closePhotos();
        if (!wasOpen) {
            target.classList.add("open");
            const b = target.querySelector(".up-row");
            if (b) b.setAttribute("aria-expanded", "true");
        }
    }

    document.querySelectorAll(".tab-btn").forEach((btn) => {
        btn.addEventListener("click", () => switchTab(btn.dataset.tab));
    });

    /* ── Render ── */
    function render(photos, status) {
        ALL_PHOTOS = photos;
        TOTAL_COUNT = photos.length;
        USERS = buildUsers(photos, status);

        renderStats();
        renderDetail();

        PILL_MEDIA.textContent = TOTAL_COUNT;
        const videos = photos.filter(photoIsVideo).length;
        PILL_BREAKDOWN.textContent = videos + " video · " + (TOTAL_COUNT - videos) + " foto";
        PILL_USERS.textContent = USERS.length + " user";
        PILL.classList.add("show");
    }

    /* ── fetch ── */
    Promise.all([
        fetch(PHOTOS_URL + "?t=" + Date.now(), { cache: "no-store" }).then((r) => {
            if (!r.ok) throw new Error("photos.json: HTTP " + r.status);
            return r.json();
        }),
        fetch(STATUS_URL + "?t=" + Date.now(), { cache: "no-store" })
            .then((r) => {
                if (!r.ok) throw new Error("status.json: HTTP " + r.status);
                return r.json();
            })
            .catch((err) => {
                console.warn("status.json gagal, lanjut tanpa profil:", err);
                return null;
            }),
    ])
        .then(([photos, status]) => {
            if (!Array.isArray(photos) || photos.length === 0) {
                throw new Error("photos.json kosong atau bukan array");
            }
            render(photos, status);
        })
        .catch((err) => {
            PANEL_STATS.innerHTML = `<div class="state-msg">
    <p style="color:var(--blue);font-weight:600;margin-bottom:.5rem;">Gagal memuat data</p>
    <p style="font-size:.82rem;color:var(--faint);">${esc(err.message)}</p>
  </div>`;
        });
})();
