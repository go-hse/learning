# Lerntrainer – Spezifikation v2

Stand: 23.10.2026 · Vorgänger: `lerntrainer-spec-v1.md`, Review: `lerntrainer-spec-v1-review.md`

## 1. Ziel und Zielgruppe

Eine Lernkarten-SPA, mit der Studierende den Stoff einer Vorlesung täglich in kleinen Einheiten üben
(Ziel: 20 Fragen pro Tag). Erste Zielgruppe: Studierende der Vorlesung *Internet-Technologien*
(Hochschule Esslingen). **Hauptgerät ist das Smartphone**, der Desktop wird ebenfalls unterstützt. Startinhalt: Kapitel **CSS**.

**Sprache:** Oberfläche und alle Fragen sind zunächst auf **Deutsch**. Ab App-Version 2.0 ist die Sprache zwischen Deutsch und Englisch umschaltbar (siehe 7.4).

Die App läuft komplett im Browser, ohne Server und ohne Konto. Alle Lerndaten bleiben auf dem Gerät.

## 2. Begriffe

| Begriff | Bedeutung |
|---|---|
| Katalog | Eine JSON-Datei mit allen Fragen eines Fachs |
| Kapitel / Sektion | Gliederung des Katalogs, entspricht der Gliederung des Vorlesungsskripts |
| Frage | Eine Lerneinheit mit stabiler ID |
| Präsentation | Eine einzelne Anzeige einer Frage samt Antwort. Jede Präsentation wird genau einmal beantwortet |
| Begegnungsnummer `n` | Wie oft der Lernende diese Frage insgesamt gesehen hat, die aktuelle Präsentation mitgezählt (1, 2, 3, …), über alle Sitzungen und Geräte hinweg |
| Sitzung | Eine zusammenhängende Übungsrunde in einem Modus |
| Leitner-Fach | Lernstand einer Frage, Fach 1 (neu/unsicher) bis 5 (beherrscht) |
| Tagesziel | 20 beantwortete Präsentationen pro Kalendertag (einstellbar) |
| Streak | Anzahl aufeinanderfolgender Tage mit erreichtem Tagesziel |
| Serie | Anzahl aufeinanderfolgender richtiger Antworten |

## 3. User Stories

- **US-1** Als Studentin wähle ich ein Fach und ein Kapitel und übe die Fragen von leicht nach schwer.
- **US-2** Als Student übe ich im Mix-Modus gemischt alles, was ich schon gesehen habe. Fragen, die ich oft falsch beantworte, kommen öfter.
- **US-3** Nach jeder Antwort sehe ich sofort, ob sie richtig war, die richtige Lösung und eine Erklärung.
- **US-4** Ich sehe, wie viele Fragen mir heute noch zum Tagesziel fehlen und wie lang meine Streak ist.
- **US-5** Ich sehe, welche Fragen ich besonders oft falsch beantworte, und kann genau diese üben.
- **US-6** Ich exportiere meinen Lernstand und importiere ihn auf einem anderen Gerät.
- **US-7** Ich lade einen eigenen Fragenkatalog hoch.
- **US-8** Ich übe offline, z. B. in der Bahn.

## 4. Fragetypen

| Typ | Beschreibung | Bewertung | Quelle im Material | Stufe |
|---|---|---|---|---|
| `mc-single` | Genau eine richtige Option | automatisch, Punkte | ARS-JSON | MVP |
| `mc-multi` | Mehrere richtige Optionen | automatisch, **Teilpunkte** | ARS-JSON (`multiple: true`) | MVP |
| `flashcard` | Begriff erläutern: Begriff wird gezeigt, nach Aufdecken die Definition | Selbsteinschätzung, keine Punkte | `glossar.md` | MVP |
| `code-task` | Aufgabe mit Code, z. B. „Wie muss das HTML aussehen?“, Musterlösung zum Aufdecken | Selbsteinschätzung, keine Punkte | `16-Review-Questions-*.md` | MVP |
| `term-mc` | Definition wird gezeigt, Begriff auswählen; Ablenker = andere Begriffe derselben Sektion | automatisch, Punkte (wie `mc-single`) | aus dem Glossar generiert | v1.1 |

