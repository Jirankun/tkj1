"use strict";

/* ==========================================================
   PESAN & KESAN — bubble chat dari DB/komentar.json
   ----------------------------------------------------------
   - Isi bubble dibersihkan lagi di client (allowlist tag + warna),
     walaupun workflow add-comment.yml sudah membersihkannya.
   - Kirim ke POST /api/komentar (Cloudflare Pages Function) yang
     memegang token GitHub; browser tidak pernah menyimpan token.
   - Pesan sendiri tampil sementara ("mengirim…") sampai versi dari
     repo muncul setelah refresh/polling.
   ========================================================== */

(() => {
    const form = document.getElementById("komentarForm");
    if (!form) return;

    const list = document.getElementById("komentarList");
    const editor = document.getElementById("komentarEditor");
    const nameInput = document.getElementById("komentarName");
    const honeypot = document.getElementById("komentarWebsite");
    const submitBtn = document.getElementById("komentarSubmit");
    const note = document.getElementById("komentarNote");
    const count = document.getElementById("komentarCount");

    const MAX_TEXT = 500;
    const MAX_NAME = 40;
    const DATA_URL = "./DB/komentar.json";
    const POST_URL = "/api/komentar";
    const NAME_KEY = "tkj_komentar_nama";

    const COLOR_NAMES = new Set([
        "black",
        "white",
        "red",
        "green",
        "blue",
        "yellow",
        "orange",
        "purple",
        "pink",
        "teal",
        "cyan",
        "magenta",
        "lime",
        "navy",
        "maroon",
        "olive",
        "silver",
        "aqua",
        "fuchsia",
        "gray",
        "grey",
        "brown",
        "gold",
        "violet",
        "indigo",
        "turquoise",
        "tomato",
        "coral",
        "salmon",
        "khaki",
        "beige",
        "ivory",
        "crimson",
    ]);
    const RGB_RE = /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*(?:0|1|0?\.\d+)\s*)?\)$/;
    const DROP_TAGS = new Set([
        "SCRIPT",
        "STYLE",
        "IFRAME",
        "OBJECT",
        "EMBED",
        "IMG",
        "SVG",
        "MATH",
        "LINK",
        "META",
        "FORM",
        "INPUT",
        "BUTTON",
        "TEXTAREA",
        "SELECT",
        "VIDEO",
        "AUDIO",
        "SOURCE",
        "TEMPLATE",
        "NOSCRIPT",
    ]);
    const BLOCK_TAGS = new Set([
        "DIV",
        "P",
        "LI",
        "UL",
        "OL",
        "BLOCKQUOTE",
        "PRE",
        "SECTION",
        "ARTICLE",
        "TABLE",
        "TR",
        "TD",
        "TH",
        "H1",
        "H2",
        "H3",
        "H4",
        "H5",
        "H6",
    ]);
    const ALLOWED_TAGS = new Set(["B", "STRONG", "I", "EM", "U", "S", "STRIKE", "DEL", "BR", "SPAN", "FONT"]);

    let entries = [];
    let pending = [];
    let loadError = false;

    /* ---------- Warna aman (hex, nama, atau rgb/rgba) ---------- */
    function safeColor(value) {
        const v = String(value || "").trim().toLowerCase();
        if (/^#[0-9a-f]{3,8}$/.test(v)) return v;
        if (COLOR_NAMES.has(v)) return v;
        const match = v.match(RGB_RE);
        if (match && [match[1], match[2], match[3]].every(part => Number(part) <= 255)) return v;
        return "";
    }

    /* ---------- Bersihkan HTML komentar sebelum dirender ---------- */
    function sanitizeHtml(input) {
        const parsed = new DOMParser().parseFromString("<body>" + String(input || "") + "</body>", "text/html");
        const out = document.createElement("div");
        let chars = 0;

        const walk = (node, target, depth) => {
            if (depth > 20) return;
            Array.from(node.childNodes).forEach(child => {
                if (chars >= MAX_TEXT) return;
                if (child.nodeType === Node.TEXT_NODE) {
                    const text = child.nodeValue.slice(0, MAX_TEXT - chars);
                    chars += text.length;
                    target.appendChild(document.createTextNode(text));
                    return;
                }
                if (child.nodeType !== Node.ELEMENT_NODE) return;
                const tag = child.tagName;
                if (DROP_TAGS.has(tag)) return;
                if (BLOCK_TAGS.has(tag)) {
                    if (target.childNodes.length) target.appendChild(document.createElement("br"));
                    walk(child, target, depth + 1);
                    return;
                }
                if (!ALLOWED_TAGS.has(tag)) {
                    walk(child, target, depth + 1);
                    return;
                }
                if (tag === "BR") {
                    target.appendChild(document.createElement("br"));
                    return;
                }
                const el = document.createElement(tag === "FONT" ? "span" : tag.toLowerCase());
                if (tag === "SPAN" || tag === "FONT") {
                    const raw = tag === "FONT" ? child.getAttribute("color") : child.style ? child.style.color : "";
                    const color = safeColor(raw);
                    if (color) el.style.color = color;
                }
                walk(child, el, depth + 1);
                target.appendChild(el);
            });
        };

        walk(parsed.body, out, 0);
        tidyBreaks(out);
        return out.innerHTML;
    }

    /* Rapikan <br> beruntun: maksimal dua, tanpa <br> di awal/akhir. */
    function tidyBreaks(root) {
        let run = 0;
        Array.from(root.childNodes).forEach(node => {
            if (node.nodeName === "BR") {
                run += 1;
                if (run > 2) node.remove();
            } else if (node.nodeType === Node.ELEMENT_NODE || (node.nodeType === Node.TEXT_NODE && node.nodeValue.trim())) {
                run = 0;
            }
        });
        while (root.firstChild && root.firstChild.nodeName === "BR") root.firstChild.remove();
        while (root.lastChild && root.lastChild.nodeName === "BR") root.lastChild.remove();
    }

    function plainLength() {
        return editor.textContent.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim().length;
    }

    function formatTime(value) {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "";
        try {
            return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(date);
        } catch {
            return date.toLocaleString();
        }
    }

    function stamp(item) {
        const time = Date.parse(item && item.time);
        return Number.isFinite(time) ? time : 0;
    }

    /* ---------- Bubble ---------- */
    function makeBubble(item, isPending) {
        const li = document.createElement("li");
        li.className = "komentar-bubble" + (isPending ? " is-pending" : "");
        if (item.id) li.dataset.id = item.id;

        const meta = document.createElement("div");
        meta.className = "komentar-meta";

        const author = document.createElement("span");
        author.className = "komentar-author";
        author.textContent = item.name || "Anonim";
        meta.appendChild(author);

        if (isPending) {
            const state = document.createElement("span");
            state.className = "komentar-state";
            state.textContent = "mengirim…";
            meta.appendChild(state);
        }

        const time = document.createElement("time");
        time.className = "komentar-time";
        if (item.time) time.dateTime = item.time;
        time.textContent = isPending ? "" : formatTime(item.time);
        meta.appendChild(time);

        const text = document.createElement("div");
        text.className = "komentar-text";
        text.innerHTML = sanitizeHtml(item.comment || "");

        li.append(meta, text);
        return li;
    }

    function render() {
        list.textContent = "";
        const visible = entries
            .filter(item => item && item.status !== false && item.status !== "false")
            .sort((a, b) => stamp(b) - stamp(a));
        const all = [...pending, ...visible];

        if (!all.length) {
            const li = document.createElement("li");
            li.className = "komentar-empty";
            li.textContent = loadError ? "Gagal memuat pesan. Coba muat ulang halaman." : "Belum ada pesan. Jadi yang pertama!";
            list.appendChild(li);
            return;
        }

        all.forEach(item => list.appendChild(makeBubble(item, Boolean(item._pending))));
    }

    /* ---------- Muat data dari repo ---------- */
    async function load() {
        try {
            const res = await fetch(DATA_URL + "?t=" + Date.now(), { cache: "no-store" });
            if (!res.ok) throw new Error("HTTP " + res.status);
            const data = await res.json();
            if (!Array.isArray(data)) throw new Error("Bukan array");
            entries = data;
            loadError = false;
            pending = pending.filter(item => !entries.some(entry => entry && item.id && entry.id === item.id));
        } catch {
            loadError = true;
        }
        list.setAttribute("aria-busy", "false");
        render();
    }

    function waitFor(id) {
        let tries = 0;
        const timer = setInterval(async () => {
            tries += 1;
            await load();
            if (!pending.some(item => item.id === id) || tries >= 15) clearInterval(timer);
        }, 4000);
    }

    /* ---------- Catatan status ---------- */
    function setNote(message, kind) {
        note.textContent = message;
        note.classList.toggle("is-error", kind === "error");
        note.classList.toggle("is-ok", kind === "ok");
    }

    function updateCount() {
        const length = plainLength();
        count.textContent = length + "/" + MAX_TEXT;
        count.classList.toggle("over", length > MAX_TEXT);
        return length;
    }

    /* ---------- Editor ---------- */
    try {
        document.execCommand("styleWithCSS", false, false);
    } catch {
        /* sebagian browser tidak mendukung; abaikan */
    }

    editor.addEventListener("paste", event => {
        event.preventDefault();
        const clipboard = event.clipboardData || window.clipboardData;
        const text = clipboard ? clipboard.getData("text/plain") : "";
        document.execCommand("insertText", false, String(text || "").slice(0, MAX_TEXT));
        updateCount();
    });
    ["drop", "dragover"].forEach(type => editor.addEventListener(type, event => event.preventDefault()));
    editor.addEventListener("input", updateCount);
    editor.addEventListener("keydown", event => {
        if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
            event.preventDefault();
            form.requestSubmit();
        }
    });

    /* ---------- Status aktif tombol format ---------- */
    const cmdButtons = Array.from(form.querySelectorAll("[data-cmd]"));
    const colorButtons = Array.from(form.querySelectorAll("[data-color]"));
    const colorProbe = document.createElement("span");
    colorProbe.style.display = "none";
    document.body.appendChild(colorProbe);

    function normalizeColor(value) {
        if (!value) return "";
        colorProbe.style.color = "";
        colorProbe.style.color = String(value);
        if (!colorProbe.style.color) return "";
        try {
            return window.getComputedStyle(colorProbe).color;
        } catch {
            return colorProbe.style.color;
        }
    }

    function syncToolbar() {
        const selection = window.getSelection ? window.getSelection() : null;
        const inside = Boolean(
            selection && selection.rangeCount && selection.anchorNode && editor.contains(selection.anchorNode),
        );

        cmdButtons.forEach(button => {
            let active = false;
            if (inside) {
                try {
                    active = document.queryCommandState(button.dataset.cmd);
                } catch {
                    active = false;
                }
            }
            button.classList.toggle("is-active", active);
            button.setAttribute("aria-pressed", active ? "true" : "false");
        });

        let current = "";
        if (inside) {
            try {
                current = normalizeColor(document.queryCommandValue("foreColor"));
            } catch {
                current = "";
            }
        }
        colorButtons.forEach(button => {
            const active = Boolean(current) && normalizeColor(button.dataset.color) === current;
            button.classList.toggle("is-active", active);
            button.setAttribute("aria-pressed", active ? "true" : "false");
        });
    }

    editor.addEventListener("focus", syncToolbar);
    editor.addEventListener("keyup", syncToolbar);
    editor.addEventListener("mouseup", syncToolbar);
    editor.addEventListener("blur", () => setTimeout(syncToolbar, 0));
    document.addEventListener("selectionchange", syncToolbar);

    const toolbar = form.querySelector(".komentar-tools");
    if (toolbar) {
        toolbar.addEventListener("mousedown", event => {
            if (event.target.closest("button")) event.preventDefault(); // jaga seleksi di editor
        });
        toolbar.addEventListener("click", event => {
            const button = event.target.closest("button");
            if (!button) return;
            editor.focus();
            if (button.dataset.cmd) document.execCommand(button.dataset.cmd, false, null);
            else if (button.dataset.color) document.execCommand("foreColor", false, button.dataset.color);
            updateCount();
            syncToolbar();
        });
    }

    /* ---------- Kirim ---------- */
    form.addEventListener("submit", async event => {
        event.preventDefault();
        const length = updateCount();
        if (!length) {
            setNote("Tulis pesan dulu ya.", "error");
            editor.focus();
            return;
        }
        if (length > MAX_TEXT) {
            setNote("Pesan maksimal " + MAX_TEXT + " karakter.", "error");
            return;
        }

        const name = nameInput.value.trim().slice(0, MAX_NAME);
        const markup = editor.innerHTML;

        submitBtn.disabled = true;
        setNote("Mengirim…", "ok");

        try {
            const res = await fetch(POST_URL, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    name,
                    comment: markup,
                    website: honeypot ? honeypot.value : "",
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data.ok) throw new Error(data.error || "HTTP " + res.status);

            const id = data.id || "lokal-" + Date.now();
            pending.unshift({
                id,
                name: name || "Anonim",
                comment: markup,
                time: new Date().toISOString(),
                _pending: true,
            });
            render();

            editor.innerHTML = "";
            updateCount();
            syncToolbar();
            if (name) {
                try {
                    localStorage.setItem(NAME_KEY, name);
                } catch {
                    /* mode privat: abaikan */
                }
            }
            setNote("Pesan terkirim! Tunggu sebentar sampai tampil dari server.", "ok");
            waitFor(id);
        } catch {
            setNote("Gagal mengirim. Coba lagi sebentar.", "error");
        } finally {
            submitBtn.disabled = false;
        }
    });

    /* ---------- Mulai ---------- */
    try {
        const savedName = localStorage.getItem(NAME_KEY);
        if (savedName) nameInput.value = savedName.slice(0, MAX_NAME);
    } catch {
        /* mode privat: abaikan */
    }
    updateCount();
    syncToolbar();
    load();
})();
