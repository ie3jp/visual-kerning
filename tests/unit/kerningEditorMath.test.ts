import { describe, expect, it } from 'vitest'
import { findGapIndex, getGapRect, moveCursorVertically } from '../../src/kerningEditorMath'

function mockRect(left: number, top: number, width: number, height: number): DOMRect {
  return {
    x: left,
    y: top,
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    toJSON() {
      return {}
    },
  } as DOMRect
}

function createSpan(rect: DOMRect): HTMLElement {
  const span = document.createElement('span')
  span.getBoundingClientRect = () => rect
  return span
}

describe('kerningEditorMath', () => {
  it('finds the nearest gap on the clicked line', () => {
    const spans = [
      createSpan(mockRect(10, 10, 10, 20)),
      createSpan(mockRect(30, 10, 10, 20)),
      createSpan(mockRect(50, 10, 10, 20)),
    ]

    expect(findGapIndex(spans, 31, 15)).toBe(0)
    expect(findGapIndex(spans, 9, 15)).toBe(-1)
    expect(findGapIndex(spans, 61, 15)).toBe(2)
  })

  it('returns the next-line start for a multiline gap rect', () => {
    const spans = [
      createSpan(mockRect(10, 10, 10, 20)),
      createSpan(mockRect(20, 40, 10, 20)),
    ]

    expect(getGapRect(spans, 0)).toEqual({ x: 20, y: 40, h: 20 })
  })

  it('moves vertically to the closest gap on the next line', () => {
    const spans = [
      createSpan(mockRect(10, 10, 10, 20)),
      createSpan(mockRect(30, 10, 10, 20)),
      createSpan(mockRect(12, 40, 10, 20)),
      createSpan(mockRect(34, 40, 10, 20)),
    ]

    expect(moveCursorVertically(spans, 0, 'down')).toBe(2)
    expect(moveCursorVertically(spans, 2, 'up')).toBe(0)
  })
})
