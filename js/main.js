// Einstieg: Kataloge laden, Routen anmelden, Service Worker registrieren.

import { route, start, go } from './router.js';
import { loadIndex, loadCatalog } from './catalog.js';
import { requestPersistence } from './store.js';
import { home } from './views/home.js';
import { subject } from './views/subject.js';
import { chapter } from './views/chapter.js';
import { quiz } from './views/quiz.js';
import { settings } from './views/settings.js';
import { helpView } from './views/help.js';

const app = document.getElementById('app');
const state = { index: null, catalogs: new Map(), error: null };
let cleanup = null;
let current = null;

function render(view, params) {
  if (typeof cleanup === 'function') cleanup();
  cleanup = null;
  current = { view, params };
  app.replaceChildren();
  app.className = '';
  window.scrollTo(0, 0);
  const ctx = { state, go, rerender: () => render(view, params) };
  cleanup = view(app, params, ctx) ?? null;
}

async function boot() {
  try {
    state.index = await loadIndex();
    for (const entry of state.index.catalogs) state.catalogs.set(entry.id, await loadCatalog(entry));
  } catch (e) {
    state.error = e;
    console.error(e);
  }
  route('/', home);
  route('/fach/:cat', subject);
  route('/fach/:cat/kapitel/:chapter', chapter);
  route('/quiz', quiz);
  route('/einstellungen', settings);
  route('/hilfe', helpView);
  start(render);
  requestPersistence();
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').catch((e) => console.warn('Service Worker:', e));
  }
}

// Nach Rückkehr in den Tab (z. B. am nächsten Tag) Startseite aktualisieren
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && current?.view === home) render(current.view, current.params);
});

boot();
