// ============================================================
// POST /api/komentar — perantara komentar ke GitHub
// ------------------------------------------------------------
// Browser tidak pernah memegang token. Function ini yang memanggil
// repository_dispatch "add-comment"; workflow add-comment.yml lalu
// membersihkan HTML dan menambah entri ke DB/komentar.json.
//
// Env yang dibutuhkan (Cloudflare Pages → Settings → Variables and Secrets):
//   G_UPLOAD_TOKEN   PAT fine-grained, Contents: Read and write (repo ini)
//   KOMENTAR_KV      opsional; binding KV untuk batas 1 pesan / 60 detik per IP
//
// Semua validasi di sini bersifat kasar (ukuran, tipe, asal request).
// Penyaringan HTML yang mengikat tetap dilakukan di workflow (server), dan
// pembersihan sekali lagi saat render (client).
// ============================================================

const REPO = "Jirankun/tkj1";
const EVENT = "add-comment";
const MAX_BODY = 8000;
const MAX_NAME = 40;
const MAX_TEXT = 500;
const MAX_HTML = 4000;
// Editor hanya menghasilkan format inline. Tag mentah di luar itu ditolak
// lebih awal supaya pesan tidak "hilang" setelah dibersihkan workflow.
const BLOCKED_HTML = /<\s*(script|style|iframe|object|svg|math|form|button|textarea|select|video|audio|template|noscript|img|a|link|meta)\b/i;

const respond = (body, status) =>
    new Response(JSON.stringify(body), {
        status,
        headers: {
            "content-type": "application/json; charset=utf-8",
            "cache-control": "no-store",
        },
    });

const fail = (message, status) => respond({ ok: false, error: message }, status);

function cleanText(markup) {
    return markup
        .replace(/<br\s*\/?>/gi, " ")
        .replace(/<[^>]*>/g, " ")
        .replace(/&nbsp;/gi, " ")
        .replace(/\s+/g, " ")
        .trim();
}

export async function onRequestPost(context) {
    const { request, env } = context;

    // Tolak request dari situs lain (CSRF sederhana untuk endpoint tanpa cookie).
    const origin = request.headers.get("Origin");
    if (origin && origin !== new URL(request.url).origin) {
        return fail("Origin tidak diizinkan", 403);
    }

    const contentType = request.headers.get("content-type") || "";
    if (!contentType.toLowerCase().includes("application/json")) {
        return fail("Body harus JSON", 415);
    }

    let raw;
    try {
        raw = await request.text();
    } catch {
        return fail("Body tidak terbaca", 400);
    }
    if (raw.length > MAX_BODY) {
        return fail("Pesan terlalu besar", 413);
    }

    let body;
    try {
        body = JSON.parse(raw);
    } catch {
        return fail("JSON tidak valid", 400);
    }
    if (!body || typeof body !== "object") {
        return fail("JSON tidak valid", 400);
    }

    // Honeypot: bot mengisi field tersembunyi. Balas sukses palsu.
    if (typeof body.website === "string" && body.website.trim() !== "") {
        return respond({ ok: true }, 202);
    }

    const nameRaw = typeof body.name === "string" ? body.name : "";
    const name = nameRaw
        .replace(/[\u0000-\u001f\u007f]/g, "")
        .replace(/<[^>]*>/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, MAX_NAME);

    const comment = typeof body.comment === "string" ? body.comment.trim() : "";
    if (!comment) {
        return fail("Pesan masih kosong", 400);
    }
    if (comment.length > MAX_HTML) {
        return fail("Pesan terlalu panjang", 400);
    }
    if (cleanText(comment).length > MAX_TEXT) {
        return fail(`Pesan maksimal ${MAX_TEXT} karakter`, 400);
    }
    if (BLOCKED_HTML.test(comment)) {
        return fail("Format tidak didukung (gambar, tautan, atau HTML mentah)", 400);
    }

    const ip = request.headers.get("cf-connecting-ip") || "";
    if (env.KOMENTAR_KV && ip) {
        const key = `rate:${ip}`;
        try {
            if (await env.KOMENTAR_KV.get(key)) {
                return fail("Terlalu cepat. Coba lagi sebentar.", 429);
            }
            await env.KOMENTAR_KV.put(key, "1", { expirationTtl: 60 });
        } catch {
            // KV bermasalah: jangan blokir komentar hanya karena itu.
        }
    }

    const token = env.G_UPLOAD_TOKEN;
    if (!token) {
        return fail("Server belum dikonfigurasi", 503);
    }

    const id =
        typeof crypto.randomUUID === "function"
            ? crypto.randomUUID().replace(/-/g, "").slice(0, 12)
            : Math.random().toString(36).slice(2, 14);

    let github;
    try {
        github = await fetch(`https://api.github.com/repos/${REPO}/dispatches`, {
            method: "POST",
            headers: {
                authorization: `Bearer ${token}`,
                accept: "application/vnd.github+json",
                "content-type": "application/json",
                "user-agent": "tkj1-komentar",
            },
            body: JSON.stringify({
                event_type: EVENT,
                client_payload: { id, name, comment },
            }),
        });
    } catch {
        return fail("Tidak bisa menghubungi GitHub", 502);
    }

    if (!github.ok) {
        return fail("GitHub menolak permintaan", 502);
    }

    return respond({ ok: true, id }, 202);
}

export async function onRequestGet() {
    return fail("Gunakan POST", 405);
}
