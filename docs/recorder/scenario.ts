/**
 * 録画シナリオ — カーニング操作を自動再生する
 */

import type { KeyIndicator } from './key-indicator'

// ---------------------------------------------------------------------------
// シミュレーション関数（tour.ts からコピー、既存ファイル変更なし）
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function simulateKey(key: string, code: string | undefined, modifiers: Record<string, boolean> = {}) {
  const o = { key, code: code ?? key, bubbles: true, ...modifiers }
  window.dispatchEvent(new KeyboardEvent('keydown', o))
  window.dispatchEvent(new KeyboardEvent('keyup', o))
}

function simulateClick(el: HTMLElement, x?: number, y?: number) {
  const rect = el.getBoundingClientRect()
  const cx = x ?? rect.left + rect.width / 2
  const cy = y ?? rect.top + rect.height / 2
  el.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: cx, clientY: cy }))
}

// --- ハイライトリング（demoと同じ） ---

const HIGHLIGHT_STYLE_ID = 'rec-highlight-style'

function ensureHighlightStyle() {
  if (document.getElementById(HIGHLIGHT_STYLE_ID)) return
  const style = document.createElement('style')
  style.id = HIGHLIGHT_STYLE_ID
  style.textContent = `
    .rec-highlight-ring {
      outline: 2px solid #f5a623 !important;
      outline-offset: 3px !important;
      border-radius: 6px;
    }
  `
  document.head.appendChild(style)
}

let highlightedEl: HTMLElement | null = null

function highlight(el: HTMLElement) {
  ensureHighlightStyle()
  clearHighlight()
  el.classList.add('rec-highlight-ring')
  highlightedEl = el
}

function clearHighlight() {
  if (highlightedEl) {
    highlightedEl.classList.remove('rec-highlight-ring')
    highlightedEl = null
  }
}

// --- クリック演出（大きめリップル + カーソルドット） ---

function ensureClickStyle() {
  if (document.getElementById('rec-click-style')) return
  const style = document.createElement('style')
  style.id = 'rec-click-style'
  style.textContent = `
    .rec-cursor-dot {
      position: fixed;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: rgba(245, 166, 35, 0.9);
      box-shadow: 0 0 12px rgba(245, 166, 35, 0.5);
      pointer-events: none;
      z-index: 100003;
      transform: translate(-50%, -50%);
      transition: opacity 0.2s;
    }
  `
  document.head.appendChild(style)
}

let cursorDot: HTMLElement | null = null

function showCursorAt(x: number, y: number) {
  ensureClickStyle()
  if (!cursorDot) {
    cursorDot = document.createElement('div')
    cursorDot.className = 'rec-cursor-dot'
    cursorDot.setAttribute('data-visual-kerning-ignore', 'true')
    cursorDot.style.opacity = '0'
    document.body.appendChild(cursorDot)
  }
  cursorDot.style.left = `${x}px`
  cursorDot.style.top = `${y}px`
  cursorDot.style.opacity = '1'
}

function hideCursor() {
  if (cursorDot) cursorDot.style.opacity = '0'
}

function showClickRipple(x: number, y: number): void {
  const ripple = document.createElement('div')
  ripple.setAttribute('data-visual-kerning-ignore', 'true')
  Object.assign(ripple.style, {
    position: 'fixed',
    left: `${x}px`,
    top: `${y}px`,
    width: '0px',
    height: '0px',
    borderRadius: '50%',
    border: '2.5px solid rgba(245, 166, 35, 0.85)',
    pointerEvents: 'none',
    zIndex: '100002',
    transform: 'translate(-50%, -50%)',
  })
  document.body.appendChild(ripple)
  ripple.animate([
    { width: '0px', height: '0px', opacity: 1 },
    { width: '72px', height: '72px', opacity: 0 },
  ], { duration: 600, easing: 'ease-out', fill: 'forwards' })
  setTimeout(() => ripple.remove(), 600)
}

/** カーソルドットをターゲットに移動 → リップル → クリック */
async function animatedClick(el: HTMLElement, x: number, y: number) {
  showCursorAt(x, y)
  await sleep(250)
  showClickRipple(x, y)
  simulateClick(el, x, y)
  await sleep(200)
  hideCursor()
}

// ---------------------------------------------------------------------------
// ヘルパー
// ---------------------------------------------------------------------------

const isMac = navigator.platform.includes('Mac')

