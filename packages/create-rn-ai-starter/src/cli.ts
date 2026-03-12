import { Command } from 'commander'
import { checkbox, select } from '@inquirer/prompts'
import { DEFAULT_CONFIG, ALLOWED_AI_PROVIDERS, ALLOWED_VALUES } from '@/config.js'
import { runGenerator } from '@/generator.js'
import { resolveProjectPath, validateConfig } from '@/utils/validation.js'
import { createLogger } from '@/utils/logger.js'
import type { StarterConfig } from '@/types.js'

export async function run(): Promise<void> {
  const collect = (value: string, previous: string[] | undefined) => {
    const base = previous ?? []
    return [...base, value]
  }

  const program = new Command()
    .name('create-rn-ai-starter')
    .description('Scaffold an Expo React Native project with modular feature packs')
    .argument('<project-path>', 'Name or path for the new project (e.g. my-app, ./projects/my-app, .)')
    .option('--ui <provider>', `UI library: ${ALLOWED_VALUES.ui.join(' | ')}`)
    .option('--auth <provider>', `Auth provider: ${ALLOWED_VALUES.auth.join(' | ')}`)
    .option('--ai <provider>', `AI providers (repeatable): ${ALLOWED_AI_PROVIDERS.join(' | ')}`, collect)
    // .option('--payments <provider>', `Payments provider: ${ALLOWED_VALUES.payments.join(' | ')}`)
    // .option('--dx <profile>', `DX profile: ${ALLOWED_VALUES.dx.join(' | ')}`)
    .option('--preset <theme>', `Theme preset: ${ALLOWED_VALUES.preset.join(' | ')}`)
    .option('--yes', 'Skip interactive prompts, use defaults for unset flags')
    .action(async (projectPath: string, opts: Record<string, string | string[] | boolean | undefined>) => {
      const logger = createLogger()

      const { projectName, projectDir } = await resolveProjectPath(projectPath)

      const partial: Partial<StarterConfig> = {}
      if (opts['ui']) partial.ui = opts['ui'] as StarterConfig['ui']
      if (opts['auth']) partial.auth = opts['auth'] as StarterConfig['auth']
      const rawAi = opts['ai']
      const hasAiFlag = Array.isArray(rawAi) ? rawAi.length > 0 : !!rawAi
      if (hasAiFlag) {
        const values = Array.isArray(rawAi) ? rawAi : [rawAi]
        const providers = normalizeAiProviders(values as string[])
        partial.ai = opts['yes']
          ? buildAiConfigWithDefaults(providers)
          : { providers }
      }
      // if (opts['payments']) partial.payments = opts['payments'] as StarterConfig['payments']
      // if (opts['dx']) partial.dx = opts['dx'] as StarterConfig['dx']
      if (opts['preset']) partial.preset = opts['preset'] as StarterConfig['preset']

      const config = opts['yes']
        ? { ...DEFAULT_CONFIG, ...partial }
        : await promptForMissing(partial)

      validateConfig(config)

      await runGenerator(projectName, projectDir, config, logger)
    })

  await program.parseAsync(process.argv)
}

