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

const ALL_CONFIG: StarterConfig = {
  ui: 'gluestack',
  auth: 'clerk',
  payments: 'stripe',
  dx: 'full',
  preset: 'fluent-blue',
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
    expect(await exists(path.join(tmpDir, 'app/index.tsx'))).toBe(true)
    expect(await exists(path.join(tmpDir, 'app/(onboarding)/_layout.tsx'))).toBe(true)
    expect(await exists(path.join(tmpDir, 'app/(onboarding)/welcome.tsx'))).toBe(true)
    expect(await exists(path.join(tmpDir, 'app/(onboarding)/features.tsx'))).toBe(true)
    expect(await exists(path.join(tmpDir, 'app/(onboarding)/get-started.tsx'))).toBe(true)
    expect(await exists(path.join(tmpDir, 'app/(app)/_layout.tsx'))).toBe(true)
    expect(await exists(path.join(tmpDir, 'app/(app)/index.tsx'))).toBe(true)
    expect(await exists(path.join(tmpDir, 'app/(app)/profile.tsx'))).toBe(true)
    expect(await exists(path.join(tmpDir, 'app/(app)/settings.tsx'))).toBe(true)
    expect(await exists(path.join(tmpDir, 'src/store/onboarding.ts'))).toBe(true)
    expect(await exists(path.join(tmpDir, 'src/store/theme.ts'))).toBe(true)
    expect(await exists(path.join(tmpDir, 'src/store/index.ts'))).toBe(true)
    expect(await exists(path.join(tmpDir, 'src/lib/query-client.ts'))).toBe(true)
    expect(await exists(path.join(tmpDir, 'src/providers/ui/index.ts'))).toBe(true)
    expect(await exists(path.join(tmpDir, 'src/providers/auth/index.ts'))).toBe(true)
    expect(await exists(path.join(tmpDir, 'src/providers/payments/index.ts'))).toBe(true)
  })

  it('interpolates starter.config.ts with correct values', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-starter-'))
    const data = toTemplateData('my-app', ALL_CONFIG)

    await renderTemplates('core', tmpDir, data)

    const content = await readFile(path.join(tmpDir, 'src/starter.config.ts'), 'utf-8')
    expect(content).toContain("ui: 'gluestack'")
    expect(content).toContain("auth: 'clerk'")
    expect(content).toContain("payments: 'stripe'")
    expect(content).toContain("dx: 'full'")
    expect(content).toContain("preset: 'fluent-blue'")
  })

  it('starter.config.ts includes all required type definitions', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-starter-'))
    const data = toTemplateData('type-app', DEFAULT_CONFIG)

    await renderTemplates('core', tmpDir, data)

    const content = await readFile(path.join(tmpDir, 'src/starter.config.ts'), 'utf-8')
    expect(content).toContain("export type UiProvider = 'tamagui' | 'gluestack'")
    expect(content).toContain("export type AuthProvider = 'clerk' | 'none'")
    expect(content).toContain("export type PaymentsProvider = 'stripe' | 'none'")
    expect(content).toContain("export type DxProfile = 'basic' | 'full'")
    expect(content).toContain("export type ThemePreset = 'neutral-green' | 'fluent-blue'")
    expect(content).toContain('export interface StarterConfig')
    expect(content).toContain('export const starterConfig: StarterConfig')
  })

  it('includes auth import in root layout when auth is enabled', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-starter-'))
    const data = toTemplateData('auth-app', { ...DEFAULT_CONFIG, auth: 'clerk' })

    await renderTemplates('core', tmpDir, data)

    const content = await readFile(path.join(tmpDir, 'app/_layout.tsx'), 'utf-8')
    expect(content).toContain("import { useAuth } from '@/providers/auth'")
    expect(content).toContain('isAuthenticated')
    expect(content).toContain('isAuthLoading')
    expect(content).toContain("router.replace('/(auth)/sign-in')")
  })

  it('excludes auth import in root layout when auth is none', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-starter-'))
    const data = toTemplateData('no-auth-app', DEFAULT_CONFIG)

    await renderTemplates('core', tmpDir, data)

    const content = await readFile(path.join(tmpDir, 'app/_layout.tsx'), 'utf-8')
    expect(content).not.toContain("import { useAuth }")
    expect(content).not.toContain('isAuthenticated')
    expect(content).not.toContain('(auth)')
  })

  it('sets correct theme preset in store', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-starter-'))
    const data = toTemplateData('theme-app', { ...DEFAULT_CONFIG, preset: 'fluent-blue' })

    await renderTemplates('core', tmpDir, data)

    const content = await readFile(path.join(tmpDir, 'src/store/theme.ts'), 'utf-8')
    expect(content).toContain("preset: 'fluent-blue'")
  })

  it('sets neutral-green as default theme preset', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-starter-'))
    const data = toTemplateData('default-theme', DEFAULT_CONFIG)

    await renderTemplates('core', tmpDir, data)

    const content = await readFile(path.join(tmpDir, 'src/store/theme.ts'), 'utf-8')
    expect(content).toContain("preset: 'neutral-green'")
  })
})

