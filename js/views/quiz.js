// Übungssitzung: Frage, Antwort, Feedback (Spec v2, F-10 bis F-14, Kapitel 10).

import { h, icon, codeBlock, scrollIntoViewIfNeeded } from '../ui.js';
import { t, tn } from '../i18n/de.js';
import { renderInline, renderMarkdown } from '../markdown.js';
import * as store from '../store.js';
import { gradeChoice, points, bonus, streak, dayKey, totalPoints } from '../scoring.js';
import { encounters } from '../leitner.js';
import { sectionTitle, findChapter } from '../catalog.js';
import { advance, currentQid, isFinished, shuffle, skip } from '../session.js';
import { startSession } from './chapter.js';

const isChoice = (q) => q.type === 'mc-single' || q.type === 'mc-multi';

export function quiz(root, _params, ctx) {
  let session = store.getSession();
  let keyHandler = null;
  let lastScore = null;
  const onKey = (e) => keyHandler?.(e);
  document.addEventListener('keydown', onKey);
  draw();
  return () => document.removeEventListener('keydown', onKey);

  function save() {
    try { store.saveSession(session); } catch { /* Sitzung ist nur Komfort, Antworten sind schon gespeichert */ }
  }

  function draw(focus = null) {
    root.replaceChildren();
    keyHandler = null;
    const cat = session && ctx.state.catalogs.get(session.catalogId);
    if (!cat) return drawEmpty();
    while (!isFinished(session) && !cat.byId.has(currentQid(session))) session = skip(session);
    if (isFinished(session)) { save(); return drawSummary(cat); }
    const q = cat.byId.get(currentQid(session));
    if (!session.current || session.current.qid !== q.id) {
      const idx = (q.options ?? []).map((_, i) => i);
      session = { ...session, current: { qid: q.id, phase: 'answer', order: q.shuffle === false ? idx : shuffle(idx), selected: [] } };
      save();
    }
    drawQuestion(cat, q);
    if (focus) {
      const el = root.querySelector(focus);
      if (el) { el.focus({ preventScroll: true }); if (focus !== '.q-prompt') scrollIntoViewIfNeeded(el); }
    }
  }

  function drawEmpty() {
    document.title = t('app.title');
    root.append(h('header', { class: 'appbar' },
      h('a', { class: 'iconbtn', href: '#/', 'aria-label': t('nav.home') }, icon('back')),
      h('h1', { class: 'appbar-title' }, t('app.title')),
      h('span', { class: 'appbar-spacer' })));
    root.append(h('main', { class: 'screen', id: 'main' },
      h('p', { class: 'notice' }, t('quiz.empty')),
      h('a', { class: 'btn btn-primary btn-block', href: '#/' }, t('quiz.emptyAction'))));
  }

  function chapterHref() {
    return `#/fach/${encodeURIComponent(session.catalogId)}/kapitel/${encodeURIComponent(session.chapterId)}`;
  }

  function quizBar() {
    const n = session.pos + 1;
    const total = session.queue.length;
    const fill = h('span', { class: 'quizbar-fill' });
    fill.style.width = `${(session.pos / total) * 100}%`;
    const score = totalPoints(store.allEvents());
    const changed = lastScore !== null && score !== lastScore;
    lastScore = score;
    return h('header', { class: 'appbar quizbar' },
      h('a', { class: 'iconbtn', href: chapterHref(), 'aria-label': t('quiz.close') }, icon('close')),
      h('div', { class: 'quizbar-progress' },
        h('span', { class: 'quizbar-text' }, t('quiz.position', { n, total })),
        h('span', { class: 'quizbar-track', 'aria-hidden': 'true' }, fill)),
      h('p', { class: `quizbar-score${changed ? ' is-changed' : ''}`, title: t('quiz.score') },
        h('span', { class: 'visually-hidden' }, `${t('quiz.score')}: `),
        h('span', { class: 'quizbar-score-value' }, String(score)),
        h('span', { class: 'quizbar-score-unit', 'aria-hidden': 'true' }, 'P')));
  }

  /** Was die Frage jetzt noch wert ist (sinkt mit jeder Begegnung, Spec 6.1). */
  function worthText(q) {
    if (!isChoice(q)) return t('quiz.noPoints');
    const max = bonus(encounters(store.allEvents(), q.id) + 1, q.difficulty);
    return max > 0 ? tn('quiz.worth', max) : t('quiz.worthZero');
  }

  function drawQuestion(cat, q) {
    const c = session.current;
    const choice = isChoice(q);
    const multi = q.type === 'mc-multi';
    const scope = sectionTitle(cat, q.section);
    document.title = `${t('quiz.position', { n: session.pos + 1, total: session.queue.length })} – ${t('app.title')}`;

    root.append(quizBar());
    const main = h('main', { class: 'screen quiz', id: 'main' });
    root.append(main);

    main.append(h('p', { class: 'q-meta' },
      h('span', {}, scope),
      h('span', { class: `q-level level-${q.difficulty}` }, t(`quiz.level${q.difficulty}`)),
      c.phase !== 'feedback' ? h('span', { class: 'q-worth' }, worthText(q)) : null,
      q.status === 'entwurf' ? h('span', { class: 'q-draft' }, t('quiz.draft')) : null));

    if (q.type === 'flashcard') main.append(h('p', { class: 'q-kicker' }, t('quiz.explainTerm')));
    main.append(h('h2', { class: `q-prompt${q.type === 'flashcard' ? ' q-term' : ''}`, tabindex: '-1' }, renderInline(q.prompt)));
    if (q.code) main.append(codeBlock(q.code));

    const actions = h('div', { class: 'actionbar' });

    if (choice) {
      if (multi) main.append(h('p', { class: 'q-hint' }, t('quiz.multiHint')));
      const fb = c.phase === 'feedback';
      const list = h('ul', { class: 'options', role: multi ? 'group' : 'radiogroup', 'aria-label': t('quiz.options') });
      c.order.forEach((orig, pos) => {
        const o = q.options[orig];
        const sel = c.selected.includes(orig);
        let state = '';
        let note = '';
        let mark = String(pos + 1);
        if (fb) {
          if (o.correct && sel) { state = 'is-correct'; note = t('quiz.noteChosenCorrect'); mark = icon('check'); }
          else if (o.correct) { state = multi ? 'is-missed' : 'is-correct'; note = multi ? t('quiz.noteMissed') : t('quiz.noteCorrect'); mark = icon('check'); }
          else if (sel) { state = 'is-wrong'; note = t('quiz.noteChosenWrong'); mark = icon('cross'); }
        }
        list.append(h('li', {}, h('button', {
          type: 'button',
          class: ['opt', sel && 'is-selected', state].filter(Boolean).join(' '),
          role: multi ? 'checkbox' : 'radio',
          'aria-checked': String(sel),
          'aria-disabled': fb ? 'true' : null,
          'data-idx': orig,
          onclick: () => toggle(orig),
        },
        h('span', { class: 'opt-key', 'aria-hidden': 'true' }, mark),
        h('span', { class: 'opt-body' },
          h('span', { class: 'opt-text' }, o.text),
          note ? h('span', { class: 'opt-note' }, note) : null))));
      });
      main.append(list);

      if (fb) {
        main.append(feedback(q, c, scope));
        actions.append(h('button', { type: 'button', class: 'btn btn-primary btn-block', id: 'next', onclick: next }, t('quiz.next')));
      } else {
        actions.append(h('button', { type: 'button', class: 'btn btn-primary btn-block', id: 'check', disabled: !c.selected.length, onclick: check }, t('quiz.check')));
      }
    } else if (c.phase === 'reveal') {
      main.append(h('section', { class: 'answer', id: 'answer', tabindex: '-1', 'aria-labelledby': 'answer-title' },
        h('h3', { class: 'answer-title', id: 'answer-title' }, t('quiz.solution')),
        q.answerCode ? codeBlock(q.answerCode) : null,
        h('div', { class: 'answer-text' }, renderMarkdown(q.answer)),
        h('p', { class: 'fb-source' }, t('quiz.readMore', { section: scope }))));
      actions.append(h('p', { class: 'actionbar-label', id: 'rate-label' }, t('quiz.rateQuestion')),
        h('div', { class: 'rate', role: 'group', 'aria-labelledby': 'rate-label' },
          h('button', { type: 'button', class: 'btn btn-rate rate-didnt', onclick: () => rate('didnt') }, t('quiz.didnt')),
          h('button', { type: 'button', class: 'btn btn-rate rate-partly', onclick: () => rate('partly') }, t('quiz.partly')),
          h('button', { type: 'button', class: 'btn btn-rate rate-knew', onclick: () => rate('knew') }, t('quiz.knew'))));
    } else {
      actions.append(h('button', { type: 'button', class: 'btn btn-primary btn-block', id: 'reveal', onclick: reveal }, t('quiz.reveal')));
    }
    root.append(actions);
    root.classList.toggle('has-rate', !choice && c.phase === 'reveal');

    keyHandler = (e) => {
      if (e.altKey || e.ctrlKey || e.metaKey || e.target.closest?.('input, textarea, select')) return;
      // Enter auf einer Antwort prüft (statt sie erneut zu wählen); auf anderen Buttons gilt das normale Verhalten
      const active = document.activeElement;
      const onButton = active?.tagName === 'BUTTON' && !(e.key === 'Enter' && active.classList.contains('opt'));
      if (choice && c.phase === 'answer' && /^[1-9]$/.test(e.key)) {
        const pos = Number(e.key) - 1;
        if (pos < c.order.length) { e.preventDefault(); toggle(c.order[pos]); }
      } else if (!choice && c.phase === 'reveal' && /^[1-3]$/.test(e.key)) {
        e.preventDefault(); rate(['didnt', 'partly', 'knew'][Number(e.key) - 1]);
      } else if (e.key === 'Enter' && !onButton) {
        e.preventDefault();
        if (choice) (c.phase === 'feedback' ? next() : c.selected.length && check());
        else if (c.phase === 'answer') reveal();
      } else if (e.key === ' ' && !onButton && !choice && c.phase === 'answer') {
        e.preventDefault(); reveal();
      }
    };

    function toggle(orig) {
      if (c.phase !== 'answer') return;
      const selected = multi
        ? (c.selected.includes(orig) ? c.selected.filter((x) => x !== orig) : [...c.selected, orig])
        : [orig];
      session = { ...session, current: { ...c, selected } };
      save();
      draw(`.opt[data-idx="${orig}"]`);
    }

    function record(result, ratio, pts, n) {
      try {
        store.appendEvent({ qid: q.id, cat: session.catalogId, ts: Date.now(), mode: session.mode, difficulty: q.difficulty, result, q: ratio, n, points: pts });
        return true;
      } catch {
        main.append(h('p', { class: 'notice notice-error', role: 'alert' }, t('quiz.saveError')));
        return false;
      }
    }

    function check() {
      if (!c.selected.length) return;
      const n = encounters(store.allEvents(), q.id) + 1;
      const { result, q: ratio } = gradeChoice(q.options, c.selected);
      const pts = points({ result, q: ratio, n, difficulty: q.difficulty });
      if (!record(result, ratio, pts, n)) return;
      session = { ...session, current: { ...c, phase: 'feedback', result, points: pts, n } };
      save();
      draw('#feedback');
    }

    function next() {
      session = advance(session, c.result, c.points);
      save();
      window.scrollTo(0, 0);
      draw('.q-prompt');
    }

    function reveal() {
      session = { ...session, current: { ...c, phase: 'reveal' } };
      save();
      draw('#answer');
    }

    function rate(result) {
      const n = encounters(store.allEvents(), q.id) + 1;
      if (!record(result, null, 0, n)) return;
      session = advance(session, result, 0);
      save();
      window.scrollTo(0, 0);
      draw('.q-prompt');
    }
  }

  function feedback(q, c, scope) {
    const res = c.result;
    const sign = c.points > 0 ? '+' : c.points < 0 ? '−' : '';
    const abs = Math.abs(c.points);
    return h('section', { class: `feedback is-${res}`, id: 'feedback', tabindex: '-1', role: 'status' },
      h('p', { class: 'fb-result' },
        icon(res === 'correct' ? 'check' : res === 'partial' ? 'partial' : 'cross', 'icon fb-icon'),
        h('span', {}, t(`result.${res}`)),
        h('span', { class: 'fb-points' }, tn('quiz.points', abs, { sign }))),
      h('p', { class: 'fb-expl' }, q.explanation),
      h('p', { class: 'fb-meta' }, c.n === 1 ? t('quiz.encounter.1') : t('quiz.encounter.n', { n: c.n })),
      h('p', { class: 'fb-source' }, t('quiz.readMore', { section: scope })));
  }

  function drawSummary(cat) {
    document.title = `${t('summary.title')} – ${t('app.title')}`;
    root.classList.remove('has-rate');
    const settings = store.getSettings();
    const st = streak(store.allEvents(), store.getDays(), dayKey(Date.now()), settings.dailyGoal);
    const ch = findChapter(cat, session.chapterId);
    root.append(h('header', { class: 'appbar' },
      h('a', { class: 'iconbtn', href: chapterHref(), 'aria-label': t('summary.back') }, icon('back')),
      h('h1', { class: 'appbar-title' }, ch?.title ?? ''),
      h('span', { class: 'appbar-spacer' })));
    const { answered, correct, points: pts } = session.stats;
    const main = h('main', { class: 'screen summary', id: 'main' },
      h('h2', { class: 'summary-title', tabindex: '-1' }, t('summary.title')),
      h('dl', { class: 'stats stats-3' },
        h('div', {}, h('dt', {}, t('summary.answered')), h('dd', {}, String(answered))),
        h('div', {}, h('dt', {}, t('summary.correct')), h('dd', {}, String(correct))),
        h('div', {}, h('dt', {}, t('summary.points')), h('dd', {}, String(pts)))),
      h('p', { class: 'muted' }, st.todayCount >= st.todayGoal ? t('home.todayDone') : tn('home.remaining', st.todayGoal - st.todayCount)),
      h('button', {
        type: 'button', class: 'btn btn-primary btn-block',
        onclick: () => startSession(ctx, cat, { chapterId: session.chapterId, sectionId: session.sectionId, filter: session.filter }),
      }, t('summary.again')),
      h('a', { class: 'btn btn-block', href: chapterHref() }, t('summary.back')));
    root.append(main);
    main.querySelector('.summary-title').focus({ preventScroll: true });
  }
}
