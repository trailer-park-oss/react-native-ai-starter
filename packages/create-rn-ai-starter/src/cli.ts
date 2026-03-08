import { Command } from 'commander'
import { select } from '@inquirer/prompts'
import { DEFAULT_CONFIG, ALLOWED_VALUES } from '@/config.js'
import { runGenerator } from '@/generator.js'
import { resolveProjectPath, validateConfig } from '@/utils/validation.js'
import { createLogger } from '@/utils/logger.js'
import type { StarterConfig } from '@/types.js'

export async function run(): Promise<void> {
  const program = new Command()
    .name('create-rn-ai-starter')
    .description('Scaffold an Expo React Native project with modular feature packs')
    .argument('<project-path>', 'Name or path for the new project (e.g. my-app, ./projects/my-app, .)')
    .option('--ui <provider>', `UI library: ${ALLOWED_VALUES.ui.join(' | ')}`)
    .option('--auth <provider>', `Auth provider: ${ALLOWED_VALUES.auth.join(' | ')}`)
    // .option('--ai <provider>', `AI implementation: ${ALLOWED_VALUES.ai.join(' | ')}`)
    // .option('--payments <provider>', `Payments provider: ${ALLOWED_VALUES.payments.join(' | ')}`)
    // .option('--dx <profile>', `DX profile: ${ALLOWED_VALUES.dx.join(' | ')}`)
    .option('--preset <theme>', `Theme preset: ${ALLOWED_VALUES.preset.join(' | ')}`)
    .option('--yes', 'Skip interactive prompts, use defaults for unset flags')
    .action(async (projectPath: string, opts: Record<string, string | boolean | undefined>) => {
      const logger = createLogger()

      const { projectName, projectDir } = await resolveProjectPath(projectPath)

      const partial: Partial<StarterConfig> = {}
      if (opts['ui']) partial.ui = opts['ui'] as StarterConfig['ui']
      if (opts['auth']) partial.auth = opts['auth'] as StarterConfig['auth']
      // if (opts['ai']) partial.ai = opts['ai'] as StarterConfig['ai']
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

  // if (!partial.ai) {
  //   config.ai = await select({
  //     message: 'Which AI implementation?',
  //     choices: ALLOWED_VALUES.ai.map((v) => ({ value: v, name: v })),
  //     default: DEFAULT_CONFIG.ai,
  //   })
  // }

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
