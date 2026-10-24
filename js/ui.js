// Kleine Hilfen zum Aufbau der Oberfläche. Inhalte werden nur als Text eingesetzt (NF-04).

import { t } from './i18n/de.js';
import { highlight } from './highlight.js';

export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs ?? {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (v === true) el.setAttribute(k, '');
    else el.setAttribute(k, String(v));
  }
  for (const c of children.flat(Infinity)) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : String(c));
  }
  return el;
}

const SVG_NS = 'http://www.w3.org/2000/svg';
const ICONS = {
  back: [['path', { d: 'M15 5l-7 7 7 7' }]],
  close: [['path', { d: 'M6 6l12 12M18 6L6 18' }]],
  check: [['path', { d: 'M5 12.5l4.5 4.5L19 7.5' }]],
  cross: [['path', { d: 'M7 7l10 10M17 7L7 17' }]],
  partial: [['path', { d: 'M6 12h12' }]],
  minus: [['path', { d: 'M6 12h12' }]],
  plus: [['path', { d: 'M12 6v12M6 12h12' }]],
  gear: [
    // Zahnrad nach Lucide (ISC-Lizenz)
    ['path', { d: 'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z' }],
    ['circle', { cx: 12, cy: 12, r: 3 }],
  ],
  flame: [['path', { d: 'M12 21c-3.9 0-6.5-2.6-6.5-6.2 0-3.4 2.4-5.2 3.6-8.3.4 2 1.6 3.1 2.6 3.6.3-2.6 1.5-5.1 3.6-7.1-.2 3.1 3.2 5.7 3.2 10.1 0 5.3-2.6 7.9-6.5 7.9z' }]],
};

export function icon(name, cls = 'icon') {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('class', cls);
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  for (const [tag, attrs] of ICONS[name] ?? []) {
    const el = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
    svg.append(el);
  }
  return svg;
}

export function appBar({ title, back = null, backLabel = t('nav.back'), end = null }) {
  return h('header', { class: 'appbar' },
    back
      ? h('a', { class: 'iconbtn', href: back, 'aria-label': backLabel }, icon('back'))
      : h('span', { class: 'appbar-spacer', 'aria-hidden': 'true' }),
    h('h1', { class: 'appbar-title' }, title),
    end ?? h('span', { class: 'appbar-spacer', 'aria-hidden': 'true' }));
}

const pct = (part, total) => (total ? `${Math.round((part / total) * 1000) / 10}%` : '0%');

export function progressBar({ total, seen, mastered }) {
  const seenBar = h('span', { class: 'bar-seen' });
  const masteredBar = h('span', { class: 'bar-mastered' });
  seenBar.style.width = pct(seen, total);
  masteredBar.style.width = pct(mastered, total);
  return h('span', { class: 'bar', role: 'img', 'aria-label': t('progress.label', { seen, total, mastered }) }, seenBar, masteredBar);
}

export function codeBlock({ lang, text }) {
  return h('pre', { class: `code lang-${lang}`, tabindex: '0', 'aria-label': `Code (${lang.toUpperCase()})` },
    h('code', {}, highlight(text, lang)));
}

export const prefersReducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function scrollIntoViewIfNeeded(el) {
  el.scrollIntoView({ block: 'nearest', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
}
