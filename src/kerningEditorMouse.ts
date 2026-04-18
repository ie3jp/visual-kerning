import { ACTIVE_CLASS } from './applyKerning'
import { generateSelector } from './cssSelector'
import { findTextElement, getCharSpans, IGNORE_SELECTOR } from './kerningEditorDom'
import { findGapIndex, getGapRect } from './kerningEditorMath'
import type { ValueBox } from './reactiveValue'
import type { VisualKerningArea } from './kerningEditor'

export interface MouseControllerDeps {
  overlayClass: string
  enabled: ValueBox<boolean>
  activeSelector: ValueBox<string | null>
  cursorGap: ValueBox<number>
  cursorGapEnd: ValueBox<number | null>
  areas: ValueBox<Map<string, VisualKerningArea>>
  ensureEditableArea(textEl: HTMLElement, selector: string): void
  applyAreaPreview(area: VisualKerningArea): void
  updateCursor(): void
  deactivate(): void
  emitSelect(): void
}

export interface MouseController {
  attach(): void
  detach(): void
}

const DRAG_THRESHOLD = 3

export function createMouseController(deps: MouseControllerDeps): MouseController {
  const {
    overlayClass,
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
  } = deps

  let isDragging = false
  let dragStartX = 0
  let dragStartY = 0
  let dragTextEl: HTMLElement | null = null

  function onSelectStart(e: Event) {
    e.preventDefault()
  }

  function addDragListeners() {
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    document.addEventListener('selectstart', onSelectStart)
  }

  function removeDragListeners() {
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
    document.removeEventListener('selectstart', onSelectStart)
    isDragging = false
    dragTextEl = null
  }

  function resolveTarget(e: MouseEvent): Element | null {
    const raw = e.target as Node
    const el = raw.nodeType === Node.TEXT_NODE ? raw.parentElement : raw as Element
    if (!el) return null
    if (el.closest(`.${overlayClass}`) || el.closest('svg')) return null
    if (el.closest(IGNORE_SELECTOR)) return null
    return el
  }

  function onMouseDown(e: MouseEvent) {
    if (!enabled.value) return
    if (e.button !== 0) return

    const target = resolveTarget(e)
    if (!target) return

    const textEl = findTextElement(target)
    if (!textEl) {
      deactivate()
      return
    }

    e.preventDefault()
    e.stopPropagation()

    const selector = generateSelector(textEl)
    ensureEditableArea(textEl, selector)
    const currentArea = areas.value.get(selector)
    if (currentArea) applyAreaPreview(currentArea)

    if (activeSelector.value && activeSelector.value !== selector) {
      const prev = areas.value.get(activeSelector.value)
      if (prev) prev.el.classList.remove(ACTIVE_CLASS)
    }

    textEl.classList.add(ACTIVE_CLASS)
    const clickedGap = findGapIndex(getCharSpans(textEl), e.clientX, e.clientY)

    // Shift+クリック: 現在位置から範囲拡張（既存 activeSelector と同一要素が対象）
    if (e.shiftKey && activeSelector.value === selector && cursorGap.value >= -1) {
      cursorGapEnd.value = clickedGap
      updateCursor()
      emitSelect()
      removeDragListeners()
      dragTextEl = textEl
      isDragging = true
      addDragListeners()
      return
    }

    // 通常クリック: 単一位置にカーソル、以降ドラッグで範囲へ伸ばす
    activeSelector.value = selector
    cursorGap.value = clickedGap
    cursorGapEnd.value = null
    updateCursor()

    // removeDragListeners が dragTextEl をクリアするため先に呼ぶ
    removeDragListeners()
    dragStartX = e.clientX
    dragStartY = e.clientY
    dragTextEl = textEl
    isDragging = false
    addDragListeners()
  }

  function onMouseMove(e: MouseEvent) {
    if (!dragTextEl) return

    if (!isDragging) {
      const dx = e.clientX - dragStartX
      const dy = e.clientY - dragStartY
      if (dx * dx + dy * dy < DRAG_THRESHOLD * DRAG_THRESHOLD) return
      isDragging = true
    }

    const spans = getCharSpans(dragTextEl)
    let stickyLineY: number | undefined
    if (cursorGapEnd.value !== null) {
      const prevRect = getGapRect(spans, cursorGapEnd.value)
      if (prevRect) stickyLineY = prevRect.y + prevRect.h / 2
    }
    cursorGapEnd.value = findGapIndex(spans, e.clientX, e.clientY, stickyLineY)
    updateCursor()
  }

  function onMouseUp(e: MouseEvent) {
    if (e.button !== 0) return
    removeDragListeners()

    // ゼロ幅選択を解消
    if (cursorGapEnd.value !== null && cursorGapEnd.value === cursorGap.value) {
      cursorGapEnd.value = null
      updateCursor()
    }

    emitSelect()
  }

  return {
    attach() {
      window.addEventListener('mousedown', onMouseDown, true)
    },
    detach() {
      window.removeEventListener('mousedown', onMouseDown, true)
      removeDragListeners()
    },
  }
}
