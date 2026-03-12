import { describe, it, expect, afterEach } from 'vitest'
import { mkdtemp, rm, readFile, access } from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import type { StarterConfig, Logger } from '@/types.js'
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

const noopLogger: Logger = {
  info() {},
  success() {},
  warn() {},
  error() {},
  step() {},
}

const CLERK_CONFIG: StarterConfig = { ...DEFAULT_CONFIG, auth: 'clerk' }
const CLERK_GLUESTACK_CONFIG: StarterConfig = { ...DEFAULT_CONFIG, auth: 'clerk', ui: 'gluestack' }

async function renderFullProject(tmpDir: string, config: StarterConfig): Promise<void> {
  const packs = getActivePacks(config)
  const context = { projectName: 'test-app', projectDir: tmpDir, config, logger: noopLogger }
  for (const pack of packs) {
    await pack.generate(context)
  }
}

// ─── Auth pack file generation ──────────────────────────────────────────────

describe('auth pack — file generation', () => {
  let tmpDir: string

  afterEach(async () => {
    if (tmpDir) await rm(tmpDir, { recursive: true, force: true })
  })

  const AUTH_PROVIDER_FILES = [
    'src/providers/auth/auth.interface.ts',
    'src/providers/auth/auth.schemas.ts',
    'src/providers/auth/useAuth.ts',
    'src/providers/auth/AuthGate.tsx',
    'src/providers/auth/AuthProviderWrapper.tsx',
    'src/providers/auth/index.ts',
  ]

  const CLERK_FILES = [
    'src/providers/auth/clerk/clerk-adapter.ts',
    'src/providers/auth/clerk/clerk-provider.tsx',
    'src/providers/auth/clerk/token-cache.ts',
    'src/providers/auth/clerk/env.ts',
    'src/providers/auth/clerk/use-warm-up-browser.ts',
    'src/providers/auth/clerk/index.ts',
  ]

  const AUTH_SCREEN_FILES = [
    'app/(auth)/_layout.tsx',
    'app/(auth)/sign-in.tsx',
    'app/(auth)/sign-up.tsx',
    'app/(auth)/forgot-password.tsx',
    'app/(auth)/verify-email.tsx',
  ]

  it('generates all auth provider files when auth=clerk', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-auth-'))
    await renderFullProject(tmpDir, CLERK_CONFIG)

    for (const f of AUTH_PROVIDER_FILES) {
      expect(await exists(path.join(tmpDir, f)), `Missing: ${f}`).toBe(true)
    }
  })

  it('generates all Clerk implementation files', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-auth-'))
    await renderFullProject(tmpDir, CLERK_CONFIG)

    for (const f of CLERK_FILES) {
      expect(await exists(path.join(tmpDir, f)), `Missing: ${f}`).toBe(true)
    }
  })

  it('generates all auth screens', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-auth-'))
    await renderFullProject(tmpDir, CLERK_CONFIG)

    for (const f of AUTH_SCREEN_FILES) {
      expect(await exists(path.join(tmpDir, f)), `Missing: ${f}`).toBe(true)
    }
  })

  it('does NOT generate auth files when auth=none', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-noauth-'))
    await renderFullProject(tmpDir, DEFAULT_CONFIG)

    for (const f of [...CLERK_FILES, ...AUTH_SCREEN_FILES]) {
      expect(await exists(path.join(tmpDir, f)), `Should not exist: ${f}`).toBe(false)
    }
  })
})

// ─── Auth interface and schemas ─────────────────────────────────────────────