async function promptForMissing(partial: Partial<StarterConfig>): Promise<StarterConfig> {
  const config: StarterConfig = {
    ...DEFAULT_CONFIG,
    ...partial,
    ai: partial.ai ?? DEFAULT_CONFIG.ai,
  }

  if (!partial.ui) {
    config.ui = await select({
      message: 'Which UI library?',
      choices: ALLOWED_VALUES.ui.map((v) => ({ value: v, name: v })),
      default: DEFAULT_CONFIG.ui,
    })
  }

  if (!partial.auth) {
    config.auth = await select({
      message: 'Which auth provider?',
      choices: ALLOWED_VALUES.auth.map((v) => ({ value: v, name: v })),
      default: DEFAULT_CONFIG.auth,
    })
  }

  if (typeof partial.ai === 'undefined') {
    const choices = [
      { value: 'none', name: 'none (disable AI)' },
      ...ALLOWED_AI_PROVIDERS.map((v) => ({ value: v, name: v })),
    ]

    while (true) {
      const selected = await checkbox({
        message: 'Which AI providers?',
        choices,
      })
      try {
        const providers = normalizeAiProviders(selected)
        config.ai = { providers }
        break
      } catch (err) {
        if (err instanceof Error) {
          // eslint-disable-next-line no-console
          console.error(err.message)
        } else {
          // eslint-disable-next-line no-console
          console.error('Invalid AI selection. Please try again.')
        }
      }
    }
  }

  config.ai = await ensureAiModels(config.ai)

  // if (!partial.payments) {
  //   config.payments = await select({
  //     message: 'Which payments provider?',
  //     choices: ALLOWED_VALUES.payments.map((v) => ({ value: v, name: v })),
  //     default: DEFAULT_CONFIG.payments,
  //   })
  // }

  // if (!partial.dx) {
  //   config.dx = await select({
  //     message: 'Which DX profile?',
  //     choices: ALLOWED_VALUES.dx.map((v) => ({ value: v, name: v })),
  //     default: DEFAULT_CONFIG.dx,
  //   })
  // }

  if (!partial.preset) {
    config.preset = await select({
      message: 'Which theme preset?',
      choices: ALLOWED_VALUES.preset.map((v) => ({ value: v, name: v })),
      default: DEFAULT_CONFIG.preset,
    })
  }

  return config
}

const OPENROUTER_MODELS = [
  'openai/gpt-4o-mini',
  'openrouter/free',
  'stepfun/step-3.5-flash:free',
] as const

const EXECUTORCH_MODELS = [
  'LLAMA3_2_1B',
  'LLAMA3_2_3B',
  'QWEN2_5_0_5B',
  'QWEN2_5_1_5B',
  'PHI_4_MINI',
  'SMOLLM_2_360M',
] as const

const DEFAULT_OPENROUTER_MODEL = OPENROUTER_MODELS[0]
const DEFAULT_EXECUTORCH_MODEL = EXECUTORCH_MODELS[0]

function normalizeAiProviders(values: string[]): StarterConfig['ai']['providers'] {
  const unique = Array.from(new Set(values))
  if (unique.includes('none')) {
    if (unique.length > 1) {
      throw new Error('AI selection "none" cannot be combined with other providers.')
    }
    return []
  }
  return unique as StarterConfig['ai']['providers']
}

function buildAiConfigWithDefaults(
  providers: StarterConfig['ai']['providers'],
): StarterConfig['ai'] {
  const config: StarterConfig['ai'] = { providers }
  if (providers.includes('online-openrouter')) {
    config.openrouter = { model: DEFAULT_OPENROUTER_MODEL }
  }
  if (providers.includes('on-device-executorch')) {
    config.executorch = { model: DEFAULT_EXECUTORCH_MODEL }
  }
  return config
}

async function ensureAiModels(ai: StarterConfig['ai']): Promise<StarterConfig['ai']> {
  const next: StarterConfig['ai'] = {
    providers: ai.providers,
    openrouter: ai.openrouter,
    executorch: ai.executorch,
  }

  if (ai.providers.includes('online-openrouter') && !ai.openrouter?.model) {
    const model = await select({
      message: 'Which OpenRouter model?',
      choices: OPENROUTER_MODELS.map((value) => ({ value, name: value })),
      default: DEFAULT_OPENROUTER_MODEL,
    })
    next.openrouter = { model }
  }

  if (ai.providers.includes('on-device-executorch') && !ai.executorch?.model) {
    const model = await select({
      message: 'Which ExecuTorch model?',
      choices: EXECUTORCH_MODELS.map((value) => ({ value, name: value })),
      default: DEFAULT_EXECUTORCH_MODEL,
    })
    next.executorch = { model }
  }

  return next
}
