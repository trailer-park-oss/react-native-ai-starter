import chalk from 'chalk'
import type { Logger } from '@/types.js'

export function createLogger(): Logger {
  return {
    info(msg) {
      console.log(chalk.blue('info'), msg)
    },
    success(msg) {
      console.log(chalk.green('✓'), msg)
    },
    warn(msg) {
      console.log(chalk.yellow('warn'), msg)
    },
    error(msg) {
      console.error(chalk.red('error'), msg)
    },
    step(current, total, msg) {
      console.log(chalk.cyan(`[${current}/${total}]`), msg)
    },
  }
}
