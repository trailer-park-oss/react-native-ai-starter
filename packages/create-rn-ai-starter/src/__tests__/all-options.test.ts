import { describe, it, expect, afterEach } from 'vitest'
import { mkdtemp, rm, readFile, access, readdir } from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import type { StarterConfig, UiProvider, AuthProvider, PaymentsProvider, DxProfile, ThemePreset, Logger } from '@/types.js'
import { DEFAULT_CONFIG } from '@/config.js'
import { getActivePacks } from '@/pack-registry.js'
import { buildBasePackageJson, mergePackDependencies } from '@/utils/package-json.js'
import { renderTemplates, type TemplateData } from '@/utils/template.js'
import { getUIKit } from '@/packs/ui/kits.js'

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
    uiKit: getUIKit(config.ui),
  }
}

const noopLogger: Logger = {
  info() {},
  success() {},
  warn() {},
  error() {},
  step() {},
}

async function renderFullProject(tmpDir: string, config: StarterConfig): Promise<void> {
  const packs = getActivePacks(config)
  const context = { projectName: 'test-app', projectDir: tmpDir, config, logger: noopLogger }

  for (const pack of packs) {
    await pack.generate(context)
  }
}

const CORE_FILES = [
  'src/starter.config.ts',
  'tsconfig.json',
  'babel.config.js',
  'app.json',
  'app/_layout.tsx',
  'app/index.tsx',
  'app/(onboarding)/_layout.tsx',
  'app/(onboarding)/welcome.tsx',
  'app/(onboarding)/features.tsx',
  'app/(onboarding)/get-started.tsx',
  'app/(app)/_layout.tsx',
  'app/(app)/index.tsx',
  'app/(app)/profile.tsx',
  'app/(app)/settings.tsx',
  'src/store/onboarding.ts',
  'src/store/theme.ts',
  'src/store/index.ts',
  'src/lib/query-client.ts',
  'src/providers/ui/index.ts',
  'src/providers/auth/index.ts',
  'src/providers/payments/index.ts',
]

const UI_SHARED_FILES = [
  'src/design-system/tokens.ts',
  'src/design-system/index.ts',
  'src/design-system/elevation.ts',
  'src/design-system/ThemeProvider.tsx',
  'src/lib/storage.ts',
]

const UI_TAMAGUI_FILES = [
  'tamagui.config.ts',
  'src/providers/ui/tamagui/TamaguiProvider.tsx',
  'src/providers/ui/tamagui/tamagui.config.ts',
  'src/components/Card.tsx',
  'src/components/PrimaryButton.tsx',
  'src/components/StatusBanner.tsx',
]

const UI_GLUESTACK_FILES = [
  'src/providers/ui/gluestack/GluestackProvider.tsx',
  'src/providers/ui/gluestack/gluestack.config.ts',
  'src/components/Card.tsx',
  'src/components/PrimaryButton.tsx',
  'src/components/StatusBanner.tsx',
]

const SCREEN_FILES = [
  'app/(onboarding)/welcome.tsx',
  'app/(onboarding)/features.tsx',
  'app/(onboarding)/get-started.tsx',
  'app/(app)/index.tsx',
  'app/(app)/profile.tsx',
  'app/(app)/settings.tsx',
]

const ONBOARDING_SCREENS = [
  'app/(onboarding)/welcome.tsx',
  'app/(onboarding)/features.tsx',
  'app/(onboarding)/get-started.tsx',
]

// ─── Full pipeline: every valid config combination ──────────────────────────

const UI_OPTIONS: UiProvider[] = ['tamagui', 'gluestack']
const AUTH_OPTIONS: AuthProvider[] = ['clerk', 'none']
const PAYMENTS_OPTIONS: PaymentsProvider[] = ['stripe', 'none']
const DX_OPTIONS: DxProfile[] = ['basic', 'full']
const PRESET_OPTIONS: ThemePreset[] = ['radix-blue', 'radix-green', 'radix-purple', 'radix-orange', 'radix-cyan', 'radix-red']

describe('full pipeline — every config combination renders without error', () => {
  let tmpDir: string

  afterEach(async () => {
    if (tmpDir) await rm(tmpDir, { recursive: true, force: true })
  })

  for (const ui of UI_OPTIONS) {
    for (const auth of AUTH_OPTIONS) {
      for (const payments of PAYMENTS_OPTIONS) {
        for (const dx of DX_OPTIONS) {
          for (const preset of PRESET_OPTIONS) {
            const label = `ui=${ui} auth=${auth} payments=${payments} dx=${dx} preset=${preset}`

            it(`renders: ${label}`, async () => {
              tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-combo-'))
              const config: StarterConfig = { ui, auth, payments, dx, preset }
              await renderFullProject(tmpDir, config)

              for (const f of CORE_FILES) {
                expect(await exists(path.join(tmpDir, f)), `Missing: ${f}`).toBe(true)
              }
              for (const f of UI_SHARED_FILES) {
                expect(await exists(path.join(tmpDir, f)), `Missing: ${f}`).toBe(true)
              }

              const libFiles = ui === 'tamagui' ? UI_TAMAGUI_FILES : UI_GLUESTACK_FILES
              for (const f of libFiles) {
                expect(await exists(path.join(tmpDir, f)), `Missing: ${f}`).toBe(true)
              }
            })
          }
        }
      }
    }
  }
})