describe('tsconfig.json generation', () => {
  let tmpDir: string

  afterEach(async () => {
    if (tmpDir) await rm(tmpDir, { recursive: true, force: true })
  })

  it('includes strict: true', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-starter-'))
    await renderTemplates('core', tmpDir, toTemplateData('ts-app', DEFAULT_CONFIG))

    const content = await readFile(path.join(tmpDir, 'tsconfig.json'), 'utf-8')
    const tsconfig = JSON.parse(content)
    expect(tsconfig.compilerOptions.strict).toBe(true)
  })

  it('includes noUncheckedIndexedAccess: true', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-starter-'))
    await renderTemplates('core', tmpDir, toTemplateData('ts-app', DEFAULT_CONFIG))

    const content = await readFile(path.join(tmpDir, 'tsconfig.json'), 'utf-8')
    const tsconfig = JSON.parse(content)
    expect(tsconfig.compilerOptions.noUncheckedIndexedAccess).toBe(true)
  })

  it('includes path alias @/* -> ./src/*', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-starter-'))
    await renderTemplates('core', tmpDir, toTemplateData('ts-app', DEFAULT_CONFIG))

    const content = await readFile(path.join(tmpDir, 'tsconfig.json'), 'utf-8')
    const tsconfig = JSON.parse(content)
    expect(tsconfig.compilerOptions.paths).toEqual({ '@/*': ['./src/*'] })
  })

  it('extends expo/tsconfig.base', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-starter-'))
    await renderTemplates('core', tmpDir, toTemplateData('ts-app', DEFAULT_CONFIG))

    const content = await readFile(path.join(tmpDir, 'tsconfig.json'), 'utf-8')
    const tsconfig = JSON.parse(content)
    expect(tsconfig.extends).toBe('expo/tsconfig.base')
  })
})

describe('app.json generation', () => {
  let tmpDir: string

  afterEach(async () => {
    if (tmpDir) await rm(tmpDir, { recursive: true, force: true })
  })

  it('interpolates project name correctly', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-starter-'))
    await renderTemplates('core', tmpDir, toTemplateData('cool-app', DEFAULT_CONFIG))

    const content = await readFile(path.join(tmpDir, 'app.json'), 'utf-8')
    const appJson = JSON.parse(content)
    expect(appJson.expo.name).toBe('cool-app')
    expect(appJson.expo.slug).toBe('cool-app')
    expect(appJson.expo.scheme).toBe('cool-app')
  })

  it('includes expo-router and expo-font plugins', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-starter-'))
    await renderTemplates('core', tmpDir, toTemplateData('plugin-app', DEFAULT_CONFIG))

    const content = await readFile(path.join(tmpDir, 'app.json'), 'utf-8')
    const appJson = JSON.parse(content)
    expect(appJson.expo.plugins).toContain('expo-router')
    expect(appJson.expo.plugins).toContain('expo-font')
  })

  it('sets newArchEnabled to true', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-starter-'))
    await renderTemplates('core', tmpDir, toTemplateData('arch-app', DEFAULT_CONFIG))

    const content = await readFile(path.join(tmpDir, 'app.json'), 'utf-8')
    const appJson = JSON.parse(content)
    expect(appJson.expo.newArchEnabled).toBe(true)
  })
})

