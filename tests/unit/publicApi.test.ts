import { describe, expect, it } from 'vitest'
import * as api from '../../src/index'

describe('public API surface', () => {
  it('exposes only the editor runtime entry point', () => {
    expect(Object.keys(api).sort()).toEqual(['createKerningEditor'])
  })
})
