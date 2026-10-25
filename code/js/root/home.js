"use strict";

/* ==========================================================
           SEMUA ISI HALAMAN ADA LANGSUNG DI HTML DI ATAS.
           Tidak ada data ganda di JavaScript/JSON — sunting markup
           (wali kelas, pengurus, anggota, FAQ) langsung di HTML.
           JavaScript di bawah hanya untuk interaksi.
           ========================================================== */
/* ---------- Helper ---------- */
const $ = (id) => document.getElementById(id);
const prefersReduced = () =>
    Boolean(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
/* ---------- Prestasi (slider) ---------- */
let slideIndex = 0;
let slideTimer = null;

function goSlide(i) {
    const slides = document.querySelectorAll("#slideTrack .slide");
    const dots = document.querySelectorAll("#slideDots button");
    if (!slides.length) return;
    slideIndex = (i + slides.length) % slides.length;
    slides.forEach((s, n) => s.classList.toggle("active", n === slideIndex));
    dots.forEach((d, n) => d.classList.toggle("active", n === slideIndex));
}

function bindSlider() {
    const track = $("slideTrack");
    const dotsWrap = $("slideDots");
    if (!track || !dotsWrap) return;
    const slides = track.querySelectorAll(".slide");
    if (!slides.length) return; // belum ada prestasi → bagian tetap tersembunyi

    /* Slide ditulis langsung di HTML; dot dibuat dari jumlah slide. */
    $("prestasi").hidden = false;
    slides[0].classList.add("active");
    dotsWrap.innerHTML = Array.from(slides)
        .map((_, i) => '<button type="button" data-i="' + i + '"' + (i === 0 ? ' class="active"' : "") + "></button>")
        .join("");

    $("slidePrev").addEventListener("click", () => goSlide(slideIndex - 1));
    $("slideNext").addEventListener("click", () => goSlide(slideIndex + 1));
    dotsWrap.addEventListener("click", (e) => {
        const b = e.target.closest("button[data-i]");
        if (b) goSlide(Number(b.dataset.i));
    });
    const start = () => {
        clearInterval(slideTimer);
        slideTimer = setInterval(() => goSlide(slideIndex + 1), 6000);
    };
    const stop = () => clearInterval(slideTimer);
    document.querySelector(".slider")?.addEventListener("mouseenter", stop);
    document.querySelector(".slider")?.addEventListener("mouseleave", start);
    start();
}

/* ---------- Navbar & scroll ---------- */
function bindNav() {
    const nav = $("nav");
    const menu = $("navMenu");
    const toggler = $("navToggler");
    if (!nav || !menu || !toggler) return;

    const closeMenu = () => {
        menu.classList.remove("open");
        toggler.setAttribute("aria-expanded", "false");
        toggler.querySelector("i")?.classList.remove("fa-xmark");
        toggler.querySelector("i")?.classList.add("fa-bars");
    };

    toggler.addEventListener("click", () => {
        const open = menu.classList.toggle("open");
        toggler.setAttribute("aria-expanded", open ? "true" : "false");
        toggler.querySelector("i")?.classList.toggle("fa-xmark", open);
        toggler.querySelector("i")?.classList.toggle("fa-bars", !open);
    });

    const navHeight = () => Math.round(nav.getBoundingClientRect().height) || 56;
    /* Abaikan link yang sedang disembunyikan (mis. #prestasi kosong) */
    const menuLinks = Array.from(menu.querySelectorAll("a[href^='#']")).filter((a) => !a.closest("[hidden]"));
    const scrollLinks = Array.from(nav.querySelectorAll("[data-scroll-to][href^='#']"));
    const items = menuLinks
        .map((link) => ({ link, section: document.querySelector(link.getAttribute("href")) }))
        .filter((item) => item.section);

    const setActive = (link) => menuLinks.forEach((a) => a.classList.toggle("active", a === link));
    const offsetFor = (link) => {
        const raw = Number(link.dataset.scrollToOffset);
        return Number.isFinite(raw) ? raw : -(navHeight() + 8);
    };

    /* Scroll tepat ke judul section, memakai tinggi navbar yang sebenarnya. */
    const scrollToLink = (link, smooth) => {
        const section = document.querySelector(link.getAttribute("href"));
        if (!section) return;
        const offset = offsetFor(link);
        if (smoothScroll && typeof smoothScroll.scrollTo === "function") {
            smoothScroll.scrollTo(section, { offset, duration: 0.9 });
        } else {
            window.scrollTo({
                top: Math.max(0, section.getBoundingClientRect().top + window.scrollY + offset),
                behavior: smooth && !prefersReduced() ? "smooth" : "auto",
            });
        }
        if (link.closest("#navMenu")) setActive(link);
        if (history.replaceState) history.replaceState(null, "", link.getAttribute("href"));
    };

    nav.addEventListener("click", (event) => {
        const link = event.target.closest("[data-scroll-to][href^='#']");
        if (!link || !document.querySelector(link.getAttribute("href"))) return;
        event.preventDefault();
        closeMenu();
        scrollToLink(link, true);
    });

    /* Penanda menu aktif dihitung dari posisi scroll, bukan pita tengah layar,
               supaya section pendek (mis. Anggota) tetap benar setelah diklik. */
    const spy = () => {
        if (!items.length) return;
        if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
            setActive(items[items.length - 1].link);
            return;
        }
        const line = window.scrollY + navHeight() + 24;
        let current = items[0];
        items.forEach((item) => {
            if (item.section.getBoundingClientRect().top + window.scrollY <= line) current = item;
        });
        setActive(current.link);
    };

    let ticking = false;
    const onScroll = () => {
        nav.classList.toggle("scrolled", window.scrollY > 50);
        if (!ticking) {
            ticking = true;
            requestAnimationFrame(() => {
                ticking = false;
                spy();
            });
        }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", spy);
    onScroll();
    spy();

    /* Link yang dibuka langsung dengan #hash tetap dikoreksi offset-nya. */
    if (location.hash) {
        const link = scrollLinks.find((a) => a.getAttribute("href") === location.hash);
        if (link) requestAnimationFrame(() => scrollToLink(link, false));
    }
}

/* ---------- Penanda nama yang punya tautan ----------
   Nama wali kelas / pengurus hanya diberi ikon panah bila namanya berupa
   tautan (a.person-name). Nama tanpa link dibiarkan apa adanya. */
function bindNameLinks() {
    document.querySelectorAll("a.person-name[href]").forEach((link) => {
        if (link.querySelector(".fa-up-right-from-square")) return;
        const icon = document.createElement("i");
        icon.className = "fa-sharp fa-solid fa-up-right-from-square";
        icon.setAttribute("aria-hidden", "true");
        link.appendChild(icon);
    });
}

/* ---------- Animasi masuk ---------- */
function bindReveal() {
    const items = document.querySelectorAll(".reveal:not(.in)");
    if (!("IntersectionObserver" in window)) {
        items.forEach((el) => el.classList.add("in"));
        return;
    }
    const io = new IntersectionObserver(
        (entries) => {
            entries.forEach((en) => {
                if (en.isIntersecting) {
                    en.target.classList.add("in");
                    io.unobserve(en.target);
                }
            });
        },
        { threshold: 0.12 },
    );
    items.forEach((el) => io.observe(el));
}

/* ---------- Smooth scroll Locomotive (desktop) ---------- */
let smoothScroll = null;
function initSmoothScroll() {
    if (!window.LocomotiveScroll || !window.matchMedia) return;
    if (prefersReduced()) return;
    /* Scroll halus hanya untuk desktop + pointer presisi. Di ponsel
               pakai scroll native supaya tidak menambah kerja per frame. */
    if (!window.matchMedia("(min-width: 992px)").matches) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    try {
        smoothScroll = new LocomotiveScroll({
            lenisOptions: { lerp: 0.09, wheelMultiplier: 1 },
            scrollCallback: (values) => {
                const nav = document.getElementById("nav");
                if (nav) nav.classList.toggle("scrolled", values.scroll > 50);
            },
        });
        window.addEventListener("load", () => smoothScroll && smoothScroll.resize());
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(() => smoothScroll && smoothScroll.resize());
        }
    } catch (err) {
        smoothScroll = null;
    }
}

/* ---------- Mulai ---------- */
$("year").textContent = new Date().getFullYear();
bindSlider();
bindNav();
bindNameLinks();
bindReveal();
initSmoothScroll();
