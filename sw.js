// Service Worker (Spec v2, NF-05): App-Dateien offline verfügbar, Kataloge zuerst aus dem Netz.
// Bei jeder Änderung an App-Dateien VERSION erhöhen, damit Nutzer die neue Fassung bekommen.

const VERSION = '0.2.0';
const SHELL_CACHE = `lerntrainer-shell-${VERSION}`;
const DATA_CACHE = 'lerntrainer-data';

const SHELL = [
  './',
  'index.html',
  'manifest.json',
  'css/app.css',
  'js/main.js',
  'js/router.js',
  'js/store.js',
  'js/catalog.js',
  'js/scoring.js',
  'js/leitner.js',
  'js/session.js',
  'js/markdown.js',
  'js/highlight.js',
  'js/ui.js',
  'js/i18n/de.js',
  'js/views/home.js',
  'js/views/subject.js',
  'js/views/chapter.js',
  'js/views/quiz.js',
  'js/views/settings.js',
  'icons/icon.svg',
  'icons/icon-192.png',
  'icons/apple-touch-icon.png',
];
const DATA = ['catalogs/index.json', 'catalogs/inet-tech.json'];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    await (await caches.open(SHELL_CACHE)).addAll(SHELL);
    await (await caches.open(DATA_CACHE)).addAll(DATA);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith('lerntrainer-shell-') && key !== SHELL_CACHE) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;

  if (url.pathname.includes('/catalogs/')) {
    // Netz zuerst, damit neue Katalogversionen ankommen; offline aus dem Cache
    event.respondWith((async () => {
      const cache = await caches.open(DATA_CACHE);
      try {
        const res = await fetch(req);
        if (res.ok) cache.put(url.origin + url.pathname, res.clone());
        return res;
      } catch {
        return (await cache.match(req, { ignoreSearch: true })) ?? Response.error();
      }
    })());
    return;
  }

  // App-Dateien: Cache zuerst
  event.respondWith((async () => {
    const cached = await caches.match(req, { ignoreSearch: true });
    if (cached) return cached;
    try {
      return await fetch(req);
    } catch {
      if (req.mode === 'navigate') return (await caches.match('index.html')) ?? Response.error();
      return Response.error();
    }
  })());
});
