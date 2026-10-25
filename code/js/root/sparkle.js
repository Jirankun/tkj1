/* ============================================================
   TKJ OnE — EFEK BINAR (sparkle) untuk halaman root (/ dan /student/)
   ------------------------------------------------------------
   - partikel bintang muncul saat pointer/jari bergerak;
   - letupan kecil saat klik/ketuk;
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
    var MAX_ALIVE = 34;
    var MOVE_STEP = 26; /* jarak minimum antar partikel saat bergerak */
    var MOVE_GAP = 38; /* jeda minimum antar partikel (ms) */

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

    function spawn(x, y, power) {
        if (alive >= MAX_ALIVE) return;
        var el = document.createElement("span");
        var size = 9 + Math.random() * 8 * power;
        var driftX = (Math.random() - 0.5) * 42 * power;
        var driftY = -14 - Math.random() * 26 * power;
        var life = 520 + Math.random() * 280;

        el.className = "sparkle";
        el.textContent = GLYPHS[(Math.random() * GLYPHS.length) | 0];
        el.style.left = x + "px";
        el.style.top = y + "px";
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
        }, life + 90);
    }

    function burst(x, y) {
        var n = 5 + ((Math.random() * 3) | 0);
        for (var i = 0; i < n; i++) {
            var angle = (Math.PI * 2 * i) / n + Math.random() * 0.6;
            var radius = 8 + Math.random() * 16;
            spawn(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius, 1);
        }
    }

    window.addEventListener(
        "pointermove",
        function (event) {
            var now = Date.now();
            if (now - lastAt < MOVE_GAP) return;
            if (lastX !== null && Math.hypot(event.clientX - lastX, event.clientY - lastY) < MOVE_STEP) return;
            lastAt = now;
            lastX = event.clientX;
            lastY = event.clientY;
            spawn(event.clientX, event.clientY, 0.8);
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