Jede Frage hat einen **Schwierigkeitsgrad** (Eigenschaft, kein Typ):

| Stufe | Bedeutung |
|---|---|
| 1 | Grundlagen: Begriffe, Fakten wiedergeben |
| 2 | Anwenden: Regel auf ein konkretes Beispiel anwenden |
| 3 | Transfer: mehrere Konzepte kombinieren, Fehler finden, begründen |

## 5. Funktionale Anforderungen

### 5.1 Fach- und Kapitelwahl

**F-01 Fachwahl.** Die Startseite listet alle Kataloge aus `catalogs/index.json` und alle hochgeladenen Kataloge.
*Akzeptanz:* Nach Auswahl eines Fachs erscheint dessen Kapitelliste mit Fortschritt pro Kapitel.

**F-02 Kapitelmodus.** Der Lernende wählt ein Kapitel (optional eine Sektion). Die Sitzung enthält alle freigegebenen
Fragen des Kapitels, sortiert nach Schwierigkeit 1 → 3; innerhalb einer Stufe zufällig gemischt.
Alle Stufen sind sofort verfügbar.
*Akzeptanz:* Keine Frage der Stufe 2 erscheint, bevor alle Fragen der Stufe 1 der Sitzung präsentiert wurden
(Wiederholungen nach F-11 ausgenommen).

**F-03 Mix-Modus.** Zieht aus allen bereits mindestens einmal präsentierten Fragen des Fachs, gewichtet nach
Leitner-Fach (siehe 6.3). Eine Sitzung umfasst standardmäßig 20 Präsentationen.

**F-04 Modus „Problemfragen“.** Übt die Fragen mit der höchsten Fehlerquote (siehe F-30), Aufruf aus der Statistik.

**F-05 Sitzung beenden.** Eine Sitzung kann jederzeit beendet werden; alle bis dahin gegebenen Antworten sind gespeichert.
Nach dem Neuladen der Seite wird eine laufende Sitzung an derselben Frage fortgesetzt.

### 5.2 Beantworten und Feedback

**F-10 Eine Antwort pro Präsentation.** Jede Präsentation wird genau einmal beantwortet; einen zweiten Versuch
direkt danach gibt es nicht.
- `mc-single`: Auswahl einer Option, dann „Prüfen“.
- `mc-multi`: Auswahl einer oder mehrerer Optionen (mindestens eine), dann „Prüfen“. Der Hinweis „Mehrfachauswahl“ ist sichtbar.
- `flashcard` / `code-task`: „Lösung zeigen“, danach Selbsteinschätzung *gewusst / teilweise / nicht gewusst*.

**F-11 Feedback.** Nach dem Beantworten zeigt die App immer:
1. das Ergebnis (richtig / teilweise richtig / falsch) und die erhaltenen Punkte,
2. die richtige Lösung: Bei MC werden richtige Optionen markiert, falsch gewählte Optionen gesondert hervorgehoben,
3. die Erklärung (`explanation`) und, falls vorhanden, einen Verweis auf die Skript-Sektion.

Erst mit „Weiter“ kommt die nächste Präsentation.
*Akzeptanz:* Es gibt keinen Weg zur nächsten Frage, ohne dass die Lösung angezeigt wurde.

**F-12 Antwortreihenfolge.** Optionen werden bei jeder Präsentation neu gemischt, außer die Frage hat `shuffle: false`.

**F-13 Wiederholung in der Sitzung.** Eine Präsentation mit dem Ergebnis *falsch*, *teilweise* oder *nicht gewusst*
wird in derselben Sitzung nach 3–5 anderen Präsentationen (zufällig) erneut eingereiht, höchstens 3-mal pro Sitzung
und Frage. Sind weniger als 3 Präsentationen übrig, wird sie ans Ende gestellt. Gilt in allen Modi.

**F-14 Bedienung.** Primär per Touch (siehe Kapitel 10). Auf dem Desktop zusätzlich per Tastatur: Tasten `1`–`9` wählen Optionen, `Enter` prüft bzw. geht weiter, `Leertaste` deckt Lernkarten auf.

