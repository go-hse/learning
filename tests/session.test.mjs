import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSession, advance, currentQid, isFinished, MAX_REPEATS } from '../js/session.js';
import { computeBoxes, progress, encounters } from '../js/leitner.js';

const qs = [
  { id: 'a3', difficulty: 3 }, { id: 'b1', difficulty: 1 }, { id: 'c2', difficulty: 2 },
  { id: 'd1', difficulty: 1 }, { id: 'e2', difficulty: 2 }, { id: 'f1', difficulty: 1 },
  { id: 'g3', difficulty: 3 }, { id: 'h1', difficulty: 1 },
];
const fixed = (v) => () => v;

test('Reihenfolge nach Schwierigkeit 1 → 2 → 3 (F-02)', () => {
  const s = createSession({ catalogId: 'c', chapterId: 'css', questions: qs });
  const level = Object.fromEntries(qs.map((q) => [q.id, q.difficulty]));
  const levels = s.queue.map((id) => level[id]);
  assert.deepEqual(levels, [...levels].sort());
  assert.equal(s.queue.length, qs.length);
});

test('Falsche Antwort kommt nach 3–5 anderen Fragen wieder (F-13)', () => {
  for (const [r, gap] of [[0, 3], [0.5, 4], [0.99, 5]]) {
    let s = createSession({ catalogId: 'c', chapterId: 'css', questions: qs, rng: fixed(0) });
    const first = currentQid(s);
    s = advance(s, 'wrong', 0, fixed(r));
    assert.equal(s.queue.indexOf(first, 1), 1 + gap, `rng ${r}`);
  }
});

test('Teilweise und nicht gewusst werden ebenfalls wiederholt, richtig nicht', () => {
  for (const result of ['partial', 'didnt', 'partly']) {
    const s = advance(createSession({ catalogId: 'c', chapterId: 'css', questions: qs }), result, 0, fixed(0));
    assert.equal(s.queue.length, qs.length + 1, result);
  }
  const s = advance(createSession({ catalogId: 'c', chapterId: 'css', questions: qs }), 'correct', 10);
  assert.equal(s.queue.length, qs.length);
  assert.deepEqual(s.stats, { answered: 1, correct: 1, points: 10 });
});

test('Weniger als 3 Fragen übrig: ans Ende', () => {
  let s = createSession({ catalogId: 'c', chapterId: 'css', questions: qs.slice(0, 3) });
  const first = currentQid(s);
  s = advance(s, 'wrong', 0, fixed(0));
  assert.equal(s.queue.at(-1), first);
});

test('Höchstens 3 Wiederholungen pro Frage und Sitzung, Sitzung endet', () => {
  let s = createSession({ catalogId: 'c', chapterId: 'css', questions: [{ id: 'x', difficulty: 1 }] });
  let steps = 0;
  while (!isFinished(s) && steps < 20) { s = advance(s, 'wrong', 0); steps++; }
  assert.equal(steps, 1 + MAX_REPEATS);
  assert.ok(isFinished(s));
});

test('Leitner-Fächer (Spec 6.3)', () => {
  const ev = (qid, result, ts) => ({ qid, result, ts });
  const boxes = computeBoxes([
    ev('a', 'correct', 1), ev('a', 'correct', 2), ev('a', 'partial', 3),
    ev('b', 'wrong', 4),
    ev('c', 'correct', 5), ev('c', 'knew', 6), ev('c', 'correct', 7), ev('c', 'correct', 8), ev('c', 'correct', 9),
    ev('d', 'correct', 10), ev('d', 'didnt', 11),
  ]);
  assert.equal(boxes.get('a'), 3);
  assert.equal(boxes.get('b'), 1);
  assert.equal(boxes.get('c'), 5);
  assert.equal(boxes.get('d'), 1);
  const p = progress([{ id: 'a' }, { id: 'c' }, { id: 'z' }], [ev('a', 'correct', 1), ...[1, 2, 3, 4].map((i) => ev('c', 'correct', i + 1))]);
  assert.deepEqual(p, { total: 3, seen: 2, correct: 2, mastered: 1 });
  const p2 = progress([{ id: 'a' }, { id: 'b' }], [ev('a', 'knew', 1), ev('b', 'correct', 2), ev('b', 'wrong', 3)]);
  assert.deepEqual(p2, { total: 2, seen: 2, correct: 1, mastered: 0 }, 'gewusst zählt als richtig, falsch danach nicht');
  assert.equal(encounters([ev('a', 'x', 1), ev('a', 'y', 2), ev('b', 'x', 3)], 'a'), 2);
});