// ─── UI axis: tamagui vs gluestack ──────────────────────────────────────────

describe('UI axis — tamagui', () => {
  let tmpDir: string

  afterEach(async () => {
    if (tmpDir) await rm(tmpDir, { recursive: true, force: true })
  })

  it('all screens import from tamagui and use YStack', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-ui-tam-'))
    await renderFullProject(tmpDir, { ...DEFAULT_CONFIG, ui: 'tamagui' })

    for (const f of SCREEN_FILES) {
      const content = await readFile(path.join(tmpDir, f), 'utf-8')
      expect(content, `${f} should import from tamagui`).toContain("from 'tamagui'")
      expect(content, `${f} should use YStack`).toContain('YStack')
      expect(content, `${f} should not reference gluestack`).not.toContain('@gluestack-ui/themed')
      expect(content, `${f} should not use StyleSheet`).not.toContain('StyleSheet')
      expect(content, `${f} should use design tokens`).toContain('useTokens')
    }
  })

  it('onboarding screens use PrimaryButton', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-ui-tam-'))
    await renderFullProject(tmpDir, { ...DEFAULT_CONFIG, ui: 'tamagui' })

    for (const f of ONBOARDING_SCREENS) {
      const content = await readFile(path.join(tmpDir, f), 'utf-8')
      expect(content, `${f} should use PrimaryButton`).toContain('PrimaryButton')
    }
  })

  it('components import directly from tamagui', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-ui-tam-'))
    await renderFullProject(tmpDir, { ...DEFAULT_CONFIG, ui: 'tamagui' })

    for (const comp of ['Card', 'PrimaryButton', 'StatusBanner']) {
      const content = await readFile(path.join(tmpDir, `src/components/${comp}.tsx`), 'utf-8')
      expect(content, `${comp} should import from tamagui`).toContain("from 'tamagui'")
    }
  })

  it('ThemeProvider uses TamaguiAdapter', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-ui-tam-'))
    await renderFullProject(tmpDir, { ...DEFAULT_CONFIG, ui: 'tamagui' })

    const content = await readFile(path.join(tmpDir, 'src/design-system/ThemeProvider.tsx'), 'utf-8')
    expect(content).toContain('TamaguiAdapter')
    expect(content).not.toContain('GluestackAdapter')
  })

  it('tamagui.config.ts re-exports from provider config', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-ui-tam-'))
    await renderFullProject(tmpDir, { ...DEFAULT_CONFIG, ui: 'tamagui' })

    expect(await exists(path.join(tmpDir, 'tamagui.config.ts'))).toBe(true)
    const content = await readFile(path.join(tmpDir, 'tamagui.config.ts'), 'utf-8')
    expect(content).toContain('tamaguiConfig')
  })

  it('no gluestack-specific files exist', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-ui-tam-'))
    await renderFullProject(tmpDir, { ...DEFAULT_CONFIG, ui: 'tamagui' })

    expect(await exists(path.join(tmpDir, 'src/providers/ui/gluestack'))).toBe(false)
  })

  it('tamagui config uses named token keys (not numeric) for zIndex', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-ui-tam-'))
    await renderFullProject(tmpDir, { ...DEFAULT_CONFIG, ui: 'tamagui' })

    const content = await readFile(
      path.join(tmpDir, 'src/providers/ui/tamagui/tamagui.config.ts'),
      'utf-8',
    )
    const zIndexBlock = content.slice(
      content.indexOf('zIndex:'),
      content.indexOf('}', content.indexOf('zIndex:')) + 1,
    )
    expect(zIndexBlock).not.toMatch(/\b\d+\s*:/)
    for (const key of ['xs', 'sm', 'md', 'lg', 'xl']) {
      expect(zIndexBlock, `zIndex should have named key '${key}'`).toContain(key)
    }
  })

  it('tamagui config token scales use named keys matching spacing scale', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-ui-tam-'))
    await renderFullProject(tmpDir, { ...DEFAULT_CONFIG, ui: 'tamagui' })

    const content = await readFile(
      path.join(tmpDir, 'src/providers/ui/tamagui/tamagui.config.ts'),
      'utf-8',
    )
    expect(content).toContain('...spacing')
    expect(content).toContain('...radius')
    expect(content).toContain('true:')
  })
})