### 5.3 Punkte, Tagesziel, Streak, Serie

**F-20 Punkte** nach 6.1. Gesamtpunkte und Punkte pro Kapitel werden angezeigt; in der Sitzung steht der aktuelle Punktestand in der Kopfzeile, und bei jeder Frage wird angezeigt, wie viele Punkte sie noch wert ist. Der Gesamtstand fällt nicht unter 0.

**F-21 Tagesziel.** Jede beantwortete Präsentation zählt: richtig, teilweise und falsch, Wiederholungen derselben Frage
und Lernkarten mit Selbsteinschätzung. Standard 20, einstellbar (5–100). Tagesgrenze ist lokale Mitternacht.
Die Startseite zeigt den Fortschritt, z. B. „13 / 20 heute“.

**F-22 Streak** nach 6.2.

**F-23 Serie.** Zählt aufeinanderfolgende Präsentationen mit dem Ergebnis *richtig* (nur automatisch bewertete Typen).
*Teilweise* und *falsch* setzen sie auf 0. Selbsteinschätzungen beeinflussen die Serie nicht.
Aktuelle Serie und Bestwert werden angezeigt.

### 5.4 Statistiken

**F-30 Problemfragen.** Liste der Fragen mit der höchsten Fehlerquote (falsch + teilweise / Präsentationen),
nur Fragen mit mindestens 3 Präsentationen.
**F-31 Fortschritt pro Kapitel/Sektion:** gesamt / zuletzt richtig (letzte Antwort richtig oder „gewusst“) / beherrscht (Leitner-Fach 5, also 4-mal in Folge richtig). Die Bedeutung von „beherrscht“ wird in der Kapitelübersicht erklärt.
**F-32 Verlauf:** beantwortete Präsentationen pro Tag (Kalender der letzten 12 Wochen), Trefferquote pro Woche.
**F-33 Kennzahlen:** Streak (aktuell / Bestwert), Serie (aktuell / Bestwert), Gesamtpunkte.

### 5.5 Kataloge

**F-40 Gehostete Kataloge** unter `catalogs/` im Repo, gelistet in `catalogs/index.json`.
**F-41 Upload** einer Katalog-JSON. Die Datei wird gegen das Schema (7.1) geprüft; Fehler werden mit Pfad angezeigt
(z. B. `questions[12].options: mindestens 2 Einträge`). Bei gleicher Katalog-ID: Ersetzen oder Abbrechen.
**F-42 Katalog-Updates.** Eine neue Version eines gehosteten Katalogs wird beim Start erkannt und geladen. Die Lernhistorie
bleibt erhalten (stabile IDs). Fragen, die es nicht mehr gibt, werden in Statistiken ausgeblendet, aber nicht gelöscht.

### 5.6 Export und Import

**F-50 Export** des gesamten Lernstands als JSON-Datei (`lerntrainer-backup-YYYY-MM-DD.json`), Format 7.3.
Auf Smartphones wird, wo verfügbar, das Teilen-Menü genutzt (`navigator.share` mit Datei), damit die Datei z. B. in Dateien/Nextcloud oder per Messenger auf das andere Gerät kommt. Sonst: Download über einen Link mit `download`-Attribut.
**F-51 Import** mit Wahl zwischen **Zusammenführen** (Standard) und **Ersetzen**. Zusammenführen bildet die Vereinigung aller
Antwort-Ereignisse (eindeutig über `qid` + `ts`) und berechnet Leitner-Fächer, Streak und Statistiken daraus neu.
*Akzeptanz:* Zweimal dieselbe Datei importieren ändert nichts.
**F-52 Backup-Erinnerung.** Gab es 14 Tage keinen Export, zeigt die Startseite einen dezenten Hinweis.

## 6. Algorithmen

### 6.1 Punkte

`n` = Begegnungsnummer der Frage (1, 2, 3, …), Wiederholungen in derselben Sitzung mitgezählt.

