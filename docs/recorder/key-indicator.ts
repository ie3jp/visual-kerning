/**
 * 録画用キーインジケータ — 画面下部に現在押されているキーを表示
 */

const STYLE = `
  .rec-indicator {
    position: fixed;
    bottom: 28px;
    left: 28px;
    background: rgba(26, 26, 26, 0.88);
    backdrop-filter: blur(12px);
    border-radius: 16px;
    padding: 16px 36px;
    display: flex;
    gap: 14px;
    align-items: center;
    min-height: 80px;
    min-width: 100px;
    justify-content: center;
    transition: opacity 0.25s ease;
    z-index: 100000;
    pointer-events: none;
  }
  .rec-indicator[data-empty] {
    opacity: 0;
  }
  .rec-key {
    display: inline-block;
    min-width: 52px;
    padding: 10px 20px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.08);
    border: 2px solid rgba(255, 255, 255, 0.18);
    color: rgba(255, 255, 255, 0.55);
    font: 700 36px/1.2 ui-monospace, SFMono-Regular, Menlo, monospace;
    text-align: center;
    transition: all 0.12s ease;
  }
  .rec-key-active {
    background: rgba(245, 166, 35, 0.28);
    border-color: rgba(245, 166, 35, 0.65);
    color: #f5a623;
    box-shadow: 0 0 12px rgba(245, 166, 35, 0.35);
  }
  .rec-key-pop {
    animation: rec-key-pop 0.15s ease-out;
  }
  @keyframes rec-key-pop {
    0% { transform: scale(1.2); }
    100% { transform: scale(1); }
  }
`

export interface KeyIndicator {
  el: HTMLElement
  show(keys: { label: string; active?: boolean }[]): void
  hide(): void
  /** popなしでハイライト（押しっぱなし表現） */
  activate(labels: string[]): void
  /** popアニメ付きハイライト（既存activeは維持） */
  pop(labels: string[]): void
  flash(activeLabels: string[]): void
  clear(): void
}

export function createKeyIndicator(): KeyIndicator {
  const style = document.createElement('style')
  style.textContent = STYLE
  document.head.appendChild(style)

  const el = document.createElement('div')
  el.className = 'rec-indicator'
  el.setAttribute('data-empty', '')
  el.setAttribute('data-visual-kerning-ignore', 'true')
  document.body.appendChild(el)

  function show(keys: { label: string; active?: boolean }[]) {
    el.textContent = ''
    if (keys.length === 0) {
      el.setAttribute('data-empty', '')
      return
    }
    el.removeAttribute('data-empty')
    for (const k of keys) {
      const kbd = document.createElement('kbd')
      kbd.className = 'rec-key'
      kbd.textContent = k.label
      kbd.setAttribute('data-rec-key', k.label)
      if (k.active) {
        kbd.classList.add('rec-key-active')
      }
      el.appendChild(kbd)
    }
  }

  function hide() {
    el.setAttribute('data-empty', '')
  }

  function flash(activeLabels: string[]) {
    el.querySelectorAll('.rec-key').forEach(kbd => {
      const label = kbd.getAttribute('data-rec-key') ?? ''
      if (activeLabels.includes(label)) {
        kbd.classList.add('rec-key-active')
        kbd.classList.remove('rec-key-pop')
        void (kbd as HTMLElement).offsetHeight
        kbd.classList.add('rec-key-pop')
      } else {
        kbd.classList.remove('rec-key-active', 'rec-key-pop')
      }
    })
  }

  /** popなしでハイライト（修飾キー押しっぱなし用） */
  function activate(labels: string[]) {
    el.querySelectorAll('.rec-key').forEach(kbd => {
      const label = kbd.getAttribute('data-rec-key') ?? ''
      if (labels.includes(label)) {
        kbd.classList.add('rec-key-active')
      }
    })
  }

  /** popアニメ付きハイライト。既にactiveな要素はそのまま維持 */
  function pop(labels: string[]) {
    el.querySelectorAll('.rec-key').forEach(kbd => {
      const label = kbd.getAttribute('data-rec-key') ?? ''
      if (labels.includes(label)) {
        kbd.classList.add('rec-key-active')
        kbd.classList.remove('rec-key-pop')
        void (kbd as HTMLElement).offsetHeight
        kbd.classList.add('rec-key-pop')
      }
    })
  }

  function clear() {
    el.querySelectorAll('.rec-key').forEach(kbd => {
      kbd.classList.remove('rec-key-active', 'rec-key-pop')
    })
  }

  return { el, show, hide, activate, pop, flash, clear }
}