describe('UI axis — gluestack', () => {
  let tmpDir: string

  afterEach(async () => {
    if (tmpDir) await rm(tmpDir, { recursive: true, force: true })
  })

  it('all screens import from gluestack and use VStack', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-ui-gs-'))
    await renderFullProject(tmpDir, { ...DEFAULT_CONFIG, ui: 'gluestack' })

    for (const f of SCREEN_FILES) {
      const content = await readFile(path.join(tmpDir, f), 'utf-8')
      expect(content, `${f} should import from gluestack`).toContain("from '@gluestack-ui/themed'")
      expect(content, `${f} should use VStack`).toContain('VStack')
      expect(content, `${f} should not reference tamagui`).not.toContain("from 'tamagui'")
      expect(content, `${f} should not use StyleSheet`).not.toContain('StyleSheet')
      expect(content, `${f} should use design tokens`).toContain('useTokens')
    }
  })

  it('components import directly from gluestack', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-ui-gs-'))
    await renderFullProject(tmpDir, { ...DEFAULT_CONFIG, ui: 'gluestack' })

    for (const comp of ['Card', 'PrimaryButton', 'StatusBanner']) {
      const content = await readFile(path.join(tmpDir, `src/components/${comp}.tsx`), 'utf-8')
      expect(content, `${comp} should import from gluestack`).toContain("from '@gluestack-ui/themed'")
    }
  })

  it('ThemeProvider uses GluestackAdapter', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-ui-gs-'))
    await renderFullProject(tmpDir, { ...DEFAULT_CONFIG, ui: 'gluestack' })

    const content = await readFile(path.join(tmpDir, 'src/design-system/ThemeProvider.tsx'), 'utf-8')
    expect(content).toContain('GluestackAdapter')
    expect(content).not.toContain('TamaguiAdapter')
  })

  it('no tamagui-specific files exist', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-ui-gs-'))
    await renderFullProject(tmpDir, { ...DEFAULT_CONFIG, ui: 'gluestack' })

    expect(await exists(path.join(tmpDir, 'tamagui.config.ts'))).toBe(false)
    expect(await exists(path.join(tmpDir, 'src/providers/ui/tamagui'))).toBe(false)
  })
})

// ─── Auth axis: clerk vs none ───────────────────────────────────────────────

describe('auth axis — clerk', () => {
  let tmpDir: string

  afterEach(async () => {
    if (tmpDir) await rm(tmpDir, { recursive: true, force: true })
  })

  it('root layout Stack includes (auth) screen when auth is clerk', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-auth-clerk-'))
    await renderFullProject(tmpDir, { ...DEFAULT_CONFIG, auth: 'clerk' })

    const content = await readFile(path.join(tmpDir, 'app/_layout.tsx'), 'utf-8')
    expect(content).toContain('(auth)')
    expect(content).toContain('Stack')
  })

  it('auth barrel export re-exports useAuth and types', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-auth-clerk-'))
    await renderFullProject(tmpDir, { ...DEFAULT_CONFIG, auth: 'clerk' })

    const content = await readFile(path.join(tmpDir, 'src/providers/auth/index.ts'), 'utf-8')
    expect(content).toContain('useAuth')
    expect(content).toContain('AuthProvider')
    expect(content).toContain('signInSchema')
  })

  it('starter.config.ts has auth: clerk', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-auth-clerk-'))
    await renderFullProject(tmpDir, { ...DEFAULT_CONFIG, auth: 'clerk' })

    const content = await readFile(path.join(tmpDir, 'src/starter.config.ts'), 'utf-8')
    expect(content).toContain("auth: 'clerk'")
  })

  it('auth pack is included in active packs', () => {
    const packs = getActivePacks({ ...DEFAULT_CONFIG, auth: 'clerk' })
    expect(packs.map((p) => p.id)).toContain('auth')
  })
})

