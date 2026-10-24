import { h, appBar, progressBar } from '../ui.js';
import { t } from '../i18n/de.js';
import * as store from '../store.js';
import { computeBoxes, progress } from '../leitner.js';
import { visibleQuestions } from '../catalog.js';

export function subject(root, { cat: catId }, ctx) {
  const cat = ctx.state.catalogs.get(catId);
  if (!cat) { ctx.go('/'); return; }
  document.title = `${cat.catalog.title} – ${t('app.title')}`;
  const settings = store.getSettings();
  const events = store.allEvents();
  const boxes = computeBoxes(events);
  const qs = visibleQuestions(cat, settings.showDrafts);

  root.append(appBar({ title: cat.catalog.title, back: '#/', backLabel: t('nav.home') }));
  const list = h('ul', { class: 'rows' });
  for (const ch of [...cat.chapters].sort((a, b) => a.order - b.order)) {
    const p = progress(qs.filter((q) => q.chapter === ch.id), events, boxes);
    list.append(h('li', {}, h('a', { class: 'row', href: `#/fach/${encodeURIComponent(catId)}/kapitel/${encodeURIComponent(ch.id)}` },
      h('span', { class: 'row-title' }, ch.title),
      h('span', { class: 'row-sub' }, t('subject.chapterSub', p)),
      progressBar(p))));
  }
  root.append(h('main', { class: 'screen', id: 'main' }, list));
}
