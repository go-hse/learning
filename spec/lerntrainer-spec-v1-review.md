# Review der Spezifikation `lerntrainer-spec-v1.md`

Stand: 23.10.2026 · Grundlage: Spec v1 und das Material in `04-CSS`
(61 ARS-Fragen in `Praesentationen/*.json`, 65 Begriffe in `glossar.md`, Fragen in `16-Review-Questions-CSS.md`)

Die Idee ist schlüssig. Die Technologiewahl (Vanilla JS, GitHub Pages, LocalStorage) passt gut zu einem
serverlosen, datenschutzfreundlichen Lerntrainer. Bisher ist v1 aber eher eine Ideensammlung als eine
Spezifikation: An mehreren Stellen kann man sie verschieden auslegen, und es fehlen Datenmodell,
Feedback-Konzept und Akzeptanzkriterien. Die Vorschläge unten sind nach Wichtigkeit sortiert.

---

## 1. Mehrdeutigkeiten, die vor der Umsetzung geklärt werden müssen

### 1.1 Punktesystem: Was heißt „beim n-ten Mal“?
Man kann es auf zwei Arten lesen, und sie führen zu sehr unterschiedlichem Verhalten:

| Lesart | Bedeutung | Problem |
|---|---|---|
| A: Versuch innerhalb einer Anzeige | Bei falscher Antwort darf sofort neu gewählt werden | Bei 4 Optionen gibt es durch Raten garantiert Punkte; ein Malus bei Versuch 2 widerspricht dem Bonus bei Versuch 2 |
| B: n-te Begegnung mit der Frage (über Sitzungen hinweg) | Erste Begegnung = volle Punkte, jede Wiederholung weniger | Schlüssig: Wer etwas schon beim ersten Mal weiß, bekommt mehr; wer wiederholt falsch liegt, verliert mehr |

**Vorschlag:** Lesart B festschreiben, mit Formel:
- `n` = Anzahl bisheriger Präsentationen dieser Frage + 1
- richtig: `max(0, 10 − 2·(n−1))` → 10, 8, 6, 4, 2, 0
- falsch: `−min(5, n−1)` → 0, −1, −2, −3, −4, −5

Außerdem festlegen:
- **Mehrfachauswahl** (die ARS-Fragen haben `"multiple": true`): alles oder nichts, oder Teilpunkte? Vorschlag: nur ganz richtig zählt als richtig.
- **Schwierigkeit gewichten?** z. B. Faktor 1 / 1,5 / 2 für Stufe 1–3. Sonst lohnt es sich nicht, schwere Fragen zu bearbeiten.
- **Wozu dienen die Punkte?** In den Statistiken tauchen sie nicht auf. Vorschlag: Gesamtpunkte und Punkte pro Kapitel anzeigen, eventuell mit Leveln.
- Kann der Punktestand negativ werden? Vorschlag: pro Frage ja, insgesamt Untergrenze 0.

### 1.2 „3 Schwierigkeitsgrade“ ist kein Fragetyp
In v1 steht der Punkt unter „Fragetypen“. Die Schwierigkeit ist aber eine **Eigenschaft jeder Frage**
(1 = Grundlagen/Wiedergabe, 2 = Anwenden, 3 = Transfer/Analyse). Sie sollte eine eigene Anforderung werden,
mit kurzer Definition, damit die Fragen einheitlich eingestuft werden.

### 1.3 Mix-Modus: welche Fragen genau?
„alle bereits – ggfs. falsch – beantworteten Fragen“ kann heißen: (a) alle schon beantworteten oder
(b) nur die falsch beantworteten. **Vorschlag:** (a), gewichtet nach Fehlerhistorie (siehe 3.2). Ein
zusätzlicher Modus „Nur Fehler“ deckt (b) ab.

### 1.4 Wiederholung „nach 3–5 anderen Fragen“
Offen ist:
- Wie oft kommt eine falsche Frage in derselben Sitzung wieder? Vorschlag: bis sie einmal richtig beantwortet wurde, höchstens 3-mal.
- Was passiert, wenn weniger als 3 Fragen übrig sind? Vorschlag: ans Ende der Warteschlange stellen.
- Zählt die Wiederholung als neue Begegnung für die Punkte (n+1)? Vorschlag: ja.