describe('auth axis — none', () => {
  let tmpDir: string

  afterEach(async () => {
    if (tmpDir) await rm(tmpDir, { recursive: true, force: true })
  })

  it('root layout Stack excludes (auth) screen when auth is none', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-auth-none-'))
    await renderFullProject(tmpDir, { ...DEFAULT_CONFIG, auth: 'none' })

    const content = await readFile(path.join(tmpDir, 'app/_layout.tsx'), 'utf-8')
    expect(content).not.toContain('(auth)')
  })

  it('auth provider resolver is a no-op stub', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-auth-none-'))
    await renderFullProject(tmpDir, { ...DEFAULT_CONFIG, auth: 'none' })

    const content = await readFile(path.join(tmpDir, 'src/providers/auth/index.ts'), 'utf-8')
    expect(content).toContain('Auth is disabled')
    expect(content).not.toContain("case 'clerk':")
    expect(content).not.toContain("starterConfig")
  })

  it('starter.config.ts has auth: none', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-auth-none-'))
    await renderFullProject(tmpDir, { ...DEFAULT_CONFIG, auth: 'none' })

    const content = await readFile(path.join(tmpDir, 'src/starter.config.ts'), 'utf-8')
    expect(content).toContain("auth: 'none'")
  })

  it('auth pack is excluded from active packs', () => {
    const packs = getActivePacks({ ...DEFAULT_CONFIG, auth: 'none' })
    expect(packs.map((p) => p.id)).not.toContain('auth')
  })
})

// ─── Payments axis: stripe vs none ──────────────────────────────────────────

describe('payments axis — stripe', () => {
  let tmpDir: string

  afterEach(async () => {
    if (tmpDir) await rm(tmpDir, { recursive: true, force: true })
  })

  it('payments provider resolver imports stripe', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-pay-stripe-'))
    await renderFullProject(tmpDir, { ...DEFAULT_CONFIG, payments: 'stripe' })

    const content = await readFile(path.join(tmpDir, 'src/providers/payments/index.ts'), 'utf-8')
    expect(content).toContain("case 'stripe':")
    expect(content).toContain("import('@/providers/payments/stripe')")
    expect(content).toContain("starterConfig")
  })

  it('starter.config.ts has payments: stripe', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-pay-stripe-'))
    await renderFullProject(tmpDir, { ...DEFAULT_CONFIG, payments: 'stripe' })

    const content = await readFile(path.join(tmpDir, 'src/starter.config.ts'), 'utf-8')
    expect(content).toContain("payments: 'stripe'")
  })

  it('payments pack is included in active packs', () => {
    const packs = getActivePacks({ ...DEFAULT_CONFIG, payments: 'stripe' })
    expect(packs.map((p) => p.id)).toContain('payments')
  })
})

describe('payments axis — none', () => {
  let tmpDir: string

  afterEach(async () => {
    if (tmpDir) await rm(tmpDir, { recursive: true, force: true })
  })

  it('payments provider resolver is a no-op stub', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-pay-none-'))
    await renderFullProject(tmpDir, { ...DEFAULT_CONFIG, payments: 'none' })

    const content = await readFile(path.join(tmpDir, 'src/providers/payments/index.ts'), 'utf-8')
    expect(content).toContain('Payments is disabled')
    expect(content).not.toContain("case 'stripe':")
    expect(content).not.toContain("starterConfig")
  })

  it('starter.config.ts has payments: none', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-pay-none-'))
    await renderFullProject(tmpDir, { ...DEFAULT_CONFIG, payments: 'none' })

    const content = await readFile(path.join(tmpDir, 'src/starter.config.ts'), 'utf-8')
    expect(content).toContain("payments: 'none'")
  })

  it('payments pack is excluded from active packs', () => {
    const packs = getActivePacks({ ...DEFAULT_CONFIG, payments: 'none' })
    expect(packs.map((p) => p.id)).not.toContain('payments')
  })
})

// ─── Preset axis: Radix presets ────────────────────────────────────────────

describe('preset axis', () => {
  let tmpDir: string

  afterEach(async () => {
    if (tmpDir) await rm(tmpDir, { recursive: true, force: true })
  })

  for (const preset of PRESET_OPTIONS) {
    it(`starter.config.ts has preset: ${preset}`, async () => {
      tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-preset-'))
      await renderFullProject(tmpDir, { ...DEFAULT_CONFIG, preset })

      const content = await readFile(path.join(tmpDir, 'src/starter.config.ts'), 'utf-8')
      expect(content).toContain(`preset: '${preset}'`)
    })

    it(`core theme store defaults to ${preset}`, async () => {
      tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-preset-'))
      await renderTemplates('core', tmpDir, toTemplateData('preset-app', { ...DEFAULT_CONFIG, preset }))

      const content = await readFile(path.join(tmpDir, 'src/store/theme.ts'), 'utf-8')
      expect(content).toContain(`preset: '${preset}'`)
    })

    it(`UI theme store (persisted) defaults to ${preset}`, async () => {
      tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-preset-'))
      await renderFullProject(tmpDir, { ...DEFAULT_CONFIG, preset })

      const content = await readFile(path.join(tmpDir, 'src/store/theme.ts'), 'utf-8')
      expect(content).toContain(`preset: '${preset}'`)
      expect(content).toContain('persist')
      expect(content).toContain('zustandStorage')
    })
  }
})

