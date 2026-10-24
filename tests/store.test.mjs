import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// Minimaler LocalStorage für Node
class MemoryStorage {
  #m = new Map();
  get length() { return this.#m.size; }
  key(i) { return [...this.#m.keys()][i] ?? null; }
  getItem(k) { return this.#m.has(k) ? this.#m.get(k) : null; }
  setItem(k, v) { this.#m.set(k, String(v)); }
  removeItem(k) { this.#m.delete(k); }
}
globalThis.localStorage = new MemoryStorage();
const store = await import('../js/store.js');

beforeEach(() => store.resetAll());

const ev = (qid, ts, result = 'correct') => ({ qid, ts, result, points: 10 });

test('Schlüssel tragen das Präfix', () => {
  store.appendEvent(ev('a', Date.UTC(2026, 9, 1, 10)));
  for (let i = 0; i < localStorage.length; i++) assert.ok(localStorage.key(i).startsWith('lerntrainer:v1:'));
});

test('Ereignisse werden nach Monaten abgelegt und sortiert gelesen', () => {
  store.appendEvent(ev('b', new Date(2026, 10, 2).getTime()));
  store.appendEvent(ev('a', new Date(2026, 9, 30).getTime()));
  assert.deepEqual(store.allEvents().map((e) => e.qid), ['a', 'b']);
  assert.ok(localStorage.getItem('lerntrainer:v1:events:2026-10'));
  assert.ok(localStorage.getItem('lerntrainer:v1:events:2026-11'));
});

test('Tagesziel wird pro Tag mitgespeichert', () => {
  store.saveSettings({ dailyGoal: 30 });
  const ts = new Date(2026, 9, 23, 9).getTime();
  store.appendEvent(ev('a', ts));
  assert.equal(store.getDays()['2026-10-23'], 30);
});

test('Import zweimal derselben Datei ändert nichts (F-51)', () => {
  store.appendEvent(ev('a', 1000));
  const backup = { ...store.exportData({ 'inet-tech': 'x' }), events: [ev('a', 1000), ev('b', 2000)] };
  assert.equal(store.validateBackup(backup), null);
  assert.deepEqual(store.importData(backup, 'merge'), { total: 2, added: 1 });
  assert.deepEqual(store.importData(backup, 'merge'), { total: 2, added: 0 });
  assert.equal(store.allEvents().length, 2);
});

test('Ersetzen übernimmt nur die Datei', () => {
  store.appendEvent(ev('local', 500));
  store.importData({ format: 'lerntrainer-backup', schemaVersion: 1, events: [ev('x', 1)], days: {}, settings: { dailyGoal: 25 } }, 'replace');
  assert.deepEqual(store.allEvents().map((e) => e.qid), ['x']);
  assert.equal(store.getSettings().dailyGoal, 25);
});

test('Ungültige Sicherungen werden erkannt', () => {
  assert.equal(store.validateBackup({}), 'format');
  assert.equal(store.validateBackup({ format: 'lerntrainer-backup', schemaVersion: 2, events: [] }), 'version');
  assert.equal(store.validateBackup({ format: 'lerntrainer-backup', schemaVersion: 1, events: [{ qid: 1 }] }), 'events');
});

test('mergeEvents vereinigt über qid + ts', () => {
  const m = store.mergeEvents([ev('a', 1), ev('b', 2)], [ev('a', 1), ev('a', 3)]);
  assert.deepEqual(m.map((e) => `${e.qid}${e.ts}`), ['a1', 'b2', 'a3']);
});
