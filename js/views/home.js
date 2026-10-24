import { h, icon, appBar, progressBar } from '../ui.js';
import { t, tn, formatDate } from '../i18n/de.js';
import * as store from '../store.js';
import { streak, series, totalPoints, dayKey } from '../scoring.js';
import { computeBoxes, progress } from '../leitner.js';
import { visibleQuestions, findChapter, sectionTitle } from '../catalog.js';
import { isFinished } from '../session.js';
import { APP_VERSION, IMPRESSUM_URL } from '../config.js';

const BACKUP_INTERVAL = 14 * 24 * 60 * 60 * 1000;

export function home(root, _params, ctx) {
  document.title = t('app.title');
  const settings = store.getSettings();
  const events = store.allEvents();
  const st = streak(events, store.getDays(), dayKey(Date.now()), settings.dailyGoal);
  const se = series(events);

  root.append(appBar({
    title: t('app.title'),
    end: h('a', { class: 'iconbtn', href: '#/einstellungen', 'aria-label': t('nav.settings') }, icon('gear')),
  }));

  const main = h('main', { class: 'screen', id: 'main' });
  root.append(main);

  if (!store.isPersistent()) main.append(h('p', { class: 'notice' }, t('home.noStorage')));

  main.append(dayPanel(st));
  main.append(h('dl', { class: 'stats' },
    h('div', {}, h('dt', {}, t('home.series')), h('dd', {}, String(se.current), h('span', { class: 'stats-sub' }, t('home.seriesBest', { n: se.best })))),
    h('div', {}, h('dt', {}, t('home.points')), h('dd', {}, String(totalPoints(events))))));

  const s = store.getSession();
  const sCat = s && ctx.state.catalogs.get(s.catalogId);
  if (s && sCat && !isFinished(s)) {
    const ch = findChapter(sCat, s.chapterId);
    const scope = [ch?.title, s.sectionId && sectionTitle(sCat, s.sectionId)].filter(Boolean).join(': ');
    main.append(h('a', { class: 'resume', href: '#/quiz' },
      h('span', { class: 'resume-title' }, t('home.resume')),
      h('span', { class: 'resume-sub' }, t('home.resumeSub', { scope, n: s.pos + 1, total: s.queue.length }))));
  }

  if (ctx.state.error) {
    main.append(h('div', { class: 'notice notice-error', role: 'alert' },
      h('p', {}, t('home.loadError')),
      h('button', { class: 'btn', type: 'button', onclick: () => location.reload() }, t('home.retry'))));
  }

  const entries = ctx.state.index?.catalogs ?? [];
  if (entries.length) {
    main.append(h('h2', { class: 'section-title' }, t('home.subjects')));
    const boxes = computeBoxes(events);
    const list = h('ul', { class: 'rows' });
    for (const entry of entries) {
      const cat = ctx.state.catalogs.get(entry.id);
      if (!cat) continue;
      const p = progress(visibleQuestions(cat, settings.showDrafts), events, boxes);
      list.append(h('li', {}, h('a', { class: 'row', href: `#/fach/${encodeURIComponent(entry.id)}` },
        h('span', { class: 'row-title' }, cat.catalog.title),
        h('span', { class: 'row-sub' }, t('home.subjectSub', p)),
        progressBar(p))));
    }
    main.append(list);
  }

  if (events.length && Date.now() - (settings.lastExport ?? events[0].ts) > BACKUP_INTERVAL) {
    main.append(h('p', { class: 'notice' },
      t('home.backup', { when: settings.lastExport ? formatDate(settings.lastExport) : t('home.backupNever') }), ' ',
      h('a', { href: '#/einstellungen' }, t('home.backupLink'))));
  }

  root.append(h('footer', { class: 'footer' },
    h('a', { href: IMPRESSUM_URL }, t('footer.impressum')),
    h('span', {}, t('footer.version', { version: APP_VERSION }))));
}

function dayPanel(st) {
  const { todayCount: count, todayGoal: goal } = st;
  const done = count >= goal;
  const grid = h('div', { class: 'day-grid', 'aria-hidden': 'true' });
  for (let i = 0; i < goal; i++) grid.append(h('span', { class: i < count ? 'cell is-filled' : 'cell' }));
  const sub = !done
    ? tn('home.remaining', goal - count)
    : count > goal ? tn('home.extra', count - goal, { count }) : t('home.doneSub', { count, goal });
  return h('section', { class: `day${done ? ' is-done' : ''}`, 'aria-labelledby': 'day-title' },
    h('h2', { class: 'day-title', id: 'day-title' }, done ? t('home.todayDone') : t('home.today', { count, goal })),
    grid,
    h('p', { class: 'day-sub' }, sub),
    h('p', { class: 'day-streak' }, icon('flame', 'icon flame'),
      h('span', {}, tn('home.streak', st.current)),
      st.best > 0 ? h('span', { class: 'day-best' }, t('home.best', { n: st.best })) : null));
}
