import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bonus, malus, gradeChoice, points, streak, series, totalPoints, dayKey, addDays } from '../js/scoring.js';

test('Bonus nach Begegnung und Stufe (Spec 6.1, Tabelle)', () => {
  assert.deepEqual([1, 2, 3, 4, 5, 6, 7].map((n) => bonus(n, 1)), [10, 8, 6, 4, 2, 0, 0]);
  assert.deepEqual([1, 2, 3, 4, 5, 6].map((n) => bonus(n, 2)), [15, 12, 9, 6, 3, 0]);
  assert.deepEqual([1, 2, 3, 4, 5, 6].map((n) => bonus(n, 3)), [20, 16, 12, 8, 4, 0]);
});

test('Malus ist ungewichtet und endet bei -5', () => {
  assert.deepEqual([1, 2, 3, 4, 5, 6, 9].map(malus), [0, -1, -2, -3, -4, -5, -5]);
});

const multi = [{ text: 'a', correct: true }, { text: 'b' }, { text: 'c', correct: true }, { text: 'd' }];

test('Teilpunkte bei Mehrfachauswahl (Spec 6.1, Beispieltabelle)', () => {
  const cases = [
    [[0, 2], 'correct', 1, 10],
    [[0], 'partial', 0.5, 5],
    [[0, 2, 1], 'partial', 0.5, 5],
    [[0, 1], 'wrong', 0, 0],
    [[0, 1, 2, 3], 'wrong', 0, 0],
  ];
  for (const [sel, result, q, pts] of cases) {
    const g = gradeChoice(multi, sel);
    assert.equal(g.result, result, `Auswahl ${sel}`);
    assert.equal(g.q, q, `Auswahl ${sel}`);
    assert.equal(points({ ...g, n: 1, difficulty: 1 }), pts, `Auswahl ${sel}`);
  }
});

test('Beispiel-Ereignis aus Spec 7.2: Stufe 2, Begegnung 2, q = 0.5 → 6 Punkte', () => {
  assert.equal(points({ result: 'partial', q: 0.5, n: 2, difficulty: 2 }), 6);
});

test('Einfachauswahl', () => {
  const single = [{ text: 'a' }, { text: 'b', correct: true }];
  assert.equal(gradeChoice(single, [1]).result, 'correct');
  assert.equal(gradeChoice(single, [0]).result, 'wrong');
  assert.equal(points({ result: 'wrong', n: 3, difficulty: 3 }), -2);
});

test('Selbsteinschätzung gibt keine Punkte', () => {
  for (const result of ['knew', 'partly', 'didnt']) assert.equal(points({ result, n: 1, difficulty: 3 }), 0);
});

const at = (day, h = 12) => { const [y, m, d] = day.split('-').map(Number); return new Date(y, m - 1, d, h).getTime(); };
const answers = (day, count, result = 'correct') => Array.from({ length: count }, (_, i) => ({ qid: `q${i}`, ts: at(day) + i, result }));

test('Streak: heute noch offen bricht die Streak nicht', () => {
  const today = '2026-10-23';
  const events = [...answers('2026-10-21', 20), ...answers('2026-10-22', 25), ...answers(today, 5)];
  const s = streak(events, {}, today, 20);
  assert.equal(s.current, 2);
  assert.equal(s.todayCount, 5);
});

test('Streak: heute erfüllt zählt mit, Lücke beendet die Streak', () => {
  const today = '2026-10-23';
  const events = [...answers('2026-10-19', 20), ...answers('2026-10-20', 20), ...answers('2026-10-22', 20), ...answers(today, 20)];
  const s = streak(events, {}, today, 20);
  assert.equal(s.current, 2);
  assert.equal(s.best, 2);
});

test('Streak: Tagesziel des jeweiligen Tages zählt, Rekord bleibt', () => {
  const today = '2026-10-23';
  const events = [...answers('2026-10-10', 10), ...answers('2026-10-11', 10), ...answers('2026-10-12', 10), ...answers('2026-10-22', 10)];
  const s = streak(events, { '2026-10-10': 10, '2026-10-11': 10, '2026-10-12': 10 }, today, 20);
  assert.equal(s.current, 0, '22.10.: 10 < 20');
  assert.equal(s.best, 3);
});

test('Falsche Antworten zählen zum Tagesziel', () => {
  const today = '2026-10-23';
  assert.equal(streak(answers(today, 20, 'wrong'), {}, today, 20).current, 1);
});

test('Serie: teilweise und falsch setzen zurück, Selbsteinschätzung zählt nicht', () => {
  const ev = ['correct', 'correct', 'knew', 'correct', 'partial', 'correct', 'didnt', 'correct'].map((result, i) => ({ qid: 'x', ts: i, result }));
  assert.deepEqual(series(ev), { current: 2, best: 3 });
});

test('Gesamtpunkte fallen nicht unter 0', () => {
  assert.equal(totalPoints([{ points: -3 }, { points: 1 }]), 0);
  assert.equal(totalPoints([{ points: 10 }, { points: -3 }]), 7);
});

test('Tage über Monatsgrenze', () => {
  assert.equal(addDays('2026-11-01', -1), '2026-10-31');
  assert.equal(dayKey(at('2026-03-29', 3)), '2026-03-29');
});
