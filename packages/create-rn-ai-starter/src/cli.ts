import { Command } from 'commander'
import { checkbox, select } from '@inquirer/prompts'
import { DEFAULT_CONFIG, ALLOWED_VALUES } from '@/config.js'
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
    .option('--ai <provider>', `AI providers (repeatable): ${ALLOWED_VALUES.ai.join(' | ')}`, collect)
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
      if (opts['ai']) {
        const rawAi = opts['ai']
        const values = Array.isArray(rawAi) ? rawAi : [rawAi]
        partial.ai = normalizeAi(values as string[])
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
  const config = { ...DEFAULT_CONFIG, ...partial }

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
      ...ALLOWED_VALUES.ai.map((v) => ({ value: v, name: v })),
    ]

    while (true) {
      const selected = await checkbox({
        message: 'Which AI providers?',
        choices,
      })
      try {
        config.ai = normalizeAi(selected)
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

function normalizeAi(values: string[]): StarterConfig['ai'] {
  const unique = Array.from(new Set(values))
  if (unique.includes('none')) {
    if (unique.length > 1) {
      throw new Error('AI selection "none" cannot be combined with other providers.')
    }
    return []
  }
  return unique as StarterConfig['ai']
}