`w` = Gewicht nach Schwierigkeitsgrad: Stufe 1 → 1, Stufe 2 → 1,5, Stufe 3 → 2.

```
Bonus(n) = round(w · max(0, 10 − 2·(n − 1)))
Malus(n) = −min(5, n − 1)
```

| Begegnung n | 1 | 2 | 3 | 4 | 5 | ≥ 6 |
|---|---|---|---|---|---|---|
| Bonus Stufe 1 | 10 | 8 | 6 | 4 | 2 | 0 |
| Bonus Stufe 2 | 15 | 12 | 9 | 6 | 3 | 0 |
| Bonus Stufe 3 | 20 | 16 | 12 | 8 | 4 | 0 |
| Malus (alle Stufen) | 0 | −1 | −2 | −3 | −4 | −5 |

Das Gewicht gilt nur für den Bonus. Der Malus ist für alle Stufen gleich, damit schwere Fragen nicht abschrecken.

**`mc-single` / `term-mc`:** richtig → `Bonus(n)`, falsch → `Malus(n)`.

**`mc-multi` (Teilpunkte):**
```
k = Anzahl richtiger Optionen
r = Anzahl gewählter richtiger Optionen
f = Anzahl gewählter falscher Optionen
q = max(0, (r − f) / k)

q = 1      → Ergebnis „richtig“,   Punkte = Bonus(n)
0 < q < 1  → Ergebnis „teilweise“, Punkte = round(Bonus(n) · q)   (Bonus schon gewichtet)
q = 0      → Ergebnis „falsch“,    Punkte = Malus(n)
```

Beispiele (4 Optionen, davon k = 2 richtig, Begegnung n = 1, Schwierigkeitsstufe 1):

| Auswahl | r | f | q | Ergebnis | Punkte |
|---|---|---|---|---|---|
| beide richtigen | 2 | 0 | 1 | richtig | 10 |
| eine richtige | 1 | 0 | 0,5 | teilweise | 5 |
| beide richtigen + eine falsche | 2 | 1 | 0,5 | teilweise | 5 |
| eine richtige + eine falsche | 1 | 1 | 0 | falsch | 0 |
| alle vier | 2 | 2 | 0 | falsch | 0 |

Durch den Abzug für falsch gewählte Optionen lohnt es sich nicht, einfach alles anzukreuzen.

**`flashcard` / `code-task`:** keine Punkte.

### 6.2 Streak

- Ein Tag ist **erfüllt**, wenn an ihm mindestens so viele Präsentationen beantwortet wurden, wie das Tagesziel verlangt.
- Streak = Anzahl erfüllter Tage in ununterbrochener Folge, rückwärts gezählt ab heute.
- **Ist heute noch nicht erfüllt, gilt die Streak noch nicht als gebrochen:** Dann wird ab gestern gezählt.
  Erst wenn ein Tag ohne erfülltes Ziel vorbei ist, fällt die Streak auf 0.
- Maßgeblich ist das Tagesziel, das an dem jeweiligen Tag eingestellt war (wird pro Tag mitgespeichert).

### 6.3 Leitner-System

| Ereignis | Wirkung auf das Fach |
|---|---|
| erste Präsentation einer Frage | startet in Fach 1, danach gilt die Regel für das Ergebnis |
| richtig / gewusst | Fach + 1 (höchstens 5) |
| teilweise | Fach bleibt |
| falsch / nicht gewusst | zurück auf Fach 1 |

- Auswahl im Mix-Modus: gewichtete Zufallsauswahl, Gewicht Fach 1 : 2 : 3 : 4 : 5 = 16 : 8 : 4 : 2 : 1.
  Dieselbe Frage erscheint nicht zweimal direkt hintereinander.
- „Beherrscht“ = Fach 5.
- Fächer gelten in allen Modi und werden aus der Ereignishistorie berechnet. So bleiben sie nach einem Import konsistent.
- Ausbaustufe (nicht v2): Fälligkeitsdatum pro Fach (echtes Spaced Repetition), ohne Änderung am Datenmodell.

## 7. Datenmodell

### 7.1 Katalog

