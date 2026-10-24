import { h, appBar, progressBar } from '../ui.js';
import { t, tn } from '../i18n/de.js';
import * as store from '../store.js';
import { computeBoxes, progress } from '../leitner.js';
import { findChapter, questionsFor, FILTERS } from '../catalog.js';
import { createSession, isFinished } from '../session.js';
import { totalPoints } from '../scoring.js';

export function startSession(ctx, cat, scope) {
  const questions = questionsFor(cat, scope, store.getSettings().showDrafts);
  if (!questions.length) return;
  store.saveSession(createSession({ catalogId: cat.catalog.id, ...scope, questions }));
  ctx.go('/quiz');
}

export function chapter(root, { cat: catId, chapter: chapterId }, ctx) {
  const cat = ctx.state.catalogs.get(catId);
  const ch = cat && findChapter(cat, chapterId);
  root.append(appBar({ title: ch?.title ?? '', back: `#/fach/${encodeURIComponent(catId)}` }));
  if (!ch) { root.append(h('main', { class: 'screen' }, h('p', { class: 'notice' }, t('chapter.notFound')))); return; }
  document.title = `${ch.title} – ${t('app.title')}`;

  const settings = store.getSettings();
  const filter = settings.chapterFilter in FILTERS ? settings.chapterFilter : 'all';
  const events = store.allEvents();
  const boxes = computeBoxes(events);
  const qs = questionsFor(cat, { chapterId, filter }, settings.showDrafts);
  const chapterIds = new Set(questionsFor(cat, { chapterId }, true).map((q) => q.id));

  const main = h('main', { class: 'screen', id: 'main' });
  root.append(main);

  const seg = h('div', { class: 'segmented', role: 'radiogroup', 'aria-label': t('chapter.filter') });
  for (const f of Object.keys(FILTERS)) {
    seg.append(h('button', {
      type: 'button', role: 'radio', class: 'seg', 'aria-checked': String(f === filter),
      onclick: () => { store.saveSettings({ chapterFilter: f }); ctx.rerender(); },
    }, t(`filter.${f}`)));
  }
  main.append(seg);

  const s = store.getSession();
  if (s && s.catalogId === catId && s.chapterId === chapterId && !isFinished(s)) {
    main.append(h('a', { class: 'btn btn-block', href: '#/quiz' }, t('chapter.resume', { n: s.pos + 1, total: s.queue.length })));
  }

  main.append(h('button', {
    type: 'button', class: 'btn btn-primary btn-block', disabled: !qs.length,
    onclick: () => startSession(ctx, cat, { chapterId, sectionId: null, filter }),
  }, tn('chapter.startAll', qs.length)));

  main.append(h('p', { class: 'muted chapter-points' }, t('chapter.points', { n: totalPoints(events, (e) => chapterIds.has(e.qid)) })));

  main.append(h('h2', { class: 'section-title' }, t('chapter.sections')));
  const list = h('ul', { class: 'rows' });
  for (const sec of ch.sections) {
    const sq = qs.filter((q) => q.section === sec.id);
    const p = progress(sq, events, boxes);
    list.append(h('li', {}, h('button', {
      type: 'button', class: 'row', disabled: !sq.length,
      onclick: () => startSession(ctx, cat, { chapterId, sectionId: sec.id, filter }),
    },
    h('span', { class: 'row-title' }, sec.title),
    h('span', { class: 'row-sub' }, sq.length ? t('chapter.sectionSub', p) : t('chapter.sectionEmpty')),
    sq.length ? progressBar(p) : null)));
  }
  main.append(list);
}