### 1.5 Tagesziel und Streak
- **Was zählt als „Frage bearbeitet“?** Jede beantwortete Präsentation, also auch Wiederholungen und Selbsteinschätzungs-Karten? Vorschlag: ja, jede abgeschlossene Präsentation.
- **Tagesgrenze:** lokale Mitternacht (Gerätezeit).
- **Streak heute:** Solange der Tag läuft, ist die Streak noch nicht gebrochen. Anzeige: „Heute noch 7 Fragen bis zum Tagesziel“.
- **Tagesziel einstellbar** machen (Standard 20).
- **„Richtige hintereinander“:** global oder pro Sitzung? Vorschlag: aktuelle Serie global plus Bestwert. Nur objektiv bewertete Typen zählen, keine Selbsteinschätzung.

### 1.6 Kapitelmodus: Wann ist eine Sitzung zu Ende?
„Fragen in aufsteigender Schwierigkeit“ beschreibt nur die Reihenfolge. Vorschlag: Alle Fragen des Kapitels,
sortiert nach Stufe und innerhalb einer Stufe gemischt. Optional: Stufe 2 wird erst ab 70 % richtig in
Stufe 1 freigeschaltet. Die Sitzung lässt sich jederzeit beenden; der Fortschritt bleibt gespeichert.

---

## 2. Was fehlt

### 2.1 Feedback nach der Antwort (wichtig)
In v1 steht nicht, was nach einer Antwort passiert. Das ist für den Lerneffekt entscheidend.
**Vorschlag:** Nach jeder Antwort richtig/falsch anzeigen, die richtige Option markieren und eine
**Erklärung** zeigen. Das Material liefert die Erklärungen schon: Die `notes` der ARS-Fragen begründen
jede Antwort, z. B. „#main hat die Spezifität 1-0-0 und schlägt .alert …“. Dazu ein Verweis auf das
Skript-Kapitel („Nachlesen: 02-Selectors“).

