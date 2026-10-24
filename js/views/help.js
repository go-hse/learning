// Hilfe-Seite: Tagesziel, Punkte, Leitner-System. Zahlen kommen aus der Logik der App, damit Hilfe und Verhalten übereinstimmen.

import { h, appBar } from '../ui.js';
import { t } from '../i18n/de.js';
import { help, fill } from '../i18n/help-de.js';
import * as store from '../store.js';
import { bonus, malus } from '../scoring.js';
import { MASTERED_BOX } from '../leitner.js';
import { MAX_REPEATS } from '../session.js';

const ENCOUNTERS = 6; // ab der 6. Begegnung gibt es keinen Bonus mehr

export function helpView(root) {
  document.title = `${help.title} – ${t('app.title')}`;
  const goal = store.getSettings().dailyGoal;
  root.append(appBar({ title: help.title, back: '#/', backLabel: t('nav.home') }));

  const section = (id, title, ...content) => h('section', { class: 'help-section', 'aria-labelledby': id },
    h('h2', { class: 'section-title', id }, title), ...content);
  const paras = (list, vars) => list.map((s) => h('p', {}, fill(s, vars)));

  // Zeilen: Begegnung, Spalten: Stufen und Abzug – passt so auch auf schmale Bildschirme
  const pointsTable = h('div', { class: 'table-wrap' },
    h('table', { class: 'help-table' },
      h('caption', {}, help.pointsTableCaption),
      h('thead', {}, h('tr', {},
        h('th', { scope: 'col' }, help.pointsTableEncounter),
        [1, 2, 3].map((d) => h('th', { scope: 'col' }, help.levelShort[d])),
        h('th', { scope: 'col', class: 'col-malus' }, help.malusCol))),
      h('tbody', {}, Array.from({ length: ENCOUNTERS }, (_, i) => h('tr', {},
        h('th', { scope: 'row' }, fill(i === ENCOUNTERS - 1 ? help.pointsTableNthPlus : help.pointsTableNth, { n: i + 1 })),
        [1, 2, 3].map((d) => h('td', {}, String(bonus(i + 1, d)))),
        h('td', { class: 'col-malus' }, String(malus(i + 1)).replace('-', '−')))))));

  const multiTable = h('table', { class: 'help-table help-table-compact' },
    h('thead', {}, h('tr', {}, help.multiHead.map((x) => h('th', { scope: 'col' }, x)))),
    h('tbody', {}, help.multiExamples.map(([sel, res, pts]) => h('tr', {}, h('td', {}, sel), h('td', {}, res), h('td', {}, String(pts))))));

  const boxes = h('ol', { class: 'leitner', 'aria-label': fill(help.leitnerText, { boxes: MASTERED_BOX }) });
  for (let n = 1; n <= MASTERED_BOX; n++) {
    boxes.append(h('li', { class: `leitner-box${n === MASTERED_BOX ? ' is-mastered' : ''}` },
      h('span', { class: 'leitner-n' }, fill(help.leitnerBox, { n })),
      h('span', { class: 'leitner-label' }, n === 1 ? help.leitnerStart : n === MASTERED_BOX ? help.leitnerMastered : '')));
  }
  const rulesTable = h('table', { class: 'help-table help-table-compact' },
    h('thead', {}, h('tr', {}, help.leitnerRulesHead.map((x) => h('th', { scope: 'col' }, x)))),
    h('tbody', {}, help.leitnerRules.map(([a, b]) => h('tr', {}, h('td', {}, a), h('td', {}, b)))));

  const levels = h('dl', { class: 'help-levels' },
    help.levelsText.map(([k, v]) => h('div', {}, h('dt', {}, k), h('dd', {}, v))));

  root.append(h('main', { class: 'screen help', id: 'main' },
    h('p', { class: 'help-intro' }, help.intro),
    section('h-day', help.dayTitle, paras(help.dayText, { goal })),
    section('h-points', help.pointsTitle,
      paras(help.pointsText), pointsTable, h('p', { class: 'muted' }, help.pointsTableLegend), paras(help.pointsAfter, { maxMalus: Math.abs(malus(99)) }),
      h('h3', { class: 'help-sub' }, help.multiTitle), h('p', {}, help.multiText), multiTable,
      h('p', {}, help.cardsText), h('p', {}, help.seriesText)),
    section('h-repeat', help.repeatTitle, h('p', {}, fill(help.repeatText, { maxRepeats: MAX_REPEATS }))),
    section('h-leitner', help.leitnerTitle,
      h('p', {}, fill(help.leitnerText, { boxes: MASTERED_BOX })), boxes, rulesTable,
      paras(help.leitnerAfter, { boxes: MASTERED_BOX, steps: MASTERED_BOX - 1 })),
    section('h-levels', help.levelsTitle, levels, h('p', {}, help.levelsAfter)),
    section('h-data', help.dataTitle, h('p', {}, help.dataText), h('p', {}, h('a', { href: '#/einstellungen' }, t('nav.settings'))))));
}
