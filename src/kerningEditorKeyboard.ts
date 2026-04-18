import { applyKerningToSpans, MODIFIED_CLASS } from './applyKerning'
import { getCharSpans, isInEditableField } from './kerningEditorDom'
import { moveCursorVertically } from './kerningEditorMath'
import type { SelectionController } from './kerningEditorSelection'
import type { ValueBox } from './reactiveValue'
import type { VisualKerningArea } from './kerningEditor'

export interface KeyboardControllerDeps {
  enabled: ValueBox<boolean>
  activeSelector: ValueBox<string | null>
  cursorGap: ValueBox<number>
  cursorGapEnd: ValueBox<number | null>
  areas: ValueBox<Map<string, VisualKerningArea>>
  selection: SelectionController
  applyAreaPreview(area: VisualKerningArea): void
  syncModifiedFlag(area: VisualKerningArea): void
  toggleEnabled(): void
  toggleCompareMode(): void
  updateCursor(): void
  deactivate(): void
  emitSelect(): void
  emitAreaChange(area: VisualKerningArea): void
  persistAreas(): void
}

export interface KeyboardController {
  attach(): void
  detach(): void
}

/** Alt+矢印の 1 回あたりの調整量。Shift=細かく, Cmd=大きく。 */
function arrowStep(e: KeyboardEvent): number {
  if (e.metaKey || e.ctrlKey) return 100
  if (e.shiftKey) return 1
  return 10
}

export function createKeyboardController(deps: KeyboardControllerDeps): KeyboardController {
  const {
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
  } = deps
  const { hasSelection, getSelectionBounds, collapseSelection, adjustableGapIndices } = selection

  // --- 各ハンドラ (戻り値 true=処理済) ---

  function tryToggleEnabled(e: KeyboardEvent): boolean {
    if (!((e.metaKey || e.ctrlKey) && e.key === 'k')) return false
    e.preventDefault()
    toggleEnabled()
    return true
  }

  function tryEscape(e: KeyboardEvent): boolean {
    if (e.key !== 'Escape') return false
    deactivate()
    return true
  }

  function trySelectAll(e: KeyboardEvent): boolean {
    if (!((e.metaKey || e.ctrlKey) && e.key === 'a')) return false
    const selector = activeSelector.value
    if (!selector || cursorGap.value < -1) return false
    e.preventDefault()
    e.stopPropagation()
    const area = areas.value.get(selector)
    if (!area) return true
    cursorGap.value = -1
    cursorGapEnd.value = area.kerning.length - 1
    updateCursor()
    emitSelect()
    return true
  }

  function tryZeroSelection(e: KeyboardEvent): boolean {
    if (!((e.metaKey || e.ctrlKey) && e.altKey && e.key === 'q')) return false
    const selector = activeSelector.value
    if (!selector || cursorGap.value < -1) return false
    e.preventDefault()
    e.stopPropagation()
    const area = areas.value.get(selector)
    if (!area) return true
    const spans = getCharSpans(area.el)
    const bounds = getSelectionBounds()
    if (bounds) {
      for (let i = bounds[0]; i <= bounds[1]; i++) {
        if (i === -1) area.indent = 0
        else area.kerning[i] = 0
      }
    } else if (cursorGap.value === -1) {
      area.indent = 0
    } else {
      area.kerning[cursorGap.value] = 0
    }
    applyKerningToSpans(spans, area.kerning, area.indent)
    syncModifiedFlag(area)
    updateCursor()
    persistAreas()
    emitAreaChange(area)
    return true
  }

  function tryAltArrow(e: KeyboardEvent): boolean {
    if (!e.altKey) return false
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return false
    const selector = activeSelector.value
    if (!selector || cursorGap.value < -1) return false
    e.preventDefault()
    e.stopPropagation()
    const area = areas.value.get(selector)
    if (!area) return true

    const delta = (e.key === 'ArrowRight' ? 1 : -1) * arrowStep(e)
    const spans = getCharSpans(area.el)
    const indices = adjustableGapIndices(getSelectionBounds(), spans)

    for (const i of indices) {
      if (i === -1) area.indent += delta
      else area.kerning[i] = (area.kerning[i] ?? 0) + delta
    }

    applyAreaPreview(area)
    area.el.classList.add(MODIFIED_CLASS)
    updateCursor()
    persistAreas()
    emitAreaChange(area)
    return true
  }

  function tryHorizontalMove(e: KeyboardEvent): boolean {
    const isArrow = e.key === 'ArrowLeft' || e.key === 'ArrowRight'
    const isTab = e.key === 'Tab'
    if (!isArrow && !isTab) return false
    if (!activeSelector.value || cursorGap.value < -1) return false
    const area = areas.value.get(activeSelector.value)
    if (!area) return false

    e.preventDefault()
    const minGap = -1
    const maxGap = area.kerning.length - 1
    const back = e.key === 'ArrowLeft' || (isTab && e.shiftKey)

    if (e.shiftKey && isArrow) {
      // Shift+矢印: 範囲拡張
      const end = cursorGapEnd.value ?? cursorGap.value
      const next = back
        ? (end > minGap ? end - 1 : end)
        : (end < maxGap ? end + 1 : end)
      cursorGapEnd.value = next
    } else if (hasSelection() && !e.shiftKey) {
      // 範囲選択中に矢印(Shiftなし): 範囲解除して端にカーソル
      collapseSelection(back ? 'start' : 'end')
    } else {
      cursorGap.value = back
        ? (cursorGap.value > minGap ? cursorGap.value - 1 : maxGap)
        : (cursorGap.value < maxGap ? cursorGap.value + 1 : minGap)
    }
    updateCursor()
    return true
  }

  function tryVerticalMove(e: KeyboardEvent): boolean {
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return false
    if (e.altKey) return false
    if (!activeSelector.value || cursorGap.value < -1) return false
    const area = areas.value.get(activeSelector.value)
    if (!area) return false

    e.preventDefault()
    const spans = getCharSpans(area.el)
    const direction = e.key === 'ArrowUp' ? 'up' : 'down'

    if (e.shiftKey) {
      const end = cursorGapEnd.value ?? cursorGap.value
      cursorGapEnd.value = moveCursorVertically(spans, end, direction)
    } else if (hasSelection()) {
      collapseSelection(direction === 'up' ? 'start' : 'end')
    } else {
      cursorGap.value = moveCursorVertically(spans, cursorGap.value, direction)
    }
    updateCursor()
    return true
  }

  function tryCompareToggle(e: KeyboardEvent): boolean {
    if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return false
    if (e.key.toLowerCase() !== 'b') return false
    e.preventDefault()
    toggleCompareMode()
    return true
  }

  function onKeydown(e: KeyboardEvent) {
    // Cmd/Ctrl+K はフォーカス先に関わらず常にエディタをトグル
    if (tryToggleEnabled(e)) return
    if (!enabled.value) return
    // 入力フィールドにフォーカス中は他ショートカットを抑止（ユーザー側のページを邪魔しない）
    if (isInEditableField(e.target)) return

    tryEscape(e)
      || trySelectAll(e)
      || tryZeroSelection(e)
      || tryAltArrow(e)
      || tryHorizontalMove(e)
      || tryVerticalMove(e)
      || tryCompareToggle(e)
  }

  return {
    attach() {
      window.addEventListener('keydown', onKeydown, true)
    },
    detach() {
      window.removeEventListener('keydown', onKeydown, true)
    },
  }
}
