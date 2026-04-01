import { createKerningEditor } from '../src/kerningUI'
import { ACTIVE_CLASS, CHAR_CLASS, MODIFIED_CLASS, STORAGE_KEY } from '../src/kerningEditor'
import kerningData from './kerning-export.json'
import { createTour } from './tour'
import { buildTutorialSteps, simulateCmdK, TUTORIAL_DONE_KEY } from './tutorial'

type PersistedArea = { text: string; kerning: number[]; indent: number; font: { family: string; weight: string; size: string } }

const IMPORTED_KEY = 'typespacing-editor-imported'

function areasToPersistedMap(areas: typeof kerningData.areas): Record<string, PersistedArea> {
  const persisted: Record<string, PersistedArea> = {}
  for (const area of areas) {
    persisted[area.selector] = {
      text: area.text,
      kerning: [...area.kerning],
      indent: area.indent ?? 0,
      font: area.font,
    }
  }
  return persisted
}

// ドロップインポート時: インポートデータを維持、フラグ消化
// 通常時: localStorageクリア → バンドルJSONを書き込み
if (localStorage.getItem(IMPORTED_KEY)) {
  localStorage.removeItem(IMPORTED_KEY)
} else {
  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem(TUTORIAL_DONE_KEY)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(areasToPersistedMap(kerningData.areas)))
}

const editor = createKerningEditor({ locale: 'en' })
editor.mount()

// チュートリアル済みならエディタONで開始、初回はOFFでチュートリアルから
if (localStorage.getItem(TUTORIAL_DONE_KEY)) {
  editor.plugin.enabled.value = true
}

const tour = createTour({
  doneKey: TUTORIAL_DONE_KEY,
  steps: buildTutorialSteps((handler) => editor.plugin.on('enable', handler)),
  onBeforeReplay: () => simulateCmdK(),
  ignoreAttr: 'data-typespacing-ignore',
})
tour.start()

// ロード完了後のlocalStorage状態を記録し、変更があれば離脱時に警告
let initialState = ''
setTimeout(() => {
  initialState = localStorage.getItem(STORAGE_KEY) ?? ''
}, 0)
window.addEventListener('beforeunload', (e) => {
  if (tour.active) return
  const current = localStorage.getItem(STORAGE_KEY) ?? ''
  if (current !== initialState) {
    e.preventDefault()
  }
})

function exportAndReset() {
  const json = JSON.stringify(editor.plugin.exportJSON(), null, 2)
  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem(IMPORTED_KEY)
  return json
}

const globals = window as unknown as { __kerningDemo?: typeof editor; exportKerning?: typeof exportAndReset }
globals.__kerningDemo = editor
globals.exportKerning = exportAndReset

// --- Card size sliders ---
document.querySelectorAll('.card-size-slider').forEach(slider => {
  const input = slider.querySelector('input[type="range"]') as HTMLInputElement
  const output = slider.querySelector('output') as HTMLOutputElement
  const target = slider.closest('.card')?.querySelector('[data-sizable]') as HTMLElement | null
  if (!input || !output || !target) return

  input.addEventListener('input', () => {
    output.textContent = `${input.value}px`
    target.style.setProperty('--size', input.value)
  })
})

// --- Sandbox ---

const GOOGLE_FONTS = [
  'Inter', 'Roboto', 'Open Sans', 'Montserrat', 'Lato', 'Oswald', 'Raleway',
  'Poppins', 'Playfair Display', 'Merriweather', 'Bebas Neue', 'Space Grotesk',
  'DM Sans', 'DM Serif Display', 'Libre Baskerville', 'Cormorant Garamond',
  'Noto Sans JP', 'Noto Serif JP', 'M PLUS 1p', 'Zen Kaku Gothic New',
  'Zen Old Mincho', 'BIZ UDPGothic', 'BIZ UDPMincho', 'DotGothic16',
  'Source Code Pro', 'JetBrains Mono', 'IBM Plex Sans', 'IBM Plex Serif',
  'Archivo', 'Sora', 'Outfit', 'Barlow', 'Barlow Condensed',
  'Crimson Text', 'Fraunces', 'Bricolage Grotesque',
]

const loadedFonts = new Set<string>()

