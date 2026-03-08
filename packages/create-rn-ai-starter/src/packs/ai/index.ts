import type { FeaturePack, ValidationCheck } from '@/packs/pack.interface.js'
import type { PackContext, StarterConfig } from '@/types.js'
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

export function createAiPack(config: StarterConfig): FeaturePack {
  const isOpenRouter = config.ai === 'online-openrouter'

  const expoInstallPackages: string[] = isOpenRouter
    ? []
    : [
        '@infinitered/react-native-mlkit-object-detection',
        'expo-image-picker',
      ]

  return {
    id: 'ai',
    dependencies: {},
    devDependencies: {},
    expoInstallPackages,
    ownedPaths: [
      'src/providers/ai/',
      'app/(app)/ai.tsx',
    ],
    async generate(ctx: PackContext) {
      const data = buildTemplateData(ctx)

      ctx.logger.info('Generating shared AI provider templates')
      await renderTemplates('ai', ctx.projectDir, data)

      if (isOpenRouter) {
        ctx.logger.info('Generating OpenRouter AI templates')
        await renderTemplates('ai-openrouter', ctx.projectDir, data)
      } else {
        ctx.logger.info('Generating ML Kit AI templates')
        await renderTemplates('ai-mlkit', ctx.projectDir, data)
      }
    },
    async postApplyValidation(ctx: PackContext) {
      const sharedChecks = [
        check('AI interface exists', () =>
          fileExists(ctx.projectDir, 'src/providers/ai/ai.interface.ts')),
        check('AI barrel export exists', () =>
          fileExists(ctx.projectDir, 'src/providers/ai/index.ts')),
        check('AI screen exists', () =>
          fileExists(ctx.projectDir, 'app/(app)/ai.tsx')),
      ]

      const providerChecks = isOpenRouter
        ? [
            check('OpenRouter client exists', () =>
              fileExists(ctx.projectDir, 'src/providers/ai/openrouter/client.ts')),
            check('OpenRouter useChat hook exists', () =>
              fileExists(ctx.projectDir, 'src/providers/ai/openrouter/useChat.ts')),
            check('OpenRouter env config exists', () =>
              fileExists(ctx.projectDir, 'src/providers/ai/openrouter/env.ts')),
            check('OpenRouter barrel export exists', () =>
              fileExists(ctx.projectDir, 'src/providers/ai/openrouter/index.ts')),
          ]
        : [
            check('MLKit provider exists', () =>
              fileExists(ctx.projectDir, 'src/providers/ai/mlkit/MLKitProvider.tsx')),
            check('MLKit vision hook exists', () =>
              fileExists(ctx.projectDir, 'src/providers/ai/mlkit/useVision.ts')),
            check('MLKit barrel export exists', () =>
              fileExists(ctx.projectDir, 'src/providers/ai/mlkit/index.ts')),
          ]

      const checks = await Promise.all([...sharedChecks, ...providerChecks])

      return {
        passed: checks.every((c) => c.passed),
        checks,
      }
    },
  }
}