```json
{
  "schemaVersion": 1,
  "catalog": { "id": "inet-tech", "title": "Internet-Technologien", "version": "2026.10.1", "lang": "de" },
  "chapters": [
    { "id": "css", "title": "CSS", "order": 4,
      "sections": [ { "id": "css-selectors", "title": "Selektoren", "source": "04-CSS/02-Selectors.md" } ] }
  ],
  "questions": [
    {
      "id": "css-sel-specificity-01",
      "chapter": "css",
      "section": "css-selectors",
      "type": "mc-single",
      "difficulty": 2,
      "status": "freigegeben",
      "prompt": "Welche Farbe hat der Text von `<p id=\"main\" class=\"alert\">`?",
      "code": { "lang": "css", "text": "#main  { color: green; }\n.alert { color: red; }\np      { color: blue; }" },
      "options": [
        { "text": "rot" },
        { "text": "blau" },
        { "text": "grün", "correct": true },
        { "text": "schwarz (Browser-Standard)" }
      ],
      "shuffle": true,
      "explanation": "#main hat die Spezifität 1-0-0 und schlägt .alert (0-1-0) und p (0-0-1).",
      "tags": ["spezifität", "kaskade"]
    }
  ]
}
```

Regeln:
- `id` ist stabil und wird nie wiederverwendet. Inhaltliche Korrekturen behalten die ID; eine grundlegend neue Frage bekommt eine neue ID.
- `status`: `entwurf` | `freigegeben`. Die App zeigt nur `freigegeben`.
- `mc-single`: genau eine Option mit `correct: true`; `mc-multi`: mindestens eine; 2–8 Optionen.
- `flashcard`: `prompt` (Begriff) und `answer` (Definition) statt `options`. `code-task`: `prompt`, `code`, `answer` (Musterlösung, optional mit `answerCode`).
- `prompt` und `answer` sind eingeschränktes Markdown: Inline-Code in Backticks, **fett**, Absätze (Leerzeile). Kein Kursiv, weil `*` in CSS-Code häufig vorkommt (`*=`, `* { }`). `options[].text` und `explanation` sind reiner Text. Codeblöcke stehen in `code` / `answerCode` mit Sprachangabe.
- `source` dokumentiert die Herkunft (`ars`, `review`, `glossar`, `neu`) und wird von der App nicht angezeigt.
- Erklärungen dürfen nicht auf Antwortpositionen verweisen („Antwort B“), weil die Optionen gemischt werden.

### 7.2 Lokale Daten

Speicherort: **LocalStorage**, ausschließlich über das Modul `store.js`, damit später ein Wechsel auf IndexedDB möglich ist.
Alle Schlüssel tragen das Präfix `lerntrainer:v1:`, weil sich alle Projektseiten unter `username.github.io`
einen Speicher teilen.

| Schlüssel | Inhalt |
|---|---|
| `lerntrainer:v1:settings` | Tagesziel, Theme, letzter Export |
| `lerntrainer:v1:events:YYYY-MM` | Antwort-Ereignisse eines Monats (Array) |
| `lerntrainer:v1:days` | pro Tag: eingestelltes Tagesziel |
| `lerntrainer:v1:session` | laufende Sitzung (Warteschlange, Position) |
| `lerntrainer:v1:catalog:<id>` | hochgeladene Kataloge |
| `lerntrainer:v1:cache` | abgeleitete Werte (Leitner-Fächer, Zähler); jederzeit aus den Ereignissen neu berechenbar |

Antwort-Ereignis:
```json
{ "qid": "css-sel-specificity-01", "cat": "inet-tech", "ts": 1761230400000,
  "mode": "chapter", "difficulty": 2, "result": "partial", "q": 0.5, "n": 2, "points": 6 }
