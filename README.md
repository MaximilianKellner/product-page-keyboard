# Product Page — Keychron Q6 Max

Übungsprojekt: eine Produktseite als statische Website, umgesetzt aus einem
eigenen Figma-Entwurf. Fokus liegt auf Layout, Design-Tokens und einem
Konfigurator, der ohne JavaScript auskommt.

## Hinweis

Dies ist **kein offizielles Angebot von Keychron** und steht in keiner
Verbindung zum Unternehmen. Es ist eine nicht-kommerzielle Design- und
Frontend-Übung. Produktname, Wortmarke und Produktabbildung gehören ihren
jeweiligen Rechteinhabern. Der „In den Einkaufswagen"-Button hat keine
Funktion — es gibt keinen Checkout, keine Zahlungsabwicklung und es werden
keine Daten erhoben.

Die Seite ist per `<meta name="robots" content="noindex, nofollow">` von der
Indexierung ausgenommen.

## Stack

- HTML, CSS, Vanilla JS — kein Framework
- [Vite](https://vite.dev/) als Dev-Server und Bundler
- Schriften über Google Fonts: Kumbh Sans, IBM Plex Sans, IBM Plex Mono, Blinker

## Lokal starten

```bash
npm install
npm run dev
```

Weitere Scripts:

| Script | Zweck |
| --- | --- |
| `npm run dev` | Dev-Server mit Hot Reload auf http://localhost:5173 |
| `npm run build` | Produktions-Build nach `dist/` |
| `npm run preview` | Build lokal servieren |

## Struktur

```
index.html          Markup der Seite
css/reset.css       CSS-Reset
css/style.css       Tokens, Layout, Komponenten
js/main.js          Einstiegspunkt
assets/images/      Produktbild, Swoosh, Farb-Swatches
assets/icons/       Icons (aus Figma exportiert)
```

Die Auswahl-Zustände im Konfigurator (Layout, Farbe, Switches) laufen über
`<fieldset>` mit Radio-Inputs und `:has(:checked)` im CSS — dadurch gibt es
Tastaturbedienung und Screenreader-Ausgabe ohne eigenes JavaScript.

## Deployment

Push auf `main` baut die Seite und veröffentlicht sie über GitHub Actions auf
GitHub Pages (siehe `.github/workflows/deploy.yml`).
