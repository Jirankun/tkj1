/* ============================================================
   TKJ OnE — EFEK BINAR (sparkle) untuk halaman root (/ dan /student/)
   ------------------------------------------------------------
   - partikel bintang muncul saat pointer/jari bergerak;
   - letupan kecil saat klik/ketuk;
   - partikel melayang mengikuti arah geseran lalu JATUH ke bawah;
   - di layar sentuh lebih hemat (jarak & jeda lebih besar, partikel kecil)
     supaya tetap enak saat menggulir dengan jari;
   - dibatasi (jarak, waktu, dan jumlah partikel) supaya ringan;
   - otomatis nonaktif bila pengguna memilih "kurangi animasi".
   Tanpa library, tanpa request tambahan.
   ============================================================ */
"use strict";

(function () {
    if (!window.matchMedia) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    var GLYPHS = ["✦", "✧", "★", "✺", "✳"];
    var COLORS = ["#5ffbf1", "#ff5fd2", "#ffd166", "#ffffff", "#8b5cf6"];

    /* Layar sentuh: geseran jari saat menggulir cukup cepat, jadi partikel
       dibuat lebih jarang, lebih kecil, dan lebih singkat. */
    var TOUCH = Boolean(
        window.matchMedia("(pointer: coarse)").matches || window.matchMedia("(hover: none)").matches,
    );
    var MAX_ALIVE = TOUCH ? 26 : 34;
    var MOVE_STEP = TOUCH ? 32 : 26; /* jarak minimum antar partikel (px) */
    var MOVE_GAP = TOUCH ? 55 : 38; /* jeda minimum antar partikel (ms) */

    var layer = null;
    var alive = 0;
    var lastX = null;
    var lastY = null;
    var lastAt = 0;

    function container() {
        if (layer && layer.isConnected) return layer;
        layer = document.createElement("div");
        layer.className = "sparkle-layer";
        layer.setAttribute("aria-hidden", "true");
        document.body.appendChild(layer);
        return layer;
    }

    function remove(el) {
        if (!el.parentNode) return;
        el.parentNode.removeChild(el);
        alive = Math.max(0, alive - 1);
    }

    /* vx = kecepatan geser mendatar (px antar event), dipakai agar partikel
       tertinggal di belakang jari, bukan muncul persis di bawahnya. */
    function spawn(x, y, power, vx) {
        if (alive >= MAX_ALIVE) return;
        var el = document.createElement("span");
        var size = (TOUCH ? 7 : 9) + Math.random() * 7 * power;
        /* sedikit acak di sekitar titik sentuh, tidak selalu di tengah jari */
        var jitterX = (Math.random() - 0.5) * (TOUCH ? 12 : 9);
        var jitterY = (Math.random() - 0.5) * (TOUCH ? 12 : 9);
        /* arah geser ikut menarik partikel, sisanya acak tipis */
        var driftX = (vx || 0) * 0.22 + (Math.random() - 0.5) * 16;
        /* gravitasi: selalu jatuh ke bawah, makin besar saat klik */
        var driftY = 22 + Math.random() * (TOUCH ? 24 : 34) * power;
        var life = (TOUCH ? 440 : 500) + Math.random() * 260;

        el.className = "sparkle";
        el.textContent = GLYPHS[(Math.random() * GLYPHS.length) | 0];
        el.style.left = x + jitterX + "px";
        el.style.top = y + jitterY + "px";
        el.style.fontSize = size.toFixed(1) + "px";
        el.style.color = COLORS[(Math.random() * COLORS.length) | 0];
        el.style.setProperty("--dx", driftX.toFixed(1) + "px");
        el.style.setProperty("--dy", driftY.toFixed(1) + "px");
        /* Durasi tiap partikel berbeda sedikit supaya tidak terlihat seragam. */
        el.style.animationDuration = life.toFixed(0) + "ms";
        container().appendChild(el);
        alive++;
        window.setTimeout(function () {
            remove(el);
        }, life + 100);
    }

    function burst(x, y) {
        var n = 5 + ((Math.random() * 3) | 0);
        for (var i = 0; i < n; i++) {
            var angle = (Math.PI * 2 * i) / n + Math.random() * 0.6;
            var radius = 8 + Math.random() * 16;
            spawn(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius, 1, 0);
        }
    }

    window.addEventListener(
        "pointermove",
        function (event) {
            var now = Date.now();
            if (now - lastAt < MOVE_GAP) return;
            if (lastX !== null && Math.hypot(event.clientX - lastX, event.clientY - lastY) < MOVE_STEP) return;
            var vx = lastX === null ? 0 : event.clientX - lastX;
            lastAt = now;
            lastX = event.clientX;
            lastY = event.clientY;
            spawn(event.clientX, event.clientY, 0.75, vx);
        },
        { passive: true },
    );

    window.addEventListener(
        "pointerdown",
        function (event) {
            burst(event.clientX, event.clientY);
        },
        { passive: true },
    );
})();