function loadGoogleFont(family: string, weight: string) {
  const key = `${family}:${weight}`
  if (loadedFonts.has(key)) return
  loadedFonts.add(key)
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&display=swap`
  document.head.appendChild(link)
}

const fontSelect = document.getElementById('sb-font') as HTMLSelectElement
const fontCustom = document.getElementById('sb-font-custom') as HTMLInputElement
const sizeInput = document.getElementById('sb-size') as HTMLInputElement
const weightSelect = document.getElementById('sb-weight') as HTMLSelectElement
const textInput = document.getElementById('sb-input') as HTMLTextAreaElement
const preview = document.getElementById('sb-preview') as HTMLParagraphElement
const exportBtn = document.getElementById('sb-export') as HTMLButtonElement
const resizeHandle = document.getElementById('sb-resize') as HTMLDivElement
const sandboxBody = document.getElementById('sb-body') as HTMLDivElement

// Font selector
fontSelect.append(...GOOGLE_FONTS.map(f => new Option(f, f)))
fontSelect.value = 'Inter'

function getSelectedFont(): string {
  return fontCustom.value.trim() || fontSelect.value
}

function updatePreviewStyle() {
  const family = getSelectedFont()
  const size = sizeInput.value
  const weight = weightSelect.value
  loadGoogleFont(family, weight)
  preview.style.fontFamily = `'${family}', sans-serif`
  preview.style.fontSize = `${size}px`
  preview.style.fontWeight = weight
}

function updatePreviewText() {
  const text = textInput.value
  // 既存のカーニング状態をリセットするため、エディタのareaを削除
  const areas = editor.plugin.areas.value
  for (const [selector, area] of areas) {
    if (area.el === preview) {
      area.el.classList.remove(ACTIVE_CLASS, MODIFIED_CLASS)
      areas.delete(selector)
      break
    }
  }
  preview.textContent = text
}

textInput.addEventListener('input', updatePreviewText)
fontSelect.addEventListener('change', () => {
  fontCustom.value = ''
  updatePreviewStyle()
})
fontCustom.addEventListener('input', () => {
  if (fontCustom.value.trim()) fontSelect.value = ''
  updatePreviewStyle()
})
sizeInput.addEventListener('input', updatePreviewStyle)
weightSelect.addEventListener('change', updatePreviewStyle)

// Resize handle
let resizing = false
let resizeStartX = 0
let resizeStartW = 0

resizeHandle.addEventListener('pointerdown', (e: PointerEvent) => {
  e.preventDefault()
  resizing = true
  resizeStartX = e.clientX
  resizeStartW = sandboxBody.offsetWidth
  resizeHandle.classList.add('is-dragging')
  resizeHandle.setPointerCapture(e.pointerId)
})

resizeHandle.addEventListener('pointermove', (e: PointerEvent) => {
  if (!resizing) return
  const delta = e.clientX - resizeStartX
  const newW = Math.max(200, resizeStartW + delta)
  sandboxBody.style.maxWidth = `${newW}px`
})

function stopResize() {
  resizing = false
  resizeHandle.classList.remove('is-dragging')
}
resizeHandle.addEventListener('pointerup', stopResize)
resizeHandle.addEventListener('pointercancel', stopResize)

// --- Import JSON via drag & drop on editor panel ---
const panel = document.querySelector('.typespacing-panel') as HTMLElement | null
if (panel) {
  const dropOverlay = document.createElement('div')
  dropOverlay.textContent = 'Drop JSON to import'
  Object.assign(dropOverlay.style, {
    display: 'none',
    position: 'absolute',
    inset: '0',
    background: 'rgba(26, 26, 26, 0.85)',
    color: '#fff',
    font: '600 13px/1 "Space Grotesk", sans-serif',
    letterSpacing: '0.06em',
    borderRadius: 'inherit',
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
    zIndex: '1',
  })
  panel.style.position = 'relative'
  panel.appendChild(dropOverlay)

  let dragCount = 0

  panel.addEventListener('dragenter', (e) => {
    e.preventDefault()
    dragCount++
    dropOverlay.style.display = 'flex'
  })

  panel.addEventListener('dragleave', () => {
    dragCount--
    if (dragCount <= 0) {
      dragCount = 0
      dropOverlay.style.display = 'none'
    }
  })

  panel.addEventListener('dragover', (e) => {
    e.preventDefault()
    ;(e as DragEvent).dataTransfer!.dropEffect = 'copy'
  })

  panel.addEventListener('drop', (e) => {
    e.preventDefault()
    dragCount = 0
    dropOverlay.style.display = 'none'
    const file = (e as DragEvent).dataTransfer?.files[0]
    if (!file || !file.name.endsWith('.json')) return

    file.text().then((text) => {
      try {
        const data = JSON.parse(text)
        if (!data.areas || !Array.isArray(data.areas)) {
          console.warn('[typespacing] Invalid kerning JSON')
          return
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(areasToPersistedMap(data.areas)))
        localStorage.setItem(IMPORTED_KEY, '1')
        location.reload()
      } catch {
        console.warn('[typespacing] Failed to parse dropped JSON')
      }
    })
  })
}

// Export HTML
exportBtn.addEventListener('click', () => {
  const clone = preview.cloneNode(true) as HTMLElement
  // typespacing の編集用クラスを除去
  clone.classList.remove(ACTIVE_CLASS, MODIFIED_CLASS, 'sandbox-preview')
  clone.querySelectorAll('[class]').forEach(el => {
    const classes = Array.from(el.classList).filter(c => !c.startsWith('typespacing-'))
    if (classes.length === 0) {
      el.removeAttribute('class')
    } else {
      el.className = classes.join(' ')
    }
  })

  const family = getSelectedFont()
  const size = sizeInput.value
  const weight = weightSelect.value
  const style = `font-family:'${family}',sans-serif; font-size:${size}px; font-weight:${weight}; line-height:1.1;`
  clone.setAttribute('style', style + ' ' + (clone.getAttribute('style') || ''))

  // span のインラインスタイルから letter-spacing:0em を除去（不要）
  clone.querySelectorAll(`span.${CHAR_CLASS}`).forEach(span => {
    span.style.removeProperty('letter-spacing')
    if (!span.getAttribute('style')?.trim()) span.removeAttribute('style')
  })

  const html = clone.outerHTML
  const blob = new Blob([html], { type: 'text/html' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'typespacing-export.html'
  a.click()
  URL.revokeObjectURL(a.href)
})
