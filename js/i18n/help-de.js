// Texte der Hilfe-Seite (Deutsch). Zahlen werden in views/help.js aus der Logik der App eingesetzt.

export const help = {
  title: 'Hilfe',
  intro: 'So funktionieren Tagesziel, Punkte und Lernfortschritt im Lerntrainer.',

  dayTitle: 'Tagesziel und Streak',
  dayText: [
    'Dein Tagesziel sind {goal} beantwortete Fragen pro Tag. Du kannst es in den Einstellungen ändern.',
    'Jede beantwortete Frage zählt – auch falsche Antworten, Wiederholungen und Lernkarten.',
    'Die Streak zählt, an wie vielen Tagen in Folge du dein Tagesziel erreicht hast. Ein Tag endet um Mitternacht.',
    'Solange der heutige Tag läuft, bleibt deine Streak erhalten. Sie fällt erst auf 0, wenn ein ganzer Tag ohne erreichtes Tagesziel vorbei ist.',
  ],

  pointsTitle: 'Punkte',
  pointsText: [
    'Punkte gibt es für Multiple-Choice-Fragen. Wie viele, hängt davon ab, wie schwer die Frage ist und wie oft du sie schon beantwortet hast: Beim ersten Mal gibt es am meisten, danach jedes Mal weniger.',
    'Bei jeder Frage siehst du oben, wie viele Punkte sie gerade noch wert ist.',
  ],
  pointsTableCaption: 'Punkte je Antwort',
  pointsTableEncounter: 'Antwort',
  pointsTableNth: '{n}. Mal',
  pointsTableNthPlus: 'ab {n}. Mal',
  level: { 1: 'Stufe 1: Grundlagen', 2: 'Stufe 2: Anwenden', 3: 'Stufe 3: Transfer' },
  levelShort: { 1: 'Stufe 1', 2: 'Stufe 2', 3: 'Stufe 3' },
  malusCol: 'falsch',
  pointsTableLegend: 'Spalten „Stufe 1–3“: Punkte für eine richtige Antwort. Spalte „falsch“: Abzug für eine falsche Antwort, für alle Stufen gleich.',
  pointsAfter: [
    'Beim ersten Versuch kostet eine falsche Antwort nichts. Wer eine Frage danach immer noch falsch beantwortet, verliert Punkte – höchstens {maxMalus} pro Antwort.',
    'Dein Punktestand fällt nie unter 0.',
  ],
  multiTitle: 'Mehrfachauswahl: Teilpunkte',
  multiText: 'Sind mehrere Antworten richtig, zählt jede richtig gewählte Antwort, jede falsch gewählte wird abgezogen. Alles anzukreuzen lohnt sich also nicht. Beispiel mit 2 richtigen von 4 Antworten, Stufe 1, erster Versuch:',
  multiExamples: [
    ['beide richtigen gewählt', 'richtig', 10],
    ['nur eine richtige gewählt', 'teilweise richtig', 5],
    ['beide richtigen und eine falsche', 'teilweise richtig', 5],
    ['eine richtige und eine falsche', 'falsch', 0],
    ['alle vier gewählt', 'falsch', 0],
  ],
  multiHead: ['Auswahl', 'Ergebnis', 'Punkte'],
  cardsText: 'Lernkarten und Code-Aufgaben bewertest du selbst („Gewusst“, „Teilweise“, „Nicht gewusst“). Dafür gibt es keine Punkte, sie zählen aber zum Tagesziel und zum Lernfortschritt.',
  seriesText: '„Richtig in Folge“ zählt deine richtigen Multiple-Choice-Antworten hintereinander. Eine falsche oder nur teilweise richtige Antwort setzt die Serie auf 0; Lernkarten zählen hier nicht.',

  repeatTitle: 'Wiederholung in einer Runde',
  repeatText: 'Beantwortest du eine Frage falsch oder nur teilweise richtig, kommt sie in derselben Runde nach 3 bis 5 anderen Fragen noch einmal – höchstens {maxRepeats}-mal. Richtig beantwortete Fragen kommen in dieser Runde nicht wieder.',

  leitnerTitle: 'Lernfortschritt: das Leitner-System',
  leitnerText: 'Jede Frage liegt in einem von {boxes} Fächern. Das Fach zeigt, wie sicher du sie beherrschst.',
  leitnerBox: 'Fach {n}',
  leitnerStart: 'Start',
  leitnerMastered: 'beherrscht',
  leitnerRules: [
    ['Richtig oder „Gewusst“', 'ein Fach höher'],
    ['Teilweise richtig oder „Teilweise“', 'bleibt im selben Fach'],
    ['Falsch oder „Nicht gewusst“', 'zurück in Fach 1'],
  ],
  leitnerRulesHead: ['Antwort', 'Die Frage …'],
  leitnerAfter: [
    'Beherrscht ist eine Frage in Fach {boxes}. Dafür musst du sie {steps}-mal richtig beantworten, ohne dass dazwischen eine falsche Antwort kommt. Eine spätere falsche Antwort wirft sie wieder zurück.',
    'Weil richtige Fragen in derselben Runde nicht wiederkommen, steigt eine Frage pro Runde höchstens ein Fach auf. Bis „beherrscht“ brauchst du also mehrere Runden – das ist gewollt: Wiederholen mit Abstand prägt sich besser ein.',
    'In der Kapitelübersicht steht bei jedem Abschnitt, wie viele Fragen zuletzt richtig waren (letzte Antwort richtig oder „Gewusst“) und wie viele beherrscht sind.',
  ],

  levelsTitle: 'Schwierigkeitsstufen',
  levelsText: [
    ['Stufe 1: Grundlagen', 'Begriffe und Fakten wiedergeben'],
    ['Stufe 2: Anwenden', 'eine Regel auf ein konkretes Beispiel anwenden'],
    ['Stufe 3: Transfer', 'mehrere Konzepte kombinieren, Fehler finden, begründen'],
  ],
  levelsAfter: 'In einer Runde kommen die Fragen von Stufe 1 bis Stufe 3.',

  dataTitle: 'Deine Daten',
  dataText: 'Antworten, Punkte und Einstellungen werden nur in diesem Browser gespeichert. Sichere deinen Lernstand in den Einstellungen als Datei, um ihn auf ein anderes Gerät zu übertragen oder nach dem Löschen der Browserdaten wiederherzustellen.',
};

export function fill(s, vars = {}) {
  return s.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
}
