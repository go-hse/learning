#!/usr/bin/env node
// Erzeugt catalogs/inet-tech.json aus dem Vorlesungsmaterial.
//
// Aufruf:  node tools/build-catalog.mjs --src <Pfad zum Ordner Vorlesungsskript> [--list]
//
// Quellen je Kapitel (derzeit nur CSS):
//   - ARS-Fragen        <src>/04-CSS/Praesentationen/*-ars.json      -> mc-single / mc-multi
//   - Review-Aufgaben   <src>/04-CSS/Praesentationen/16-review-questions-css.json -> code-task
//   - Glossar           <src>/04-CSS/glossar.md                       -> flashcard
//   - Redaktion         tools/content/css-overrides.json  (Abschnitte, Schwierigkeit, Korrekturen)
//   - Neue Fragen       tools/content/css-new-questions.json
//
// Spezifikation: spec/lerntrainer-spec-v2.md, Kapitel 7.1 und 11.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const arg = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const SRC = arg('--src');
const LIST = args.includes('--list');
if (!SRC) { console.error('Fehlt: --src <Pfad zum Ordner Vorlesungsskript>'); process.exit(1); }

const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const errors = [];
const warn = [];

// ---------- Hilfsfunktionen ----------
export function slug(s) {
  return s.toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    .slice(0, 48).replace(/-+$/, '');
}

function applyWordFixes(text, fixes) {
  return text.replace(/[A-Za-zÄÖÜäöüß]+/g, (w) => fixes[w] ?? w);
}

function cleanText(text, cfg) {
  let t = applyWordFixes(text, cfg.wordFixes);
  t = t.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1$2'); // Kursiv entfernen (nur Inline-Code und fett erlaubt)
  t = t.replace(/ -- /g, ' – ').replace(/--/g, '–');
  return t.trim();
}

function cleanArsExplanation(notes) {
  let t = notes.filter((n) => !/^Richtige Position:/.test(n)).join(' ').trim();
  t = t.replace(/^ARS-Frage\.\s*/, '');
  const m = t.match(/^Richtige Antwort:\s*(.+?)\.(?=\s|$)\s*/);
  if (m) {
    const rest = t.slice(m[0].length).trim();
    t = (m[1].length <= 45 && rest) ? rest : m[1] + '.' + (rest ? ' ' + rest : '');
  }
  t = t.replace(/\s*\(Folie „[^“]*“[^)]*\)/g, '');
  t = t.replace(/ -- /g, ' – ');
  return t.trim();
}

function cleanArsPrompt(q) {
  return q.replace(/\s*\(Mehrfachauswahl\)\s*/, ' ').trim()
    .replace(/<[a-z][^>]*>/g, (tag) => '`' + tag + '`');
}

function parseCorrect(notes, n) {
  const line = notes.find((x) => /^Richtige Position:/.test(x));
  if (!line) return null;
  const letters = line.replace(/^Richtige Position:\s*/, '').split(/\s*,\s*/);
  const idx = letters.map((l) => 'ABCDEFGH'.indexOf(l.trim()));
  if (idx.some((i) => i < 0 || i >= n)) return null;
  return idx;
}

function applyPatch(q, patch) {
  if (!patch) return q;
  for (const [k, v] of Object.entries(patch)) {
    if (k === 'replaceOption') {
      for (const [letter, text] of Object.entries(v)) {
        const i = 'ABCDEFGH'.indexOf(letter);
        q.options[i] = { ...q.options[i], text };
      }
    } else if (v === null) {
      delete q[k];
    } else {
      q[k] = v;
    }
  }
  return q;
}