describe('provider resolver generation', () => {
  let tmpDir: string

  afterEach(async () => {
    if (tmpDir) await rm(tmpDir, { recursive: true, force: true })
  })

  it('UI resolver uses tamagui import when ui=tamagui', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-starter-'))
    await renderTemplates('core', tmpDir, toTemplateData('ui-app', { ...DEFAULT_CONFIG, ui: 'tamagui' }))

    const content = await readFile(path.join(tmpDir, 'src/providers/ui/index.ts'), 'utf-8')
    expect(content).toContain("case 'tamagui':")
    expect(content).toContain("import('@/providers/ui/tamagui')")
    expect(content).not.toContain("case 'gluestack':")
  })

  it('UI resolver uses gluestack import when ui=gluestack', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-starter-'))
    await renderTemplates('core', tmpDir, toTemplateData('ui-app', { ...DEFAULT_CONFIG, ui: 'gluestack' }))

    const content = await readFile(path.join(tmpDir, 'src/providers/ui/index.ts'), 'utf-8')
    expect(content).toContain("case 'gluestack':")
    expect(content).toContain("import('@/providers/ui/gluestack')")
    expect(content).not.toContain("case 'tamagui':")
  })

  it('UI resolver imports starterConfig', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-starter-'))
    await renderTemplates('core', tmpDir, toTemplateData('ui-app', DEFAULT_CONFIG))

    const content = await readFile(path.join(tmpDir, 'src/providers/ui/index.ts'), 'utf-8')
    expect(content).toContain("import { starterConfig } from '@/starter.config'")
  })

  it('auth resolver exports useAuth when auth=clerk', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-starter-'))
    await renderTemplates('core', tmpDir, toTemplateData('auth-app', { ...DEFAULT_CONFIG, auth: 'clerk' }))

    const content = await readFile(path.join(tmpDir, 'src/providers/auth/index.ts'), 'utf-8')
    expect(content).toContain("import { starterConfig } from '@/starter.config'")
    expect(content).toContain("case 'clerk':")
    expect(content).toContain("import('@/providers/auth/clerk')")
    expect(content).toContain('export function useAuth()')
  })

  it('auth resolver is a no-op stub when auth=none', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-starter-'))
    await renderTemplates('core', tmpDir, toTemplateData('no-auth-app', DEFAULT_CONFIG))

    const content = await readFile(path.join(tmpDir, 'src/providers/auth/index.ts'), 'utf-8')
    expect(content).toContain('Auth is disabled')
    expect(content).toContain('export function useAuth()')
    expect(content).not.toContain("import { starterConfig }")
    expect(content).not.toContain("case 'clerk':")
  })

  it('payments resolver exports usePayments when payments=stripe', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-starter-'))
    await renderTemplates('core', tmpDir, toTemplateData('pay-app', { ...DEFAULT_CONFIG, payments: 'stripe' }))

    const content = await readFile(path.join(tmpDir, 'src/providers/payments/index.ts'), 'utf-8')
    expect(content).toContain("import { starterConfig } from '@/starter.config'")
    expect(content).toContain("case 'stripe':")
    expect(content).toContain("import('@/providers/payments/stripe')")
    expect(content).toContain('export function usePayments()')
  })

  it('payments resolver is a no-op stub when payments=none', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-starter-'))
    await renderTemplates('core', tmpDir, toTemplateData('no-pay-app', DEFAULT_CONFIG))

    const content = await readFile(path.join(tmpDir, 'src/providers/payments/index.ts'), 'utf-8')
    expect(content).toContain('Payments is disabled')
    expect(content).toContain('export function usePayments()')
    expect(content).not.toContain("import { starterConfig }")
    expect(content).not.toContain("case 'stripe':")
  })
})