describe('auth pack — interface and schemas', () => {
  let tmpDir: string

  afterEach(async () => {
    if (tmpDir) await rm(tmpDir, { recursive: true, force: true })
  })

  it('auth.interface.ts defines AuthProvider interface with all required methods', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-auth-'))
    await renderFullProject(tmpDir, CLERK_CONFIG)

    const content = await readFile(path.join(tmpDir, 'src/providers/auth/auth.interface.ts'), 'utf-8')
    expect(content).toContain('interface AuthProvider')
    expect(content).toContain('isAuthenticated: boolean')
    expect(content).toContain('isLoading: boolean')
    expect(content).toContain('signIn(')
    expect(content).toContain('signUp(')
    expect(content).toContain('signOut(')
    expect(content).toContain('resetPassword(')
    expect(content).toContain('signInWithOAuth(')
    expect(content).toContain('verifyEmailCode(')
    expect(content).toContain('resendVerificationCode(')
    expect(content).toContain('getToken(')
    expect(content).toContain('refreshSession(')
  })

  it('auth.interface.ts defines AuthErrorCode union', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-auth-'))
    await renderFullProject(tmpDir, CLERK_CONFIG)

    const content = await readFile(path.join(tmpDir, 'src/providers/auth/auth.interface.ts'), 'utf-8')
    for (const code of ['INVALID_CREDENTIALS', 'EMAIL_NOT_VERIFIED', 'ACCOUNT_EXISTS', 'NETWORK_ERROR', 'RATE_LIMITED', 'UNKNOWN']) {
      expect(content, `Should define ${code}`).toContain(code)
    }
  })

  it('auth.interface.ts defines OAuthProvider type', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-auth-'))
    await renderFullProject(tmpDir, CLERK_CONFIG)

    const content = await readFile(path.join(tmpDir, 'src/providers/auth/auth.interface.ts'), 'utf-8')
    expect(content).toContain("'google'")
    expect(content).toContain("'apple'")
    expect(content).toContain("'github'")
  })

  it('auth.schemas.ts defines Zod schemas for all forms', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-auth-'))
    await renderFullProject(tmpDir, CLERK_CONFIG)

    const content = await readFile(path.join(tmpDir, 'src/providers/auth/auth.schemas.ts'), 'utf-8')
    expect(content).toContain("from 'zod'")
    expect(content).toContain('signInSchema')
    expect(content).toContain('signUpSchema')
    expect(content).toContain('forgotPasswordSchema')
    expect(content).toContain('verifyEmailSchema')
    expect(content).toContain('.refine(')
    expect(content).toContain('SignInFormData')
    expect(content).toContain('SignUpFormData')
    expect(content).toContain('ForgotPasswordFormData')
    expect(content).toContain('VerifyEmailFormData')
  })
})

// ─── Clerk adapter ──────────────────────────────────────────────────────────

describe('auth pack — Clerk adapter', () => {
  let tmpDir: string

  afterEach(async () => {
    if (tmpDir) await rm(tmpDir, { recursive: true, force: true })
  })

  it('clerk-adapter.ts uses Clerk hooks and maps to AuthProvider', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-auth-'))
    await renderFullProject(tmpDir, CLERK_CONFIG)

    const content = await readFile(path.join(tmpDir, 'src/providers/auth/clerk/clerk-adapter.ts'), 'utf-8')
    expect(content).toContain("from '@clerk/expo'")
    expect(content).toContain('useClerkAuthAdapter')
    expect(content).toContain('mapClerkError')
    expect(content).toContain('INVALID_CREDENTIALS')
    expect(content).toContain('ACCOUNT_EXISTS')
    expect(content).toContain('RATE_LIMITED')
    expect(content).toContain('NETWORK_ERROR')
  })

  it('clerk-provider.tsx wraps with ClerkProvider and ClerkLoaded', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-auth-'))
    await renderFullProject(tmpDir, CLERK_CONFIG)

    const content = await readFile(path.join(tmpDir, 'src/providers/auth/clerk/clerk-provider.tsx'), 'utf-8')
    expect(content).toContain("from '@clerk/expo'")
    expect(content).toContain('ClerkProvider')
    expect(content).toContain('ClerkLoaded')
    expect(content).toContain('tokenCache')
    expect(content).toContain('validateClerkEnv')
  })

  it('token-cache.ts uses expo-secure-store', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-auth-'))
    await renderFullProject(tmpDir, CLERK_CONFIG)

    const content = await readFile(path.join(tmpDir, 'src/providers/auth/clerk/token-cache.ts'), 'utf-8')
    expect(content).toContain("from 'expo-secure-store'")
    expect(content).toContain('getToken')
    expect(content).toContain('saveToken')
    expect(content).toContain('clearToken')
    expect(content).toContain('tokenCache')
  })

  it('env.ts validates EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-auth-'))
    await renderFullProject(tmpDir, CLERK_CONFIG)

    const content = await readFile(path.join(tmpDir, 'src/providers/auth/clerk/env.ts'), 'utf-8')
    expect(content).toContain('EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY')
    expect(content).toContain("pk_")
    expect(content).toContain('validateClerkEnv')
  })

  it('use-warm-up-browser.ts pre-warms browser for OAuth', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-auth-'))
    await renderFullProject(tmpDir, CLERK_CONFIG)

    const content = await readFile(path.join(tmpDir, 'src/providers/auth/clerk/use-warm-up-browser.ts'), 'utf-8')
    expect(content).toContain("from 'expo-web-browser'")
    expect(content).toContain('warmUpAsync')
    expect(content).toContain('coolDownAsync')
  })
})

