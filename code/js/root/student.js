"use strict";

/* ==========================================================
               DATA ANGGOTA — dibangun dari data/memberlist.json menjadi markup
               statis #membersList (lihat scripts/build-student.py). Ubah anggota
               di JSON itu, bukan di HTML. JavaScript di bawah hanya menambah
               interaksi (pemutar audio).
               ========================================================== */

/* ---------- Helper ---------- */
const $ = id => document.getElementById(id);
const prefersReduced = () =>
    Boolean(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
/* Format detik → m:ss atau h:mm:ss ("--:--" bila belum diketahui) */
/* Ikon kecil di ujung nama yang punya tautan (tanda nama bisa diklik) */
const linkIcon = () => {
    const icon = document.createElement("i");
    icon.className = "fa-sharp fa-solid fa-up-right-from-square";
    icon.setAttribute("aria-hidden", "true");
    return icon;
};
const fmtTime = seconds => {
    if (!Number.isFinite(seconds) || seconds < 0) return "--:--";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return m >= 60
        ? Math.floor(m / 60) + ":" + String(m % 60).padStart(2, "0") + ":" + String(s).padStart(2, "0")
        : m + ":" + String(s).padStart(2, "0");
};

/* ---------- Pemutar audio mini per kartu ---------- */
function bindAudio() {
    const players = document.querySelectorAll("#membersList .member-audio");
    players.forEach(row => {
        const audio = row.querySelector("audio");
        const btn = row.querySelector(".ma-btn");
        const range = row.querySelector(".ma-range");
        if (!audio || !btn || !range) return;
        const src = audio.getAttribute("src");
        if (!src) return;

        const icon = btn.querySelector("i");
        const timeEl = row.querySelector(".ma-time");
        const name = row.closest(".member-cell")?.querySelector(".member-name")?.textContent || "";
        const showDuration = () => {
            if (timeEl) timeEl.textContent = fmtTime(audio.duration);
        };
        const setProgress = () => {
            const dur = audio.duration;
            const pct = Number.isFinite(dur) && dur > 0 ? (audio.currentTime / dur) * 100 : 0;
            range.value = String(Math.round(pct * 10));
            range.style.setProperty("--p", pct.toFixed(2) + "%");
        };
        const sync = () => {
            const playing = !audio.paused && !audio.ended;
            icon.className = "fa-solid fa-" + (playing ? "pause" : "play");
            btn.classList.toggle("is-playing", playing);
            btn.setAttribute("aria-label", (playing ? "Jeda audio " : "Putar audio ") + name);
        };

        btn.addEventListener("click", () => {
            if (audio.paused) {
                const p = audio.play();
                if (p && typeof p.catch === "function") {
                    p.catch(() => sync());
                }
            } else {
                audio.pause();
            }
        });
        range.addEventListener("input", () => {
            if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;
            audio.currentTime = (Number(range.value) / 1000) * audio.duration;
            setProgress();
        });
        audio.addEventListener("play", () => {
            document.querySelectorAll("#membersList audio").forEach(other => {
                if (other !== audio) other.pause();
            });
            sync();
        });
        audio.addEventListener("pause", sync);
        audio.addEventListener("timeupdate", setProgress);
        audio.addEventListener("loadedmetadata", () => {
            setProgress();
            showDuration();
        });
        audio.addEventListener("durationchange", showDuration);
        audio.addEventListener("ended", () => {
            audio.currentTime = 0;
            setProgress();
            sync();
        });
        setProgress();
        if (audio.readyState >= 1) showDuration();
    });
}

/* ==========================================================
               Popup kartu anggota
               Klik kartu → kartu “lepas” dari grid, membesar ke tengah
               layar; isinya memakai data dari kartu yang diklik.
               Audio memakai elemen <audio> yang sama dengan kartu,
               jadi status putar/jeda tetap sinkron.
               ========================================================== */
const memberModal = $("memberModal");
const memberModalShell = $("memberModalShell");
const memberModalCard = $("memberModalCard");
const memberModalClose = $("memberModalClose");
let modalCell = null;
let modalCleanup = null;
let modalCloseTimer = 0;

/* Posisi & skala kartu tujuan terhadap kartu sumber (untuk animasi) */
function modalMotion(fromRect, toRect) {
    const dx = fromRect.left + fromRect.width / 2 - (toRect.left + toRect.width / 2);
    const dy = fromRect.top + fromRect.height / 2 - (toRect.top + toRect.height / 2);
    const sx = Math.max(0.2, fromRect.width / toRect.width);
    const sy = Math.max(0.2, fromRect.height / toRect.height);
    /* Kartu berada di alur normal (tengah layar), jadi cukup
                   geser pusatnya ke pusat kartu sumber lalu skala. */
    return "translate(" + dx + "px, " + dy + "px) scale(" + sx + ", " + sy + ")";
}

function openMemberModal(cell) {
    if (!cell || !memberModal) return;
    clearTimeout(modalCloseTimer);
    if (modalCleanup) {
        modalCleanup();
        modalCleanup = null;
    }

    const name = (cell.querySelector(".member-name")?.textContent || "").trim();
    memberModalCard.textContent = "";
    memberModalCard.style.transition = "none";
    memberModalCard.style.transform = "";
    memberModalCard.style.opacity = "";
    memberModalCard.style.setProperty("--tone", cell.style.getPropertyValue("--tone") || "200");

    /* Foto / avatar */
    const media = cell.querySelector(".member-media");
    const photo = media?.querySelector("img");
    if (photo) {
        const bigPhoto = document.createElement("img");
        bigPhoto.className = "mm-photo";
        bigPhoto.src = photo.getAttribute("src") || "";
        bigPhoto.alt = photo.getAttribute("alt") || name;
        bigPhoto.decoding = "async";
        memberModalCard.appendChild(bigPhoto);
    } else {
        const bigAvatar = document.createElement("div");
        bigAvatar.className = "mm-avatar";
        bigAvatar.textContent = media?.querySelector(".avatar")?.textContent || "•";
        memberModalCard.appendChild(bigAvatar);
    }

    /* Nama — tetap bisa diklik ke Instagram seperti di kartu */
    const nameLink = cell.querySelector("a.member-name");
    const nameNode = document.createElement(nameLink ? "a" : "h2");
    nameNode.className = "mm-name";
    nameNode.textContent = name;
    if (nameLink) {
        nameNode.href = nameLink.getAttribute("href") || "";
        nameNode.target = "_blank";
        nameNode.rel = "noopener noreferrer";
        nameNode.appendChild(linkIcon());
    }
    memberModalCard.appendChild(nameNode);

    /* Pemutar audio */
    const audio = cell.querySelector("audio");
    const player = document.createElement("div");
    player.className = "mm-player";

    const line = document.createElement("div");
    line.className = "mm-line";
    const curTime = document.createElement("span");
    curTime.className = "mm-time";
    curTime.textContent = "0:00";
    const range = document.createElement("input");
    range.type = "range";
    range.className = "ma-range mm-range";
    range.min = "0";
    range.max = "1000";
    range.step = "1";
    range.value = "0";
    range.setAttribute("aria-label", "Posisi audio " + name);
    const totalTime = document.createElement("span");
    totalTime.className = "mm-time";
    totalTime.textContent = "--:--";
    line.append(curTime, range, totalTime);

    const playBtn = document.createElement("button");
    playBtn.type = "button";
    playBtn.className = "mm-play";
    playBtn.setAttribute("aria-label", "Putar audio " + name);
    playBtn.innerHTML = '<i class="fa-solid fa-play" aria-hidden="true"></i>';

    player.append(line, playBtn);
    memberModalCard.appendChild(player);

    if (!audio) {
        player.classList.add("is-empty");
        range.disabled = true;
        playBtn.disabled = true;
        curTime.textContent = "--:--";
    } else {
        const icon = playBtn.querySelector("i");
        const setProgress = () => {
            const duration = audio.duration;
            const pct = Number.isFinite(duration) && duration > 0 ? (audio.currentTime / duration) * 100 : 0;
            range.value = String(Math.round(pct * 10));
            range.style.setProperty("--p", pct.toFixed(2) + "%");
            curTime.textContent = fmtTime(audio.currentTime);
        };
        const setDuration = () => {
            totalTime.textContent = fmtTime(audio.duration);
        };
        const sync = () => {
            const playing = !audio.paused && !audio.ended;
            icon.className = "fa-solid fa-" + (playing ? "pause" : "play");
            playBtn.classList.toggle("is-playing", playing);
            playBtn.setAttribute("aria-label", (playing ? "Jeda audio " : "Putar audio ") + name);
        };
        const onPlay = () => {
            /* Hanya satu audio yang boleh berbunyi */
            document.querySelectorAll("#membersList audio").forEach(other => {
                if (other !== audio) other.pause();
            });
            sync();
        };
        const onToggle = () => {
            if (audio.paused) {
                const p = audio.play();
                if (p && typeof p.catch === "function") p.catch(sync);
            } else {
                audio.pause();
            }
        };
        const onSeek = () => {
            if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;
            audio.currentTime = (Number(range.value) / 1000) * audio.duration;
            setProgress();
        };
        const onMeta = () => {
            setProgress();
            setDuration();
        };
        const onEnded = () => {
            audio.currentTime = 0;
            setProgress();
            sync();
        };

        playBtn.addEventListener("click", onToggle);
        range.addEventListener("input", onSeek);
        audio.addEventListener("play", onPlay);
        audio.addEventListener("pause", sync);
        audio.addEventListener("timeupdate", setProgress);
        audio.addEventListener("loadedmetadata", onMeta);
        audio.addEventListener("durationchange", setDuration);
        audio.addEventListener("ended", onEnded);

        modalCleanup = () => {
            playBtn.removeEventListener("click", onToggle);
            range.removeEventListener("input", onSeek);
            audio.removeEventListener("play", onPlay);
            audio.removeEventListener("pause", sync);
            audio.removeEventListener("timeupdate", setProgress);
            audio.removeEventListener("loadedmetadata", onMeta);
            audio.removeEventListener("durationchange", setDuration);
            audio.removeEventListener("ended", onEnded);
        };

        setProgress();
        if (audio.readyState >= 1) setDuration();
        sync();
    }

    /* Tampilkan & animasikan dari posisi kartu ke tengah layar */
    memberModal.hidden = false;
    const fromRect = cell.getBoundingClientRect();
    const toRect = memberModalCard.getBoundingClientRect();
    const animate = !prefersReduced() && toRect.width > 0 && toRect.height > 0;
    if (animate) {
        memberModalCard.style.transform = modalMotion(fromRect, toRect);
        memberModalCard.style.opacity = "0.35";
        void memberModalCard.offsetWidth; /* paksa reflow */
        memberModalCard.style.transition = "";
        requestAnimationFrame(() => {
            memberModalCard.style.transform = "translate(0, 0) scale(1)";
            memberModalCard.style.opacity = "1";
        });
    } else {
        memberModalCard.style.transform = "translate(0, 0) scale(1)";
        memberModalCard.style.opacity = "1";
    }

    memberModalShell.setAttribute("aria-label", "Detail anggota " + name);
    memberModal.classList.add("is-open");
    document.documentElement.classList.add("mm-open");
    document.body.classList.add("mm-open");
    if (smoothScroll) smoothScroll.stop();
    cell.classList.add("is-open");
    modalCell = cell;
    memberModalClose.focus({ preventScroll: true });
}

function closeMemberModal() {
    if (!memberModal || memberModal.hidden) return;
    const cell = modalCell;
    const animate = Boolean(cell) && !prefersReduced();

    if (modalCleanup) {
        modalCleanup();
        modalCleanup = null;
    }

    if (animate) {
        const fromRect = cell.getBoundingClientRect();
        const toRect = memberModalCard.getBoundingClientRect();
        memberModalCard.style.transition = "";
        memberModalCard.style.transform = modalMotion(fromRect, toRect);
        memberModalCard.style.opacity = "0";
    }

    memberModal.classList.remove("is-open");
    document.documentElement.classList.remove("mm-open");
    document.body.classList.remove("mm-open");
    if (smoothScroll) smoothScroll.start();
    if (cell) cell.classList.remove("is-open");
    modalCell = null;

    const finish = () => {
        memberModal.hidden = true;
        memberModalCard.textContent = "";
        memberModalCard.style.transition = "none";
        memberModalCard.style.transform = "";
        memberModalCard.style.opacity = "";
        void memberModalCard.offsetWidth;
        memberModalCard.style.transition = "";
        if (cell) cell.focus({ preventScroll: true });
    };

    if (animate) {
        modalCloseTimer = setTimeout(finish, 340);
    } else {
        finish();
    }
}

/* ---------- Penanda nama yang punya tautan ----------
   Nama di daftar bisa berupa <span> (tanpa link) atau <a> (mis. Instagram).
   Untuk yang <a>, tambahkan ikon panah di ujung nama supaya jelas bisa diklik.
   Dilakukan di sini, bukan di markup, agar tetap muncul walau daftar disuntik
   ulang oleh workflow inject-ld-and-memberlist.yml. */
function bindNameLinks() {
    document.querySelectorAll("#membersList a.member-name[href]").forEach(link => {
        if (link.querySelector(".fa-up-right-from-square")) return;
        link.appendChild(linkIcon());
    });
}

function bindMemberCards() {
    document.querySelectorAll("#membersList .member-cell").forEach(cell => {
        const name = (cell.querySelector(".member-name")?.textContent || "").trim();
        cell.tabIndex = 0;
        cell.setAttribute("role", "group");
        cell.setAttribute("aria-label", "Kartu " + name + " — tekan Enter untuk memperbesar");
        cell.addEventListener("click", e => {
            /* Username & kontrol audio tetap bekerja seperti biasa */
            if (e.target.closest("a, button, input")) return;
            openMemberModal(cell);
        });
        cell.addEventListener("keydown", e => {
            if (e.target !== cell) return;
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openMemberModal(cell);
            }
        });
    });
}

