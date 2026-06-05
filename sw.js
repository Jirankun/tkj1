// ============================================================
// TKJ OnE Gallery — Service Worker
// Strategi: Cache First untuk aset statis, Network First untuk data
// ============================================================
const CACHE_NAME = 'tkjone-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/page/gallery.html',
  '/about/index.html',
  '/DB/photos.json',
  '/DB/info.json',
  '/DB/status.json',
  '/DB/banner.json',
  '/photos.json',
  '/manifest.json'
];

// ─── Install: cache aset statis ───────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// ─── Activate: bersihkan cache lama ───────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// ─── Fetch: strategi hybrid ───────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Hanya tangani request dari origin kita sendiri
  if (url.origin !== self.location.origin) return;

  // JSON data → Network First (tetap update walau offline fallback)
  if (url.pathname.endsWith('.json')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Statis assets → Cache First (cepat)
  event.respondWith(cacheFirst(request));
});


// ─── Cache First ──────────────────────────────────────────────
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return new Response('Offline', { status: 503 });
  }
}

// ─── Network First ────────────────────────────────────────────
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: 'Offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
