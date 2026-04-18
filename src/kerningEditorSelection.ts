import { isLineBreakGap } from './kerningEditorMath'
import type { ValueBox } from './reactiveValue'

export interface SelectionStateRefs {
  cursorGap: ValueBox<number>
  cursorGapEnd: ValueBox<number | null>
}

export interface SelectionController {
  hasSelection(): boolean
  /** 選択範囲の [開始, 終了] (常に開始 <= 終了)。未選択なら null。 */
  getSelectionBounds(): [number, number] | null
  /** 範囲選択中ならいずれかの端にカーソルを寄せて解除する。 */
  collapseSelection(side: 'start' | 'end'): void
  /**
   * トラッキング調整の対象ギャップ群。
   * 範囲選択時は左端ギャップと改行ギャップを除外（両端の余白は動かさない）。
   */
  adjustableGapIndices(
    bounds: [number, number] | null,
    spans: HTMLElement[],
  ): number[]
}

export function createSelectionController(state: SelectionStateRefs): SelectionController {
  const { cursorGap, cursorGapEnd } = state

  function hasSelection(): boolean {
    return cursorGapEnd.value !== null && cursorGapEnd.value !== cursorGap.value
  }

  function getSelectionBounds(): [number, number] | null {
    if (cursorGapEnd.value === null) return null
    const a = cursorGap.value
    const b = cursorGapEnd.value
    return a <= b ? [a, b] : [b, a]
  }

  function collapseSelection(side: 'start' | 'end') {
    if (!hasSelection()) return
    const bounds = getSelectionBounds()
    if (!bounds) return
    cursorGap.value = side === 'start' ? bounds[0] : bounds[1]
    cursorGapEnd.value = null
  }

  function adjustableGapIndices(
    bounds: [number, number] | null,
    spans: HTMLElement[],
  ): number[] {
    if (!bounds) return cursorGap.value >= -1 ? [cursorGap.value] : []
    const result: number[] = []
    for (let i = bounds[0] + 1; i <= bounds[1]; i++) {
      if (isLineBreakGap(spans, i)) continue
      result.push(i)
    }
    return result
  }

  return { hasSelection, getSelectionBounds, collapseSelection, adjustableGapIndices }
}