function bindMemberModal() {
    if (!memberModal) return;
    memberModalClose.addEventListener("click", closeMemberModal);
    memberModal.addEventListener("click", e => {
        if (e.target === memberModal || e.target.closest("[data-mm-close]")) closeMemberModal();
    });
    document.addEventListener("keydown", e => {
        if (e.key === "Escape" && !memberModal.hidden) closeMemberModal();
    });
}

/* ---------- Navbar & scroll ---------- */
function bindNav() {
    const nav = $("nav");
    const menu = $("navMenu");
    const toggler = $("navToggler");
    toggler.addEventListener("click", () => {
        const open = menu.classList.toggle("open");
        toggler.setAttribute("aria-expanded", open ? "true" : "false");
        toggler.querySelector("i")?.classList.toggle("fa-xmark", open);
        toggler.querySelector("i")?.classList.toggle("fa-bars", !open);
    });
    menu.addEventListener("click", e => {
        if (e.target.closest("a")) {
            menu.classList.remove("open");
            toggler.setAttribute("aria-expanded", "false");
            toggler.querySelector("i")?.classList.remove("fa-xmark");
            toggler.querySelector("i")?.classList.add("fa-bars");
        }
    });
    const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
}

/* ---------- Animasi masuk ---------- */
function bindReveal() {
    const items = document.querySelectorAll(".reveal:not(.in)");
    if (!("IntersectionObserver" in window)) {
        items.forEach(el => el.classList.add("in"));
        return;
    }
    const io = new IntersectionObserver(
        entries => {
            entries.forEach(en => {
                if (en.isIntersecting) {
                    en.target.classList.add("in");
                    io.unobserve(en.target);
                }
            });
        },
        { threshold: 0.12 },
    );
    items.forEach(el => io.observe(el));
}

/* ---------- Smooth scroll Locomotive ---------- */
let smoothScroll = null;
function initSmoothScroll() {
    if (!window.LocomotiveScroll || !window.matchMedia) return;
    if (prefersReduced()) return;
    /* Scroll halus hanya desktop + pointer presisi; ponsel pakai scroll native. */
    if (!window.matchMedia("(min-width: 992px)").matches) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    try {
        smoothScroll = new LocomotiveScroll({
            lenisOptions: { lerp: 0.09, wheelMultiplier: 1 },
            scrollCallback: values => {
                const nav = document.getElementById("nav");
                if (nav) nav.classList.toggle("scrolled", values.scroll > 50);
            },
        });
        window.addEventListener("load", () => smoothScroll && smoothScroll.resize());
    } catch (err) {
        smoothScroll = null;
    }
}

/* ---------- Mulai ---------- */
$("year").textContent = new Date().getFullYear();
bindNav();
bindAudio();
bindNameLinks();
bindMemberCards();
bindMemberModal();
bindReveal();
initSmoothScroll();
