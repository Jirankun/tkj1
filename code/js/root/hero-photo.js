/* ============================================================
   TKJ OnE — POPUP GALERI FOTO HERO (/)
   ------------------------------------------------------------
   - klik/Enter pada foto → polaroid "terangkat" ke tengah layar;
   - isi popup bisa DIGESER kiri/kanan (drag) untuk pindah foto;
   - loop tanpa ujung, tanpa titik/panah indikator;
   - foto tetangga dipra-muat, jadi saat digeser tidak ada jeda;
   - sumber foto memakai markup: foto hero (slide 1) + setiap
     <figure class="hero-slide"> di dalam #heroGallery;
   - panah kiri/kanan di keyboard juga berpindah foto;
   - Esc / klik backdrop menutup, fokus kembali ke foto;
   - scroll dikunci selama popup terbuka.
   ============================================================ */
"use strict";

(function () {
    var figure = document.querySelector(".banner .hero-photo");
    var gallery = document.getElementById("heroGallery");
    var stage = document.getElementById("heroPhotoStage");
    var card = document.getElementById("heroPhotoCard");
    var shell = document.getElementById("heroPhotoShell");
    var closeBtn = document.getElementById("heroPhotoClose");
    if (!figure || !stage || !card || !shell || !closeBtn) return;

    var backdrop = stage.querySelector("[data-hero-close]");
    var isOpen = false;
    var closeTimer = 0;
    var lastFocus = null;

    /* Track geser (dibuat saat popup dibuka) */
    var swipe = null;
    var track = null;
    var slides = [];
    var visible = 0; /* jumlah slide dari markup */
    var pos = 0; /* posisi track (0 & n+1 adalah klon untuk loop) */
    var dragging = false;
    var moved = false;
    var startX = 0;
    var startY = 0;
    var startAt = 0;
    var dragX = 0;
    var activeId = null;

    var prefersReduced = function () {
        return Boolean(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    };

    /* ---------- Kumpulkan slide dari markup HTML ---------- */
    function collectSlides() {
        var list = [figure];
        if (gallery) {
            list = list.concat(Array.prototype.slice.call(gallery.querySelectorAll(".hero-slide")));
        }
        return list;
    }

    /* Salin satu slide untuk dipakai di dalam popup (tanpa atribut interaktif). */
    function cloneSlide(source) {
        var node = source.cloneNode(true);
        node.removeAttribute("id");
        node.removeAttribute("tabindex");
        node.removeAttribute("role");
        node.removeAttribute("aria-label");
        node.removeAttribute("aria-haspopup");
        node.classList.remove("hero-photo");
        node.classList.add("hero-slide");
        Array.prototype.forEach.call(node.querySelectorAll("img"), function (img) {
            /* Popup memang tempat melihat foto: jangan tunggu malas. */
            img.removeAttribute("loading");
            img.setAttribute("loading", "eager");
            img.setAttribute("draggable", "false");
            img.removeAttribute("fetchpriority");
        });
        return node;
    }

    /* Pra-muat foto tetangga supaya geseran terasa langsung. */
    function warm(index) {
        if (!visible) return;
        var source = slides[((index % visible) + visible) % visible];
        if (!source) return;
        var img = source.querySelector("img");
        if (!img) return;
        var src = img.currentSrc || img.getAttribute("src");
        if (!src) return;
        var pre = new Image();
        pre.decoding = "async";
        pre.src = src;
    }

    function realIndex() {
        if (!visible) return 0;
        return ((pos - 1) % visible + visible) % visible;
    }

    function applyTransform(px, animate) {
        if (!track) return;
        track.classList.toggle("no-anim", !animate);
        var offset = -pos * 100;
        var shift = offset + "%";
        if (px) {
            shift = "calc(" + offset + "% " + (px < 0 ? "-" : "+") + " " + Math.abs(px) + "px)";
        }
        track.style.transform = "translate3d(" + shift + ", 0px, 0px)";
    }

    /* Setelah animasi selesai: lompat diam-diam dari klon ke slide asli. */
    function normalize() {
        if (!visible) return;
        if (pos === 0) {
            pos = visible;
            applyTransform(0, false);
            void track.offsetWidth;
        } else if (pos === visible + 1) {
            pos = 1;
            applyTransform(0, false);
            void track.offsetWidth;
        }
    }

    function go(direction) {
        if (!visible || !track) return;
        if (visible === 1) {
            applyTransform(0, true);
            return;
        }
        pos += direction;
        applyTransform(0, true);
        warm(realIndex() + 1);
        warm(realIndex() - 1);
    }

    /* ---------- Animasi buka/tutup kartu ---------- */
    function motion(fromRect, toRect) {
        var dx = fromRect.left + fromRect.width / 2 - (toRect.left + toRect.width / 2);
        var dy = fromRect.top + fromRect.height / 2 - (toRect.top + toRect.height / 2);
        var sx = Math.max(0.2, fromRect.width / toRect.width);
        var sy = Math.max(0.2, fromRect.height / toRect.height);
        return "translate(" + dx + "px, " + dy + "px) scale(" + sx + ", " + sy + ")";
    }

    function lockScroll(lock) {
        document.documentElement.classList.toggle("mm-open", lock);
        document.body.classList.toggle("mm-open", lock);
        if (typeof smoothScroll !== "undefined" && smoothScroll) {
            if (lock) smoothScroll.stop();
            else smoothScroll.start();
        }
    }

    /* ---------- Bangun isi popup ---------- */
    function build() {
        var frame = figure.cloneNode(true);
        frame.removeAttribute("id");
        frame.removeAttribute("tabindex");
        frame.removeAttribute("role");
        frame.removeAttribute("aria-label");
        frame.removeAttribute("aria-haspopup");

        swipe = document.createElement("div");
        swipe.className = "hero-swipe";
        swipe.setAttribute("role", "group");
        swipe.setAttribute("aria-roledescription", "galeri");
        swipe.setAttribute("aria-label", "Foto kelas — geser kiri atau kanan untuk foto lain");

        track = document.createElement("div");
        track.className = "hero-track";
        slides = collectSlides();
        visible = slides.length;

        var nodes = slides.map(function (source, i) {
            var node = cloneSlide(source);
            node.setAttribute("role", "group");
            node.setAttribute("aria-roledescription", "slide");
            node.setAttribute("aria-label", "Foto " + (i + 1) + " dari " + visible);
            return node;
        });
        if (visible > 1) {
            /* Klon ujung-ujung supaya geseran bisa berputar terus.
               Klon tidak perlu dibacakan lagi oleh pembaca layar. */
            var firstClone = cloneSlide(slides[visible - 1]);
            var lastClone = cloneSlide(slides[0]);
            firstClone.setAttribute("aria-hidden", "true");
            lastClone.setAttribute("aria-hidden", "true");
            nodes.unshift(firstClone);
            nodes.push(lastClone);
        }
        nodes.forEach(function (node) {
            track.appendChild(node);
        });

        swipe.appendChild(track);
        var media = frame.querySelector("picture") || frame.querySelector("img");
        if (media) media.replaceWith(swipe);
        else frame.appendChild(swipe);

        card.replaceChildren(frame);

        pos = visible > 1 ? 1 : 0;
        applyTransform(0, false);

        /* Foto saat ini + tetangganya langsung diunduh. */
        warm(realIndex());
        warm(realIndex() + 1);
        warm(realIndex() - 1);

        if (visible > 1) bindDrag();
    }

    /* ---------- Geser (mouse & sentuh) ---------- */
    function onDown(event) {
        if (!visible || visible < 2) return;
        if (event.pointerType === "mouse" && event.button !== 0) return;
        dragging = true;
        moved = false;
        startX = event.clientX;
        startY = event.clientY;
        startAt = Date.now();
        dragX = 0;
        activeId = event.pointerId;
        track.classList.add("no-anim");
        swipe.classList.add("is-dragging");
        if (swipe.setPointerCapture && activeId != null) {
            try {
                swipe.setPointerCapture(activeId);
            } catch (err) {
                /* abaikan: tetap jalan lewat listener global */
            }
        }
        window.addEventListener("pointermove", onMove, { passive: true });
        window.addEventListener("pointerup", onUp);
        window.addEventListener("pointercancel", onUp);
    }

    function onMove(event) {
        if (!dragging) return;
        var dx = event.clientX - startX;
        var dy = event.clientY - startY;
        /* Geseran tegak jelas lebih dominan: jangan anggap geser foto. */
        if (!moved && Math.abs(dy) > 18 && Math.abs(dy) > Math.abs(dx) * 1.4) return;
        moved = true;
        var width = swipe ? swipe.getBoundingClientRect().width : 0;
        /* Batasi geseran maksimal satu layar supaya tidak terbuka ruang kosong. */
        if (width > 0) dx = Math.max(-width, Math.min(width, dx));
        dragX = dx;
        applyTransform(dx, false);
    }

    function onUp() {
        if (!dragging) return;
        dragging = false;
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
        if (swipe) swipe.classList.remove("is-dragging");

        var width = swipe ? swipe.getBoundingClientRect().width : 0;
        var threshold = Math.max(40, width * 0.16);
        var fast = Math.abs(dragX) > 24 && Date.now() - startAt < 260;
        var change = Math.abs(dragX) > threshold || fast;

        if (!change) {
            applyTransform(0, true);
            return;
        }
        go(dragX < 0 ? 1 : -1);
    }

    function bindDrag() {
        swipe.addEventListener("pointerdown", onDown);
        swipe.addEventListener("transitionend", function (event) {
            if (event.propertyName !== "transform") return;
            normalize();
        });
        /* Klik pada foto tidak menutup popup. */
        swipe.addEventListener("click", function (event) {
            event.stopPropagation();
        });
        /* Cegah drag bawaan gambar. */
        swipe.addEventListener("dragstart", function (event) {
            event.preventDefault();
        });
    }

    /* ---------- Buka / tutup ---------- */
    function open() {
        if (isOpen) return;
        clearTimeout(closeTimer);
        isOpen = true;
        lastFocus = document.activeElement;

        build();
        stage.hidden = false;

        var fromRect = figure.getBoundingClientRect();
        var toRect = card.getBoundingClientRect();
        var animate = !prefersReduced() && toRect.width > 0 && toRect.height > 0;

        card.style.transition = "none";
        card.style.transform = animate ? motion(fromRect, toRect) : "none";
        card.style.opacity = animate ? "0.4" : "1";
        void card.offsetWidth; /* paksa reflow sebelum transisi */
        card.style.transition = "";

        if (animate) {
            requestAnimationFrame(function () {
                card.style.transform = "translate(0px, 0px) scale(1)";
                card.style.opacity = "1";
            });
        }

        stage.classList.add("is-open");
        lockScroll(true);
        closeBtn.focus({ preventScroll: true });
    }

    function close() {
        if (!isOpen) return;
        isOpen = false;
        dragging = false;

        var animate = !prefersReduced();
        if (animate) {
            var fromRect = figure.getBoundingClientRect();
            var toRect = card.getBoundingClientRect();
            card.style.transform = motion(fromRect, toRect);
            card.style.opacity = "0";
        }

        stage.classList.remove("is-open");
        lockScroll(false);

        var finish = function () {
            stage.hidden = true;
            card.textContent = "";
            card.style.transition = "none";
            card.style.transform = "";
            card.style.opacity = "";
            void card.offsetWidth;
            card.style.transition = "";
            track = null;
            swipe = null;
            slides = [];
            visible = 0;
            pos = 0;
            if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus({ preventScroll: true });
            lastFocus = null;
        };

        if (animate) closeTimer = setTimeout(finish, 330);
        else finish();
    }

    /* Foto bisa diaktifkan lewat klik, Enter, atau Spasi. */
    figure.tabIndex = 0;
    figure.setAttribute("role", "button");
    figure.setAttribute("aria-haspopup", "dialog");
    figure.setAttribute("aria-label", "Buka galeri foto kelas TKJ 1");

    figure.addEventListener("click", open);
    figure.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " " || event.key === "Spacebar") {
            event.preventDefault();
            open();
        }
    });

    closeBtn.addEventListener("click", close);
    if (backdrop) backdrop.addEventListener("click", close);
    stage.addEventListener("click", function (event) {
        if (event.target === stage || event.target.closest("[data-hero-close]")) close();
    });
    document.addEventListener("keydown", function (event) {
        if (!isOpen) return;
        if (event.key === "Escape") {
            close();
            return;
        }
        if (event.key === "ArrowLeft") {
            event.preventDefault();
            go(-1);
        } else if (event.key === "ArrowRight") {
            event.preventDefault();
            go(1);
        }
    });
})();
