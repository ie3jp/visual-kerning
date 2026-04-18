/**
 * Kerning Editor — ブラウザ上でペアカーニングを直接調整するツール。
 */
import {
  ACTIVE_CLASS,
  CHAR_CLASS,
  MODIFIED_CLASS,
  applyKerningToSpans,
  collectKerningText,
  extractKerningFromWrapped,
  getSingleCharSpans,
  KERNING_FORMAT_VERSION,
  normalizeKerning,
  normalizeKerningForText,
  wrapElementWithKerning,
  type KerningArea,
  type KerningExport,
} from './applyKerning'
import {
  collectBreakPositions,
  getCharSpans,
  getFontInfo,
  isOurWrapped,
} from './kerningEditorDom'
import { createKeyboardController } from './kerningEditorKeyboard'
import { createMouseController } from './kerningEditorMouse'
import {
  LOG_PREFIX,
  TOOL_NAME,
  loadPersistedData,
  removePersistedData,
  savePersistedData,
  seedPersistedKerningData,
} from './kerningEditorStorage'
import {
  getGapRect,
  getSelectionGapRects,
  type CursorRect,
} from './kerningEditorMath'
import { generateSelector } from './cssSelector'
import { createSelectionController } from './kerningEditorSelection'
import {
  derivedValueBox,
  valueBox,
  watchedValueBox,
  type ValueBox,
} from './reactiveValue'
import { createTypedEventEmitter, type TypedEventEmitter } from './typedEventEmitter'
import type { PersistedKerningArea } from './validation'

export { LOG_PREFIX, STORAGE_KEY, TOOL_NAME } from './kerningEditorStorage'
export type { ValueBox } from './reactiveValue'

export interface KerningChangeDetail {
  selector: string
  kerning: number[]
  indent: number
}

export interface KerningSelectDetail {
  selector: string | null
  gapIndex: number
  gapIndexEnd: number | null
}

export interface VisualKerningEventMap {
  enable: undefined
  disable: undefined
  change: KerningChangeDetail
  select: KerningSelectDetail
  reset: undefined
}

export interface VisualKerningEmitter extends TypedEventEmitter<VisualKerningEventMap> {}

export { ACTIVE_CLASS, CHAR_CLASS, MODIFIED_CLASS } from './applyKerning'
export const OVERLAY_CLASS = 'visual-kerning-overlay'

export interface VisualKerningArea {
  selector: string
  el: HTMLElement
  text: string
  originalHTML: string
  kerning: number[]
  indent: number
  font: KerningArea['font']
  brPositions: number[]
}

export interface SelectionRange {
  rects: CursorRect[]
}

export interface GapMarker {
  x: number
  y: number
  h: number
  value: number
}

export interface VisualKerningPlugin extends VisualKerningEmitter {
  name: string
  enabled: ValueBox<boolean>
  compareMode: ValueBox<boolean>
  showGapMarkers: ValueBox<boolean>
  mount(): Promise<void>
  unmount(): void
  areas: ValueBox<Map<string, VisualKerningArea>>
  activeSelector: ValueBox<string | null>
  cursorGap: ValueBox<number>
  cursorGapEnd: ValueBox<number | null>
  cursorRect: ValueBox<CursorRect | null>
  selectionRange: ValueBox<SelectionRange | null>
  cursorValue: ValueBox<number>
  gapMarkers: ValueBox<GapMarker[]>
  modifiedCount: ValueBox<number>
  exportJSON(): KerningExport
  toggleCompareMode(): void
  resetAll(): void
  importJSON(data: KerningExport): void
}

function isAreaModified(area: Pick<VisualKerningArea, 'indent' | 'kerning'>): boolean {
  return area.indent !== 0 || area.kerning.some(k => k !== 0)
}

