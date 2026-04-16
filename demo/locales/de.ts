import type { DemoMessages } from './types'

export const de: DemoMessages = {
  editorLocale: 'en',
  skipLabel: 'Tour überspringen',
  replayLabel: 'Tour erneut abspielen',
  defaultGoogleFont: 'Inter',
  preferredLocalFonts: ['system-ui'],

  loadingBtn: 'Lädt...',
  loadedBtn: 'Geladen',
  loadBtn: 'Laden',
  unavailableBtn: 'Nicht verfügbar',

  localUnavailable: 'Die lokale Schriftartenliste ist in Chrome/Edge verfügbar.',
  googleLoadingStatus: 'Google Fonts werden geladen...',
  googleLoadedStatus: (count) => `Google Fonts geladen (${count})`,
  googleFailedStatus: 'Google-Schriftartenliste konnte nicht geladen werden.',
  localLoadingStatus: 'Lokale Schriftarten werden geladen...',
  localLoadedStatus: (count) => `Lokale Schriftarten geladen (${count})`,
  localBlockedStatus: 'Zugriff auf lokale Schriftarten wurde blockiert.',

  fontStatusMsg: (source, family) => `${source === 'google' ? 'Google Fonts' : 'Lokale Schriftarten'}: ${family}.`,
  localFontsLoadingMsg: 'Lokale Schriftarten werden geladen...',
  loadLocalFirst: 'Bitte zuerst lokale Schriftarten laden (auf „Laden" klicken).',
  localAccessNote: 'Zugriff auf lokale Schriftarten ist in Chrome/Edge verfügbar.',
  noLocalFonts: 'Keine lokalen Schriftarten verfügbar.',
  typeTextFirst: 'Bitte zuerst Text eingeben.',
  luckyFontMsg: (font) => `Lucky-Schriftart: ${font}.`,
  messyApplied: 'Messy!',
  htmlDropOverlay: 'HTML ablegen, um erneut zu bearbeiten',
  htmlImportSuccess: 'Aus HTML importiert.',
  htmlImportFailed: 'Kerning konnte aus diesem HTML nicht gelesen werden.',

  tutorialContent: ({ isMac, altKey }) => ({
    welcome: [
      'Willkommen bei ', { strong: 'visual kerning' }, '!',
      '\n',
      'Sehen wir uns an, wie man die Buchstabenabstände im Browser feinjustiert.',
    ],
    openEditor: [
      { key: 'cmd', label: isMac ? '\u2318' : 'Ctrl' }, ' + ', { key: 'k', label: 'K' }, ' drücken, um die Editor-Palette zu öffnen.',
    ],
    clickToEdit: 'Auf einen Textblock klicken, um zu bearbeiten...',
    moveAdjust: [
      'Bewegen ', { key: 'nav-left', label: '\u2190' }, ' ', { key: 'nav-right', label: '\u2192' },
      '   Anpassen ', { key: 'adj-mod', label: altKey }, ' + ', { key: 'adj-left', label: '\u2190' }, ' ', { key: 'adj-right', label: '\u2192' },
    ],
    compareTitle: 'Vorher / Nachher',
    compareDesc: 'Umschalten, um mit dem ursprünglichen Abstand zu vergleichen.',
    guidesTitle: 'Hilfslinien',
    guidesDesc: 'Abstandsmarkierungen zwischen den Zeichen anzeigen.',
    exportTitle: 'Export',
    exportDesc1: 'Kopiert die Kerning-Daten als JSON.',
    exportDesc2: 'Mit der visual-kerning-Bibliothek anwenden – fertig!',
    resetTitle: 'Zurücksetzen',
    resetDesc: 'Alle Änderungen verwerfen und ursprüngliche Abstände wiederherstellen.',
    yourTurn: [
      'Jetzt bist du dran!',
      '\n',
      'Wähle eine Schriftart, gib Text ein',
      '\n',
      'und probiere das Kerning selbst aus.',
    ],
  }),
}
