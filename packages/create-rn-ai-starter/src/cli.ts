import { Command } from 'commander'
import { checkbox, confirm, select, search } from '@inquirer/prompts'
import { DEFAULT_CONFIG, ALLOWED_AI_PROVIDERS, ALLOWED_VALUES } from '@/config.js'
import { runGenerator } from '@/generator.js'
import { resolveProjectPath, validateConfig } from '@/utils/validation.js'
import { createLogger } from '@/utils/logger.js'
import path from 'node:path'
import type { StarterConfig } from '@/types.js'

interface ModelOption {
  id: string
  name: string
  description: string
  pricing?: string
}

async function fetchOpenRouterModels(): Promise<ModelOption[]> {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/models')
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    return data.data.map((model: any) => ({
      id: model.id,
      name: model.name || model.id,
      description: model.description || '',
      pricing: model.pricing ? `${model.pricing.prompt}/${model.pricing.completion}` : undefined,
    }))
  } catch (error) {
    console.error('Failed to fetch OpenRouter models, using fallback list:', error?.toString() || error)
    return [
      { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini (OpenAI)', description: 'Fast, affordable, high-quality' },
      { id: 'openrouter/free', name: 'Free (OpenRouter)', description: 'Free tier models' },
      { id: 'stepfun/step-3.5-flash:free', name: 'Step 3.5 Flash (Free)', description: 'Fast free model' },
      { id: 'openai/gpt-4o', name: 'GPT-4o (OpenAI)', description: 'Most capable model' },
      { id: 'openai/gpt-4-turbo', name: 'GPT-4 Turbo (OpenAI)', description: 'Advanced reasoning' },
      { id: 'openai/gpt-3.5-turbo', name: 'GPT-3.5 Turbo (OpenAI)', description: 'Fast and reliable' },
      { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku (Anthropic)', description: 'Fast, efficient' },
      { id: 'anthropic/claude-3-sonnet', name: 'Claude 3 Sonnet (Anthropic)', description: 'Balanced performance' },
      { id: 'anthropic/claude-3-opus', name: 'Claude 3 Opus (Anthropic)', description: 'Most capable' },
      { id: 'meta-llama/llama-3-70b-instruct', name: 'Llama 3 70B (Meta)', description: 'Large open model' },
      { id: 'meta-llama/llama-3-8b-instruct', name: 'Llama 3 8B (Meta)', description: 'Efficient open model' },
      { id: 'google/gemini-pro', name: 'Gemini Pro (Google)', description: 'Multimodal capabilities' },
      { id: 'mistralai/mistral-large', name: 'Mistral Large (Mistral)', description: 'High performance' },
      { id: 'mistralai/mistral-medium', name: 'Mistral Medium (Mistral)', description: 'Balanced' },
      { id: 'mistralai/mixtral-8x7b', name: 'Mixtral 8x7B (Mistral)', description: 'Mixture of experts' },
    ]
  }
}

async function fetchExecuTorchModels(): Promise<ModelOption[]> {
  return [
    { id: 'LLAMA3_2_1B', name: 'Llama 3.2 1B', description: 'Smallest, fastest, good for mobile' },
    { id: 'LLAMA3_2_3B', name: 'Llama 3.2 3B', description: 'Balanced performance and speed' },
    { id: 'PHI3_MINI', name: 'Phi-3 Mini', description: 'High quality small model' },
    { id: 'PHI3_SMALL', name: 'Phi-3 Small', description: 'Improved Phi-3, more capable' },
    { id: 'QWEN2_0_5B', name: 'Qwen 2 0.5B', description: 'Ultra compact, multilingual' },
    { id: 'QWEN2_1_5B', name: 'Qwen 2 1.5B', description: 'Compact, multilingual' },
    { id: 'QWEN2_7B', name: 'Qwen 2 7B', description: 'Balanced size and performance' },
    { id: 'GEMMA2_2B', name: 'Gemma 2 2B', description: 'Google small model' },
    { id: 'GEMMA2_9B', name: 'Gemma 2 9B', description: 'Google mid-sized model' },
    { id: 'TINYLLAMA', name: 'TinyLlama', description: 'Minimal footprint' },
    { id: 'STABLELM_ZEPHYR_3B', name: 'StableLM Zephyr 3B', description: 'Stability AI model' },
    { id: 'MISTRAL_7B', name: 'Mistral 7B', description: 'Popular open model' },
    { id: 'NEMOTRON_SUPER', name: 'Nemotron Super', description: 'NVIDIA open-source model' },
  ]
}

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

      await handleExecuTorchDownload(config, projectDir, logger, !opts['yes'])

      validateConfig(config)

      await runGenerator(projectName, projectDir, config, logger)
    })

  await program.parseAsync(process.argv)
}

export function assertNonEmptySelection(values: string[]): void {
  if (values.length === 0) {
    throw new Error(
      'Select at least one option (press Space), including "none" if you want AI disabled.',
    )
  }
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
        assertNonEmptySelection(selected)
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

const DEFAULT_OPENROUTER_MODEL = 'openai/gpt-4o-mini'
const DEFAULT_EXECUTORCH_MODEL = 'LLAMA3_2_1B'

export function normalizeAiProviders(values: string[]): StarterConfig['ai']['providers'] {
  const unique = Array.from(new Set(values))
  if (unique.includes('none')) {
    if (unique.length > 1) {
      throw new Error('AI selection "none" cannot be combined with other providers.')
    }
    return []
  }
  if (unique.includes('on-device-mlkit') && unique.includes('on-device-executorch')) {
    throw new Error('on-device-mlkit cannot be combined with on-device-executorch.')
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
    const models = await fetchOpenRouterModels()
    const modelId = await search({
      message: 'Which OpenRouter model?',
      source: async (input) => {
        const searchTerm = input?.toLowerCase() ?? ''
        const filtered = models.filter(
          (m: ModelOption) =>
            m.name.toLowerCase().includes(searchTerm) ||
            m.id.toLowerCase().includes(searchTerm) ||
            m.description.toLowerCase().includes(searchTerm),
        )
        return filtered.map((m: ModelOption) => ({
          name: `${m.name} - ${m.description}`,
          value: m.id,
        }))
      },
      pageSize: 10,
    })
    next.openrouter = { model: modelId }
  }

  if (ai.providers.includes('on-device-executorch') && !ai.executorch?.model) {
    const models = await fetchExecuTorchModels()
    const modelId = await search({
      message: 'Which ExecuTorch model?',
      source: async (input) => {
        const searchTerm = input?.toLowerCase() ?? ''
        const filtered = models.filter(
          (m: ModelOption) =>
            m.name.toLowerCase().includes(searchTerm) ||
            m.id.toLowerCase().includes(searchTerm) ||
            m.description.toLowerCase().includes(searchTerm),
        )
        return filtered.map((m: ModelOption) => ({
          name: `${m.name} - ${m.description}`,
          value: m.id,
        }))
      },
      pageSize: 10,
    })
    next.executorch = { model: modelId }
  }

  return next
}

async function handleExecuTorchDownload(
  config: StarterConfig,
  projectDir: string,
  logger: ReturnType<typeof createLogger>,
  interactive: boolean,
): Promise<void> {
  if (!config.ai.providers.includes('on-device-executorch')) {
    return
  }

  const execConfig = config.ai.executorch ?? { model: DEFAULT_EXECUTORCH_MODEL }
  execConfig.model ||= DEFAULT_EXECUTORCH_MODEL

  if (execConfig.modelPath) {
    return
  }

  if (interactive) {
    logger.info('The ExecuTorch model will be downloaded on first launch of the app.')
  }

  config.ai.executorch = execConfig
}
