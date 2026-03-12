import type { FeaturePack, ValidationCheck } from '@/packs/pack.interface.js'
import type { PackContext, StarterConfig } from '@/types.js'
import { renderTemplates, type TemplateData } from '@/utils/template.js'
import { fileExists } from '@/utils/fs.js'
import { getUIKit } from '@/packs/ui/kits.js'

function buildTemplateData(ctx: PackContext): TemplateData {
  const hasMlkit = ctx.config.ai.includes('on-device-mlkit')
  const hasExecuTorch = ctx.config.ai.includes('on-device-executorch')
  const hasOpenRouter = ctx.config.ai.includes('online-openrouter')

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
    hasAi: ctx.config.ai.length > 0,
    hasMlkit,
    hasExecuTorch,
    hasOpenRouter,
  }
}

async function check(name: string, fn: () => Promise<boolean>): Promise<ValidationCheck> {
  const passed = await fn()
  return { name, passed, message: passed ? undefined : 'File not found' }
}

export function createAiPack(config: StarterConfig): FeaturePack {
  const hasMlkit = config.ai.includes('on-device-mlkit')
  const hasExecuTorch = config.ai.includes('on-device-executorch')
  const hasOpenRouter = config.ai.includes('online-openrouter')

  const expoInstallPackages = new Set<string>()
  if (hasOpenRouter) expoInstallPackages.add('expo-image-picker')
  if (hasMlkit) {
    expoInstallPackages.add('@infinitered/react-native-mlkit-object-detection')
    expoInstallPackages.add('expo-image-picker')
  }
  if (hasExecuTorch) expoInstallPackages.add('react-native-executorch')

  return {
    id: 'ai',
    dependencies: {},
    devDependencies: {},
    expoInstallPackages: Array.from(expoInstallPackages),
    ownedPaths: [
      'src/providers/ai/',
      'app/(app)/ai.tsx',
    ],
    async generate(ctx: PackContext) {
      const data = buildTemplateData(ctx)

      ctx.logger.info('Generating shared AI provider templates')
      await renderTemplates('ai', ctx.projectDir, data)

      if (hasOpenRouter) {
        ctx.logger.info('Generating OpenRouter AI templates')
        await renderTemplates('ai-openrouter', ctx.projectDir, data)
      }
      if (hasMlkit) {
        ctx.logger.info('Generating ML Kit AI templates')
        await renderTemplates('ai-mlkit', ctx.projectDir, data)
      }
      if (hasExecuTorch) {
        ctx.logger.info('Generating ExecuTorch AI templates')
        await renderTemplates('ai-executorch', ctx.projectDir, data)
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

      const providerChecks: Promise<ValidationCheck>[] = []
      if (hasOpenRouter) {
        providerChecks.push(
          check('OpenRouter client exists', () =>
            fileExists(ctx.projectDir, 'src/providers/ai/openrouter/client.ts')),
          check('OpenRouter useChat hook exists', () =>
            fileExists(ctx.projectDir, 'src/providers/ai/openrouter/useChat.ts')),
          check('OpenRouter env config exists', () =>
            fileExists(ctx.projectDir, 'src/providers/ai/openrouter/env.ts')),
          check('OpenRouter barrel export exists', () =>
            fileExists(ctx.projectDir, 'src/providers/ai/openrouter/index.ts')),
        )
      }
      if (hasMlkit) {
        providerChecks.push(
          check('MLKit provider exists', () =>
            fileExists(ctx.projectDir, 'src/providers/ai/mlkit/MLKitProvider.tsx')),
          check('MLKit vision hook exists', () =>
            fileExists(ctx.projectDir, 'src/providers/ai/mlkit/useVision.ts')),
          check('MLKit barrel export exists', () =>
            fileExists(ctx.projectDir, 'src/providers/ai/mlkit/index.ts')),
        )
      }
      if (hasExecuTorch) {
        providerChecks.push(
          check('ExecuTorch provider exists', () =>
            fileExists(ctx.projectDir, 'src/providers/ai/executorch/ExecuTorchProvider.tsx')),
          check('ExecuTorch chat hook exists', () =>
            fileExists(ctx.projectDir, 'src/providers/ai/executorch/useOnDeviceChat.ts')),
          check('ExecuTorch barrel export exists', () =>
            fileExists(ctx.projectDir, 'src/providers/ai/executorch/index.ts')),
        )
      }

      const checks = await Promise.all([...sharedChecks, ...providerChecks])

      return {
        passed: checks.every((c) => c.passed),
        checks,
      }
    },
  }
}
