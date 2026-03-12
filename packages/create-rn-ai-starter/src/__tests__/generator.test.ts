import { describe, it, expect, afterEach } from 'vitest'
import { mkdtemp, rm, readFile, access } from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import type { StarterConfig } from '@/types.js'
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
  const providers = config.ai.providers
  const hasMlkit = providers.includes('on-device-mlkit')
  const hasExecuTorch = providers.includes('on-device-executorch')
  const hasOpenRouter = providers.includes('online-openrouter')

  return {
    projectName,
    ui: config.ui,
    auth: config.auth,
    aiProviders: providers,
    openrouterModel: config.ai.openrouter?.model,
    executorchModel: config.ai.executorch?.model,
    payments: config.payments,
    dx: config.dx,
    preset: config.preset,
    hasAuth: config.auth !== 'none',
    hasPayments: config.payments !== 'none',
    isFullDx: config.dx === 'full',
    uiKit: getUIKit(config.ui),
    hasAi: providers.length > 0,
    hasMlkit,
    hasExecuTorch,
    hasOpenRouter,
  }
}

const ALL_CONFIG: StarterConfig = {
  ui: 'gluestack',
  auth: 'clerk',
  ai: { providers: ['online-openrouter'], openrouter: { model: 'openai/gpt-4o-mini' } },
  payments: 'stripe',
  dx: 'full',
  preset: 'radix-blue',
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
    expect(await exists(path.join(tmpDir, 'babel.config.js'))).toBe(true)
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
    expect(content).toContain('providers: [\"online-openrouter\"]')
    expect(content).toContain('openrouter: { model:')
    expect(content).toContain("payments: 'stripe'")
    expect(content).toContain("dx: 'full'")
    expect(content).toContain("preset: 'radix-blue'")
  })

  it('starter.config.ts includes ai model config', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-starter-ai-models-'))
    const data = toTemplateData('ai-models', {
      ...DEFAULT_CONFIG,
      ai: {
        providers: ['online-openrouter', 'on-device-executorch'],
        openrouter: { model: 'openai/gpt-4o-mini' },
        executorch: { model: 'LLAMA3_2_1B' },
      },
    })

    await renderTemplates('core', tmpDir, data)

    const content = await readFile(path.join(tmpDir, 'src/starter.config.ts'), 'utf-8')
    expect(content).toContain('openrouter: { model:')
    expect(content).toContain('executorch: { model:')
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
    expect(content).toContain('export type ThemePreset')
    for (const p of ['radix-blue', 'radix-green', 'radix-purple', 'radix-orange', 'radix-cyan', 'radix-red']) {
      expect(content).toContain(`'${p}'`)
    }
    expect(content).toContain('export interface StarterConfig')
    expect(content).toContain('export const starterConfig: StarterConfig')
  })

  it('renders AI screen for OpenRouter provider', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-ai-openrouter-'))
    const data = toTemplateData('ai-openrouter', {
      ...DEFAULT_CONFIG,
      ai: { providers: ['online-openrouter'], openrouter: { model: 'openai/gpt-4o-mini' } },
    })

    await renderTemplates('ai', tmpDir, data)

    const content = await readFile(path.join(tmpDir, 'app/(app)/ai.tsx'), 'utf-8')
    expect(content).toContain('OpenRouter')
    expect(content).toContain('AI Chat')
  })

  it('renders AI screen for ML Kit provider', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-ai-mlkit-'))
    const data = toTemplateData('ai-mlkit', {
      ...DEFAULT_CONFIG,
      ai: { providers: ['on-device-mlkit'] },
    })

    await renderTemplates('ai', tmpDir, data)

    const content = await readFile(path.join(tmpDir, 'app/(app)/ai.tsx'), 'utf-8')
    expect(content).toContain('ML Kit')
    expect(content).toContain('On-Device Vision')
  })

  it('renders provider switcher when multiple AI providers are selected', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-ai-multi-'))
    const data = toTemplateData('ai-multi', {
      ...DEFAULT_CONFIG,
      ai: {
        providers: ['on-device-mlkit', 'online-openrouter'],
        openrouter: { model: 'openai/gpt-4o-mini' },
      },
    })

    await renderTemplates('ai', tmpDir, data)

    const content = await readFile(path.join(tmpDir, 'app/(app)/ai.tsx'), 'utf-8')
    expect(content).toContain('OpenRouter')
    expect(content).toContain('ML Kit')
  })

  it('uses selected OpenRouter model in ai screen', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-ai-openrouter-model-'))
    const data = toTemplateData('ai-openrouter', {
      ...DEFAULT_CONFIG,
      ai: {
        providers: ['online-openrouter'],
        openrouter: { model: 'openai/gpt-4o-mini' },
      },
    })

    await renderTemplates('ai', tmpDir, data)

    const content = await readFile(path.join(tmpDir, 'app/(app)/ai.tsx'), 'utf-8')
    expect(content).toContain('openai/gpt-4o-mini')
  })

  it('uses selected ExecuTorch model in hook', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-ai-executorch-model-'))
    const data = toTemplateData('ai-executorch', {
      ...DEFAULT_CONFIG,
      ai: {
        providers: ['on-device-executorch'],
        executorch: { model: 'LLAMA3_2_3B' },
      },
    })

    await renderTemplates('ai-executorch', tmpDir, data)

    const content = await readFile(
      path.join(tmpDir, 'src/providers/ai/executorch/useOnDeviceChat.ts'),
      'utf-8',
    )
    expect(content).toContain('LLAMA3_2_3B')
  })

  it('includes auth screen in root layout Stack when auth is enabled', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-starter-'))
    const data = toTemplateData('auth-app', { ...DEFAULT_CONFIG, auth: 'clerk' })

    await renderTemplates('core', tmpDir, data)

    const content = await readFile(path.join(tmpDir, 'app/_layout.tsx'), 'utf-8')
    expect(content).toContain('(auth)')
  })

  it('excludes auth screen in root layout Stack when auth is none', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-starter-'))
    const data = toTemplateData('no-auth-app', DEFAULT_CONFIG)

    await renderTemplates('core', tmpDir, data)

    const content = await readFile(path.join(tmpDir, 'app/_layout.tsx'), 'utf-8')
    expect(content).not.toContain('(auth)')
  })

  it('sets correct theme preset in store', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-starter-'))
    const data = toTemplateData('theme-app', { ...DEFAULT_CONFIG, preset: 'radix-blue' })

    await renderTemplates('core', tmpDir, data)

    const content = await readFile(path.join(tmpDir, 'src/store/theme.ts'), 'utf-8')
    expect(content).toContain("preset: 'radix-blue'")
  })

  it('sets radix-blue as default theme preset', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-starter-'))
    const data = toTemplateData('default-theme', DEFAULT_CONFIG)

    await renderTemplates('core', tmpDir, data)

    const content = await readFile(path.join(tmpDir, 'src/store/theme.ts'), 'utf-8')
    expect(content).toContain("preset: 'radix-blue'")
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
    await renderTemplates('core', tmpDir, toTemplateData('store-app', { ...DEFAULT_CONFIG, preset: 'radix-blue' }))

    const content = await readFile(path.join(tmpDir, 'src/store/theme.ts'), 'utf-8')
    expect(content).toContain("import { create } from 'zustand'")
    expect(content).toContain('useThemeStore')
    expect(content).toContain("preset: 'radix-blue'")
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

  it('app layout uses Tabs with Home, AI, Profile, Settings', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-starter-'))
    await renderTemplates('core', tmpDir, toTemplateData('tab-app', DEFAULT_CONFIG))

    const content = await readFile(path.join(tmpDir, 'app/(app)/_layout.tsx'), 'utf-8')
    expect(content).toContain('Tabs')
    expect(content).toContain("title: 'Home'")
    expect(content).toContain("title: 'AI'")
    expect(content).toContain("title: 'Profile'")
    expect(content).toContain("title: 'Settings'")
  })

  it('root layout wraps with SafeAreaProvider, QueryClientProvider, ThemeProvider', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-starter-'))
    await renderTemplates('core', tmpDir, toTemplateData('layout-app', DEFAULT_CONFIG))

    const content = await readFile(path.join(tmpDir, 'app/_layout.tsx'), 'utf-8')
    expect(content).toContain('SafeAreaProvider')
    expect(content).toContain('QueryClientProvider')
    expect(content).toContain('ThemeProvider')
    expect(content).toContain('Stack')
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
    expect(allDeps).not.toHaveProperty('@clerk/expo')
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

describe('UI kit pattern — tamagui screens', () => {
  let tmpDir: string

  afterEach(async () => {
    if (tmpDir) await rm(tmpDir, { recursive: true, force: true })
  })

  it('welcome screen imports YStack and Text from tamagui', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-starter-'))
    await renderTemplates('core', tmpDir, toTemplateData('tam-app', { ...DEFAULT_CONFIG, ui: 'tamagui' }))

    const content = await readFile(path.join(tmpDir, 'app/(onboarding)/welcome.tsx'), 'utf-8')
    expect(content).toContain("import { YStack, Text } from 'tamagui'")
    expect(content).toContain('useTokens')
    expect(content).toContain('PrimaryButton')
  })

  it('home screen uses YStack as container and imports uiKit', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-starter-'))
    await renderTemplates('core', tmpDir, toTemplateData('tam-app', { ...DEFAULT_CONFIG, ui: 'tamagui' }))

    const content = await readFile(path.join(tmpDir, 'app/(app)/index.tsx'), 'utf-8')
    expect(content).toContain("from 'tamagui'")
    expect(content).toContain('YStack')
    expect(content).toContain('XStack')
    expect(content).toContain('useTokens')
    expect(content).toContain('useAiChat')
    expect(content).not.toContain('StyleSheet')
  })

  it('all tamagui screens use design tokens not hardcoded styles', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-starter-'))
    await renderTemplates('core', tmpDir, toTemplateData('tam-app', { ...DEFAULT_CONFIG, ui: 'tamagui' }))

    for (const screen of ['welcome', 'features', 'get-started']) {
      const content = await readFile(path.join(tmpDir, `app/(onboarding)/${screen}.tsx`), 'utf-8')
      expect(content).toContain("from '@/design-system'")
      expect(content).toContain('useTokens()')
      expect(content).not.toContain('StyleSheet.create')
    }

    for (const screen of ['index', 'profile', 'settings']) {
      const content = await readFile(path.join(tmpDir, `app/(app)/${screen}.tsx`), 'utf-8')
      expect(content).toContain("from '@/design-system'")
      expect(content).toContain('useTokens()')
      expect(content).not.toContain('StyleSheet.create')
    }
  })
})