function toPersistedData(areas: Map<string, VisualKerningArea>): Record<string, PersistedKerningArea> {
  const data: Record<string, PersistedKerningArea> = {}
  areas.forEach((area, selector) => {
    if (isAreaModified(area)) {
      data[selector] = {
        text: area.text,
        kerning: [...area.kerning],
        indent: area.indent,
        font: area.font,
      }
    }
  })
  return data
}

function wrapText(el: HTMLElement, kerning: number[], indent = 0): { brPositions: number[] } {
  const { brPositions } = wrapElementWithKerning(el, kerning, {
    indent,
    spanClassName: CHAR_CLASS,
  })
  return { brPositions }
}

function restoreOriginalText(el: HTMLElement, originalHTML: string) {
  el.innerHTML = originalHTML
}

export function createVisualKerningPlugin(): VisualKerningPlugin {
  const emitter = createTypedEventEmitter<VisualKerningEventMap>()
  let loadTimerId = 0
  const enabled = valueBox(false)
  const compareMode = valueBox(false)
  const showGapMarkers = watchedValueBox(false, () => updateGapMarkers())
  const areas = valueBox(new Map<string, VisualKerningArea>())
  const activeSelector = valueBox<string | null>(null)
  const cursorGap = valueBox(-2)
  const cursorGapEnd = valueBox<number | null>(null)
  const cursorRect = valueBox<CursorRect | null>(null)
  const selectionRange = valueBox<SelectionRange | null>(null)
  const cursorValue = valueBox(0)
  const gapMarkers = valueBox<GapMarker[]>([])
  const modifiedCount = derivedValueBox(
    () => Array.from(areas.value.values()).filter(area => isAreaModified(area)).length,
  )

  const selection = createSelectionController({ cursorGap, cursorGapEnd })
  const { hasSelection, getSelectionBounds, collapseSelection, adjustableGapIndices } = selection

  function gapValue(area: VisualKerningArea, gap: number): number {
    return gap === -1 ? area.indent : (area.kerning[gap] ?? 0)
  }

  function syncModifiedFlag(area: VisualKerningArea) {
    if (isAreaModified(area)) area.el.classList.add(MODIFIED_CLASS)
    else area.el.classList.remove(MODIFIED_CLASS)
  }

  function emitSelect() {
    emitter.emit('select', {
      selector: activeSelector.value,
      gapIndex: cursorGap.value,
      gapIndexEnd: cursorGapEnd.value,
    })
  }

  function emitAreaChange(area: VisualKerningArea) {
    emitter.emit('change', {
      selector: area.selector,
      kerning: [...area.kerning],
      indent: area.indent,
    })
  }

  function persistAreas() {
    savePersistedData(toPersistedData(areas.value))
  }

  function deactivate() {
    if (activeSelector.value) {
      const area = areas.value.get(activeSelector.value)
      if (area) area.el.classList.remove(ACTIVE_CLASS)
    }
    activeSelector.value = null
    cursorGap.value = -2
    cursorGapEnd.value = null
    cursorRect.value = null
    selectionRange.value = null
    cursorValue.value = 0
    updateGapMarkers()
  }

  function updateCursor() {
    const selector = activeSelector.value
    const gap = cursorGap.value
    if (!selector || gap < -1) {
      cursorRect.value = null
      selectionRange.value = null
      cursorValue.value = 0
      return
    }

    const area = areas.value.get(selector)
    if (!area) return
    const spans = getCharSpans(area.el)

    if (hasSelection()) {
      const bounds = getSelectionBounds()!
      const rects: CursorRect[] = []
      for (let i = bounds[0]; i <= bounds[1]; i++) {
        for (const r of getSelectionGapRects(spans, i)) rects.push(r)
      }
      selectionRange.value = rects.length > 0 ? { rects } : null
      cursorRect.value = null
      // 範囲選択時の表示値: 調整対象ギャップの平均（操作と表示を一致させる）
      const indices = adjustableGapIndices(bounds, spans)
      if (indices.length > 0) {
        const sum = indices.reduce((acc, i) => acc + gapValue(area, i), 0)
        cursorValue.value = Math.round(sum / indices.length)
      } else {
        cursorValue.value = 0
      }
    } else {
      selectionRange.value = null
      cursorRect.value = getGapRect(spans, gap)
      cursorValue.value = gapValue(area, gap)
    }
    updateGapMarkers()
  }

  function updateGapMarkers() {
    if (!showGapMarkers.value) {
      gapMarkers.value = []
      return
    }
    const markers: GapMarker[] = []
    areas.value.forEach((area) => {
      if (!isAreaModified(area)) return
      const spans = getCharSpans(area.el)
      if (area.indent !== 0) {
        const r = getGapRect(spans, -1)
        if (r) markers.push({ ...r, value: area.indent })
      }
      area.kerning.forEach((k, i) => {
        if (k === 0) return
        const r = getGapRect(spans, i)
        if (r) markers.push({ ...r, value: k })
      })
    })
    gapMarkers.value = markers
  }

  function applyAreaPreview(area: VisualKerningArea) {
    const spans = getCharSpans(area.el)
    if (compareMode.value) {
      applyKerningToSpans(spans, new Array(area.kerning.length).fill(0), 0)
      return
    }
    applyKerningToSpans(spans, area.kerning, area.indent)
  }

  function applyPreviewToAllAreas() {
    areas.value.forEach((area) => applyAreaPreview(area))
  }

  function setCompareMode(next: boolean) {
    if (compareMode.value === next) return
    compareMode.value = next
    applyPreviewToAllAreas()
    updateCursor()
  }

  function toggleCompareMode() {
    setCompareMode(!compareMode.value)
  }

  function ensureEditableArea(textEl: HTMLElement, selector: string) {
    if (textEl.tagName === 'SPAN') {
      console.warn(
        `${LOG_PREFIX} Target element is a <span>: "${selector}". `
        + 'Wrapping may produce nested spans. Consider using a block-level element (e.g. <p>, <div>, <h1>) as the kerning target.',
      )
    }

    if (getSingleCharSpans(textEl) && !isOurWrapped(textEl)) {
      const imported = extractKerningFromWrapped(textEl)
      if (!imported) return
      const font = getFontInfo(textEl)
      const originalHTML = textEl.innerHTML
      const kerning = normalizeKerningForText(imported.kerning, imported.text)
      const { brPositions } = wrapText(textEl, kerning, imported.indent)
      textEl.classList.add(MODIFIED_CLASS)
      areas.value.set(selector, {
        selector,
        el: textEl,
        text: imported.text,
        originalHTML,
        kerning,
        indent: imported.indent,
        font,
        brPositions,
      })
    }

    if (!isOurWrapped(textEl)) {
      const text = collectKerningText(textEl)
      const originalHTML = textEl.innerHTML
      const kerning = normalizeKerningForText([], text)
      const font = getFontInfo(textEl)
      const { brPositions } = wrapText(textEl, kerning)
      areas.value.set(selector, {
        selector,
        el: textEl,
        text,
        originalHTML,
        kerning,
        indent: 0,
        font,
        brPositions,
      })
    }
  }

  const mouseController = createMouseController({
    overlayClass: OVERLAY_CLASS,
    enabled,
    activeSelector,
    cursorGap,
    cursorGapEnd,
    areas,
    ensureEditableArea,
    applyAreaPreview,
    updateCursor,
    deactivate,
    emitSelect,
  })

  function toggleEnabled() {
    enabled.value = !enabled.value
    if (enabled.value) {
      emitter.emit('enable', undefined)
    } else {
      setCompareMode(false)
      deactivate()
      emitter.emit('disable', undefined)
    }
  }

  const keyboardController = createKeyboardController({
    enabled,
    activeSelector,
    cursorGap,
    cursorGapEnd,
    areas,
    selection,
    applyAreaPreview,
    syncModifiedFlag,
    toggleEnabled,
    toggleCompareMode,
    updateCursor,
    deactivate,
    emitSelect,
    emitAreaChange,
    persistAreas,
  })

  function onScrollOrResize() {
    if (cursorRect.value || selectionRange.value) updateCursor()
    else updateGapMarkers()
  }

  function exportJSON(): KerningExport {
    const exportAreas: KerningArea[] = []
    areas.value.forEach((area) => {
      if (!isAreaModified(area)) return
      exportAreas.push({
        selector: area.selector,
        text: area.text,
        font: area.font,
        indent: area.indent,
        kerning: [...area.kerning],
      })
    })

    return {
      version: KERNING_FORMAT_VERSION,
      exported: new Date().toISOString(),
      page: location.pathname,
      areas: exportAreas,
    }
  }

  function clearAreas() {
    areas.value.forEach((area) => {
      area.el.classList.remove(ACTIVE_CLASS, MODIFIED_CLASS)
      restoreOriginalText(area.el, area.originalHTML)
    })
    areas.value.clear()
    setCompareMode(false)
    deactivate()
  }

  function resetAll() {
    clearAreas()
    removePersistedData()
    emitter.emit('reset', undefined)
  }

  function importJSON(data: KerningExport) {
    clearAreas()
    seedPersistedKerningData(data)
    load()
  }

  function load() {
    const data = loadPersistedData()
    for (const [selector, info] of Object.entries(data)) {
      const el = document.querySelector(selector) as HTMLElement | null
      if (!el) continue

      const indent = info.indent ?? 0
      const existingSpans = getSingleCharSpans(el)
      const isOurs = existingSpans?.every(s => s.classList.contains(CHAR_CLASS))

      if (existingSpans && isOurs) {
        const originalHTML = el.innerHTML
        const kerning = normalizeKerning(info.kerning, existingSpans.length)
        applyKerningToSpans(existingSpans, kerning, indent)
        el.classList.add(MODIFIED_CLASS)
        const brPositions = collectBreakPositions(el)

        areas.value.set(selector, {
          selector,
          el,
          text: info.text,
          originalHTML,
          kerning,
          indent,
          font: info.font,
          brPositions,
        })
      } else {
        const text = collectKerningText(el)
        if (text !== info.text) continue

        const originalHTML = el.innerHTML
        const kerning = normalizeKerningForText(info.kerning, text)
        const { brPositions } = wrapText(el, kerning, indent)
        el.classList.add(MODIFIED_CLASS)

        areas.value.set(selector, {
          selector,
          el,
          text,
          originalHTML,
          kerning,
          indent,
          font: info.font,
          brPositions,
        })
      }
    }
  }

  return {
    name: TOOL_NAME,
    on: emitter.on,
    enabled,
    compareMode,
    areas,
    activeSelector,
    cursorGap,
    cursorGapEnd,
    cursorRect,
    selectionRange,
    cursorValue,
    showGapMarkers,
    gapMarkers,
    modifiedCount,
    exportJSON,
    toggleCompareMode,
    resetAll,
    importJSON,
    mount() {
      mouseController.attach()
      keyboardController.attach()
      window.addEventListener('scroll', onScrollOrResize, true)
      window.addEventListener('resize', onScrollOrResize)
      return new Promise<void>((resolve) => {
        loadTimerId = window.setTimeout(() => {
          load()
          resolve()
        }, 0)
      })
    },
    unmount() {
      window.clearTimeout(loadTimerId)
      mouseController.detach()
      keyboardController.detach()
      deactivate()
      window.removeEventListener('scroll', onScrollOrResize, true)
      window.removeEventListener('resize', onScrollOrResize)
      const wasEnabled = enabled.value
      enabled.value = false
      setCompareMode(false)
      if (wasEnabled) emitter.emit('disable', undefined)
    },
  }
}