```
`result`: `correct` | `partial` | `wrong` | `knew` | `partly` | `didnt`.
Die Punkte werden beim Beantworten berechnet und gespeichert. Wird der Schwierigkeitsgrad einer Frage später geändert, bleiben bisherige Punkte unverändert.

Die Ereignisse sind die einzige Quelle der Wahrheit; alles andere wird daraus berechnet.
Größe: etwa 150 Byte pro Ereignis, ein Jahr mit 20 Präsentationen täglich ≈ 1,1 MB.

Beim ersten Start fordert die App `navigator.storage.persist()` an.

### 7.3 Exportformat

```json
{ "format": "lerntrainer-backup", "schemaVersion": 1, "exportedAt": "2026-10-23T16:00:00+02:00",
  "catalogVersions": { "inet-tech": "2026.10.1" },
  "settings": { }, "days": { }, "events": [ ] }
```
Hochgeladene Kataloge sind im Export nicht enthalten.

### 7.4 Vorbereitung auf Deutsch/Englisch (ab App-Version 2.0)

Die Umschaltung kommt erst mit Version 2.0, wird aber schon jetzt so vorbereitet, dass kein Umbau nötig ist:
- **Oberflächentexte** stehen von Anfang an nicht im HTML/JS verstreut, sondern in `js/i18n/de.js` (Schlüssel → Text) und werden über eine Funktion `t('quiz.check')` abgerufen. Für Englisch kommt später `js/i18n/en.js` dazu.
- **Kataloge** gibt es dann je Sprache als eigene Datei mit **denselben Frage-IDs**, z. B. `inet-tech.de.json` und `inet-tech.en.json`. Weil die Historie an der ID hängt, bleibt der Lernstand beim Umschalten erhalten. `catalogs/index.json` listet pro Katalog die verfügbaren Sprachen.
- Datums- und Zahlenformate über `Intl` mit der eingestellten Sprache.

## 8. Architektur

- **SPA:** eine `index.html`, Ansichten werden per JavaScript getauscht.
- **Hash-Routing**, weil GitHub Pages keine Umleitung auf `index.html` bietet:

| Route | Ansicht |
|---|---|
| `#/` | Start: Fachwahl, Tagesziel, Streak |
| `#/fach/:cat` | Kapitelliste mit Fortschritt, Mix-Modus starten |
| `#/fach/:cat/kapitel/:chapter` | Kapitel mit Sektionen, Kapitelmodus starten |
| `#/quiz` | laufende Sitzung (die einzelne Frage hat keine eigene Route) |
| `#/statistik/:cat` | Statistiken |
| `#/einstellungen` | Tagesziel, Export/Import, Katalog-Upload |

- **Module** (ES-Module, kein Build-Schritt):

```
index.html
css/app.css
js/main.js          Start, Router einhängen
js/router.js        hashchange → Ansicht
js/store.js         LocalStorage-Zugriff mit Präfix, Export/Import
js/catalog.js       Kataloge laden, Schema prüfen
js/session.js       Warteschlange, Wiederholung nach 3–5 Fragen
js/leitner.js       Fächer berechnen, gewichtete Auswahl
js/scoring.js       Punkte, Tagesziel, Streak, Serie (reine Funktionen)
js/markdown.js      kleiner, escapender Markdown-Renderer
js/views/*.js       je Ansicht render(container, params)
vendor/             Syntax-Highlighting (lokal abgelegt)
catalogs/index.json
catalogs/inet-tech.json
sw.js, manifest.json
tests/*.test.mjs    node --test
tools/build-catalog.mjs
```

## 9. Nichtfunktionale Anforderungen