describe('UI kit pattern — gluestack screens', () => {
  let tmpDir: string

  afterEach(async () => {
    if (tmpDir) await rm(tmpDir, { recursive: true, force: true })
  })

  it('welcome screen imports VStack and Text from gluestack', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-starter-'))
    await renderTemplates('core', tmpDir, toTemplateData('gs-app', { ...DEFAULT_CONFIG, ui: 'gluestack' }))

    const content = await readFile(path.join(tmpDir, 'app/(onboarding)/welcome.tsx'), 'utf-8')
    expect(content).toContain("import { VStack, Text } from '@gluestack-ui/themed'")
    expect(content).toContain('useTokens')
    expect(content).toContain('PrimaryButton')
  })

  it('home screen uses VStack as container and imports uiKit', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-starter-'))
    await renderTemplates('core', tmpDir, toTemplateData('gs-app', { ...DEFAULT_CONFIG, ui: 'gluestack' }))

    const content = await readFile(path.join(tmpDir, 'app/(app)/index.tsx'), 'utf-8')
    expect(content).toContain("from '@gluestack-ui/themed'")
    expect(content).toContain('VStack')
    expect(content).toContain('HStack')
    expect(content).toContain('useTokens')
    expect(content).toContain('useAiChat')
    expect(content).not.toContain('StyleSheet')
  })

  it('all gluestack screens use design tokens not hardcoded styles', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-starter-'))
    await renderTemplates('core', tmpDir, toTemplateData('gs-app', { ...DEFAULT_CONFIG, ui: 'gluestack' }))

    for (const screen of ['welcome', 'features', 'get-started']) {
      const content = await readFile(path.join(tmpDir, `app/(onboarding)/${screen}.tsx`), 'utf-8')
      expect(content).toContain("from '@/design-system'")
      expect(content).toContain('useTokens()')
      expect(content).not.toContain('StyleSheet.create')
    }

    for (const screen of ['index', 'profile', 'settings']) {
      const content = await readFile(path.join(tmpDir, `app/(app)/${screen}.tsx`), 'utf-8')
      expect(content).toContain("from '@/design-system'")
      expect(content).toContain('useTokens()')
      expect(content).not.toContain('StyleSheet.create')
    }
  })
})

