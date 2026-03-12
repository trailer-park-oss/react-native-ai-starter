import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { execa } from 'execa'
import type { StarterConfig, Logger, PackContext } from '@/types.js'
import type { ValidationResult } from '@/packs/pack.interface.js'
import { getActivePacks } from '@/pack-registry.js'
import { buildBasePackageJson, mergePackDependencies } from '@/utils/package-json.js'
import { writeProjectFile } from '@/utils/fs.js'

export async function runGenerator(
  projectName: string,
  projectDir: string,
  config: StarterConfig,
  logger: Logger,
): Promise<void> {
  const packs = getActivePacks(config)
  const totalSteps = 4 + packs.length

  let step = 1

  // Step 1: Create project directory
  logger.step(step++, totalSteps, 'Creating project directory')
  await mkdir(projectDir, { recursive: true })

  // Step 2..N: Apply packs in order
  const context: PackContext = { projectName, projectDir, config, logger }

  for (const pack of packs) {
    logger.step(step++, totalSteps, `Applying ${pack.id} pack`)
    await pack.generate(context)
  }

  // Step N+1: Write merged package.json
  logger.step(step++, totalSteps, 'Writing package.json')
  const packageJson = mergePackDependencies(buildBasePackageJson(projectName), packs)
  await writeProjectFile(projectDir, 'package.json', JSON.stringify(packageJson, null, 2) + '\n')

  // Step N+2: Install base deps, then use expo install for SDK-compatible packages
  logger.step(step++, totalSteps, 'Installing dependencies')
  await execa('npm', ['install'], { cwd: projectDir, stdio: 'inherit' })

  const expoPackages = packs.flatMap((p) => p.expoInstallPackages ?? [])
  if (expoPackages.length > 0) {
    await execa('npx', ['expo', 'install', ...expoPackages], { cwd: projectDir, stdio: 'inherit' })
  }

  // Step N+3: Run post-apply validations
  logger.step(step++, totalSteps, 'Running validations')
  const results: { packId: string; result: ValidationResult }[] = []

  for (const pack of packs) {
    const result = await pack.postApplyValidation(context)
    results.push({ packId: pack.id, result })
  }

  // Print summary
  printSummary(logger, config, results, projectDir)
}

function printSummary(
  logger: Logger,
  config: StarterConfig,
  results: { packId: string; result: ValidationResult }[],
  projectDir: string,
): void {
  logger.info('')
  logger.info('Configuration:')
  logger.info(`  UI:       ${config.ui}`)
  logger.info(`  Auth:     ${config.auth}`)
  logger.info(
    `  AI:       ${
      config.ai.providers.length === 0 ? 'none' : config.ai.providers.join(', ')
    }`,
  )
  // logger.info(`  Payments: ${config.payments}`)
  // logger.info(`  DX:       ${config.dx}`)
  logger.info(`  Preset:   ${config.preset}`)
  logger.info('')

  let allPassed = true
  for (const { packId, result } of results) {
    for (const check of result.checks) {
      if (check.passed) {
        logger.success(`[${packId}] ${check.name}`)
      } else {
        logger.error(`[${packId}] ${check.name}${check.message ? ` — ${check.message}` : ''}`)
        allPassed = false
      }
    }
  }

  logger.info('')
  if (allPassed) {
    logger.success('All validations passed!')
  } else {
    logger.warn('Some validations failed. Check the output above.')
  }

  const cdPath = path.relative(process.cwd(), projectDir) || '.'
  logger.info('')
  logger.info('Next steps:')
  logger.info(`  cd ${cdPath}`)
  logger.info('  npx expo start')
}
