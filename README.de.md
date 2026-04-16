# Visual Kerning

[English](./README.md) | [日本語](./README.ja.md) | [Deutsch](./README.de.md) | [简体中文](./README.zh-CN.md) | [한국어](./README.ko.md)

[![npm](https://img.shields.io/npm/v/visual-kerning?style=flat-square&color=888)](https://www.npmjs.com/package/visual-kerning)
[![Playground](https://img.shields.io/badge/playground-live-888?style=flat-square)](https://ie3jp.github.io/visual-kerning/)
[![GitHub Pages](https://img.shields.io/github/actions/workflow/status/ie3jp/visual-kerning/deploy-demo-pages.yml?style=flat-square&label=GitHub+Pages&color=888)](https://github.com/ie3jp/visual-kerning/actions/workflows/deploy-demo-pages.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-888?style=flat-square)](./LICENSE)
[![Ko-fi](https://img.shields.io/badge/Ko--fi-FF5E5B?style=flat-square&logo=ko-fi&logoColor=white)](https://ko-fi.com/cyocun)

**Web-Typografie intuitiver gestalten.**

Passe Kerning im Browser an, exportiere es als JSON
und wende es im Produktions-DOM an – ohne dich an ein bestimmtes Framework zu binden.

![Visual Kerning demo](.github/readme/ogp.gif)

## Playground

**Hier starten:** [Playground öffnen](https://ie3jp.github.io/visual-kerning/)

- Lokale Demo: `npm run demo`
- Statischer Build: `npm run demo:build`

> Die Bearbeitungs-UI ist für Entwicklung und Staging gedacht.
> In der Produktion: `visualKerning({ editable: false, kerning })`.

## Warum Visual Kerning

CSS `letter-spacing` reicht aus, wenn ein einziger Wert genügt.
Sobald paarweise Anpassungen im realen UI nötig werden, stößt es an Grenzen.

Visual Kerning ist für Teams gedacht, die einen praktischen Workflow wie diesen wünschen:

1. Abstände in Entwicklung oder Staging visuell im Browser feinjustieren.
2. Das Ergebnis als JSON exportieren.
3. Die exportierten Daten in der Produktion anwenden.

Stärken:

- **Paarweise Kontrolle, die CSS nicht bietet**
  — `letter-spacing` ist uniform; dies passt jedes Zeichenpaar unabhängig an
- **Illustrator-ähnliche Bearbeitung**
  — Alt + Pfeiltasten für Fein-/Grobanpassung, direkt im Browser
- **Eine API von der Bearbeitung bis zur Produktion**
  — in Staging bearbeiten, JSON exportieren, in Produktion mit derselben Bibliothek anwenden
- **Erhält Inline-Markup**
  — `<em>`, `<strong>`, `<span>` und andere Inline-Elemente überleben den Wrap-Prozess
- **Null Abhängigkeiten, framework-unabhängig**
  — funktioniert mit jedem Stack, ohne Laufzeit-Overhead
- **Ereignisgesteuerte Integration**
  — `enable`-, `disable`-, `change`-Events zur Koordination mit deiner App

## Installation

```bash
npm install visual-kerning
```

## Der vorgesehene Workflow

```ts
import { visualKerning } from 'visual-kerning'
```

**1. Bearbeiten** — den Editor in Entwicklung oder Staging mounten.
Kerning visuell anpassen, dann JSON aus der Palette exportieren.

```ts
const editor = visualKerning({ editable: true })
editor.mount()
```

Du kannst auch exportiertes JSON über die `kerning`-Option übergeben,
um die Bearbeitung eines vorherigen Exports fortzusetzen.

**2. Anwenden** — mit dem exportierten JSON in der Produktion mounten.

```ts
const editor = visualKerning({ editable: false, kerning: kerningData })
await editor.mount()
```

`mount()` gibt ein `Promise` zurück, das aufgelöst wird,
sobald Kerning angewendet wurde.
Nutze `await`, um das Rendering zu verzögern
(z. B. `visibility: hidden` zu entfernen),
bis der Text korrekt gekernt ist.

Im Bearbeitungsmodus kannst du auch die exportierte JSON-Datei
per Drag & Drop auf das Editor-Panel ziehen, um sie erneut zu importieren.

## Wofür es sich eignet

Visual Kerning ist auf Text ausgerichtet, der auf einer normalen Website visuell wichtig ist.

- Überschriften
- Hero-Copy
- Display-Typografie
- Titel mit gemischten Schriftarten
- Kurze redaktionelle Zeilen
- Kurze mehrzeilige Texte mit `<br>`

Es ist praktisch für gewöhnliche Websites, Landingpages,
Marketing-Sites, Portfolios und redaktionelle UI.

## Unterstützte Inhalte

- Klartext in einem einzelnen Element
- Mehrzeiliger Text mit `<br>`
- Inline-Formatierung innerhalb des Zielelements
  — z. B. `<span>`, `<em>`, `<strong>`, `<b>`, `<i>`

Beim Bearbeiten wickelt Visual Kerning sichtbare Zeichen in Spans,
bemüht sich aber, nützliche Inline-Strukturen zu erhalten.

Um ein Element von der Bearbeitung auszuschließen,
füge `data-visual-kerning-ignore` hinzu:

```html
<div data-visual-kerning-ignore>Dieser Text wird nicht bearbeitbar sein.</div>
```

## Public API

### `visualKerning(options?)`

Der einzige öffentliche Einstiegspunkt für Bearbeitung und Produktion.

```ts
const editor = visualKerning({
  locale: 'en',          // 'ja' | 'en' (Standard: 'en')
  editable: true,        // Bearbeitungs-UI anzeigen (Standard: true)
  kerning: kerningData,  // KerningExport beim Mount anwenden
  accessible: false,     // Screenreader-Unterstützung (Standard: false)
})
editor.mount()
```

- `editable: true` (Standard) — Bearbeitungs-UI + Tastenkürzel
- `editable: false` + `kerning` — Produktionsmodus, wendet nur Kerning-Daten an
- `accessible: true` — fügt Screenreader-Unterstützung hinzu (siehe [Barrierefreiheit](#barrierefreiheit))
- `mount()` / `unmount()` — an das DOM anhängen / entfernen. `mount()` gibt ein `Promise<void>` zurück, das aufgelöst wird, sobald Kerning angewendet wurde

`KerningExport` ist die öffentliche Datenform, die von der `kerning`-Option verwendet wird.

#### Events

Lifecycle-Events abonnieren. `on()` gibt eine Dispose-Funktion zurück.

```ts
editor.on('enable', () => { document.body.style.overflow = 'hidden' })
editor.on('disable', () => { document.body.style.overflow = '' })
editor.on('change', ({ selector, kerning, indent }) => { /* ... */ })
editor.on('select', ({ selector, gapIndex, gapIndexEnd }) => { /* ... */ })
editor.on('reset', () => { /* ... */ })
```

Abonnement beenden:

```ts
const off = editor.on('change', handleChange)
off()
```

## Editor-Tastenkürzel

| Taste | Aktion |
|-------|--------|
| `Cmd/Ctrl + K` | Bearbeitungsmodus umschalten |
| Klick | Textblock und Abstand auswählen |
| Ziehen | Einen Bereich von Abständen auswählen |
| `Shift + Klick` | Auswahl auf einen Bereich erweitern |
| `Cmd/Ctrl + A` | Alle Abstände im aktiven Textblock auswählen |
| `Tab` / `Shift+Tab` | Nächster / vorheriger Abstand |
| `←` / `→` | Cursor bewegen |
| `Shift + ←/→` | Auswahl erweitern |
| `↑` / `↓` | Im selben Textblock nach oben / unten |
| `Alt + Shift + ←/→` | Um ±1 anpassen |
| `Alt + ←/→` | Um ±10 anpassen |
| `Alt + Cmd/Ctrl + ←/→` | Um ±100 anpassen |
| `Alt + Cmd/Ctrl + Q` | Ausgewählte Abstände auf Null zurücksetzen |
| `Esc` | Auswahl aufheben |
| `B` | Vorher / Nachher-Vergleich umschalten |

Wenn mehrere Abstände ausgewählt sind,
passt `Alt + ←/→` alle ausgewählten Abstände gleichzeitig an (Tracking).

<details>
<summary>Ist es Illustrator-ähnlich?</summary>

Die Kerning-Anpassungstasten sind bewusst an Illustrator angelehnt:

- `Alt/Option + Shift + ←/→`: Feinjustierung (±1)
- `Alt/Option + ←/→`: Standardanpassung (±10)
- `Alt/Option + Cmd/Ctrl + ←/→`: Grobanpassung (±100)

Der Browsing- und Bearbeitungs-Workflow selbst ist browserspezifisch:

- `Cmd/Ctrl + K`: Editor umschalten
- `Tab` / `Shift+Tab`: zwischen Abständen bewegen
- `B`: Vorher / Nachher-Vergleich
- `Esc`: Auswahl aufheben
</details>

## Warum `margin-left` statt `letter-spacing`

Visual Kerning wickelt jedes sichtbare Zeichen in ein `<span>`
und steuert den Abstand über `margin-left` jedes Spans.
Dies ist eine bewusste Entscheidung gegen `letter-spacing`:

- **`letter-spacing` auf Ein-Zeichen-Spans ist unzuverlässig.**
  Die Eigenschaft fügt Raum *zwischen Zeichen innerhalb eines Elements* hinzu
  — aber mit nur einem Zeichen pro Span gibt es kein „zwischen".
  Das Browserverhalten variiert.
- **`letter-spacing` läuft an Zeilenumbrüchen aus.**
  Es vergrößert die Zeichenbox selbst
  und hinterlässt unerwünschten Endabstand am Ende umbrochener Zeilen.
- **`margin-left` ist kontextübergreifend vorhersehbar.**
  Es folgt der Box-Modell-Spezifikation: der Abstand sitzt zwischen benachbarten Spans,
  unabhängig von Zeilenumbrüchen, Inline-Wrappern (`<em>`, `<strong>`)
  oder Stilen des Elternelements.
- **Keine doppelte Anwendung mit geerbtem `letter-spacing`.**
  Wenn das Elternelement `letter-spacing` hat, stört `margin-left` nicht.
  Die Bibliothek liest den vererbten Wert
  und bezieht ihn über `calc()` in die Margin-Berechnung ein.

## Barrierefreiheit

Visual Kerning wickelt jedes Zeichen in ein `<span>`,
was dazu führen kann, dass Screenreader den Text Zeichen für Zeichen vorlesen.

Um dies zu verhindern, aktiviere die `accessible`-Option im Produktionsmodus:

```ts
const editor = visualKerning({
  editable: false,
  kerning: kerningData,
  accessible: true,
})
editor.mount()
```

Wenn aktiviert, wird jedes Zielelement umstrukturiert:

```html
<!-- Vorher (ohne accessible) -->
<h1>
  <span class="visual-kerning-char" style="margin-left:...">H</span>
  <span class="visual-kerning-char" style="margin-left:...">e</span>
  ...
</h1>

<!-- Nachher (mit accessible: true) -->
<h1>
  <span class="visual-kerning-sr-only">Hello</span>
  <span class="visual-kerning-presentation" aria-hidden="true">
    <span class="visual-kerning-char" style="margin-left:...">H</span>
    <span class="visual-kerning-char" style="margin-left:...">e</span>
    ...
  </span>
</h1>
```

Screenreader lesen den visuell versteckten Originaltext,
während die gekernten Spans per `aria-hidden` ausgeblendet sind.

> **Hinweis:** Dies ändert die DOM-Struktur.
> Wenn dein CSS oder JS Kind-Elemente von Kerning-Zielen direkt referenziert,
> müssen Selektoren möglicherweise angepasst werden.

## CSS-Klassen

Visual Kerning fügt dem DOM diese Klassen für Styling und Auswahl hinzu:

| Klasse | Angewendet auf | Beschreibung |
|--------|----------------|--------------|
| `visual-kerning-char` | Jedes Zeichen-`<span>` | Immer auf gekernten Zeichen vorhanden |
| `visual-kerning-sr-only` | Visuell versteckter Text | Nur mit `accessible: true` — enthält den lesbaren Originaltext |
| `visual-kerning-presentation` | Wrapper um gekernte Spans | Nur mit `accessible: true` — hat `aria-hidden="true"` |
| `visual-kerning-active` | Zielelement | Hinzugefügt, während das Element bearbeitet wird |
| `visual-kerning-modified` | Zielelement | Hinzugefügt, wenn Kerning angewendet wurde |

```css
/* Beispiel: gekernte Zeichen stylen */
.visual-kerning-char {
  /* jeder Zeichen-Span */
}

/* Beispiel: den visuellen Wrapper bei accessible ansprechen */
.visual-kerning-presentation {
  /* umschließt alle gekernten Spans, vor Screenreadern versteckt */
}
```

## Einschränkungen

- Kein universelles System für umfangreichen Textsatz
- Fokus auf visuell wichtige Texte, nicht auf jeden Textknoten einer Seite
- Praktisch für gewöhnliche Websites,
  verspricht aber keine perfekte Rekonstruktion jeder möglichen
  HTML-Struktur oder stark dekorierter Inline-Markup

## Entwicklung

```bash
npm install
npm run build
npm test
npm run smoke
npm run demo
```

### Verfügbare Skripte

| Skript | Beschreibung |
|--------|--------------|
| `npm run build` | Paket in `dist/` bauen |
| `npm test` | Vitest ausführen |
| `npm run smoke` | Core-Smoke-Tests + Demo-E2E |
| `npm run smoke:ci` | CI-orientierter Smoke-Lauf |
| `npm run e2e` | Nur Playwright-E2E |
| `npm run demo` | Lokale Demo unter `http://127.0.0.1:4173` |
| `npm run demo:build` | Statischer Demo-Build in `demo-dist/` |

Vor dem ersten E2E-Lauf:

```bash
npx playwright install
```

## Support

> [!TIP]
> Wenn dir dieses Tool bei deinem Workflow hilft, bedeutet deine Unterstützung viel — [buy me a coffee!](https://ko-fi.com/cyocun)

## Lizenz

[MIT](./LICENSE)