/**
 * キーを繰り返し押す + インジケータ連動
 * 表示 → 一拍 → 実行 → 一拍 → 消す
 */
async function repeatKey(
  indicator: KeyIndicator,
  opts: {
    key: string
    code: string
    modifiers?: Record<string, boolean>
    repeat: number
    interval: number
    display: { label: string; active?: boolean }[]
    flashLabels: string[]
    holdLabels?: string[]
  },
) {
  indicator.show(opts.display)

  // holdKeys を押しっぱなし表示（popなし）
  if (opts.holdLabels?.length) {
    indicator.activate(opts.holdLabels)
  }

  // 表示してから一拍待つ
  await sleep(250)

  for (let i = 0; i < opts.repeat; i++) {
    indicator.pop(opts.flashLabels)
    simulateKey(opts.key, opts.code, opts.modifiers)
    if (i < opts.repeat - 1) await sleep(opts.interval)
  }

  // 実行後に一拍待ってから消す
  await sleep(250)
  indicator.clear()
}

// --- ファイルアイコン投げアニメーション（demo/tutorial.ts から移植） ---

function animateJsonDownload(anchor: HTMLElement): Promise<void> {
  const rect = anchor.getBoundingClientRect()
  const startX = rect.left + rect.width / 2 - 36
  const startY = rect.top + rect.height / 2 - 45

  const icon = document.createElement('div')
  icon.setAttribute('data-visual-kerning-ignore', 'true')

  const parser = new DOMParser()
  const svgDoc = parser.parseFromString(
    '<svg width="72" height="90" viewBox="0 0 48 60" fill="none" xmlns="http://www.w3.org/2000/svg">'
    + '<path d="M4 0h28l16 16v40a4 4 0 01-4 4H4a4 4 0 01-4-4V4a4 4 0 014-4z" fill="#fff"/>'
    + '<path d="M32 0l16 16H36a4 4 0 01-4-4V0z" fill="#ddd"/>'
    + '<path d="M4 0h28l16 16v40a4 4 0 01-4 4H4a4 4 0 01-4-4V4a4 4 0 014-4z" stroke="#ccc" stroke-width="1" fill="none"/>'
    + '<text x="24" y="42" text-anchor="middle" fill="#1a1a1a" font-family="ui-monospace,SFMono-Regular,monospace" font-size="16" font-weight="700">{ }</text>'
    + '</svg>',
    'image/svg+xml',
  )
  icon.appendChild(svgDoc.documentElement)

  Object.assign(icon.style, {
    position: 'fixed',
    left: `${startX}px`,
    top: `${startY}px`,
    zIndex: '100002',
    pointerEvents: 'none',
    filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.25))',
  })
  document.body.appendChild(icon)
  icon.offsetHeight

  const totalDuration = 1200
  const frames: Keyframe[] = []
  const v0 = -14
  const g = 0.45
  const numFrames = 30

  for (let i = 0; i <= numFrames; i++) {
    const t = i / numFrames
    const time = t * totalDuration / 16
    const y = v0 * time + 0.5 * g * time * time
    const rotation = -8 + t * 20
    frames.push({
      transform: `translateY(${y}px) rotate(${rotation}deg)`,
      opacity: 1,
      offset: t,
    })
  }

  const anim = icon.animate(frames, {
    duration: totalDuration,
    easing: 'linear',
    fill: 'forwards',
  })

  return new Promise(resolve => {
    anim.onfinish = () => { icon.remove(); resolve() }
  })
}

// ---------------------------------------------------------------------------
// メインシナリオ
// ---------------------------------------------------------------------------

const HERO_SELECTOR = '.hero'