// ─── DX axis: basic vs full ────────────────────────────────────────────────

describe('dx axis', () => {
  let tmpDir: string

  afterEach(async () => {
    if (tmpDir) await rm(tmpDir, { recursive: true, force: true })
  })

  for (const dx of DX_OPTIONS) {
    it(`starter.config.ts has dx: ${dx}`, async () => {
      tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-dx-'))
      await renderFullProject(tmpDir, { ...DEFAULT_CONFIG, dx })

      const content = await readFile(path.join(tmpDir, 'src/starter.config.ts'), 'utf-8')
      expect(content).toContain(`dx: '${dx}'`)
    })
  }
})

// ─── Cross-cutting combinations ─────────────────────────────────────────────

describe('cross-cutting — maximal config (all features enabled)', () => {
  let tmpDir: string
  const maxConfig: StarterConfig = {
    ui: 'tamagui',
    auth: 'clerk',
    payments: 'stripe',
    dx: 'full',
    preset: 'radix-blue',
  }

  afterEach(async () => {
    if (tmpDir) await rm(tmpDir, { recursive: true, force: true })
  })

  it('all packs are active', () => {
    const packs = getActivePacks(maxConfig)
    expect(packs.map((p) => p.id)).toEqual(['core', 'ui', 'auth', 'payments', 'dx'])
  })

  it('all files exist and content is consistent', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-max-'))
    await renderFullProject(tmpDir, maxConfig)

    const starterConfig = await readFile(path.join(tmpDir, 'src/starter.config.ts'), 'utf-8')
    expect(starterConfig).toContain("ui: 'tamagui'")
    expect(starterConfig).toContain("auth: 'clerk'")
    expect(starterConfig).toContain("payments: 'stripe'")
    expect(starterConfig).toContain("dx: 'full'")
    expect(starterConfig).toContain("preset: 'radix-blue'")

    const layout = await readFile(path.join(tmpDir, 'app/_layout.tsx'), 'utf-8')
    expect(layout).toContain('(auth)')
    expect(layout).toContain('ThemeProvider')
    expect(layout).toContain('QueryClientProvider')

    const authBarrel = await readFile(path.join(tmpDir, 'src/providers/auth/index.ts'), 'utf-8')
    expect(authBarrel).toContain('useAuth')

    const payResolver = await readFile(path.join(tmpDir, 'src/providers/payments/index.ts'), 'utf-8')
    expect(payResolver).toContain("case 'stripe':")

    const uiResolver = await readFile(path.join(tmpDir, 'src/providers/ui/index.ts'), 'utf-8')
    expect(uiResolver).toContain("case 'tamagui':")
  })

  it('package.json merges all active pack dependencies', () => {
    const packs = getActivePacks(maxConfig)
    const base = buildBasePackageJson('max-app')
    const result = mergePackDependencies(base, packs)

    expect(result.dependencies).toHaveProperty('expo')
    expect(result.dependencies).toHaveProperty('tamagui')
    expect(Object.keys(result.dependencies).length).toBeGreaterThan(3)
  })
})

describe('cross-cutting — minimal config (all optional features disabled)', () => {
  let tmpDir: string
  const minConfig: StarterConfig = {
    ui: 'tamagui',
    auth: 'none',
    payments: 'none',
    dx: 'basic',
    preset: 'radix-green',
  }

  afterEach(async () => {
    if (tmpDir) await rm(tmpDir, { recursive: true, force: true })
  })

  it('only core, ui, dx packs are active', () => {
    const packs = getActivePacks(minConfig)
    expect(packs.map((p) => p.id)).toEqual(['core', 'ui', 'dx'])
  })

  it('no auth or payments wiring in generated files', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-min-'))
    await renderFullProject(tmpDir, minConfig)

    const layout = await readFile(path.join(tmpDir, 'app/_layout.tsx'), 'utf-8')
    expect(layout).not.toContain('(auth)')

    const authResolver = await readFile(path.join(tmpDir, 'src/providers/auth/index.ts'), 'utf-8')
    expect(authResolver).toContain('Auth is disabled')

    const payResolver = await readFile(path.join(tmpDir, 'src/providers/payments/index.ts'), 'utf-8')
    expect(payResolver).toContain('Payments is disabled')
  })
})

