// ============================================================
// TKJ OnE — Service Worker
// Statis: cache-first · JSON & navigasi: network-first
// ============================================================
'use strict';

const CACHE = 'tkjone-v6';

const PRECACHE = [
  '/',
  '/index.html',
  '/photo/',
  '/story/',
  '/uploaders/',
  '/assets/theme.css',
  '/assets/fa/css/all.min.css',
  '/assets/fa/webfonts/fa-solid-900.woff2',
  '/assets/plyr/plyr.css',
  '/assets/plyr/plyr.js',
  '/assets/plyr/assets/plyr.svg',
  '/assets/plyr/assets/blank.mp4',
  '/DB/photos.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // Tambahkan satu per satu: satu file hilang tidak menggagalkan instalasi.
    await Promise.all(PRECACHE.map(async (url) => {
      try {
        const res = await fetch(url, { cache: 'reload' });
        if (res.ok) await cache.put(url, res);
      } catch (e) {
        /* offline saat instalasi — lewati */
      }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((n) => n !== CACHE).map((n) => caches.delete(n)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // gambar ImgBB biarkan langsung

  if (req.mode === 'navigate' || url.pathname.endsWith('.json')) {
    event.respondWith(networkFirst(req));
    return;
  }

  event.respondWith(cacheFirst(req));
});

async function cacheFirst(req) {
  const cached = await caches.match(req);
  if (cached) return cached;
  try {
    const res = await fetch(req);
    if (res.ok) {
      const cache = await caches.open(CACHE);
      cache.put(req, res.clone());
    }
    return res;
  } catch (e) {
    return new Response('Offline', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
}

async function networkFirst(req) {
  try {
    const res = await fetch(req);
    if (res.ok) {
      const cache = await caches.open(CACHE);
      cache.put(req, res.clone());
    }
    return res;
  } catch (e) {
    const cached = await caches.match(req);
    if (cached) return cached;
    const isJson = new URL(req.url).pathname.endsWith('.json');
    return new Response(
      isJson ? JSON.stringify({ error: 'offline' }) : 'Offline',
      {
        status: 503,
        headers: { 'Content-Type': isJson ? 'application/json' : 'text/plain; charset=utf-8' }
      }
    );
  }
}
