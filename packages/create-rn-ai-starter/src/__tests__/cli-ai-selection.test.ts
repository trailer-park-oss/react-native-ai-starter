import { describe, it, expect } from 'vitest'
import { assertNonEmptySelection, normalizeAiProviders } from '@/cli.js'

describe('ai provider selection', () => {
  it('rejects empty selections with a helpful message', () => {
    expect(() => assertNonEmptySelection([])).toThrow(
      'Select at least one option (press Space), including "none" if you want AI disabled.',
    )
  })

  it('rejects selecting mlkit and executorch together during prompt normalization', () => {
    expect(() =>
      normalizeAiProviders(['on-device-mlkit', 'on-device-executorch']),
    ).toThrow('on-device-mlkit cannot be combined with on-device-executorch.')
  })
})