describe('store generation', () => {
  let tmpDir: string

  afterEach(async () => {
    if (tmpDir) await rm(tmpDir, { recursive: true, force: true })
  })

  it('onboarding store uses zustand create', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-starter-'))
    await renderTemplates('core', tmpDir, toTemplateData('store-app', DEFAULT_CONFIG))

    const content = await readFile(path.join(tmpDir, 'src/store/onboarding.ts'), 'utf-8')
    expect(content).toContain("import { create } from 'zustand'")
    expect(content).toContain('useOnboardingStore')
    expect(content).toContain('hasCompletedOnboarding')
    expect(content).toContain('complete')
    expect(content).toContain('reset')
  })

  it('theme store uses zustand create with preset', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-starter-'))
    await renderTemplates('core', tmpDir, toTemplateData('store-app', { ...DEFAULT_CONFIG, preset: 'fluent-blue' }))

    const content = await readFile(path.join(tmpDir, 'src/store/theme.ts'), 'utf-8')
    expect(content).toContain("import { create } from 'zustand'")
    expect(content).toContain('useThemeStore')
    expect(content).toContain("preset: 'fluent-blue'")
    expect(content).toContain('setPreset')
  })

  it('store barrel export re-exports onboarding and theme stores', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-starter-'))
    await renderTemplates('core', tmpDir, toTemplateData('store-app', DEFAULT_CONFIG))

    const content = await readFile(path.join(tmpDir, 'src/store/index.ts'), 'utf-8')
    expect(content).toContain('useOnboardingStore')
    expect(content).toContain('useThemeStore')
  })

  it('query client uses TanStack Query', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-starter-'))
    await renderTemplates('core', tmpDir, toTemplateData('query-app', DEFAULT_CONFIG))

    const content = await readFile(path.join(tmpDir, 'src/lib/query-client.ts'), 'utf-8')
    expect(content).toContain("import { QueryClient } from '@tanstack/react-query'")
    expect(content).toContain('new QueryClient')
    expect(content).toContain('export const queryClient')
  })
})

describe('route group generation', () => {
  let tmpDir: string

  afterEach(async () => {
    if (tmpDir) await rm(tmpDir, { recursive: true, force: true })
  })

  it('entry screen redirects to onboarding or app based on state', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-starter-'))
    await renderTemplates('core', tmpDir, toTemplateData('route-app', DEFAULT_CONFIG))

    const content = await readFile(path.join(tmpDir, 'app/index.tsx'), 'utf-8')
    expect(content).toContain('useOnboardingStore')
    expect(content).toContain('Redirect')
    expect(content).toContain('/(onboarding)/welcome')
    expect(content).toContain('/(app)')
  })

  it('onboarding layout uses Stack with headerShown false', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-starter-'))
    await renderTemplates('core', tmpDir, toTemplateData('onb-app', DEFAULT_CONFIG))

    const content = await readFile(path.join(tmpDir, 'app/(onboarding)/_layout.tsx'), 'utf-8')
    expect(content).toContain('Stack')
    expect(content).toContain('headerShown: false')
  })

  it('onboarding has 3 screens: welcome, features, get-started', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-starter-'))
    await renderTemplates('core', tmpDir, toTemplateData('onb-app', DEFAULT_CONFIG))

    expect(await exists(path.join(tmpDir, 'app/(onboarding)/welcome.tsx'))).toBe(true)
    expect(await exists(path.join(tmpDir, 'app/(onboarding)/features.tsx'))).toBe(true)
    expect(await exists(path.join(tmpDir, 'app/(onboarding)/get-started.tsx'))).toBe(true)
  })

  it('app layout uses Tabs with Home, Profile, Settings', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-starter-'))
    await renderTemplates('core', tmpDir, toTemplateData('tab-app', DEFAULT_CONFIG))

    const content = await readFile(path.join(tmpDir, 'app/(app)/_layout.tsx'), 'utf-8')
    expect(content).toContain('Tabs')
    expect(content).toContain("title: 'Home'")
    expect(content).toContain("title: 'Profile'")
    expect(content).toContain("title: 'Settings'")
  })

  it('root layout wraps with SafeAreaProvider and QueryClientProvider', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-starter-'))
    await renderTemplates('core', tmpDir, toTemplateData('layout-app', DEFAULT_CONFIG))

    const content = await readFile(path.join(tmpDir, 'app/_layout.tsx'), 'utf-8')
    expect(content).toContain('SafeAreaProvider')
    expect(content).toContain('QueryClientProvider')
    expect(content).toContain('queryClient')
  })

  it('get-started screen calls onboarding complete and navigates to app', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-starter-'))
    await renderTemplates('core', tmpDir, toTemplateData('gs-app', DEFAULT_CONFIG))

    const content = await readFile(path.join(tmpDir, 'app/(onboarding)/get-started.tsx'), 'utf-8')
    expect(content).toContain('complete()')
    expect(content).toContain("router.replace('/(app)')")
  })
})

