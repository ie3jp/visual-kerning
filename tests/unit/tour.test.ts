import { afterEach, describe, expect, it, vi } from 'vitest'
import { createTour } from '../../demo/tour'

describe('demo tour', () => {
  afterEach(() => {
    vi.useRealTimers()
    localStorage.clear()
    document.head.innerHTML = ''
    document.body.innerHTML = ''
  })

  it('keeps ignore attributes isolated per tour instance', () => {
    vi.useFakeTimers()

    const tourA = createTour({
      doneKey: 'tour-a',
      ignoreAttr: 'data-tour-a',
      steps: [],
    })

    createTour({
      doneKey: 'tour-b',
      ignoreAttr: 'data-tour-b',
      steps: [],
    })

    tourA.start()

    expect(document.querySelector('[data-tour-a="true"]')).not.toBeNull()
    expect(document.querySelector('.tour-caption')?.getAttribute('data-tour-a')).toBe('true')
    expect(document.querySelector('.tour-caption')?.hasAttribute('data-tour-b')).toBe(false)

    vi.runAllTimers()
  })
})