// ---------- Kapitel CSS ----------
function buildCss() {
  const cfg = readJson(path.join(ROOT, 'tools/content/css-overrides.json'));
  const dir = path.join(SRC, cfg.chapter.dir);
  const pres = path.join(dir, 'Praesentationen');
  const out = [];
  const secById = Object.fromEntries(cfg.sections.map((s) => [s.id, s]));

  // 1. ARS-Fragen
  for (const sec of cfg.sections.filter((s) => s.ars)) {
    const deck = readJson(path.join(pres, sec.ars));
    for (const slide of deck.slides) {
      const a = slide.ars;
      if (!a) continue;
      if (a.kind !== 'question') { warn.push(`übersprungen (kind=${a.kind}): ${sec.ars} – ${slide.title}`); continue; }
      const rawId = `${sec.prefix}-${slug(slide.title.replace(/^Frage:\s*/, ''))}`;
      const id = cfg.rename?.[rawId] ?? rawId;
      const correct = parseCorrect(slide.notes ?? [], a.answers.length);
      if (!correct) { errors.push(`${id}: richtige Antwort nicht erkennbar`); continue; }
      const codes = (slide.content ?? []).filter((c) => c.type === 'code');
      if (codes.length > 1) warn.push(`${id}: mehr als ein Codeblock, nur der erste wird übernommen`);
      const q = {
        id, chapter: cfg.chapter.id, section: sec.id,
        type: a.multiple ? 'mc-multi' : 'mc-single',
        difficulty: cfg.difficulty[id],
        status: 'freigegeben',
        prompt: cleanArsPrompt(a.question),
        ...(codes[0] ? { code: { lang: codes[0].language, text: codes[0].text } } : {}),
        options: a.answers.map((text, i) => (correct.includes(i) ? { text, correct: true } : { text })),
        shuffle: true,
        explanation: cleanArsExplanation(slide.notes ?? []),
        source: { kind: 'ars', file: `${cfg.chapter.dir}/Praesentationen/${sec.ars}` },
      };
      out.push(applyPatch(q, cfg.patch[id]));
    }
  }

  // 2. Review-Aufgaben (code-task)
  {
    const sec = secById[cfg.review.section];
    const deck = readJson(path.join(pres, cfg.review.file));
    for (const slide of deck.slides) {
      const m = slide.title.match(/^Frage (\d+):\s*(.+)$/);
      if (!m) continue;
      const topic = m[2];
      const id = `${sec.prefix}-${slug(topic)}`;
      const task = slide.content.find((c) => c.caption === 'Aufgabe');
      const sol = slide.content.find((c) => c.caption === 'Musterlösung');
      let answer = (slide.notes ?? []).filter((n) => !/schliesst den Review-Questions-Block/.test(n)).join('\n\n');
      answer = answer
        .replace(/\s*\((?:siehe )?Aufgabe \d+\)/g, '')
        .replace(/ (?:der|aus|in) Aufgabe \d+/g, '');
      const q = {
        id, chapter: cfg.chapter.id, section: sec.id, type: 'code-task',
        difficulty: cfg.difficulty[id], status: 'freigegeben',
        prompt: `Schreibe HTML, auf das dieser Selektor zutrifft (${topic}).`,
        code: { lang: task.language, text: task.text },
        answer: cleanText(answer, cfg),
        answerCode: { lang: sol.language, text: sol.text },
        source: { kind: 'review', file: `${cfg.chapter.dir}/Praesentationen/${cfg.review.file}`, nr: Number(m[1]) },
      };
      out.push(applyPatch(q, cfg.patch[id]));
    }
  }

  // 3. Glossar (flashcard)
  {
    const md = fs.readFileSync(path.join(dir, 'glossar.md'), 'utf8');
    const re = /^\*\*(.+?)\*\*\s*\n:\s*(.+)$/gm;
    let m;
    while ((m = re.exec(md))) {
      const term = m[1].trim();
      const id = `${cfg.glossaryPrefix}-${slug(term)}`;
      const section = cfg.glossarySections[term];
      if (!section) errors.push(`Glossar: kein Abschnitt für „${term}“ in glossarySections`);
      const q = {
        id, chapter: cfg.chapter.id, section, type: 'flashcard',
        difficulty: cfg.difficulty[id] ?? 1, status: 'freigegeben',
        prompt: term,
        answer: cleanText(m[2], cfg),
        source: { kind: 'glossar', file: `${cfg.chapter.dir}/glossar.md` },
      };
      out.push(applyPatch(q, cfg.patch[id]));
    }
  }

  // 4. Neue, redaktionell erstellte Fragen
  const fresh = readJson(path.join(ROOT, 'tools/content/css-new-questions.json'));
  for (const q of fresh) {
    out.push({ chapter: cfg.chapter.id, status: 'entwurf', shuffle: true, source: { kind: 'neu' }, ...q });
  }

  const skip = new Set(cfg.skip ?? []);
  const questions = out.filter((q) => !skip.has(q.id));
  const order = Object.fromEntries(cfg.sections.map((s, i) => [s.id, i]));
  const typeOrder = { 'mc-single': 0, 'mc-multi': 0, 'code-task': 1, flashcard: 2 };
  questions.forEach((q, i) => (q._i = i));
  questions.sort((a, b) => (order[a.section] - order[b.section]) || (typeOrder[a.type] - typeOrder[b.type]) || (a._i - b._i));
  questions.forEach((q) => delete q._i);

  return {
    chapter: {
      id: cfg.chapter.id, title: cfg.chapter.title, order: cfg.chapter.order,
      sections: cfg.sections.map(({ id, title, source }) => ({ id, title, source })),
    },
    questions,
  };
}

