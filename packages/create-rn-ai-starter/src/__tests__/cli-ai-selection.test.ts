import { describe, it, expect } from 'vitest'
import { assertNonEmptySelection } from '@/cli.js'

describe('ai provider selection', () => {
  it('rejects empty selections with a helpful message', () => {
    expect(() => assertNonEmptySelection([])).toThrow(
      'Select at least one option (press Space), including "none" if you want AI disabled.',
    )
  })
})