describe('package.json generation', () => {
  it('merges core pack dependencies into package.json', () => {
    const packs = getActivePacks(DEFAULT_CONFIG)
    const base = buildBasePackageJson('test-app')
    const result = mergePackDependencies(base, packs)

    expect(result.dependencies).toHaveProperty('expo')
  })

  it('sets correct project name and main entry', () => {
    const base = buildBasePackageJson('my-project')
    expect(base.name).toBe('my-project')
    expect(base.main).toBe('expo-router/entry')
  })

  it('includes dev scripts for expo', () => {
    const base = buildBasePackageJson('test-app')
    expect(base.scripts.dev).toBe('expo start')
    expect(base.scripts['dev:ios']).toBe('expo start --ios')
    expect(base.scripts['dev:android']).toBe('expo start --android')
  })

  it('collects expoInstallPackages from active packs', () => {
    const packs = getActivePacks(DEFAULT_CONFIG)
    const expoPackages = packs.flatMap((p) => p.expoInstallPackages ?? [])

    expect(expoPackages).toContain('zustand')
    expect(expoPackages).toContain('@tanstack/react-query')
    expect(expoPackages).toContain('expo-router')
    expect(expoPackages).toContain('react-native-safe-area-context')
    expect(expoPackages).toContain('react-native-screens')
    expect(expoPackages).toContain('react-native-gesture-handler')
  })

  it('does not include disabled pack dependencies', () => {
    const packs = getActivePacks(DEFAULT_CONFIG)
    const base = buildBasePackageJson('test-app')
    const result = mergePackDependencies(base, packs)

    const allDeps = { ...result.dependencies, ...result.devDependencies }
    expect(allDeps).not.toHaveProperty('@clerk/clerk-expo')
    expect(allDeps).not.toHaveProperty('@stripe/stripe-react-native')
  })

  it('sorts dependencies alphabetically', () => {
    const packs = getActivePacks(DEFAULT_CONFIG)
    const base = buildBasePackageJson('test-app')
    const result = mergePackDependencies(base, packs)

    const keys = Object.keys(result.dependencies)
    const sorted = [...keys].sort((a, b) => a.localeCompare(b))
    expect(keys).toEqual(sorted)
  })

  it('pins react in overrides when present', () => {
    const packs = getActivePacks(DEFAULT_CONFIG)
    const base = buildBasePackageJson('test-app')
    const result = mergePackDependencies(base, packs)

    expect(result.overrides).toHaveProperty('react')
    expect(result.overrides.react).toBe(result.dependencies['react'])
  })
})
