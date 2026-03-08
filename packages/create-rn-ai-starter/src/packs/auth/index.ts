import type { FeaturePack, ValidationCheck } from '@/packs/pack.interface.js'
import type { PackContext } from '@/types.js'
import { renderTemplates, type TemplateData } from '@/utils/template.js'
import { fileExists } from '@/utils/fs.js'
import { getUIKit } from '@/packs/ui/kits.js'

function buildTemplateData(ctx: PackContext): TemplateData {
  return {
    projectName: ctx.projectName,
    ui: ctx.config.ui,
    auth: ctx.config.auth,
    ai: ctx.config.ai,
    payments: ctx.config.payments,
    dx: ctx.config.dx,
    preset: ctx.config.preset,
    hasAuth: ctx.config.auth !== 'none',
    hasPayments: ctx.config.payments !== 'none',
    isFullDx: ctx.config.dx === 'full',
    uiKit: getUIKit(ctx.config.ui),
  }
}

async function check(name: string, fn: () => Promise<boolean>): Promise<ValidationCheck> {
  const passed = await fn()
  return { name, passed, message: passed ? undefined : 'File not found' }
}

export const authPack: FeaturePack = {
  id: 'auth',
  dependencies: {
    '@clerk/expo': 'npm:@clerk/clerk-expo@^2.19.30',
    '@hookform/resolvers': '^3.9.0',
  },
  devDependencies: {},
  expoInstallPackages: [
    'react-hook-form',
    'zod',
    'expo-secure-store',
    'expo-web-browser',
    'expo-auth-session',
  ],
  ownedPaths: [
    'src/providers/auth/auth.interface.ts',
    'src/providers/auth/auth.schemas.ts',
    'src/providers/auth/useAuth.ts',
    'src/providers/auth/AuthGate.tsx',
    'src/providers/auth/AuthProviderWrapper.tsx',
    'src/providers/auth/index.ts',
    'src/providers/auth/clerk/',
    'app/(auth)/',
  ],
  async generate(ctx: PackContext) {
    const data = buildTemplateData(ctx)
    ctx.logger.info('Generating auth provider templates')
    await renderTemplates('auth', ctx.projectDir, data)
  },
  async postApplyValidation(ctx: PackContext) {
    const providerChecks = [
      check('Auth interface exists', () =>
        fileExists(ctx.projectDir, 'src/providers/auth/auth.interface.ts')),
      check('Auth schemas exist', () =>
        fileExists(ctx.projectDir, 'src/providers/auth/auth.schemas.ts')),
      check('useAuth hook exists', () =>
        fileExists(ctx.projectDir, 'src/providers/auth/useAuth.ts')),
      check('AuthGate exists', () =>
        fileExists(ctx.projectDir, 'src/providers/auth/AuthGate.tsx')),
      check('AuthProviderWrapper exists', () =>
        fileExists(ctx.projectDir, 'src/providers/auth/AuthProviderWrapper.tsx')),
      check('Auth barrel export exists', () =>
        fileExists(ctx.projectDir, 'src/providers/auth/index.ts')),
    ]

    const clerkChecks = [
      check('Clerk adapter exists', () =>
        fileExists(ctx.projectDir, 'src/providers/auth/clerk/clerk-adapter.ts')),
      check('Clerk provider exists', () =>
        fileExists(ctx.projectDir, 'src/providers/auth/clerk/clerk-provider.tsx')),
      check('Clerk token cache exists', () =>
        fileExists(ctx.projectDir, 'src/providers/auth/clerk/token-cache.ts')),
      check('Clerk env validation exists', () =>
        fileExists(ctx.projectDir, 'src/providers/auth/clerk/env.ts')),
      check('Clerk warm-up browser hook exists', () =>
        fileExists(ctx.projectDir, 'src/providers/auth/clerk/use-warm-up-browser.ts')),
      check('Clerk barrel export exists', () =>
        fileExists(ctx.projectDir, 'src/providers/auth/clerk/index.ts')),
    ]

    const screenChecks = [
      check('Auth layout exists', () =>
        fileExists(ctx.projectDir, 'app/(auth)/_layout.tsx')),
      check('Sign-in screen exists', () =>
        fileExists(ctx.projectDir, 'app/(auth)/sign-in.tsx')),
      check('Sign-up screen exists', () =>
        fileExists(ctx.projectDir, 'app/(auth)/sign-up.tsx')),
      check('Forgot-password screen exists', () =>
        fileExists(ctx.projectDir, 'app/(auth)/forgot-password.tsx')),
      check('Verify-email screen exists', () =>
        fileExists(ctx.projectDir, 'app/(auth)/verify-email.tsx')),
    ]

    const checks = await Promise.all([...providerChecks, ...clerkChecks, ...screenChecks])

    return {
      passed: checks.every((c) => c.passed),
      checks,
    }
  },
}
