// Lokale Daten (Spec v2, Kapitel 7.2 und 7.3). Einziger Zugang zum LocalStorage.
// Alle Schlüssel tragen ein Präfix, weil sich alle Projektseiten unter username.github.io einen Speicher teilen.

import { dayKey } from './scoring.js';

export const PREFIX = 'lerntrainer:v1:';
export const BACKUP_FORMAT = 'lerntrainer-backup';
export const DEFAULT_SETTINGS = { dailyGoal: 20, lastExport: null, showDrafts: false, chapterFilter: 'all' };

const memory = new Map(); // Ersatz, falls LocalStorage gesperrt ist (z. B. privater Modus)
let backend;

function storage() {
  if (backend !== undefined) return backend;
  try {
    const ls = globalThis.localStorage;
    ls.setItem(PREFIX + 'probe', '1');
    ls.removeItem(PREFIX + 'probe');
    backend = ls;
  } catch {
    backend = null;
  }
  return backend;
}

export const isPersistent = () => storage() !== null;

function read(key, fallback) {
  try {
    const s = storage();
    const raw = s ? s.getItem(PREFIX + key) : memory.get(key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function write(key, value) {
  const json = JSON.stringify(value);
  const s = storage();
  if (s) s.setItem(PREFIX + key, json); // kann QuotaExceededError werfen – Aufrufer zeigt die Meldung
  else memory.set(key, json);
}

function remove(key) {
  const s = storage();
  if (s) s.removeItem(PREFIX + key);
  else memory.delete(key);
}

function keys() {
  const s = storage();
  if (!s) return [...memory.keys()];
  const out = [];
  for (let i = 0; i < s.length; i++) {
    const k = s.key(i);
    if (k?.startsWith(PREFIX)) out.push(k.slice(PREFIX.length));
  }
  return out;
}

// ---------- Einstellungen ----------
export function getSettings() {
  return { ...DEFAULT_SETTINGS, ...read('settings', {}) };
}

export function saveSettings(patch) {
  const next = { ...getSettings(), ...patch };
  write('settings', next);
  if ('dailyGoal' in patch) {
    const days = getDays();
    const today = dayKey(Date.now());
    if (today in days) { days[today] = next.dailyGoal; write('days', days); }
  }
  return next;
}

// ---------- Ereignisse ----------
const monthKey = (ts) => 'events:' + dayKey(ts).slice(0, 7);
let eventsCache = null;

/** Alle Antwort-Ereignisse, nach Zeit sortiert. */
export function allEvents() {
  if (eventsCache) return eventsCache;
  const list = keys().filter((k) => k.startsWith('events:')).flatMap((k) => read(k, []));
  list.sort((a, b) => a.ts - b.ts);
  eventsCache = list;
  return list;
}

export function appendEvent(ev) {
  const k = monthKey(ev.ts);
  const month = read(k, []);
  month.push(ev);
  write(k, month);
  eventsCache = null;
  const days = getDays();
  days[dayKey(ev.ts)] = getSettings().dailyGoal;
  write('days', days);
}

function replaceEvents(events) {
  for (const k of keys()) if (k.startsWith('events:')) remove(k);
  const byMonth = {};
  for (const e of events) (byMonth[monthKey(e.ts)] ??= []).push(e);
  for (const [k, list] of Object.entries(byMonth)) write(k, list);
  eventsCache = null;
}

export const getDays = () => read('days', {});

// ---------- Sitzung ----------
export const getSession = () => read('session', null);
export const saveSession = (s) => write('session', s);
export const clearSession = () => remove('session');

// ---------- Export / Import ----------
export function exportData(catalogVersions = {}) {
  return {
    format: BACKUP_FORMAT,
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    catalogVersions,
    settings: { dailyGoal: getSettings().dailyGoal },
    days: getDays(),
    events: allEvents(),
  };
}

const isEvent = (e) => e && typeof e.qid === 'string' && Number.isFinite(e.ts) && typeof e.result === 'string';

/** Liefert eine Fehlermeldung oder null. */
export function validateBackup(obj) {
  if (!obj || obj.format !== BACKUP_FORMAT) return 'format';
  if (obj.schemaVersion !== 1) return 'version';
  if (!Array.isArray(obj.events) || !obj.events.every(isEvent)) return 'events';
  return null;
}

/** Vereinigung zweier Ereignislisten, eindeutig über qid + ts, sortiert. */
export function mergeEvents(a, b) {
  const map = new Map();
  for (const e of [...a, ...b]) map.set(`${e.qid}|${e.ts}`, e);
  return [...map.values()].sort((x, y) => x.ts - y.ts);
}

/** mode: 'merge' (Standard) oder 'replace'. Liefert { total, added }. */
export function importData(obj, mode = 'merge') {
  const before = allEvents();
  const incoming = obj.events.filter(isEvent);
  if (mode === 'replace') {
    replaceEvents(incoming);
    write('days', obj.days ?? {});
    if (Number.isFinite(obj.settings?.dailyGoal)) saveSettings({ dailyGoal: obj.settings.dailyGoal });
    clearSession();
    return { total: incoming.length, added: incoming.length };
  }
  const merged = mergeEvents(before, incoming);
  replaceEvents(merged);
  write('days', { ...(obj.days ?? {}), ...getDays() });
  return { total: merged.length, added: merged.length - before.length };
}

export function resetAll() {
  for (const k of keys()) remove(k);
  eventsCache = null;
}

/** Bittet den Browser, die Daten nicht automatisch zu löschen. */
export async function requestPersistence() {
  try {
    if (navigator.storage?.persist && !(await navigator.storage.persisted())) await navigator.storage.persist();
  } catch { /* nicht unterstützt */ }
}