### 2.2 Datenmodell des Fragenkatalogs
Das ist die wichtigste fehlende Festlegung, weil Katalog, Historie, Export und Konverter davon abhängen.
Entwurf:

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
      "chapter": "css", "section": "css-selectors",
      "type": "mc-single",
      "difficulty": 2,
      "status": "freigegeben",
      "prompt": "Welche Farbe hat der Text von `<p id=\"main\" class=\"alert\">`?",
      "code": { "lang": "css", "text": "#main  { color: green; }\n.alert { color: red; }\np      { color: blue; }" },
      "options": [
        { "text": "rot" }, { "text": "blau" },
        { "text": "grün", "correct": true }, { "text": "schwarz (Browser-Standard)" }
      ],
      "shuffle": true,
      "explanation": "#main hat die Spezifität 1-0-0 und schlägt .alert (0-1-0) und p (0-0-1).",
      "tags": ["spezifität", "kaskade"]
    }
  ]
}
```

Wichtige Regeln:
- **Stabile, sprechende IDs:** Die Historie verweist auf Frage-IDs. Wenn sich eine ID ändert, geht die Lernhistorie verloren. IDs werden nie wiederverwendet.
- **Richtige Antwort als eigenes Feld:** In den ARS-JSONs steht sie nur als Freitext („Richtige Position: B“) in `notes`. Der Konverter sollte sie einmal parsen, danach gilt das strukturierte Feld.
- **`shuffle`:** Antworten mischen, damit nicht die Position gelernt wird. Abschalten für Optionen wie „alle oben genannten“.
- **`status`** (Entwurf/freigegeben), analog zu `abkuerzungen.yaml`. Die App zeigt nur freigegebene Fragen.
- **Text als eingeschränktes Markdown** (Inline-Code, Fett, Codeblöcke) mit Syntax-Hervorhebung für CSS/HTML/JS.

### 2.3 Fragetypen konkretisieren
| Typ | Bewertung | Quelle im Material | Version |
|---|---|---|---|
| `mc-single` | automatisch, Punkte | ARS-JSON | MVP |
| `mc-multi` | automatisch, alles oder nichts | ARS-JSON (`multiple: true`) | MVP |
| `flashcard` (Begriff erläutern) | Selbsteinschätzung: gewusst / teilweise / nicht gewusst | `glossar.md` | MVP |
| `code-task` („Wie muss das HTML aussehen?“) | Selbsteinschätzung mit Musterlösung | `16-Review-Questions-CSS.md` (Lecturer-Hinweis) | MVP |
| `term-mc` (Definition → Begriff) | automatisch | aus dem Glossar generiert, Ablenker = andere Begriffe derselben Sektion | v1.1 |
| `input` (z. B. Selektor eintippen) | automatisch, normalisierter Vergleich | neu | später |

Selbsteinschätzung gibt keine Punkte, wie in v1 geplant. Sie **steuert aber die Wiederholung**
(„nicht gewusst“ wird behandelt wie falsch) und zählt zum Tagesziel.

### 2.4 Fächer und Kataloge
„Student wählt Fach“ setzt mehrere Kataloge voraus. Vorschlag:
- `catalogs/index.json` auf GitHub Pages listet die verfügbaren Fächer: ID, Titel, URL, Version.
- **Upload:** Die Datei wird gegen das Schema validiert (mit verständlichen Fehlermeldungen) und lokal gespeichert. Bei gleicher Katalog-ID fragt die App, ob sie ersetzen oder abbrechen soll.
- **Katalog-Updates:** Neue Version wird erkannt. Die Historie bleibt erhalten, weil die IDs stabil sind; gelöschte Fragen werden in Statistiken ausgeblendet.

### 2.5 Export, Import und Datensicherheit
- **Ereignisprotokoll statt Zähler speichern:** Jede Antwort ist ein Eintrag `{qid, ts, result, points, mode}`. Alle Statistiken lassen sich daraus berechnen, und beim Import werden zwei Geräte einfach zusammengeführt (Vereinigung über `qid + ts`, keine Konflikte). Größe: etwa 100 Byte pro Eintrag, ein Jahr mit 20 Fragen täglich sind unter 1 MB. Das liegt weit unter dem LocalStorage-Limit von etwa 5 MB.
- **Exportformat:** JSON mit `schemaVersion`, Exportdatum und Katalog-Versionen. Beim Import zwischen **Zusammenführen** (Standard) und **Ersetzen** wählen lassen.
- **Datenverlust-Risiko:** Safari löscht Website-Daten (auch LocalStorage) nach 7 Tagen ohne Besuch, und Nutzer leeren Browserdaten. Gegenmaßnahmen: `navigator.storage.persist()` anfordern, nach z. B. 14 Tagen ohne Export dezent an ein Backup erinnern, und das als bekanntes Risiko in die Spec aufnehmen.

### 2.6 Statistiken erweitern
- „Besonders häufig falsch“ als **Fehlerquote** angeben, mit Mindestanzahl Versuche (z. B. ≥ 3). Absolute Zahlen bevorzugen sonst oft gezeigte Fragen.
- **Fortschritt pro Kapitel/Sektion:** gesehen / beherrscht / fällig.
- Verlauf: Fragen pro Tag als Kalender-Heatmap, Trefferquote über die Zeit.
- Aus der Statistik heraus direkt üben: „Diese 10 Problemfragen jetzt üben“.
- **Optional, für die Lehre interessant:** anonymer Export der Fehlerquoten pro Frage, freiwillig hochzuladen z. B. über Moodle. So sieht der Dozent, welche Themen schwierig sind, ohne Server und ohne personenbezogene Daten.

---

## 3. Konkretisierungsvorschläge

### 3.1 Begriffe definieren
Ein kurzes Glossar am Anfang der Spec: *Katalog, Kapitel, Sektion, Frage, Präsentation (eine Anzeige einer
Frage), Sitzung, Begegnung, Tagesziel, Streak, Serie.* Viele der Mehrdeutigkeiten oben entstehen, weil
„Mal“, „Frage bearbeiten“ und „hintereinander“ nicht definiert sind.

### 3.2 Wiederholungsalgorithmus: Leitner-System
„Falsche Fragen häufiger“ lässt sich einfach und gut testbar als **Leitner-System mit 5 Fächern** umsetzen:
- neu → Fach 1; richtig → ein Fach höher; falsch oder „nicht gewusst“ → Fach 1 und in derselben Sitzung nach 3–5 Fragen wieder einreihen
- Mix-Modus zieht gewichtet: Fach 1 : 2 : 3 : 4 : 5 = 16 : 8 : 4 : 2 : 1
- „beherrscht“ = Fach 5 (das verwendet auch die Kapitelstatistik)
- Später ausbaubar zu echtem Spaced Repetition mit Fälligkeitsdatum (z. B. SM-2), ohne das Datenmodell zu ändern

### 3.3 Technik
- **Routing:** Hash-Routing (`#/fach/css/quiz`), weil GitHub Pages keinen SPA-Fallback auf `index.html` bietet.
- **ES-Module ohne Build-Schritt;** Bibliotheken für Syntax-Highlighting (Prism oder highlight.js) im Repo ablegen statt über ein CDN laden, damit die App offline läuft. In der Spec festhalten, ob das noch als „Vanilla“ gilt.
- **Sicherheit:** Fragen enthalten absichtlich HTML-Code, und Kataloge können hochgeladen werden. Texte also nie ungeprüft per `innerHTML` einsetzen, sondern `textContent` bzw. einen kleinen, escapenden Markdown-Renderer verwenden. Dazu eine Content-Security-Policy per `<meta>`.
- **PWA / Offline:** `manifest.json` und ein Service Worker. Dann ist die App auf dem Handy installierbar und läuft offline, etwa in Bus oder Bahn. Das passt sehr gut zu „20 Fragen pro Tag“.
- **Mobile-first, Bedienung per Tastatur** (Tasten 1–4 für Antworten, Enter für weiter), ARIA-Rollen, Dunkelmodus über `prefers-color-scheme`.
- **Tests:** Punkte, Leitner-Logik, Streak-Berechnung und Import-Zusammenführung als reine Funktionen schreiben und mit `node --test` testen. Das braucht keine Abhängigkeiten.