- **NF-01 Technik:** Vanilla HTML5, CSS, JavaScript (ES-Module), keine Frameworks, kein Build-Schritt. Einzige Ausnahme: eine lokal abgelegte Bibliothek für Syntax-Hervorhebung.
- **NF-02 Hosting:** GitHub Pages.
- **NF-03 Datenschutz:** keine Server-Kommunikation außer dem Laden der App und der Kataloge; kein Tracking, keine Cookies.
- **NF-04 Sicherheit:** Fragetexte werden nie ungeprüft per `innerHTML` eingesetzt (Fragen enthalten absichtlich HTML-Code, Kataloge können hochgeladen werden). Content-Security-Policy per `<meta>`-Tag.
- **NF-05 Offline und installierbar (MVP):** Service Worker speichert App-Dateien und Kataloge; `manifest.json` macht die App auf dem Startbildschirm installierbar. Grund für das MVP: Auf iOS gilt die 7-Tage-Löschregel von Safari nicht für auf dem Startbildschirm installierte Web-Apps. So ist die Lernhistorie dort deutlich sicherer.
- **NF-06 Smartphone:** Die App muss auf Smartphones vollständig nutzbar sein. Details in Kapitel 10.
- **NF-07 Barrierefreiheit:** vollständig per Tastatur bedienbar, ARIA-Rollen, Kontrast nach WCAG 2.2 AA; richtig/falsch nicht nur über Farbe kennzeichnen.
- **NF-08 Browser:** aktuelle Versionen von Chrome, Firefox, Safari, Edge auf dem Desktop; Safari auf iOS/iPadOS (aktuelle und Vorgängerversion) und Chrome auf Android.
- **NF-09 Tests:** `scoring.js`, `leitner.js`, `session.js` und Import-Zusammenführung mit `node --test`, inklusive der Beispieltabellen aus Kapitel 6.

## 10. Smartphone

Die meisten Übungen finden voraussichtlich auf dem Handy statt (20 Fragen am Tag, unterwegs). Darum wird
**mobile-first** entworfen: erst die Smartphone-Ansicht, dann die Erweiterung für große Bildschirme.

**M-01 Layout.** Einspaltig ab 320 px Breite, ohne horizontales Scrollen der Seite. `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`; Zoomen bleibt erlaubt. Ab etwa 768 px wird der Inhalt zentriert mit begrenzter Breite (ca. 40 rem) dargestellt.

**M-02 Touch-Bedienung.** Alle Bedienelemente sind mindestens 44 × 44 px groß und haben mindestens 8 px Abstand. Antwortoptionen sind ganzseitig breite Schaltflächen; die ganze Fläche ist antippbar. Nichts hängt von Hover ab.

**M-03 Daumenbereich.** Die Hauptschaltfläche („Prüfen“, „Weiter“, „Lösung zeigen“) sitzt fest am unteren Bildschirmrand und berücksichtigt den Home-Indikator (`env(safe-area-inset-bottom)`). „Prüfen“ ist deaktiviert, solange nichts ausgewählt ist; ein Doppeltipp überspringt nie versehentlich das Feedback.

**M-04 Code-Darstellung.** Codeblöcke in Fragen und Lösungen: Monospace-Schrift, mindestens 14 px, kein automatischer Zeilenumbruch, stattdessen horizontal scrollbar nur innerhalb des Codeblocks. Schriftgrößen in `rem`, damit die Systemeinstellung für Textgröße wirkt.

**M-05 Feedback lesbar.** Nach „Prüfen“ scrollt die Ansicht so, dass das Ergebnis sichtbar ist; lange Erklärungen sind scrollbar, ohne dass die Schaltfläche „Weiter“ verschwindet.

**M-06 Hoch- und Querformat.** Primär Hochformat; Querformat funktioniert ohne abgeschnittene Inhalte.

**M-07 Performance.** Erster Aufruf über Mobilfunk (Fast 3G) in unter 3 s nutzbar; App-Dateien zusammen unter 150 KB (gzip), ohne Katalog. Keine Schriftarten von externen Servern, Systemschriften verwenden.

**M-08 Installation.** Manifest mit Name, Icons (192 px, 512 px, maskable), `display: standalone`, Theme-Farbe; `apple-touch-icon` für iOS. Auf der Einstellungsseite ein kurzer Hinweis, wie man die App auf iOS („Teilen → Zum Home-Bildschirm“) und Android installiert.

**M-09 Import auf dem Handy.** Import über `<input type="file" accept="application/json,.json">`, damit die Datei aus Dateien/Nextcloud oder einem Download gewählt werden kann.

**M-10 Testgeräte.** Jede Version wird vor dem Deployment geprüft auf: iPhone mit Safari (auch als installierte App), Android-Smartphone mit Chrome, schmaler Bildschirm 320 px in den Entwicklertools.
*Akzeptanz:* Eine komplette Sitzung mit 20 Fragen (alle Fragetypen), Export und Import gelingen auf beiden Geräten nur mit dem Daumen, ohne Zoomen.