describe('UI kit pattern — root layout', () => {
  let tmpDir: string

  afterEach(async () => {
    if (tmpDir) await rm(tmpDir, { recursive: true, force: true })
  })

  it('root layout wraps with ThemeProvider', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-starter-'))
    await renderTemplates('core', tmpDir, toTemplateData('theme-layout', DEFAULT_CONFIG))

    const content = await readFile(path.join(tmpDir, 'app/_layout.tsx'), 'utf-8')
    expect(content).toContain('ThemeProvider')
    expect(content).toContain("from '@/design-system'")
  })

  it('root layout uses Stack navigator with explicit screen declarations', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-starter-'))
    await renderTemplates('core', tmpDir, toTemplateData('stack-layout', DEFAULT_CONFIG))

    const content = await readFile(path.join(tmpDir, 'app/_layout.tsx'), 'utf-8')
    expect(content).toContain("import { Stack } from 'expo-router'")
    expect(content).toContain('<Stack')
    expect(content).toContain('name="index"')
    expect(content).toContain('name="(onboarding)"')
    expect(content).toContain('name="(app)"')
    expect(content).not.toContain('Slot')
    expect(content).not.toContain('RouteGuard')
  })
})

describe('UI pack template rendering', () => {
  let tmpDir: string

  afterEach(async () => {
    if (tmpDir) await rm(tmpDir, { recursive: true, force: true })
  })

  it('renders shared design system files', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-starter-'))
    await renderTemplates('ui', tmpDir, toTemplateData('ui-shared', DEFAULT_CONFIG))

    expect(await exists(path.join(tmpDir, 'src/design-system/tokens.ts'))).toBe(true)
    expect(await exists(path.join(tmpDir, 'src/design-system/index.ts'))).toBe(true)
    expect(await exists(path.join(tmpDir, 'src/design-system/elevation.ts'))).toBe(true)
    expect(await exists(path.join(tmpDir, 'src/design-system/ThemeProvider.tsx'))).toBe(true)
    expect(await exists(path.join(tmpDir, 'src/lib/storage.ts'))).toBe(true)
  })

  it('renders tamagui-specific templates', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-starter-'))
    await renderTemplates('ui-tamagui', tmpDir, toTemplateData('tam-ui', { ...DEFAULT_CONFIG, ui: 'tamagui' }))

    expect(await exists(path.join(tmpDir, 'tamagui.config.ts'))).toBe(true)
    expect(await exists(path.join(tmpDir, 'src/providers/ui/tamagui/TamaguiProvider.tsx'))).toBe(true)
    expect(await exists(path.join(tmpDir, 'src/providers/ui/tamagui/tamagui.config.ts'))).toBe(true)
    expect(await exists(path.join(tmpDir, 'src/components/Card.tsx'))).toBe(true)
    expect(await exists(path.join(tmpDir, 'src/components/PrimaryButton.tsx'))).toBe(true)
    expect(await exists(path.join(tmpDir, 'src/components/StatusBanner.tsx'))).toBe(true)
  })

  it('renders gluestack-specific templates', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-starter-'))
    await renderTemplates('ui-gluestack', tmpDir, toTemplateData('gs-ui', { ...DEFAULT_CONFIG, ui: 'gluestack' }))

    expect(await exists(path.join(tmpDir, 'src/providers/ui/gluestack/GluestackProvider.tsx'))).toBe(true)
    expect(await exists(path.join(tmpDir, 'src/providers/ui/gluestack/gluestack.config.ts'))).toBe(true)
    expect(await exists(path.join(tmpDir, 'src/components/Card.tsx'))).toBe(true)
    expect(await exists(path.join(tmpDir, 'src/components/PrimaryButton.tsx'))).toBe(true)
    expect(await exists(path.join(tmpDir, 'src/components/StatusBanner.tsx'))).toBe(true)
  })

  it('tamagui Card component imports from tamagui directly', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-starter-'))
    await renderTemplates('ui-tamagui', tmpDir, toTemplateData('tam-comp', { ...DEFAULT_CONFIG, ui: 'tamagui' }))

    const content = await readFile(path.join(tmpDir, 'src/components/Card.tsx'), 'utf-8')
    expect(content).toContain("from 'tamagui'")
    expect(content).not.toContain('@gluestack-ui/themed')
  })

  it('gluestack Card component imports from gluestack directly', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-starter-'))
    await renderTemplates('ui-gluestack', tmpDir, toTemplateData('gs-comp', { ...DEFAULT_CONFIG, ui: 'gluestack' }))

    const content = await readFile(path.join(tmpDir, 'src/components/Card.tsx'), 'utf-8')
    expect(content).toContain("from '@gluestack-ui/themed'")
    expect(content).not.toContain("from 'tamagui'")
  })

  it('ThemeProvider conditionally imports TamaguiAdapter for tamagui', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-starter-'))
    await renderTemplates('ui', tmpDir, toTemplateData('tam-tp', { ...DEFAULT_CONFIG, ui: 'tamagui' }))

    const content = await readFile(path.join(tmpDir, 'src/design-system/ThemeProvider.tsx'), 'utf-8')
    expect(content).toContain('TamaguiAdapter')
    expect(content).not.toContain('GluestackAdapter')
  })

  it('ThemeProvider conditionally imports GluestackAdapter for gluestack', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-starter-'))
    await renderTemplates('ui', tmpDir, toTemplateData('gs-tp', { ...DEFAULT_CONFIG, ui: 'gluestack' }))

    const content = await readFile(path.join(tmpDir, 'src/design-system/ThemeProvider.tsx'), 'utf-8')
    expect(content).toContain('GluestackAdapter')
    expect(content).not.toContain('TamaguiAdapter')
  })
})

