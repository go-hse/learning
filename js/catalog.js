// Kataloge laden und filtern (Spec v2, F-40 bis F-42).

export const SUPPORTED_TYPES = new Set(['mc-single', 'mc-multi', 'flashcard', 'code-task']);
export const FILTERS = {
  all: () => true,
  mc: (q) => q.type === 'mc-single' || q.type === 'mc-multi',
  cards: (q) => q.type === 'flashcard' || q.type === 'code-task',
};

export async function loadIndex() {
  const res = await fetch('catalogs/index.json', { cache: 'no-cache' });
  if (!res.ok) throw new Error(`index.json: HTTP ${res.status}`);
  return res.json();
}

export async function loadCatalog(entry) {
  const res = await fetch(entry.url, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`${entry.url}: HTTP ${res.status}`);
  const cat = await res.json();
  const err = checkCatalog(cat);
  if (err) throw new Error(`${entry.url}: ${err}`);
  cat.byId = new Map(cat.questions.map((q) => [q.id, q]));
  return cat;
}

/** Grobe Prüfung; die vollständige Prüfung macht tools/build-catalog.mjs. */
export function checkCatalog(cat) {
  if (!cat || cat.schemaVersion !== 1) return 'unbekannte schemaVersion';
  if (!cat.catalog?.id) return 'catalog.id fehlt';
  if (!Array.isArray(cat.chapters) || !Array.isArray(cat.questions)) return 'chapters oder questions fehlen';
  return null;
}

export function visibleQuestions(cat, showDrafts = false) {
  return cat.questions.filter((q) =>
    SUPPORTED_TYPES.has(q.type) && (q.status === 'freigegeben' || (showDrafts && q.status === 'entwurf')));
}

export function questionsFor(cat, { chapterId, sectionId = null, filter = 'all' }, showDrafts = false) {
  const f = FILTERS[filter] ?? FILTERS.all;
  return visibleQuestions(cat, showDrafts).filter((q) =>
    q.chapter === chapterId && (!sectionId || q.section === sectionId) && f(q));
}

export function findChapter(cat, chapterId) {
  return cat.chapters.find((c) => c.id === chapterId) ?? null;
}

export function sectionTitle(cat, sectionId) {
  for (const c of cat.chapters) {
    const s = c.sections.find((x) => x.id === sectionId);
    if (s) return s.title;
  }
  return '';
}
