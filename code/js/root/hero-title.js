/* Efek menulis judul hero — berjalan sebelum sisa halaman selesai di-parse. */
(function () {
    var h2 = document.getElementById("heroTitle");
    var txt = document.getElementById("heroTitleText");
    var caret = document.getElementById("heroCaret");
    if (!h2 || !txt) return;

    var full = h2.getAttribute("data-text") || txt.textContent || "";
    var reduce = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)").matches : false;

    if (reduce || !full) {
        h2.classList.add("done");
        return;
    }

    var started = false;
    var start = function () {
        if (started) return;
        started = true;
        try {
            var reserve = h2.offsetHeight;
            h2.style.minHeight = reserve + "px";
            txt.textContent = "";
            h2.classList.add("typing");
            var i = 0;
            var step = function () {
                i++;
                txt.textContent = full.slice(0, i);
                if (i < full.length) {
                    var ch = full.charAt(i - 1);
                    setTimeout(step, ch === " " ? 150 : 58 + (i % 4) * 12);
                    return;
                }
                setTimeout(function () {
                    h2.classList.remove("typing");
                    h2.classList.add("done");
                    h2.style.minHeight = "";
                    if (caret) caret.setAttribute("aria-hidden", "true");
                }, 1000);
            };
            setTimeout(step, 380);
        } catch (err) {
            h2.classList.add("done");
        }
    };

    if (document.fonts && document.fonts.load) {
        document.fonts.load('700 1em "Dancing Script"').then(start, start);
        setTimeout(start, 900);
    } else {
        setTimeout(start, 350);
    }
})();