// ─── Auth screens ───────────────────────────────────────────────────────────

describe('auth pack — screens use React Hook Form + Zod', () => {
  let tmpDir: string

  afterEach(async () => {
    if (tmpDir) await rm(tmpDir, { recursive: true, force: true })
  })

  it('sign-in screen uses Controller, zodResolver, and design tokens', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-auth-'))
    await renderFullProject(tmpDir, CLERK_CONFIG)

    const content = await readFile(path.join(tmpDir, 'app/(auth)/sign-in.tsx'), 'utf-8')
    expect(content).toContain("from 'react-hook-form'")
    expect(content).toContain("from '@hookform/resolvers/zod'")
    expect(content).toContain('zodResolver(signInSchema)')
    expect(content).toContain('Controller')
    expect(content).toContain('useAuth')
    expect(content).toContain('useTokens')
    expect(content).toContain('PrimaryButton')
    expect(content).toContain('Forgot password')
    expect(content).toContain('Sign up')
    expect(content).toContain('Google')
    expect(content).toContain('Apple')
  })

  it('sign-up screen uses signUpSchema with password confirmation', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-auth-'))
    await renderFullProject(tmpDir, CLERK_CONFIG)

    const content = await readFile(path.join(tmpDir, 'app/(auth)/sign-up.tsx'), 'utf-8')
    expect(content).toContain('zodResolver(signUpSchema)')
    expect(content).toContain('confirmPassword')
    expect(content).toContain('Controller')
    expect(content).toContain('verify-email')
  })

  it('forgot-password screen uses forgotPasswordSchema', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-auth-'))
    await renderFullProject(tmpDir, CLERK_CONFIG)

    const content = await readFile(path.join(tmpDir, 'app/(auth)/forgot-password.tsx'), 'utf-8')
    expect(content).toContain('zodResolver(forgotPasswordSchema)')
    expect(content).toContain('resetPassword')
    expect(content).toContain('Check your email')
  })

  it('verify-email screen has OTP digit inputs with auto-submit', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-auth-'))
    await renderFullProject(tmpDir, CLERK_CONFIG)

    const content = await readFile(path.join(tmpDir, 'app/(auth)/verify-email.tsx'), 'utf-8')
    expect(content).toContain('verifyEmailCode')
    expect(content).toContain('resendVerificationCode')
    expect(content).toContain('CODE_LENGTH')
    expect(content).toContain('RESEND_COOLDOWN_SECONDS')
    expect(content).toContain('submitCode')
    expect(content).toContain('Resend code')
  })
})

// ─── Auth screens — UI kit integration ──────────────────────────────────────

describe('auth pack — screens use correct UI kit', () => {
  let tmpDir: string

  afterEach(async () => {
    if (tmpDir) await rm(tmpDir, { recursive: true, force: true })
  })

  const AUTH_SCREENS = [
    'app/(auth)/sign-in.tsx',
    'app/(auth)/sign-up.tsx',
    'app/(auth)/forgot-password.tsx',
    'app/(auth)/verify-email.tsx',
  ]

  it('tamagui: auth screens use YStack from tamagui', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-auth-tam-'))
    await renderFullProject(tmpDir, CLERK_CONFIG)

    for (const f of AUTH_SCREENS) {
      const content = await readFile(path.join(tmpDir, f), 'utf-8')
      expect(content, `${f} should import from tamagui`).toContain("from 'tamagui'")
      expect(content, `${f} should use YStack`).toContain('YStack')
      expect(content, `${f} should not use VStack`).not.toContain('VStack')
    }
  })

  it('gluestack: auth screens use VStack from gluestack', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-auth-gs-'))
    await renderFullProject(tmpDir, CLERK_GLUESTACK_CONFIG)

    for (const f of AUTH_SCREENS) {
      const content = await readFile(path.join(tmpDir, f), 'utf-8')
      expect(content, `${f} should import from gluestack`).toContain("from '@gluestack-ui/themed'")
      expect(content, `${f} should use VStack`).toContain('VStack')
      expect(content, `${f} should not use YStack`).not.toContain('YStack')
    }
  })

  it('auth screens use design tokens, not hardcoded styles', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-auth-tokens-'))
    await renderFullProject(tmpDir, CLERK_CONFIG)

    for (const f of AUTH_SCREENS) {
      const content = await readFile(path.join(tmpDir, f), 'utf-8')
      expect(content, `${f} should use useTokens`).toContain('useTokens')
      expect(content, `${f} should import from design-system`).toContain("from '@/design-system'")
      expect(content, `${f} should not use StyleSheet`).not.toContain('StyleSheet.create')
    }
  })
})