## 11. Content-Pipeline

1. `tools/build-catalog.mjs` liest das Material:
   - ARS-JSON (`*-ars.json`): `ars.question` → `prompt`, `ars.answers` → `options`, „Richtige Position: B, D“ aus `notes` → `correct`, übrige `notes` → `explanation`, `multiple` → `mc-multi`, Code-Inhalt der Folie → `code`
   - `glossar.md` → `flashcard`
   - `16-Review-Questions-*.md` → `code-task` (Lecturer-Hinweis als Musterlösung); die englischen Fragetexte werden ins Deutsche übersetzt, Code bleibt unverändert
2. Zuordnung zur Sektion über den Dateinamen (`02-selectors-ars.json` → `css-selectors`).
3. Erzeugte Fragen haben `status: entwurf`. Schwierigkeitsgrad und Freigabe werden redaktionell gesetzt.
4. Eine GitHub Action prüft den Katalog gegen das Schema, bevor deployt wird.

Inhaltliche Regeln:
- **Mindestens 50 % Fragen mit Punkten** (`mc-single`, `mc-multi`, `term-mc`) in jedem Abschnitt; Entwürfe zählen mit. Das Erzeugungs-Skript bricht sonst ab.
- **Keine Fragen zur Geschichte** von CSS (Versionen, Jahreszahlen der Standardisierung).
- **Fragenspeicher:** Fragen zu Themen, die in der Vorlesung noch nicht ausführlich behandelt wurden (derzeit Modularisierung, Nesting, `@layer`), werden zurückgestellt (`fragenspeicher` in `css-overrides.json`). Sie stehen nicht im Katalog der App, bleiben aber in `tools/content/css-fragenspeicher.json` erhalten.

Material: `05-Hochschule/0505-ModuleVorlesungen/02_InternetTechnologien/Vorlesungsskript`.
Umfang CSS (Stand Oktober 2026): 61 MC-Fragen, 65 Glossarbegriffe, rund 15 Code-Aufgaben.

## 12. Nicht im Umfang

Benutzerkonten, Server-Synchronisation, Ranglisten, Fragen-Editor in der App, KI-Bewertung von Freitext, Statistik-Export für Lehrende.

## 13. Meilensteine

| Stufe | Inhalt |
|---|---|
| **MVP** | CSS-Katalog; Kapitelmodus; `mc-single`, `mc-multi`, `flashcard`, `code-task`; Feedback (F-11); Wiederholung (F-13); Punkte, Tagesziel, Streak, Serie; Export/Import; Smartphone-Tauglichkeit (Kapitel 10); installierbar und offline (NF-05) |
| **v1.1** | Mix-Modus und Problemfragen mit Leitner; Statistikseite; `term-mc` |
| **v1.2** | Katalog-Upload; weitere Kapitel (HTML5, JavaScript) |
| **v2.0** | Sprachumschaltung Deutsch/Englisch (Oberfläche und Kataloge) |

## 14. Entscheidungen

| Thema | Entscheidung |
|---|---|
| Punkte | nach Begegnungsnummer; kein zweiter Versuch direkt danach |
| Mehrfachauswahl | Teilpunkte (6.1) |
| Schwierigkeit | Bonus gewichtet 1 / 1,5 / 2; Malus ungewichtet |
| Feedback | nach jeder Antwort immer Lösung und Erklärung |
| Tagesziel | 20 beantwortete Präsentationen, auch falsche und Wiederholungen |
| Streak | Tage in Folge mit erreichtem Tagesziel |
| Wiederholung | Leitner-System mit 5 Fächern |
| Speicher | LocalStorage über `store.js` |
| Architektur | SPA mit Hash-Routing |
| Gerät | Smartphone als Hauptgerät; installierbar und offline schon im MVP |
| Sprache | zunächst Deutsch; Deutsch/Englisch umschaltbar ab App-Version 2.0 |
| Statistik-Export für Lehrende | nein |

Derzeit gibt es keine offenen Punkte.
