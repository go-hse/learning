// Service Worker (Spec v2, NF-05): App offline verfügbar machen.
//
// Strategie: Netz zuerst, Cache nur als Rückfall (offline). So sehen Nutzer mit Internet immer die
// aktuelle Fassung; offline läuft die zuletzt geladene.
//
// Die Version kommt aus der Registrierung (sw.js?v=<APP_VERSION> in js/main.js). Eine neue Version in
// js/config.js führt damit automatisch zu einem neuen Service Worker – hier muss nichts angepasst werden.

const VERSION = new URL(self.location.href).searchParams.get('v') ?? 'dev';
const CACHE = `lerntrainer-${VERSION}`;

// Wird beim Installieren vorab geladen, damit die App auch offline vollständig startet.
// Neue Dateien hier eintragen.
const PRECACHE = [
  './',
  'index.html',
  'impressum.html',
  'datenschutz.html',
  'manifest.json',
  'css/app.css',
  'js/main.js',
  'js/config.js',
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
  'js/i18n/help-de.js',
  'js/views/home.js',
  'js/views/subject.js',
  'js/views/chapter.js',
  'js/views/quiz.js',
  'js/views/settings.js',
  'js/views/help.js',
  'icons/icon.svg',
  'icons/icon-192.png',
  'icons/apple-touch-icon.png',
  'catalogs/index.json',
  'catalogs/inet-tech.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // cache: 'reload' umgeht den HTTP-Cache des Browsers – sonst könnten kurz nach einem Deployment
    // noch alte Dateien (GitHub Pages: bis zu 10 Minuten) in den neuen Cache gelangen.
    await cache.addAll(PRECACHE.map((url) => new Request(url, { cache: 'reload' })));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith('lerntrainer-') && key !== CACHE) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      // no-cache: der Browser fragt beim Server nach, ob sich die Datei geändert hat (schnell per 304)
      const res = await fetch(req, { cache: 'no-cache' });
      if (res.ok) cache.put(url.origin + url.pathname, res.clone());
      return res;
    } catch {
      const cached = await cache.match(url.origin + url.pathname) ?? await cache.match(req, { ignoreSearch: true });
      if (cached) return cached;
      if (req.mode === 'navigate') return (await cache.match('index.html')) ?? Response.error();
      return Response.error();
    }
  })());
});
