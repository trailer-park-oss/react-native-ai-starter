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
      preset: 'radix-green',
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

describe('pack ownership boundaries', () => {
  it('no two packs share the same owned path', () => {
    const allConfig: StarterConfig = {
      ui: 'tamagui',
      auth: 'clerk',
      payments: 'stripe',
      dx: 'full',
      preset: 'radix-green',
    }
    const packs = getActivePacks(allConfig)
    const seen = new Map<string, string>()

    for (const pack of packs) {
      for (const ownedPath of pack.ownedPaths) {
        const existingOwner = seen.get(ownedPath)
        if (existingOwner) {
          throw new Error(
            `Path "${ownedPath}" is claimed by both "${existingOwner}" and "${pack.id}"`,
          )
        }
        seen.set(ownedPath, pack.id)
      }
    }

    expect(seen.size).toBeGreaterThan(0)
  })

  it('every pack has a unique id', () => {
    const allConfig: StarterConfig = {
      ui: 'tamagui',
      auth: 'clerk',
      payments: 'stripe',
      dx: 'full',
      preset: 'radix-green',
    }
    const packs = getActivePacks(allConfig)
    const ids = packs.map((p) => p.id)
    const unique = new Set(ids)

    expect(unique.size).toBe(ids.length)
  })

  it('every pack implements the FeaturePack interface correctly', () => {
    const allConfig: StarterConfig = {
      ui: 'tamagui',
      auth: 'clerk',
      payments: 'stripe',
      dx: 'full',
      preset: 'radix-green',
    }
    const packs = getActivePacks(allConfig)

    for (const pack of packs) {
      expect(pack).toHaveProperty('id')
      expect(pack).toHaveProperty('dependencies')
      expect(pack).toHaveProperty('devDependencies')
      expect(pack).toHaveProperty('ownedPaths')
      expect(typeof pack.generate).toBe('function')
      expect(typeof pack.postApplyValidation).toBe('function')
      expect(typeof pack.id).toBe('string')
      expect(typeof pack.dependencies).toBe('object')
      expect(typeof pack.devDependencies).toBe('object')
      expect(Array.isArray(pack.ownedPaths)).toBe(true)
    }
  })

  it('core pack owns foundation files', () => {
    const packs = getActivePacks(DEFAULT_CONFIG)
    const core = packs.find((p) => p.id === 'core')!

    expect(core.ownedPaths).toContain('src/starter.config.ts')
    expect(core.ownedPaths).toContain('tsconfig.json')
    expect(core.ownedPaths).toContain('app.json')
    expect(core.ownedPaths).toContain('app/_layout.tsx')
    expect(core.ownedPaths).toContain('src/store/')
    expect(core.ownedPaths).toContain('src/lib/')
  })

  it('auth pack owns (auth) route group', () => {
    const packs = getActivePacks({ ...DEFAULT_CONFIG, auth: 'clerk' })
    const auth = packs.find((p) => p.id === 'auth')!

    expect(auth.ownedPaths).toContain('app/(auth)/')
  })

  it('payments pack owns payments paths', () => {
    const packs = getActivePacks({ ...DEFAULT_CONFIG, payments: 'stripe' })
    const payments = packs.find((p) => p.id === 'payments')!

    expect(payments.ownedPaths).toContain('src/providers/payments/stripe/')
    expect(payments.ownedPaths).toContain('src/features/payments/')
  })
})
