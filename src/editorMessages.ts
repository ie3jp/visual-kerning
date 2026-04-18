export type EditorLocale = 'ja' | 'en'

const baseMessages = {
  en: {
    export: 'Export',
    reset: 'Reset',
    compare: 'Before/After',
    copied: 'Downloaded',
    confirmReset: 'Reset all kerning?',
    collapse: 'Collapse palette',
    expand: 'Expand palette',
    guides: 'Guides',
    dropOverlay: 'Drop JSON to import',
  },
  ja: {
    export: '書き出し',
    reset: 'リセット',
    compare: '比較',
    copied: 'ダウンロードしました',
    confirmReset: 'カーニングをすべてリセットしますか？',
    collapse: 'パレットを折りたたむ',
    expand: 'パレットを展開する',
    guides: 'ガイド',
    dropOverlay: 'JSONをドロップしてインポート',
  },
} as const

export const editorMessages = {
  en: {
    ...baseMessages.en,
    helpText: [
      '←/→/↑/↓ move  ⇧ + arrow extend  ⌘A select all',
      '⌥ + ←/→ ±10  ⌥⇧ ±1  ⌥⌘ ±100  ⌥⌘Q zero',
      '⌘K toggle  B compare  Esc clear',
    ].join('\n'),
    warnSpanTarget: '<span> detected as target. Use a block element (<p>, <div>, <h1>) to avoid nested spans.',
  },
  ja: {
    ...baseMessages.ja,
    helpText: [
      '←/→/↑/↓ 移動  ⇧ + 矢印 範囲拡張  ⌘A 全選択',
      '⌥ + ←/→ ±10  ⌥⇧ ±1  ⌥⌘ ±100  ⌥⌘Q ゼロ',
      '⌘K 切替  B 比較  Esc 解除',
    ].join('\n'),
    warnSpanTarget: '対象が <span> です。ネストを避けるためブロック要素（<p>, <div>, <h1>）の使用を推奨します。',
  },
} as const