describe('cross-cutting — gluestack + clerk + stripe', () => {
  let tmpDir: string
  const config: StarterConfig = {
    ui: 'gluestack',
    auth: 'clerk',
    payments: 'stripe',
    dx: 'full',
    preset: 'radix-green',
  }

  afterEach(async () => {
    if (tmpDir) await rm(tmpDir, { recursive: true, force: true })
  })

  it('screens use gluestack while auth and payments are wired', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-cross-'))
    await renderFullProject(tmpDir, config)

    const welcome = await readFile(path.join(tmpDir, 'app/(onboarding)/welcome.tsx'), 'utf-8')
    expect(welcome).toContain("from '@gluestack-ui/themed'")
    expect(welcome).toContain('VStack')

    const layout = await readFile(path.join(tmpDir, 'app/_layout.tsx'), 'utf-8')
    expect(layout).toContain('ThemeProvider')
    expect(layout).toContain('Stack')

    const themeProvider = await readFile(path.join(tmpDir, 'src/design-system/ThemeProvider.tsx'), 'utf-8')
    expect(themeProvider).toContain('GluestackAdapter')

    const authBarrel = await readFile(path.join(tmpDir, 'src/providers/auth/index.ts'), 'utf-8')
    expect(authBarrel).toContain('useAuth')

    const payResolver = await readFile(path.join(tmpDir, 'src/providers/payments/index.ts'), 'utf-8')
    expect(payResolver).toContain("case 'stripe':")
  })

  it('package.json has gluestack deps, not tamagui', () => {
    const packs = getActivePacks(config)
    const base = buildBasePackageJson('cross-app')
    const result = mergePackDependencies(base, packs)

    expect(result.dependencies).toHaveProperty('@gluestack-ui/themed')
    expect(result.dependencies).not.toHaveProperty('tamagui')
  })
})

// ─── Design system tokens content ───────────────────────────────────────────

describe('design system tokens', () => {
  let tmpDir: string

  afterEach(async () => {
    if (tmpDir) await rm(tmpDir, { recursive: true, force: true })
  })

  it('tokens.ts exports all preset palettes', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-tokens-'))
    await renderFullProject(tmpDir, DEFAULT_CONFIG)

    const content = await readFile(path.join(tmpDir, 'src/design-system/tokens.ts'), 'utf-8')
    expect(content).toContain('radix-blue')
    expect(content).toContain('radix-green')
    expect(content).toContain('light')
    expect(content).toContain('dark')
    expect(content).toContain('resolveTokens')
    expect(content).toContain('colorPalettes')
    expect(content).toContain('spacing')
    expect(content).toContain('radius')
    expect(content).toContain('typography')
  })

  it('tokens.ts defines all color roles', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-tokens-'))
    await renderFullProject(tmpDir, DEFAULT_CONFIG)

    const content = await readFile(path.join(tmpDir, 'src/design-system/tokens.ts'), 'utf-8')
    for (const role of ['primary', 'success', 'warning', 'critical', 'info', 'text', 'textSubtle', 'background', 'surface', 'border']) {
      expect(content, `tokens should define ${role}`).toContain(role)
    }
  })

  it('elevation.ts exports card, modal, pressed, toast styles', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-tokens-'))
    await renderFullProject(tmpDir, DEFAULT_CONFIG)

    const content = await readFile(path.join(tmpDir, 'src/design-system/elevation.ts'), 'utf-8')
    expect(content).toContain('card')
    expect(content).toContain('modal')
    expect(content).toContain('pressed')
    expect(content).toContain('toast')
  })

  it('barrel export re-exports all public APIs', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-tokens-'))
    await renderFullProject(tmpDir, DEFAULT_CONFIG)

    const content = await readFile(path.join(tmpDir, 'src/design-system/index.ts'), 'utf-8')
    expect(content).toContain('resolveTokens')
    expect(content).toContain('ThemeProvider')
    expect(content).toContain('useTokens')
    expect(content).toContain('elevation')
  })
})

// ─── Package.json dependency correctness per option ─────────────────────────