### 3.4 Content-Pipeline
Die Spec nennt das Material, aber nicht, wie daraus ein Katalog wird. Vorschlag:
1. Konverter-Skript (`tools/build-catalog.mjs`): ARS-JSON → `mc-*`, `glossar.md` → `flashcard`, Review-Questions → `code-task`
2. Zuordnung zu Sektionen über den Dateinamen-Präfix (`02-selectors-ars.json` → `css-selectors`)
3. Schwierigkeitsgrad und Freigabe redaktionell prüfen, Status `entwurf` → `freigegeben`
4. Schema-Validierung in CI (GitHub Action) vor dem Deployment

Beim CSS-Kapitel kommen so ohne neue Inhalte etwa 61 MC-Fragen, 65 Begriffskarten und rund 15 Code-Aufgaben zusammen.
Das reicht gut für einen MVP. Achtung: Das Material ist gemischt deutsch/englisch (Review-Questions englisch, ARS deutsch). Ein Feld `lang` pro Frage oder eine bewusste Entscheidung für eine Sprache ist sinnvoll.

### 3.5 Lizenz
Das Repo steht unter GPL-3.0. Für die **Inhalte** (Fragen) passt eher eine Inhaltslizenz wie CC BY-SA 4.0.
In der Spec festhalten, unter welcher Lizenz Code und Katalog jeweils stehen.

---

## 4. Vorschlag für die Gliederung von Spec v2

1. Ziel und Zielgruppe (Studierende Internet-Technologien, HS Esslingen; Smartphone und Desktop)
2. Begriffe
3. User Stories (z. B. „Als Studentin will ich in der Bahn offline 20 Fragen üben, damit …“)
4. Funktionale Anforderungen mit IDs (F-01 …), jeweils mit **Akzeptanzkriterium**
5. Datenmodell: Katalog-Schema, Historie, Exportformat
6. Algorithmen: Punkte, Leitner, Streak (mit Beispieltabellen)
7. Nichtfunktionale Anforderungen: offline, Datenschutz (keine Serverdaten), Barrierefreiheit, Browser-Support, Performance
8. Content-Pipeline
9. Nicht im Umfang (z. B. Accounts, Server-Sync, Ranglisten)
10. Meilensteine

### Meilensteine (Vorschlag)
- **MVP:** CSS-Katalog, Kapitelmodus, `mc-single`/`mc-multi`/`flashcard`, Feedback mit Erklärung, Punkte, Tagesziel und Streak, Export/Import
- **v1.1:** Mix-Modus mit Leitner, Statistikseite, `code-task`, `term-mc`
- **v1.2:** PWA/Offline, Katalog-Upload, weitere Kapitel (HTML5, JavaScript)

---

## 5. Offene Entscheidungen (bitte festlegen)

1. Punkte: Lesart A oder B (Empfehlung B)? Schwierigkeit gewichten?
2. Mehrfachauswahl: Teilpunkte oder alles oder nichts?
3. Zählen Selbsteinschätzungs-Karten zum Tagesziel?
4. Sprache der Fragen: Deutsch, Englisch oder gemischt?
5. Stufe 2/3 freischalten oder alles sofort verfügbar?
6. Syntax-Highlighting-Bibliothek erlaubt oder strikt keine Fremdbibliotheken?
7. Soll es einen anonymen Statistik-Export für den Dozenten geben?
