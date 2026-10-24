// Punkte, Tagesziel, Streak und Serie – reine Funktionen (Spec v2, Kapitel 6.1 und 6.2).

export const DIFFICULTY_WEIGHT = { 1: 1, 2: 1.5, 3: 2 };
export const OBJECTIVE_RESULTS = new Set(['correct', 'partial', 'wrong']);
export const SELF_RESULTS = new Set(['knew', 'partly', 'didnt']);

/** Bonus für eine richtige Antwort bei der n-ten Begegnung, gewichtet nach Schwierigkeit. */
export function bonus(n, difficulty = 1) {
  const w = DIFFICULTY_WEIGHT[difficulty] ?? 1;
  return Math.round(w * Math.max(0, 10 - 2 * (n - 1)));
}

/** Malus für eine falsche Antwort bei der n-ten Begegnung (für alle Stufen gleich). */
export function malus(n) {
  return n <= 1 ? 0 : -Math.min(5, n - 1);
}

/**
 * Bewertet eine Auswahl bei Multiple Choice.
 * options: Optionen der Frage (mit correct: true), selected: gewählte Indizes in options.
 * Liefert { result: 'correct' | 'partial' | 'wrong', q }.
 */
export function gradeChoice(options, selected) {
  const k = options.filter((o) => o.correct).length;
  const unique = [...new Set(selected)];
  const r = unique.filter((i) => options[i]?.correct).length;
  const f = unique.length - r;
  const q = k === 0 ? 0 : Math.max(0, (r - f) / k);
  const result = q === 1 ? 'correct' : q > 0 ? 'partial' : 'wrong';
  return { result, q };
}

/** Punkte für ein Ergebnis. Selbsteinschätzungen geben keine Punkte. */
export function points({ result, q = 0, n, difficulty }) {
  if (result === 'correct') return bonus(n, difficulty);
  if (result === 'partial') return Math.round(bonus(n, difficulty) * q);
  if (result === 'wrong') return malus(n);
  return 0;
}

const pad = (x) => String(x).padStart(2, '0');

/** Kalendertag in lokaler Zeit, z. B. "2026-10-23". */
export function dayKey(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function addDays(key, delta) {
  const [y, m, d] = key.split('-').map(Number);
  return dayKey(new Date(y, m - 1, d + delta).getTime());
}

export function countsPerDay(events) {
  const counts = {};
  for (const e of events) {
    const k = dayKey(e.ts);
    counts[k] = (counts[k] ?? 0) + 1;
  }
  return counts;
}

/**
 * Streak: Tage in Folge mit erreichtem Tagesziel.
 * days: { "YYYY-MM-DD": Tagesziel an diesem Tag }, fehlende Tage nutzen defaultGoal.
 * Ist heute noch nicht erfüllt, zählt die Streak ab gestern (Spec 6.2).
 */
export function streak(events, days = {}, today = dayKey(Date.now()), defaultGoal = 20) {
  const counts = countsPerDay(events);
  const goalOf = (k) => days[k] ?? defaultGoal;
  const fulfilled = (k) => (counts[k] ?? 0) >= goalOf(k);

  let current = 0;
  let k = fulfilled(today) ? today : addDays(today, -1);
  while (fulfilled(k)) { current++; k = addDays(k, -1); }

  let best = current;
  const sorted = Object.keys(counts).sort();
  if (sorted.length) {
    let run = 0;
    let prev = null;
    for (const day of sorted) {
      if (!fulfilled(day)) { run = 0; prev = day; continue; }
      run = prev && addDays(prev, 1) === day && run > 0 ? run + 1 : 1;
      best = Math.max(best, run);
      prev = day;
    }
  }
  return { current, best, todayCount: counts[today] ?? 0, todayGoal: days[today] ?? defaultGoal };
}

/** Serie richtiger Antworten. Teilweise und falsch setzen auf 0, Selbsteinschätzungen zählen nicht. */
export function series(events) {
  let current = 0;
  let best = 0;
  for (const e of events) {
    if (!OBJECTIVE_RESULTS.has(e.result)) continue;
    current = e.result === 'correct' ? current + 1 : 0;
    best = Math.max(best, current);
  }
  return { current, best };
}

/** Summe der Punkte, nie unter 0. Optional nur Ereignisse, für die filter(e) true liefert. */
export function totalPoints(events, filter = null) {
  let sum = 0;
  for (const e of events) if (!filter || filter(e)) sum += e.points ?? 0;
  return Math.max(0, sum);
}
