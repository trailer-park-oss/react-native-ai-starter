import { describe, it, expect, afterEach } from 'vitest'
import { mkdtemp, rm, readFile, access } from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import type { StarterConfig } from '@/types.js'
import { DEFAULT_CONFIG } from '@/config.js'
import { getActivePacks } from '@/pack-registry.js'
import { buildBasePackageJson, mergePackDependencies } from '@/utils/package-json.js'
import { renderTemplates, type TemplateData } from '@/utils/template.js'

async function exists(p: string): Promise<boolean> {
  try {
    await access(p)
    return true
  } catch {
    return false
  }
}

function toTemplateData(projectName: string, config: StarterConfig): TemplateData {
  return {
    projectName,
    ui: config.ui,
    auth: config.auth,
    payments: config.payments,
    dx: config.dx,
    preset: config.preset,
    hasAuth: config.auth !== 'none',
    hasPayments: config.payments !== 'none',
    isFullDx: config.dx === 'full',
  }
}

describe('generator — template rendering', () => {
  let tmpDir: string

  afterEach(async () => {
    if (tmpDir) await rm(tmpDir, { recursive: true, force: true })
  })

  it('generates core files with default config', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-starter-'))
    const data = toTemplateData('test-app', DEFAULT_CONFIG)

    await renderTemplates('core', tmpDir, data)

    expect(await exists(path.join(tmpDir, 'src/starter.config.ts'))).toBe(true)
    expect(await exists(path.join(tmpDir, 'tsconfig.json'))).toBe(true)
    expect(await exists(path.join(tmpDir, 'app.json'))).toBe(true)
    expect(await exists(path.join(tmpDir, 'app/_layout.tsx'))).toBe(true)
    expect(await exists(path.join(tmpDir, 'app/(onboarding)/_layout.tsx'))).toBe(true)
    expect(await exists(path.join(tmpDir, 'app/(onboarding)/welcome.tsx'))).toBe(true)
    expect(await exists(path.join(tmpDir, 'app/(app)/_layout.tsx'))).toBe(true)
    expect(await exists(path.join(tmpDir, 'app/(app)/index.tsx'))).toBe(true)
    expect(await exists(path.join(tmpDir, 'src/store/onboarding.ts'))).toBe(true)
    expect(await exists(path.join(tmpDir, 'src/store/theme.ts'))).toBe(true)
    expect(await exists(path.join(tmpDir, 'src/lib/query-client.ts'))).toBe(true)
  })

  it('interpolates starter.config.ts with correct values', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-starter-'))
    const config: StarterConfig = {
      ui: 'gluestack',
      auth: 'clerk',
      payments: 'stripe',
      dx: 'full',
      preset: 'fluent-blue',
    }
    const data = toTemplateData('my-app', config)

    await renderTemplates('core', tmpDir, data)

    const content = await readFile(path.join(tmpDir, 'src/starter.config.ts'), 'utf-8')
    expect(content).toContain("ui: 'gluestack'")
    expect(content).toContain("auth: 'clerk'")
    expect(content).toContain("payments: 'stripe'")
    expect(content).toContain("dx: 'full'")
    expect(content).toContain("preset: 'fluent-blue'")
  })

  it('includes auth import in root layout when auth is enabled', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-starter-'))
    const data = toTemplateData('auth-app', { ...DEFAULT_CONFIG, auth: 'clerk' })

    await renderTemplates('core', tmpDir, data)

    const content = await readFile(path.join(tmpDir, 'app/_layout.tsx'), 'utf-8')
    expect(content).toContain("import { useAuth } from '@/providers/auth'")
    expect(content).toContain('isAuthenticated')
  })

  it('excludes auth import in root layout when auth is none', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-starter-'))
    const data = toTemplateData('no-auth-app', DEFAULT_CONFIG)

    await renderTemplates('core', tmpDir, data)

    const content = await readFile(path.join(tmpDir, 'app/_layout.tsx'), 'utf-8')
    expect(content).not.toContain("import { useAuth }")
    expect(content).not.toContain('isAuthenticated')
  })

  it('sets correct theme preset in store', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-starter-'))
    const data = toTemplateData('theme-app', { ...DEFAULT_CONFIG, preset: 'fluent-blue' })

    await renderTemplates('core', tmpDir, data)

    const content = await readFile(path.join(tmpDir, 'src/store/theme.ts'), 'utf-8')
    expect(content).toContain("preset: 'fluent-blue'")
  })
})

describe('package.json generation', () => {
  it('merges core pack dependencies into package.json', () => {
    const packs = getActivePacks(DEFAULT_CONFIG)
    const base = buildBasePackageJson('test-app')
    const result = mergePackDependencies(base, packs)

    // expo is in the direct dependencies map
    expect(result.dependencies).toHaveProperty('expo')
  })

  it('collects expoInstallPackages from active packs', () => {
    const packs = getActivePacks(DEFAULT_CONFIG)
    const expoPackages = packs.flatMap((p) => p.expoInstallPackages ?? [])

    expect(expoPackages).toContain('zustand')
    expect(expoPackages).toContain('@tanstack/react-query')
    expect(expoPackages).toContain('expo-router')
  })

  it('does not include disabled pack dependencies', () => {
    const packs = getActivePacks(DEFAULT_CONFIG)
    const base = buildBasePackageJson('test-app')
    const result = mergePackDependencies(base, packs)

    // With default config, auth and payments are none — their stubs have no deps
    const allDeps = { ...result.dependencies, ...result.devDependencies }
    expect(allDeps).not.toHaveProperty('@clerk/clerk-expo')
    expect(allDeps).not.toHaveProperty('@stripe/stripe-react-native')
  })
})