export async function runRecording(
  indicator: KeyIndicator,
): Promise<void> {
  const altLabel = isMac ? '⌥' : 'Alt'

  // --- 1. 待機: 初期状態を見せる ---
  await sleep(500)

  // --- 3. heroタイトルをクリック ---
  const hero = document.querySelector(HERO_SELECTOR) as HTMLElement | null
  if (!hero) return

  const spans = hero.querySelectorAll('.visual-kerning-char')
  if (spans.length > 0) {
    const span = spans[Math.min(3, spans.length - 1)] as HTMLElement
    const rect = span.getBoundingClientRect()
    await animatedClick(hero, rect.right, rect.top + rect.height / 2)
  } else {
    const rect = hero.getBoundingClientRect()
    await animatedClick(hero, rect.left + rect.width / 2, rect.top + rect.height / 2)
  }
  await sleep(500)

  // --- 4. カーソル移動 ---
  await repeatKey(indicator, {
    key: 'ArrowRight', code: 'ArrowRight',
    repeat: 3, interval: 120,
    display: [{ label: '→' }],
    flashLabels: ['→'],
  })
  await sleep(200)

  // --- 5. 個別カーニング調整 ---
  // 広げる
  await repeatKey(indicator, {
    key: 'ArrowRight', code: 'ArrowRight',
    modifiers: { altKey: true },
    repeat: 6, interval: 150,
    display: [{ label: altLabel }, { label: '→' }],
    flashLabels: ['→'],
    holdLabels: [altLabel],
  })
  await sleep(300)

  // 戻す + さらに詰める
  await repeatKey(indicator, {
    key: 'ArrowLeft', code: 'ArrowLeft',
    modifiers: { altKey: true },
    repeat: 9, interval: 150,
    display: [{ label: altLabel }, { label: '←' }],
    flashLabels: ['←'],
    holdLabels: [altLabel],
  })
  await sleep(300)

  // 少し広げて仕上げ
  await repeatKey(indicator, {
    key: 'ArrowRight', code: 'ArrowRight',
    modifiers: { altKey: true },
    repeat: 3, interval: 150,
    display: [{ label: altLabel }, { label: '→' }],
    flashLabels: ['→'],
    holdLabels: [altLabel],
  })
  await sleep(500)
  indicator.hide()
  await sleep(350)

  // --- 6. 範囲選択 ---
  await repeatKey(indicator, {
    key: 'ArrowRight', code: 'ArrowRight',
    modifiers: { shiftKey: true },
    repeat: 4, interval: 200,
    display: [{ label: '⇧' }, { label: '→' }],
    flashLabels: ['→'],
    holdLabels: ['⇧'],
  })
  await sleep(350)

  // --- 7. 一括カーニング ---
  await repeatKey(indicator, {
    key: 'ArrowLeft', code: 'ArrowLeft',
    modifiers: { altKey: true },
    repeat: 5, interval: 150,
    display: [{ label: altLabel }, { label: '←' }],
    flashLabels: ['←'],
    holdLabels: [altLabel],
  })
  await sleep(500)
  indicator.hide()
  await sleep(400)

  // --- 8. Guides 表示 ---
  const guidesBtn = document.querySelector('.js-gaps') as HTMLElement | null
  if (guidesBtn) {
    highlight(guidesBtn)
    await sleep(350)
    const gr = guidesBtn.getBoundingClientRect()
    await animatedClick(guidesBtn, gr.left + gr.width / 2, gr.top + gr.height / 2)
    await sleep(1200)
    await animatedClick(guidesBtn, gr.left + gr.width / 2, gr.top + gr.height / 2)
    await sleep(500)
    clearHighlight()
  }

  // --- 9. Before/After 比較 ---
  const compareBtn = document.querySelector('.js-compare') as HTMLElement | null
  if (compareBtn) {
    highlight(compareBtn)
    await sleep(350)
    const cr = compareBtn.getBoundingClientRect()
    await animatedClick(compareBtn, cr.left + cr.width / 2, cr.top + cr.height / 2)
    await sleep(1200)
    await animatedClick(compareBtn, cr.left + cr.width / 2, cr.top + cr.height / 2)
    await sleep(500)
    clearHighlight()
  }

  // --- 10. Export（ファイルアイコン投げ、実際のダウンロードは抑止） ---
  const exportBtn = document.querySelector('.js-export') as HTMLElement | null
  if (exportBtn) {
    highlight(exportBtn)
    await sleep(350)
    const er = exportBtn.getBoundingClientRect()
    // クリックイベントを一時的に横取りしてダウンロードを抑止
    const blockClick = (e: Event) => { e.stopImmediatePropagation(); e.preventDefault() }
    exportBtn.addEventListener('click', blockClick, { capture: true })
    await animatedClick(exportBtn, er.left + er.width / 2, er.top + er.height / 2)
    exportBtn.removeEventListener('click', blockClick, { capture: true })
    await animateJsonDownload(exportBtn)
    await sleep(500)
    clearHighlight()
  }

  // --- 11. 終了: 最終状態を見せる ---
  indicator.hide()
  await sleep(1500)
}
