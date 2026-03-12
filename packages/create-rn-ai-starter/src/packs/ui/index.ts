import type { FeaturePack, ValidationCheck } from '@/packs/pack.interface.js'
import type { PackContext, StarterConfig } from '@/types.js'
import { renderTemplates, type TemplateData } from '@/utils/template.js'
import { fileExists } from '@/utils/fs.js'
import { getUIKit } from '@/packs/ui/kits.js'

function buildTemplateData(ctx: PackContext): TemplateData {
  const providers = ctx.config.ai.providers
  const hasMlkit = providers.includes('on-device-mlkit')
  const hasExecuTorch = providers.includes('on-device-executorch')
  const hasOpenRouter = providers.includes('online-openrouter')

  return {
    projectName: ctx.projectName,
    ui: ctx.config.ui,
    auth: ctx.config.auth,
    aiProviders: providers,
    openrouterModel: ctx.config.ai.openrouter?.model,
    executorchModel: ctx.config.ai.executorch?.model,
    payments: ctx.config.payments,
    dx: ctx.config.dx,
    preset: ctx.config.preset,
    hasAuth: ctx.config.auth !== 'none',
    hasPayments: ctx.config.payments !== 'none',
    isFullDx: ctx.config.dx === 'full',
    uiKit: getUIKit(ctx.config.ui),
    hasAi: providers.length > 0,
    hasMlkit,
    hasExecuTorch,
    hasOpenRouter,
  }
}

async function check(name: string, fn: () => Promise<boolean>): Promise<ValidationCheck> {
  const passed = await fn()
  return { name, passed, message: passed ? undefined : 'File not found' }
}

export function createUiPack(config: StarterConfig): FeaturePack {
  const isTamagui = config.ui === 'tamagui'

  const dependencies: Record<string, string> = isTamagui
    ? {
        'tamagui': '^1.116.0',
        '@tamagui/config': '^1.116.0',
        '@tamagui/font-inter': '^1.116.0',
        '@tamagui/animations-react-native': '^1.116.0',
      }
    : {
        '@gluestack-ui/themed': '^1.1.0',
        '@gluestack-style/react': '^1.0.0',
        '@gluestack-ui/config': '^1.1.0',
      }

  const devDependencies: Record<string, string> = isTamagui
    ? { '@tamagui/babel-plugin': '^1.116.0' }
    : {}

  return {
    id: 'ui',
    dependencies,
    devDependencies,
    expoInstallPackages: [
      'react-native-reanimated',
      '@react-native-async-storage/async-storage',
      'expo-haptics',
      'expo-linear-gradient',
    ],
    ownedPaths: [
      'src/design-system/',
      'src/components/',
      ...(isTamagui
        ? ['src/providers/ui/tamagui/', 'tamagui.config.ts']
        : ['src/providers/ui/gluestack/']),
    ],
    async generate(ctx: PackContext) {
      const data = buildTemplateData(ctx)

      ctx.logger.info('Generating shared design system templates')
      await renderTemplates('ui', ctx.projectDir, data)

      if (isTamagui) {
        ctx.logger.info('Generating Tamagui adapter templates')
        await renderTemplates('ui-tamagui', ctx.projectDir, data)
      } else {
        ctx.logger.info('Generating Gluestack adapter templates')
        await renderTemplates('ui-gluestack', ctx.projectDir, data)
      }
    },
    async postApplyValidation(ctx: PackContext) {
      const sharedChecks = [
        check('Design system tokens exist', () =>
          fileExists(ctx.projectDir, 'src/design-system/tokens.ts')),
        check('ThemeProvider exists', () =>
          fileExists(ctx.projectDir, 'src/design-system/ThemeProvider.tsx')),
        check('Elevation styles exist', () =>
          fileExists(ctx.projectDir, 'src/design-system/elevation.ts')),
        check('Design system barrel export exists', () =>
          fileExists(ctx.projectDir, 'src/design-system/index.ts')),
        check('Storage adapter exists', () =>
          fileExists(ctx.projectDir, 'src/lib/storage.ts')),
        check('Persisted theme store exists', () =>
          fileExists(ctx.projectDir, 'src/store/theme.ts')),
      ]

      const libraryChecks = isTamagui
        ? [
            check('Tamagui config exists', () =>
              fileExists(ctx.projectDir, 'src/providers/ui/tamagui/tamagui.config.ts')),
            check('TamaguiProvider exists', () =>
              fileExists(ctx.projectDir, 'src/providers/ui/tamagui/TamaguiProvider.tsx')),
            check('Root tamagui.config.ts exists', () =>
              fileExists(ctx.projectDir, 'tamagui.config.ts')),
          ]
        : [
            check('Gluestack config exists', () =>
              fileExists(ctx.projectDir, 'src/providers/ui/gluestack/gluestack.config.ts')),
            check('GluestackProvider exists', () =>
              fileExists(ctx.projectDir, 'src/providers/ui/gluestack/GluestackProvider.tsx')),
          ]

      const componentChecks = [
        check('Card component exists', () =>
          fileExists(ctx.projectDir, 'src/components/Card.tsx')),
        check('StatusBanner component exists', () =>
          fileExists(ctx.projectDir, 'src/components/StatusBanner.tsx')),
        check('PrimaryButton component exists', () =>
          fileExists(ctx.projectDir, 'src/components/PrimaryButton.tsx')),
      ]

      const checks = await Promise.all([...sharedChecks, ...libraryChecks, ...componentChecks])

      return {
        passed: checks.every((c) => c.passed),
        checks,
      }
    },
  }
}
