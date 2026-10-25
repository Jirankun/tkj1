/* Anti-copy / anti-save: konten galeri hanya bisa diunduh lewat aplikasi. */
(function () {
    "use strict";

    /* Isian milik user sendiri (form upload, pencarian) tetap boleh disalin. */
    function isEditable(el) {
        if (!el || !el.tagName) return false;
        var tag = el.tagName.toLowerCase();
        if (tag === "input" || tag === "textarea" || tag === "select") return true;
        return !!el.isContentEditable;
    }

    /* Klik kanan: blokir menu simpan / salin / cetak. */
    document.addEventListener("contextmenu", function (e) {
        e.preventDefault();
    });

    /* Seret & lepas: blokir "save image as" dan drag ke disk. */
    document.addEventListener("dragstart", function (e) {
        e.preventDefault();
    });
    document.addEventListener("dragover", function (e) {
        e.preventDefault();
    });
    document.addEventListener("drop", function (e) {
        e.preventDefault();
    });

    /* Salin & potong teks: teks halaman tidak bisa disalin. */
    document.addEventListener("copy", function (e) {
        if (isEditable(e.target) || isEditable(document.activeElement)) return;
        e.preventDefault();
    });
    document.addEventListener("cut", function (e) {
        if (isEditable(e.target) || isEditable(document.activeElement)) return;
        e.preventDefault();
    });
    document.addEventListener("selectstart", function (e) {
        if (isEditable(e.target)) return;
        e.preventDefault();
    });

    /* Pintasan keyboard: salin, potong, pilih semua, simpan, cetak, lihat sumber. */
    document.addEventListener("keydown", function (e) {
        var k = (e.key || "").toLowerCase();
        if (!e.ctrlKey && !e.metaKey) return;
        if (k === "s" || k === "p" || k === "u") {
            e.preventDefault();
            return;
        }
        if ((k === "c" || k === "x" || k === "a") && !isEditable(e.target)) {
            e.preventDefault();
        }
    });

    /* Gaya anti-seleksi + anti long-press "simpan ke layar" (iOS/Android). */
    var style = document.createElement("style");
    style.textContent =
        "html,body,body *:not(input):not(textarea):not(select){" +
        "-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;" +
        "-webkit-touch-callout:none;}" +
        "input,textarea,[contenteditable]{-webkit-user-select:text;-moz-user-select:text;-ms-user-select:text;user-select:text;}" +
        "img,video{-webkit-user-drag:none;-webkit-touch-callout:none;}";
    (document.head || document.documentElement).appendChild(style);
})();