// ---------- Validierung (Spec 7.1) ----------
export function validateCatalog(cat) {
  const errs = [];
  const sections = new Set(cat.chapters.flatMap((c) => c.sections.map((s) => s.id)));
  const chapters = new Set(cat.chapters.map((c) => c.id));
  const ids = new Set();
  cat.questions.forEach((q, i) => {
    const at = `questions[${i}] (${q.id ?? '?'})`;
    if (!q.id || !/^[a-z0-9-]+$/.test(q.id)) errs.push(`${at}: ungültige id`);
    if (ids.has(q.id)) errs.push(`${at}: id doppelt`);
    ids.add(q.id);
    if (!chapters.has(q.chapter)) errs.push(`${at}: unbekanntes Kapitel ${q.chapter}`);
    if (!sections.has(q.section)) errs.push(`${at}: unbekannter Abschnitt ${q.section}`);
    if (![1, 2, 3].includes(q.difficulty)) errs.push(`${at}: difficulty fehlt oder ist nicht 1–3`);
    if (!['entwurf', 'freigegeben'].includes(q.status)) errs.push(`${at}: status ungültig`);
    if (!q.prompt) errs.push(`${at}: prompt fehlt`);
    if (q.type === 'mc-single' || q.type === 'mc-multi' || q.type === 'term-mc') {
      const n = q.options?.length ?? 0;
      const c = q.options?.filter((o) => o.correct).length ?? 0;
      if (n < 2 || n > 8) errs.push(`${at}: 2–8 Optionen erwartet, ${n} gefunden`);
      if (q.type !== 'mc-multi' && c !== 1) errs.push(`${at}: genau eine richtige Option erwartet, ${c} gefunden`);
      if (q.type === 'mc-multi' && c < 1) errs.push(`${at}: mindestens eine richtige Option erwartet`);
      if (!q.explanation) errs.push(`${at}: explanation fehlt`);
      const texts = q.options?.map((o) => o.text) ?? [];
      if (new Set(texts).size !== texts.length) errs.push(`${at}: doppelte Optionen`);
      if (q.shuffle !== false && /\b(erste|zweite|dritte|vierte|letzte) Antwort|\b[A-H] (ist|sind) (falsch|richtig)|Antwort [A-H]\b/.test(q.explanation ?? ''))
        errs.push(`${at}: Erklärung verweist auf eine Antwortposition, die Optionen werden aber gemischt`);
    } else if (q.type === 'flashcard' || q.type === 'code-task') {
      if (!q.answer) errs.push(`${at}: answer fehlt`);
    } else {
      errs.push(`${at}: unbekannter type ${q.type}`);
    }
  });
  return errs;
}

// ---------- Hauptprogramm ----------
const css = buildCss();
const prev = (() => { try { return readJson(path.join(ROOT, 'catalogs/inet-tech.json')); } catch { return null; } })();
const catalog = {
  schemaVersion: 1,
  catalog: { id: 'inet-tech', title: 'Internet-Technologien', version: '', lang: 'de' },
  chapters: [css.chapter],
  questions: css.questions,
};
errors.push(...validateCatalog(catalog));

if (LIST) {
  for (const q of catalog.questions) console.log([q.id, q.type, q.difficulty ?? '-', q.prompt.slice(0, 70)].join('\t'));
}
for (const w of warn) console.warn('Hinweis: ' + w);
if (errors.length) {
  for (const e of errors) console.error('FEHLER: ' + e);
  process.exit(1);
}

// Version nur erhöhen, wenn sich der Inhalt geändert hat
const today = new Date().toISOString().slice(0, 10).replaceAll('-', '.');
const sameContent = prev && JSON.stringify({ ...prev, catalog: { ...prev.catalog, version: '' } }) === JSON.stringify(catalog);
catalog.catalog.version = sameContent ? prev.catalog.version
  : (prev?.catalog.version?.startsWith(today) ? `${today}.${Number(prev.catalog.version.split('.')[3] ?? 0) + 1}` : `${today}.1`);

fs.writeFileSync(path.join(ROOT, 'catalogs/inet-tech.json'), JSON.stringify(catalog, null, 2) + '\n');
fs.writeFileSync(path.join(ROOT, 'catalogs/index.json'), JSON.stringify({
  schemaVersion: 1,
  catalogs: [{ id: 'inet-tech', title: 'Internet-Technologien', url: 'catalogs/inet-tech.json', version: catalog.catalog.version, languages: ['de'] }],
}, null, 2) + '\n');

const by = (k) => catalog.questions.reduce((m, q) => ((m[q[k]] = (m[q[k]] ?? 0) + 1), m), {});
console.log(`catalogs/inet-tech.json geschrieben, Version ${catalog.catalog.version}, ${catalog.questions.length} Fragen`);
console.log('nach Typ:', by('type'));
console.log('nach Status:', by('status'));
console.log('nach Schwierigkeit:', by('difficulty'));
console.log('nach Abschnitt:', by('section'));
