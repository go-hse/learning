// Sitzungen: Reihenfolge der Fragen und Wiederholung falscher Antworten (Spec v2, F-02 und F-13).
// Alle Funktionen geben neue Objekte zurück, damit der Zustand gespeichert werden kann.

export const REQUEUE_RESULTS = new Set(['wrong', 'partial', 'didnt', 'partly']);
export const MAX_REPEATS = 3;

export function shuffle(list, rng = Math.random) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Stufe 1 → 3, innerhalb einer Stufe zufällig gemischt. */
export function orderByDifficulty(questions, rng = Math.random) {
  const ids = [];
  for (const d of [1, 2, 3]) ids.push(...shuffle(questions.filter((q) => (q.difficulty ?? 1) === d).map((q) => q.id), rng));
  return ids;
}

export function createSession({ catalogId, chapterId, sectionId = null, filter = 'all', questions, rng = Math.random, now = Date.now() }) {
  return {
    id: now.toString(36),
    mode: 'chapter',
    catalogId,
    chapterId,
    sectionId,
    filter,
    queue: orderByDifficulty(questions, rng),
    pos: 0,
    repeats: {},
    stats: { answered: 0, correct: 0, points: 0 },
    current: null,
    startedAt: now,
  };
}

export const currentQid = (s) => s.queue[s.pos] ?? null;
export const isFinished = (s) => s.pos >= s.queue.length;

/** Nach einer Antwort weiterrücken; falsche/teilweise Antworten nach 3–5 Fragen erneut einreihen. */
export function advance(s, result, pts = 0, rng = Math.random) {
  const qid = s.queue[s.pos];
  const next = {
    ...s,
    queue: [...s.queue],
    repeats: { ...s.repeats },
    stats: { ...s.stats },
    current: null,
    pos: s.pos + 1,
  };
  next.stats.answered += 1;
  if (result === 'correct' || result === 'knew') next.stats.correct += 1;
  next.stats.points += pts;

  if (REQUEUE_RESULTS.has(result) && (next.repeats[qid] ?? 0) < MAX_REPEATS) {
    next.repeats[qid] = (next.repeats[qid] ?? 0) + 1;
    const remaining = next.queue.length - next.pos;
    const gap = 3 + Math.floor(rng() * 3); // 3, 4 oder 5
    const at = remaining < 3 ? next.queue.length : next.pos + Math.min(gap, remaining);
    next.queue.splice(at, 0, qid);
  }
  return next;
}

/** Frage ohne Antwort überspringen (z. B. wenn sie nicht mehr im Katalog steht). */
export function skip(s) {
  return { ...s, pos: s.pos + 1, current: null };
}