describe('UI pack dependencies', () => {
  it('includes tamagui deps when ui=tamagui', () => {
    const packs = getActivePacks({ ...DEFAULT_CONFIG, ui: 'tamagui' })
    const uiPack = packs.find((p) => p.id === 'ui')!
    expect(uiPack.dependencies).toHaveProperty('tamagui')
    expect(uiPack.dependencies).toHaveProperty('@tamagui/config')
    expect(uiPack.dependencies).not.toHaveProperty('@gluestack-ui/themed')
  })

  it('includes gluestack deps when ui=gluestack', () => {
    const packs = getActivePacks({ ...DEFAULT_CONFIG, ui: 'gluestack' })
    const uiPack = packs.find((p) => p.id === 'ui')!
    expect(uiPack.dependencies).toHaveProperty('@gluestack-ui/themed')
    expect(uiPack.dependencies).toHaveProperty('@gluestack-style/react')
    expect(uiPack.dependencies).not.toHaveProperty('tamagui')
  })

  it('includes tamagui devDependencies when ui=tamagui', () => {
    const packs = getActivePacks({ ...DEFAULT_CONFIG, ui: 'tamagui' })
    const uiPack = packs.find((p) => p.id === 'ui')!
    expect(uiPack.devDependencies).toHaveProperty('@tamagui/babel-plugin')
  })

  it('merges UI pack deps into package.json', () => {
    const packs = getActivePacks({ ...DEFAULT_CONFIG, ui: 'tamagui' })
    const base = buildBasePackageJson('test-app')
    const result = mergePackDependencies(base, packs)
    expect(result.dependencies).toHaveProperty('tamagui')
  })
})
