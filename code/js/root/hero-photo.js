/* ============================================================
   TKJ OnE — POPUP FOTO HERO (/)
   ------------------------------------------------------------
   Pola sama dengan popup kartu anggota di /student/:
   - klik/Enter pada foto → polaroid "terangkat" ke tengah layar;
   - backdrop gelap, tombol tutup di luar kartu;
   - Esc / klik backdrop menutup, fokus kembali ke foto;
   - scroll dikunci selama popup terbuka.
   ============================================================ */
"use strict";

(function () {
    var figure = document.querySelector(".banner .hero-photo");
    var stage = document.getElementById("heroPhotoStage");
    var card = document.getElementById("heroPhotoCard");
    var shell = document.getElementById("heroPhotoShell");
    var closeBtn = document.getElementById("heroPhotoClose");
    if (!figure || !stage || !card || !shell || !closeBtn) return;

    var backdrop = stage.querySelector("[data-hero-close]");
    var isOpen = false;
    var closeTimer = 0;
    var lastFocus = null;

    var prefersReduced = function () {
        return Boolean(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    };

    /* Posisi & skala kartu tujuan terhadap foto sumber (untuk animasi). */
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

    function open() {
        if (isOpen) return;
        clearTimeout(closeTimer);
        isOpen = true;
        lastFocus = document.activeElement;

        /* Salin polaroid (bingkai + selotip) ke dalam popup. */
        var clone = figure.cloneNode(true);
        clone.removeAttribute("id");
        clone.removeAttribute("tabindex");
        clone.removeAttribute("role");
        clone.removeAttribute("aria-label");
        clone.removeAttribute("aria-haspopup");
        card.replaceChildren(clone);

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
    figure.setAttribute("aria-label", "Perbesar foto kelas TKJ 1");

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
        if (event.key === "Escape" && isOpen) close();
    });
})();
