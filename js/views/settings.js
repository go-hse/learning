import { h, icon, appBar } from '../ui.js';
import { t, formatDate } from '../i18n/de.js';
import * as store from '../store.js';
import { dayKey } from '../scoring.js';
import { APP_VERSION } from '../config.js';

const GOAL_MIN = 5;
const GOAL_MAX = 100;
const GOAL_STEP = 5;

export function settings(root, _params, ctx) {
  document.title = `${t('settings.title')} – ${t('app.title')}`;
  root.append(appBar({ title: t('settings.title'), back: '#/', backLabel: t('nav.home') }));
  const main = h('main', { class: 'screen settings', id: 'main' });
  root.append(main);
  let s = store.getSettings();

  // Tagesziel
  const goalInput = h('input', {
    type: 'number', id: 'goal', inputmode: 'numeric', min: GOAL_MIN, max: GOAL_MAX, step: 1, value: s.dailyGoal,
    'aria-describedby': 'goal-help',
    onchange: () => setGoal(Number(goalInput.value)),
  });
  const setGoal = (v) => {
    const goal = Math.min(GOAL_MAX, Math.max(GOAL_MIN, Math.round(Number.isFinite(v) ? v : 20)));
    s = store.saveSettings({ dailyGoal: goal });
    goalInput.value = goal;
  };
  main.append(h('section', { class: 'setting' },
    h('h2', { class: 'section-title' }, h('label', { for: 'goal' }, t('settings.goal'))),
    h('p', { class: 'muted', id: 'goal-help' }, t('settings.goalHelp')),
    h('div', { class: 'stepper' },
      h('button', { type: 'button', class: 'iconbtn iconbtn-outline', 'aria-label': t('settings.goalLess'), onclick: () => setGoal(Math.ceil(s.dailyGoal / GOAL_STEP) * GOAL_STEP - GOAL_STEP) }, icon('minus')),
      goalInput,
      h('button', { type: 'button', class: 'iconbtn iconbtn-outline', 'aria-label': t('settings.goalMore'), onclick: () => setGoal(Math.floor(s.dailyGoal / GOAL_STEP) * GOAL_STEP + GOAL_STEP) }, icon('plus')),
      h('span', { class: 'muted' }, t('settings.goalUnit')))));

  // Sichern
  const status = h('p', { class: 'status', role: 'status' });
  const lastExport = h('p', { class: 'muted' });
  const showLast = () => { lastExport.textContent = t('settings.lastExport', { when: s.lastExport ? formatDate(s.lastExport) : t('home.backupNever') }); };
  showLast();
  const fileInput = h('input', { type: 'file', id: 'import-file', accept: 'application/json,.json', class: 'visually-hidden', onchange: () => importFile() });
  const modeName = 'import-mode';
  const radio = (value, label, help, checked) => h('label', { class: 'choice' },
    h('input', { type: 'radio', name: modeName, value, checked }),
    h('span', {}, h('span', { class: 'choice-label' }, label), h('span', { class: 'muted choice-help' }, help)));

  main.append(h('section', { class: 'setting' },
    h('h2', { class: 'section-title' }, t('settings.backup')),
    h('p', { class: 'muted' }, t('settings.backupHelp')),
    lastExport,
    h('button', { type: 'button', class: 'btn btn-primary btn-block', onclick: exportFile }, t('settings.export')),
    h('fieldset', { class: 'import' },
      h('legend', {}, t('settings.import')),
      radio('merge', t('settings.importMerge'), t('settings.importMergeHelp'), true),
      radio('replace', t('settings.importReplace'), t('settings.importReplaceHelp'), false),
      fileInput,
      h('label', { for: 'import-file', class: 'btn btn-block' }, t('settings.chooseFile'))),
    status));

  async function exportFile() {
    const versions = Object.fromEntries([...ctx.state.catalogs.values()].map((c) => [c.catalog.id, c.catalog.version]));
    const json = JSON.stringify(store.exportData(versions), null, 1);
    const name = `lerntrainer-backup-${dayKey(Date.now())}.json`;
    const file = new File([json], name, { type: 'application/json' });
    const done = () => { s = store.saveSettings({ lastExport: Date.now() }); showLast(); status.textContent = t('settings.exported'); };
    if (matchMedia('(pointer: coarse)').matches && navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ files: [file], title: name }); done(); return; } catch (e) { if (e?.name === 'AbortError') return; }
    }
    const url = URL.createObjectURL(file);
    const a = h('a', { href: url, download: name, class: 'visually-hidden' });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    done();
  }

  async function importFile() {
    const file = fileInput.files?.[0];
    if (!file) return;
    const mode = main.querySelector(`input[name="${modeName}"]:checked`)?.value ?? 'merge';
    status.classList.remove('is-error');
    try {
      const data = JSON.parse(await file.text());
      const err = store.validateBackup(data);
      if (err) throw new Error(err);
      const r = store.importData(data, mode);
      s = store.getSettings();
      goalInput.value = s.dailyGoal;
      status.textContent = t('settings.imported', r);
    } catch (e) {
      const key = ['format', 'version', 'events'].includes(e?.message) ? e.message : 'read';
      status.textContent = t(`settings.importError.${key}`);
      status.classList.add('is-error');
    } finally {
      fileInput.value = '';
    }
  }

  // Installieren
  main.append(h('section', { class: 'setting' },
    h('h2', { class: 'section-title' }, t('settings.install')),
    h('p', {}, t('settings.installWhy')),
    h('ul', { class: 'plain' }, h('li', {}, t('settings.installIos')), h('li', {}, t('settings.installAndroid')))));

  // Für Lehrende
  main.append(h('section', { class: 'setting' },
    h('h2', { class: 'section-title' }, t('settings.lecturer')),
    h('label', { class: 'switch' },
      h('input', { type: 'checkbox', role: 'switch', checked: s.showDrafts, onchange: (e) => { s = store.saveSettings({ showDrafts: e.target.checked }); } }),
      h('span', {}, h('span', { class: 'choice-label' }, t('settings.drafts')), h('span', { class: 'muted choice-help' }, t('settings.draftsHelp'))))));

  // Löschen
  const resetArea = h('div', { class: 'reset' });
  const resetStatus = h('p', { class: 'status', role: 'status' });
  const showReset = () => resetArea.replaceChildren(
    h('button', { type: 'button', class: 'btn btn-danger-outline', onclick: confirmReset }, t('settings.reset')));
  const confirmReset = () => {
    resetArea.replaceChildren(
      h('button', { type: 'button', class: 'btn btn-danger', onclick: () => { store.resetAll(); s = store.getSettings(); goalInput.value = s.dailyGoal; showLast(); resetStatus.textContent = t('settings.resetDone'); showReset(); } }, t('settings.resetConfirm')),
      h('button', { type: 'button', class: 'btn', onclick: showReset }, t('settings.resetCancel')));
    resetArea.querySelector('button').focus();
  };
  showReset();
  main.append(h('section', { class: 'setting' },
    h('h2', { class: 'section-title' }, t('settings.reset')),
    h('p', { class: 'muted' }, t('settings.resetHelp')),
    resetArea, resetStatus));

  // Über
  main.append(h('section', { class: 'setting about' },
    h('h2', { class: 'section-title' }, t('settings.about')),
    [...ctx.state.catalogs.values()].map((c) => h('p', { class: 'muted' }, t('settings.catalogVersion', { title: c.catalog.title, version: c.catalog.version }))),
    h('p', { class: 'muted' }, t('settings.appVersion', { version: APP_VERSION }))));
}