describe('package.json dependencies per option combination', () => {
  it('tamagui config includes tamagui deps, excludes gluestack', () => {
    const packs = getActivePacks({ ...DEFAULT_CONFIG, ui: 'tamagui' })
    const pkg = mergePackDependencies(buildBasePackageJson('t'), packs)
    const all = { ...pkg.dependencies, ...pkg.devDependencies }

    expect(all).toHaveProperty('tamagui')
    expect(all).toHaveProperty('@tamagui/config')
    expect(all).toHaveProperty('@tamagui/babel-plugin')
    expect(all).not.toHaveProperty('@gluestack-ui/themed')
    expect(all).not.toHaveProperty('@gluestack-style/react')
  })

  it('gluestack config includes gluestack deps, excludes tamagui', () => {
    const packs = getActivePacks({ ...DEFAULT_CONFIG, ui: 'gluestack' })
    const pkg = mergePackDependencies(buildBasePackageJson('g'), packs)
    const all = { ...pkg.dependencies, ...pkg.devDependencies }

    expect(all).toHaveProperty('@gluestack-ui/themed')
    expect(all).toHaveProperty('@gluestack-style/react')
    expect(all).not.toHaveProperty('tamagui')
    expect(all).not.toHaveProperty('@tamagui/config')
    expect(all).not.toHaveProperty('@tamagui/babel-plugin')
  })

  it('core deps are always present regardless of options', () => {
    for (const ui of UI_OPTIONS) {
      for (const auth of AUTH_OPTIONS) {
        const packs = getActivePacks({ ...DEFAULT_CONFIG, ui, auth })
        const pkg = mergePackDependencies(buildBasePackageJson('c'), packs)

        expect(pkg.dependencies, `ui=${ui} auth=${auth}`).toHaveProperty('expo')
        expect(pkg.dependencies, `ui=${ui} auth=${auth}`).toHaveProperty('react')
        expect(pkg.dependencies, `ui=${ui} auth=${auth}`).toHaveProperty('react-native')
      }
    }
  })

  it('expo install packages include reanimated for all UI choices', () => {
    for (const ui of UI_OPTIONS) {
      const packs = getActivePacks({ ...DEFAULT_CONFIG, ui })
      const expoPackages = packs.flatMap((p) => p.expoInstallPackages ?? [])
      expect(expoPackages, `ui=${ui} should include reanimated`).toContain('react-native-reanimated')
    }
  })
})

// ─── Expo Go compatibility: no native-only modules in import chains ─────────

const NATIVE_ONLY_PACKAGES = [
  'react-native-mmkv',
  'react-native-nitro-modules',
]

describe('Expo Go compatibility — no native-only imports in generated source', () => {
  let tmpDir: string

  afterEach(async () => {
    if (tmpDir) await rm(tmpDir, { recursive: true, force: true })
  })

  async function collectTsFiles(dir: string, base: string = dir): Promise<string[]> {
    const results: string[] = []
    let entries: import('node:fs').Dirent[]
    try {
      entries = await readdir(dir, { withFileTypes: true })
    } catch {
      return results
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory() && entry.name !== 'node_modules') {
        results.push(...await collectTsFiles(full, base))
      } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
        results.push(path.relative(base, full))
      }
    }
    return results
  }

  for (const ui of UI_OPTIONS) {
    it(`no native-only imports when ui=${ui}`, async () => {
      tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-expo-go-'))
      await renderFullProject(tmpDir, { ...DEFAULT_CONFIG, ui })

      const tsFiles = await collectTsFiles(tmpDir)

      for (const file of tsFiles) {
        const content = await readFile(path.join(tmpDir, file), 'utf-8')
        for (const pkg of NATIVE_ONLY_PACKAGES) {
          expect(content, `${file} imports native-only package '${pkg}'`).not.toContain(`from '${pkg}'`)
          expect(content, `${file} imports native-only package '${pkg}'`).not.toContain(`'${pkg}'`)
        }
      }
    })
  }

  it('storage adapter uses AsyncStorage, not MMKV', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-expo-go-'))
    await renderFullProject(tmpDir, DEFAULT_CONFIG)

    const content = await readFile(path.join(tmpDir, 'src/lib/storage.ts'), 'utf-8')
    expect(content).toContain('@react-native-async-storage/async-storage')
    expect(content).not.toContain('react-native-mmkv')
    expect(content).not.toContain('MMKV')
  })

  it('theme store uses zustandStorage from storage adapter', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-expo-go-'))
    await renderFullProject(tmpDir, DEFAULT_CONFIG)

    const content = await readFile(path.join(tmpDir, 'src/store/theme.ts'), 'utf-8')
    expect(content).toContain("from '@/lib/storage'")
    expect(content).toContain('zustandStorage')
    expect(content).not.toContain('mmkv')
    expect(content).not.toContain('MMKV')
  })

  it('expoInstallPackages includes async-storage, not mmkv', () => {
    for (const ui of UI_OPTIONS) {
      const packs = getActivePacks({ ...DEFAULT_CONFIG, ui })
      const allPackages = packs.flatMap((p) => p.expoInstallPackages ?? [])
      expect(allPackages, `ui=${ui}`).toContain('@react-native-async-storage/async-storage')
      expect(allPackages, `ui=${ui}`).not.toContain('react-native-mmkv')
    }
  })
})

// ─── Babel/Metro config: required for Expo + Reanimated ─────────────────────