// ─── Auth integration with core templates ───────────────────────────────────

describe('auth pack — core template integration', () => {
  let tmpDir: string

  afterEach(async () => {
    if (tmpDir) await rm(tmpDir, { recursive: true, force: true })
  })

  it('root layout wraps with AuthProviderWrapper when auth=clerk', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-auth-layout-'))
    await renderFullProject(tmpDir, CLERK_CONFIG)

    const content = await readFile(path.join(tmpDir, 'app/_layout.tsx'), 'utf-8')
    expect(content).toContain('AuthProviderWrapper')
    expect(content).toContain("from '@/providers/auth/AuthProviderWrapper'")
    expect(content).toContain('(auth)')
  })

  it('root layout does NOT include AuthProviderWrapper when auth=none', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-noauth-layout-'))
    await renderFullProject(tmpDir, DEFAULT_CONFIG)

    const content = await readFile(path.join(tmpDir, 'app/_layout.tsx'), 'utf-8')
    expect(content).not.toContain('AuthProviderWrapper')
    expect(content).not.toContain('(auth)')
  })

  it('entry screen checks auth state when auth=clerk', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-auth-entry-'))
    await renderFullProject(tmpDir, CLERK_CONFIG)

    const content = await readFile(path.join(tmpDir, 'app/index.tsx'), 'utf-8')
    expect(content).toContain('useAuth')
    expect(content).toContain('isAuthenticated')
    expect(content).toContain('/(auth)/sign-in')
    expect(content).toContain('/(onboarding)/welcome')
    expect(content).toContain('/(app)')
  })

  it('entry screen does NOT import useAuth when auth=none', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-noauth-entry-'))
    await renderFullProject(tmpDir, DEFAULT_CONFIG)

    const content = await readFile(path.join(tmpDir, 'app/index.tsx'), 'utf-8')
    expect(content).not.toContain('useAuth')
    expect(content).not.toContain('isAuthenticated')
    expect(content).not.toContain('/(auth)/sign-in')
  })

  it('(app) layout wraps with AuthGate when auth=clerk', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-auth-app-'))
    await renderFullProject(tmpDir, CLERK_CONFIG)

    const content = await readFile(path.join(tmpDir, 'app/(app)/_layout.tsx'), 'utf-8')
    expect(content).toContain('AuthGate')
    expect(content).toContain("from '@/providers/auth/AuthGate'")
    expect(content).toContain('Tabs')
  })

  it('(app) layout does NOT use AuthGate when auth=none', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-noauth-app-'))
    await renderFullProject(tmpDir, DEFAULT_CONFIG)

    const content = await readFile(path.join(tmpDir, 'app/(app)/_layout.tsx'), 'utf-8')
    expect(content).not.toContain('AuthGate')
    expect(content).toContain('Tabs')
  })
})

// ─── Auth pack dependencies ─────────────────────────────────────────────────

