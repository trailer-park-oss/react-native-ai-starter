import type { FeaturePack, ValidationResult } from '@/packs/pack.interface.js'
import type { PackContext } from '@/types.js'
import { renderTemplates, type TemplateData } from '@/utils/template.js'
import { fileExists } from '@/utils/fs.js'
import { getUIKit } from '@/packs/ui/kits.js'

function buildTemplateData(ctx: PackContext): TemplateData {
  return {
    projectName: ctx.projectName,
    ui: ctx.config.ui,
    auth: ctx.config.auth,
    payments: ctx.config.payments,
    dx: ctx.config.dx,
    preset: ctx.config.preset,
    hasAuth: ctx.config.auth !== 'none',
    hasPayments: ctx.config.payments !== 'none',
    isFullDx: ctx.config.dx === 'full',
    uiKit: getUIKit(ctx.config.ui),
  }
}

async function generateCore(ctx: PackContext): Promise<void> {
  const data = buildTemplateData(ctx)
  await renderTemplates('core', ctx.projectDir, data)
}

async function validateCore(ctx: PackContext): Promise<ValidationResult> {
  const checks = await Promise.all([
    check('starter.config.ts exists', () => fileExists(ctx.projectDir, 'src/starter.config.ts')),
    check('tsconfig.json exists', () => fileExists(ctx.projectDir, 'tsconfig.json')),
    check('babel.config.js exists', () => fileExists(ctx.projectDir, 'babel.config.js')),
    check('app.json exists', () => fileExists(ctx.projectDir, 'app.json')),
    check('Root layout exists', () => fileExists(ctx.projectDir, 'app/_layout.tsx')),
    check('Entry screen exists', () => fileExists(ctx.projectDir, 'app/index.tsx')),
    check('Onboarding layout exists', () => fileExists(ctx.projectDir, 'app/(onboarding)/_layout.tsx')),
    check('Onboarding welcome screen exists', () => fileExists(ctx.projectDir, 'app/(onboarding)/welcome.tsx')),
    check('Onboarding features screen exists', () => fileExists(ctx.projectDir, 'app/(onboarding)/features.tsx')),
    check('Onboarding get-started screen exists', () => fileExists(ctx.projectDir, 'app/(onboarding)/get-started.tsx')),
    check('App tab layout exists', () => fileExists(ctx.projectDir, 'app/(app)/_layout.tsx')),
    check('Home screen exists', () => fileExists(ctx.projectDir, 'app/(app)/index.tsx')),
    check('Profile screen exists', () => fileExists(ctx.projectDir, 'app/(app)/profile.tsx')),
    check('Settings screen exists', () => fileExists(ctx.projectDir, 'app/(app)/settings.tsx')),
    check('Onboarding store exists', () => fileExists(ctx.projectDir, 'src/store/onboarding.ts')),
    check('Theme store exists', () => fileExists(ctx.projectDir, 'src/store/theme.ts')),
    check('Store barrel export exists', () => fileExists(ctx.projectDir, 'src/store/index.ts')),
    check('Query client exists', () => fileExists(ctx.projectDir, 'src/lib/query-client.ts')),
    check('UI provider resolver exists', () => fileExists(ctx.projectDir, 'src/providers/ui/index.ts')),
    check('Auth provider resolver exists', () => fileExists(ctx.projectDir, 'src/providers/auth/index.ts')),
    check('Payments provider resolver exists', () => fileExists(ctx.projectDir, 'src/providers/payments/index.ts')),
  ])

  return {
    passed: checks.every((c) => c.passed),
    checks,
  }
}

async function check(name: string, fn: () => Promise<boolean>) {
  const passed = await fn()
  return { name, passed, message: passed ? undefined : 'File not found' }
}

export const corePack: FeaturePack = {
  id: 'core',
  dependencies: {
    'expo': '~55.0.5',
    'react': '19.2.0',
    'react-native': '0.83.2',
  },
  devDependencies: {},
  // Packages to install via `npx expo install` (resolves SDK-compatible versions)
  expoInstallPackages: [
    'expo-router',
    'expo-status-bar',
    'expo-linking',
    'expo-constants',
    'expo-font',
    'expo-splash-screen',
    'react-native-safe-area-context',
    'react-native-screens',
    'react-native-gesture-handler',
    'zustand',
    '@tanstack/react-query',
    'typescript',
    '@types/react',
  ],
  ownedPaths: [
    'src/starter.config.ts',
    'tsconfig.json',
    'babel.config.js',
    'app.json',
    'app/_layout.tsx',
    'app/index.tsx',
    'app/(onboarding)/',
    'app/(app)/',
    'src/store/',
    'src/lib/',
    'src/providers/ui/index.ts',
    'src/providers/auth/index.ts',
    'src/providers/payments/index.ts',
  ],
  generate: generateCore,
  postApplyValidation: validateCore,
}
