import { describe, it, expect } from 'vitest'
import { validateConfig } from '@/utils/validation.js'
import type { StarterConfig } from '@/types.js'
import { DEFAULT_CONFIG } from '@/config.js'

describe('validateConfig', () => {
  it('accepts valid default config', () => {
    expect(() => validateConfig(DEFAULT_CONFIG)).not.toThrow()
  })

  it('accepts all valid combinations', () => {
    const config: StarterConfig = {
      ui: 'gluestack',
      auth: 'clerk',
      payments: 'stripe',
      dx: 'full',
      preset: 'fluent-blue',
    }
    expect(() => validateConfig(config)).not.toThrow()
  })

  it('rejects invalid ui value', () => {
    const config = { ...DEFAULT_CONFIG, ui: 'invalid' as StarterConfig['ui'] }
    expect(() => validateConfig(config)).toThrow('Invalid value "invalid" for --ui')
  })

  it('rejects invalid auth value', () => {
    const config = { ...DEFAULT_CONFIG, auth: 'firebase' as StarterConfig['auth'] }
    expect(() => validateConfig(config)).toThrow('Invalid value "firebase" for --auth')
  })

  it('rejects invalid payments value', () => {
    const config = { ...DEFAULT_CONFIG, payments: 'paypal' as StarterConfig['payments'] }
    expect(() => validateConfig(config)).toThrow('Invalid value "paypal" for --payments')
  })

  it('rejects invalid dx value', () => {
    const config = { ...DEFAULT_CONFIG, dx: 'extreme' as StarterConfig['dx'] }
    expect(() => validateConfig(config)).toThrow('Invalid value "extreme" for --dx')
  })

  it('rejects invalid preset value', () => {
    const config = { ...DEFAULT_CONFIG, preset: 'ocean-red' as StarterConfig['preset'] }
    expect(() => validateConfig(config)).toThrow('Invalid value "ocean-red" for --preset')
  })
})
