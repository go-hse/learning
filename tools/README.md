# Fragenkatalog erzeugen

```
node tools/build-catalog.mjs --src "C:\Users\adr\Nextcloud\05-Hochschule\0505-ModuleVorlesungen\02_InternetTechnologien\Vorlesungsskript"
```

Schreibt `catalogs/inet-tech.json` und `catalogs/index.json`. Mit `--list` werden zusätzlich alle Fragen mit ID, Typ und Schwierigkeit ausgegeben.
Das Skript bricht mit Fehlermeldung ab, wenn der Katalog nicht der Spezifikation (Kapitel 7.1) entspricht oder in einem Abschnitt weniger als 50 % der Fragen Punkte geben (Entwürfe zählen mit).

## Quellen (Kapitel CSS)

| Quelle | wird zu | Status |
|---|---|---|
| `04-CSS/Praesentationen/*-ars.json` | `mc-single` / `mc-multi` | freigegeben |
| `04-CSS/Praesentationen/16-review-questions-css.json` | `code-task` | freigegeben |
| `04-CSS/glossar.md` | `flashcard` | freigegeben |
| `tools/content/css-new-questions.json` | neue Fragen, v. a. für Abschnitte ohne ARS-Fragen | **entwurf** |

ARS-Fragen vom Typ „Tippen Sie auf …“ (`kind: coords`) werden übersprungen.

## Redaktion: `tools/content/css-overrides.json`

- `sections` – Abschnitte des Kapitels und zugehörige ARS-Datei
- `difficulty` – Schwierigkeitsgrad je Frage-ID (Pflicht für MC- und Code-Fragen; Lernkarten ohne Eintrag = 1)
- `patch` – Korrekturen je Frage-ID, z. B. `prompt`, `explanation`, `answer` oder `replaceOption: { "D": "neuer Text" }`
- `rename` – feste IDs, wenn die automatisch erzeugte ID unpassend ist
- `skip` – Fragen, die endgültig nicht in den Katalog sollen (z. B. Geschichte)
- `fragenspeicher` – zurückgestellte Fragen zu Themen, die noch nicht ausführlich behandelt wurden; sie landen in `css-fragenspeicher.json` statt im Katalog. Zum Aktivieren die ID aus der Liste entfernen.
- `glossarySections` – Zuordnung der Glossarbegriffe zu Abschnitten
- `wordFixes` – Schreibweisen ohne Umlaut im Glossar (fuer → für)

## Freigabe neuer Fragen

Neue Fragen erscheinen in der App erst mit `"status": "freigegeben"`. Nach der Durchsicht in
`css-new-questions.json` bei der Frage `"status": "freigegeben"` ergänzen und das Skript erneut ausführen.

**IDs nie ändern:** Die Lernhistorie hängt an der Frage-ID. Wird ein Folientitel geändert, ändert sich die
automatisch erzeugte ID – dann die alte ID über `rename` festhalten.
