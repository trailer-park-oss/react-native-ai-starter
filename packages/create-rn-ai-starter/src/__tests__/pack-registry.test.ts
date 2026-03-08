import { describe, it, expect } from 'vitest'
import { getActivePacks } from '@/pack-registry.js'
import { DEFAULT_CONFIG } from '@/config.js'
import type { StarterConfig } from '@/types.js'

describe('getActivePacks', () => {
  it('always includes core, ui, and dx packs', () => {
    const packs = getActivePacks(DEFAULT_CONFIG)
    const ids = packs.map((p) => p.id)

    expect(ids).toContain('core')
    expect(ids).toContain('ui')
    expect(ids).toContain('dx')
  })

  it('excludes auth when auth is none', () => {
    const packs = getActivePacks({ ...DEFAULT_CONFIG, auth: 'none' })
    const ids = packs.map((p) => p.id)

    expect(ids).not.toContain('auth')
  })

  it('includes auth when auth is clerk', () => {
    const packs = getActivePacks({ ...DEFAULT_CONFIG, auth: 'clerk' })
    const ids = packs.map((p) => p.id)

    expect(ids).toContain('auth')
  })

  it('excludes payments when payments is none', () => {
    const packs = getActivePacks({ ...DEFAULT_CONFIG, payments: 'none' })
    const ids = packs.map((p) => p.id)

    expect(ids).not.toContain('payments')
  })

  it('includes payments when payments is stripe', () => {
    const packs = getActivePacks({ ...DEFAULT_CONFIG, payments: 'stripe' })
    const ids = packs.map((p) => p.id)

    expect(ids).toContain('payments')
  })

  it('maintains deterministic order: core, ui, auth, payments, dx', () => {
    const config: StarterConfig = {
      ui: 'tamagui',
      auth: 'clerk',
      payments: 'stripe',
      dx: 'full',
      preset: 'neutral-green',
    }
    const packs = getActivePacks(config)
    const ids = packs.map((p) => p.id)

    expect(ids).toEqual(['core', 'ui', 'auth', 'payments', 'dx'])
  })

  it('returns correct subset for minimal config', () => {
    const packs = getActivePacks(DEFAULT_CONFIG)
    const ids = packs.map((p) => p.id)

    expect(ids).toEqual(['core', 'ui', 'dx'])
  })
})
