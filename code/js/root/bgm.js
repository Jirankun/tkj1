/* ============================================================
   TKJ OnE — MUSIK LATAR (hanya index utama /)
   ------------------------------------------------------------
   - tidak berbunyi sendiri saat halaman dibuka (kebijakan browser);
   - mulai otomatis pada interaksi pertama: sentuh, klik, atau tombol;
   - tombol kecil di kanan bawah untuk menjeda / memutar lagi;
   - pilihan "jeda" diingat (localStorage) supaya tidak berbunyi
     lagi di kunjungan berikutnya;
   - loop, volume rendah (0.35), dan tidak memuat audio sebelum
     dibutuhkan (preload="none").
   ============================================================ */
"use strict";

(function () {
    var audio = document.getElementById("bgm");
    var btn = document.getElementById("bgmToggle");
    if (!audio || !btn) return;

    var STORAGE_KEY = "tkj_bgm_off";
    var icon = btn.querySelector("i");
    var started = false;
    var muted = false;

    try {
        muted = window.localStorage.getItem(STORAGE_KEY) === "1";
    } catch (err) {
        muted = false;
    }

    audio.loop = true;
    audio.volume = 0.35;

    function remember(off) {
        try {
            window.localStorage.setItem(STORAGE_KEY, off ? "1" : "0");
        } catch (err) {
            /* mode privat / storage penuh: abaikan */
        }
    }

    function paint() {
        var playing = !audio.paused && !audio.ended;
        btn.classList.toggle("is-playing", playing);
        btn.setAttribute("aria-pressed", playing ? "true" : "false");
        btn.setAttribute("aria-label", playing ? "Jeda musik latar" : "Putar musik latar");
        if (icon) icon.className = "fa-solid " + (playing ? "fa-volume-high" : "fa-volume-xmark");
    }

    function play() {
        var promise = audio.play();
        if (promise && typeof promise.catch === "function") {
            promise.catch(function () {
                /* Autoplay ditolak / format tidak didukung: coba lagi di interaksi berikutnya. */
                started = false;
                paint();
            });
        }
    }

    /* Interaksi pertama membunyikan musik (kecuali user pernah mematikan). */
    function onFirstGesture(event) {
        if (started) return;
        if (event && event.target && event.target.closest && event.target.closest("#bgmToggle")) return;
        if (muted) {
            stopListening();
            return;
        }
        started = true;
        play();
    }

    var GESTURES = ["pointerdown", "touchstart", "click", "keydown"];
    function stopListening() {
        GESTURES.forEach(function (name) {
            window.removeEventListener(name, onFirstGesture);
        });
    }
    GESTURES.forEach(function (name) {
        window.addEventListener(name, onFirstGesture, { passive: true });
    });

    btn.addEventListener("click", function () {
        stopListening();
        if (audio.paused) {
            muted = false;
            remember(false);
            started = true;
            play();
        } else {
            muted = true;
            remember(true);
            audio.pause();
        }
    });

    /* Begitu benar-benar berbunyi, berhenti mendengarkan gestur. */
    audio.addEventListener("playing", function () {
        started = true;
        stopListening();
    });
    audio.addEventListener("play", paint);
    audio.addEventListener("pause", paint);
    audio.addEventListener("ended", paint);
    paint();
})();
