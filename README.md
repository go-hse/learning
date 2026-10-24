# Lerntrainer

Lernkarten-App (SPA) zur Vorlesung *Internet-Technologien*: täglich 20 Fragen üben, auf dem Smartphone und offline.
Vanilla HTML, CSS und JavaScript, ohne Build-Schritt, gehostet auf GitHub Pages. Alle Lerndaten bleiben im Browser.

Spezifikation: [`spec/lerntrainer-spec-v2.md`](spec/lerntrainer-spec-v2.md)

## Lokal starten

Die App muss über einen Webserver laufen (ES-Module und Service Worker funktionieren nicht über `file://`):

```
python -m http.server 8000
```

Dann <http://localhost:8000> öffnen. Zum Testen auf dem Handy im selben WLAN die IP-Adresse des Rechners verwenden
(der Service Worker läuft dann allerdings nur unter `localhost` oder HTTPS).

## Tests

```
npm test
```

(entspricht `node --test tests/*.test.mjs`, Node 20 oder neuer, keine Abhängigkeiten)

## Fragenkatalog aktualisieren

```
node tools/build-catalog.mjs --src "<Pfad zum Ordner Vorlesungsskript>"
```

Details in [`tools/README.md`](tools/README.md).

## Veröffentlichen

1. Repository auf GitHub pushen.
2. *Settings → Pages → Build and deployment*: Quelle „Deploy from a branch“, Branch `main`, Ordner `/ (root)`.
3. Bei jeder Änderung an App-Dateien in `sw.js` die Konstante `VERSION` erhöhen und neue Dateien in `SHELL` eintragen –
   sonst sehen installierte Apps die alte Fassung.

## Aufbau

| Pfad | Inhalt |
|---|---|
| `index.html`, `css/app.css` | Einstieg und Gestaltung (mobile-first) |
| `js/main.js`, `js/router.js` | Start, Hash-Routing |
| `js/views/` | Ansichten: Startseite, Fach, Kapitel, Sitzung, Einstellungen |
| `js/scoring.js`, `js/leitner.js`, `js/session.js` | Punkte, Streak, Leitner-Fächer, Wiederholung (reine Funktionen) |
| `js/store.js` | einziger Zugriff auf den LocalStorage, Export/Import |
| `js/i18n/de.js` | alle Oberflächentexte |
| `catalogs/` | Fragenkataloge (erzeugt) |
| `sw.js`, `manifest.json`, `icons/` | Installierbarkeit und Offline-Betrieb |
| `tools/` | Erzeugung des Fragenkatalogs aus dem Vorlesungsmaterial |
