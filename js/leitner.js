// Leitner-System mit 5 Fächern (Spec v2, Kapitel 6.3). Fächer werden immer aus den Ereignissen berechnet.

export const LEITNER_WEIGHTS = [16, 8, 4, 2, 1];
export const MASTERED_BOX = 5;

/** events müssen nach ts aufsteigend sortiert sein. Liefert Map qid → Fach (1–5). */
export function computeBoxes(events) {
  const boxes = new Map();
  for (const e of events) {
    const box = boxes.get(e.qid) ?? 1;
    let next = box;
    if (e.result === 'correct' || e.result === 'knew') next = Math.min(MASTERED_BOX, box + 1);
    else if (e.result === 'wrong' || e.result === 'didnt') next = 1;
    boxes.set(e.qid, next);
  }
  return boxes;
}

/** Wie oft wurde die Frage schon beantwortet? */
export function encounters(events, qid) {
  let n = 0;
  for (const e of events) if (e.qid === qid) n++;
  return n;
}

/** Letztes Ergebnis je Frage (events nach ts sortiert). */
export function lastResults(events) {
  const last = new Map();
  for (const e of events) last.set(e.qid, e.result);
  return last;
}

/**
 * Fortschritt für eine Menge von Fragen:
 * gesehen, zuletzt richtig (richtig oder gewusst), beherrscht (Fach 5), gesamt.
 */
export function progress(questions, events, boxes = computeBoxes(events), last = lastResults(events)) {
  let s = 0;
  let c = 0;
  let m = 0;
  for (const q of questions) {
    const r = last.get(q.id);
    if (r) s++;
    if (r === 'correct' || r === 'knew') c++;
    if (boxes.get(q.id) === MASTERED_BOX) m++;
  }
  return { total: questions.length, seen: s, correct: c, mastered: m };
}