describe('auth pack — dependencies', () => {
  it('includes Clerk and hookform deps when auth=clerk', () => {
    const packs = getActivePacks(CLERK_CONFIG)
    const authPack = packs.find((p) => p.id === 'auth')!
    expect(authPack.dependencies).toHaveProperty('@clerk/expo')
    expect(authPack.dependencies['@clerk/expo']).toContain('npm:@clerk/clerk-expo@')
    expect(authPack.dependencies).toHaveProperty('@hookform/resolvers')
  })

  it('includes expo install packages for auth libs', () => {
    const packs = getActivePacks(CLERK_CONFIG)
    const authPack = packs.find((p) => p.id === 'auth')!
    const expoPackages = authPack.expoInstallPackages ?? []
    expect(expoPackages).toContain('react-hook-form')
    expect(expoPackages).toContain('zod')
    expect(expoPackages).toContain('expo-secure-store')
    expect(expoPackages).toContain('expo-web-browser')
    expect(expoPackages).toContain('expo-auth-session')
  })

  it('merges auth deps into package.json', () => {
    const packs = getActivePacks(CLERK_CONFIG)
    const base = buildBasePackageJson('auth-test')
    const result = mergePackDependencies(base, packs)

    expect(result.dependencies).toHaveProperty('@clerk/expo')
    expect(result.dependencies).toHaveProperty('@hookform/resolvers')
  })

  it('does NOT include auth deps when auth=none', () => {
    const packs = getActivePacks(DEFAULT_CONFIG)
    const base = buildBasePackageJson('noauth-test')
    const result = mergePackDependencies(base, packs)

    const allDeps = { ...result.dependencies, ...result.devDependencies }
    expect(allDeps).not.toHaveProperty('@clerk/expo')
    expect(allDeps).not.toHaveProperty('@hookform/resolvers')
  })
})

// ─── Auth pack validation ───────────────────────────────────────────────────

describe('auth pack — postApplyValidation', () => {
  let tmpDir: string

  afterEach(async () => {
    if (tmpDir) await rm(tmpDir, { recursive: true, force: true })
  })

  it('all validation checks pass after full generation', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-auth-valid-'))
    await renderFullProject(tmpDir, CLERK_CONFIG)

    const packs = getActivePacks(CLERK_CONFIG)
    const authPack = packs.find((p) => p.id === 'auth')!
    const context = { projectName: 'test-app', projectDir: tmpDir, config: CLERK_CONFIG, logger: noopLogger }
    const result = await authPack.postApplyValidation(context)

    expect(result.passed).toBe(true)
    for (const check of result.checks) {
      expect(check.passed, `Check failed: ${check.name}`).toBe(true)
    }
  })
})

// ─── Import resolution — auth screens ───────────────────────────────────────

describe('auth pack — @/ imports resolve to existing modules', () => {
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

  async function moduleExists(projectDir: string, aliasImport: string): Promise<boolean> {
    const relative = aliasImport.replace(/^@\//, 'src/')
    const base = path.join(projectDir, relative)
    if (await exists(base + '.ts')) return true
    if (await exists(base + '.tsx')) return true
    if (await exists(path.join(base, 'index.ts'))) return true
    if (await exists(path.join(base, 'index.tsx'))) return true
    return false
  }

  const AUTH_FILES_TO_CHECK = [
    'src/providers/auth/useAuth.ts',
    'src/providers/auth/AuthGate.tsx',
    'src/providers/auth/AuthProviderWrapper.tsx',
    'src/providers/auth/clerk/clerk-adapter.ts',
    'src/providers/auth/clerk/clerk-provider.tsx',
    'app/(auth)/sign-in.tsx',
    'app/(auth)/sign-up.tsx',
    'app/(auth)/forgot-password.tsx',
    'app/(auth)/verify-email.tsx',
  ]

  it('all @/ imports in auth files resolve (tamagui)', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-auth-resolve-'))
    await renderFullProject(tmpDir, CLERK_CONFIG)

    for (const file of AUTH_FILES_TO_CHECK) {
      const fullPath = path.join(tmpDir, file)
      if (!(await exists(fullPath))) continue

      const imports = await extractStaticAliasImports(fullPath)
      for (const imp of imports) {
        const found = await moduleExists(tmpDir, imp)
        expect(found, `${file}: import from '${imp}' does not resolve`).toBe(true)
      }
    }
  })

  it('all @/ imports in auth files resolve (gluestack)', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-auth-resolve-'))
    await renderFullProject(tmpDir, CLERK_GLUESTACK_CONFIG)

    for (const file of AUTH_FILES_TO_CHECK) {
      const fullPath = path.join(tmpDir, file)
      if (!(await exists(fullPath))) continue

      const imports = await extractStaticAliasImports(fullPath)
      for (const imp of imports) {
        const found = await moduleExists(tmpDir, imp)
        expect(found, `${file}: import from '${imp}' does not resolve`).toBe(true)
      }
    }
  })
})