describe('babel.config.js — required for Expo runtime', () => {
  let tmpDir: string

  afterEach(async () => {
    if (tmpDir) await rm(tmpDir, { recursive: true, force: true })
  })

  it('babel.config.js exists in generated project', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-babel-'))
    await renderFullProject(tmpDir, DEFAULT_CONFIG)

    expect(await exists(path.join(tmpDir, 'babel.config.js'))).toBe(true)
  })

  it('babel.config.js uses babel-preset-expo', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-babel-'))
    await renderFullProject(tmpDir, DEFAULT_CONFIG)

    const content = await readFile(path.join(tmpDir, 'babel.config.js'), 'utf-8')
    expect(content).toContain('babel-preset-expo')
  })

  it('babel.config.js includes react-native-reanimated/plugin', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-babel-'))
    await renderFullProject(tmpDir, DEFAULT_CONFIG)

    const content = await readFile(path.join(tmpDir, 'babel.config.js'), 'utf-8')
    expect(content).toContain('react-native-reanimated/plugin')
  })
})

// ─── Import resolution: every import() target in resolvers must exist ───────

async function extractDynamicImports(filePath: string): Promise<string[]> {
  const content = await readFile(filePath, 'utf-8')
  const importRe = /import\(['"](@\/[^'"]+)['"]\)/g
  const matches: string[] = []
  let m: RegExpExecArray | null
  while ((m = importRe.exec(content)) !== null) {
    if (m[1]) matches.push(m[1])
  }
  return matches
}

function resolveAliasPath(projectDir: string, aliasImport: string): string {
  const relative = aliasImport.replace(/^@\//, 'src/')
  return path.join(projectDir, relative)
}

async function moduleExists(projectDir: string, aliasImport: string): Promise<boolean> {
  const base = resolveAliasPath(projectDir, aliasImport)
  if (await exists(base + '.ts')) return true
  if (await exists(base + '.tsx')) return true
  if (await exists(path.join(base, 'index.ts'))) return true
  if (await exists(path.join(base, 'index.tsx'))) return true
  return false
}

describe('import resolution — every dynamic import() target resolves to an existing module', () => {
  let tmpDir: string

  afterEach(async () => {
    if (tmpDir) await rm(tmpDir, { recursive: true, force: true })
  })

  const RESOLVER_FILES = [
    'src/providers/ui/index.ts',
    'src/providers/auth/index.ts',
    'src/providers/payments/index.ts',
  ]

  for (const ui of UI_OPTIONS) {
    for (const auth of AUTH_OPTIONS) {
      for (const payments of PAYMENTS_OPTIONS) {
        const label = `ui=${ui} auth=${auth} payments=${payments}`

        it(`all resolver imports resolve: ${label}`, async () => {
          tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-resolve-'))
          const config: StarterConfig = { ui, auth, payments, dx: 'basic', preset: 'radix-green' }
          await renderFullProject(tmpDir, config)

          for (const resolverFile of RESOLVER_FILES) {
            const fullPath = path.join(tmpDir, resolverFile)
            if (!(await exists(fullPath))) continue

            const imports = await extractDynamicImports(fullPath)
            for (const imp of imports) {
              const found = await moduleExists(tmpDir, imp)
              expect(found, `${resolverFile}: import('${imp}') does not resolve to a file`).toBe(true)
            }
          }
        })
      }
    }
  }
})

describe('import resolution — screen @/ imports resolve to existing modules', () => {
  let tmpDir: string

  afterEach(async () => {
    if (tmpDir) await rm(tmpDir, { recursive: true, force: true })
  })

  async function extractStaticAliasImports(filePath: string): Promise<string[]> {
    const content = await readFile(filePath, 'utf-8')
    const importRe = /from\s+['"](@\/[^'"]+)['"]/g
    const matches: string[] = []
    let m: RegExpExecArray | null
    while ((m = importRe.exec(content)) !== null) {
      if (m[1]) matches.push(m[1])
    }
    return matches
  }

  for (const ui of UI_OPTIONS) {
    for (const auth of AUTH_OPTIONS) {
      const label = `ui=${ui} auth=${auth}`

      it(`all screen @/ imports resolve: ${label}`, async () => {
        tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-screen-resolve-'))
        const config: StarterConfig = { ui, auth, payments: 'none', dx: 'basic', preset: 'radix-green' }
        await renderFullProject(tmpDir, config)

        const screenFiles = [
          'app/_layout.tsx',
          'app/index.tsx',
          'app/(onboarding)/welcome.tsx',
          'app/(onboarding)/features.tsx',
          'app/(onboarding)/get-started.tsx',
          'app/(app)/index.tsx',
          'app/(app)/profile.tsx',
          'app/(app)/settings.tsx',
        ]

        for (const screenFile of screenFiles) {
          const fullPath = path.join(tmpDir, screenFile)
          if (!(await exists(fullPath))) continue

          const imports = await extractStaticAliasImports(fullPath)
          for (const imp of imports) {
            const found = await moduleExists(tmpDir, imp)
            expect(found, `${screenFile}: import from '${imp}' does not resolve to a file`).toBe(true)
          }
        }
      })
    }
  }
})
