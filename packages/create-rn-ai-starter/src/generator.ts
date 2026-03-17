import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { execa } from 'execa'
import type { StarterConfig, Logger, PackContext } from '@/types.js'
import type { ValidationResult } from '@/packs/pack.interface.js'
import { getActivePacks } from '@/pack-registry.js'
import type { FeaturePack } from '@/packs/pack.interface.js'
import { buildBasePackageJson, mergePackDependencies } from '@/utils/package-json.js'
import { writeProjectFile } from '@/utils/fs.js'

interface GeneratedPackageJson {
  dependencies: Record<string, string>
  devDependencies: Record<string, string>
  overrides: Record<string, string>
}

const EXECUTORCH_COMPATIBILITY = {
  expo: '~54.0.0',
  react: '19.1.0',
  reactNative: '0.81.5',
  reactTypes: '~19.1.10',
} as const

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

  // Build base package.json with ExecuTorch-compatible versions if needed
  let basePackageJson = buildBasePackageJson(projectName)
  const hasExecuTorch = config.ai.providers.includes('on-device-executorch')

  if (hasExecuTorch) {
    basePackageJson.dependencies = {
      'expo': EXECUTORCH_COMPATIBILITY.expo,
      'react': EXECUTORCH_COMPATIBILITY.react,
      'react-native': EXECUTORCH_COMPATIBILITY.reactNative,
    }
    logger.info(
      `  Using React Native ${EXECUTORCH_COMPATIBILITY.reactNative} and Expo SDK 54 for ExecuTorch compatibility`,
    )
  }

  const packageJson = mergePackDependencies(basePackageJson, packs)

  // Override dependencies after merge if ExecuTorch is selected
  // This ensures compatibility even after packs are merged
  if (hasExecuTorch) {
    applyExecuTorchCompatibility(packageJson)
  }

  await writeProjectFile(projectDir, 'package.json', JSON.stringify(packageJson, null, 2) + '\n')

  // Step N+2: Install base deps, then use expo install for SDK-compatible packages
  logger.step(step++, totalSteps, 'Installing dependencies')
  await execa('npm', ['install'], { cwd: projectDir, stdio: 'inherit' })

  const expoPackages = getExpoInstallPackages(packs, hasExecuTorch)
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

export function printSummary(
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
  const hasMlkit = config.ai.providers.includes('on-device-mlkit')
  logger.info('')
  if (hasMlkit) {
    logger.warn('ML Kit on iOS does not support Apple Silicon simulators. Use a physical iPhone for `npx expo run:ios`.')
    logger.info('')
  }
  logger.info('Next steps:')
  logger.info(`  cd ${cdPath}`)
  logger.info(hasMlkit ? '  npx expo run:ios --device' : '  npx expo run:ios')
  logger.info('  npx expo run:android')
}

export function applyExecuTorchCompatibility(packageJson: GeneratedPackageJson): void {
  const pinnedDependencies: Record<string, string> = {
    '@tanstack/react-query': '5.90.21',
    'typescript': '5.9.2',
    'zustand': '5.0.12',
  }

  if (packageJson.dependencies['react-native']) {
    packageJson.dependencies['react-native'] = EXECUTORCH_COMPATIBILITY.reactNative
  }
  if (packageJson.dependencies['react']) {
    packageJson.dependencies['react'] = EXECUTORCH_COMPATIBILITY.react
  }
  if (packageJson.dependencies['expo']) {
    packageJson.dependencies['expo'] = EXECUTORCH_COMPATIBILITY.expo
  }
  Object.assign(packageJson.dependencies, pinnedDependencies)
  packageJson.devDependencies['@types/react'] = EXECUTORCH_COMPATIBILITY.reactTypes
  if (packageJson.dependencies['react']) {
    packageJson.overrides.react = packageJson.dependencies['react']
  }
}

export function getExpoInstallPackages(packs: FeaturePack[], hasExecuTorch: boolean): string[] {
  const packages = packs.flatMap((p) => p.expoInstallPackages ?? [])
  if (!hasExecuTorch) return packages

  const skippedPackages = new Set([
    '@tanstack/react-query',
    '@types/react',
    'typescript',
    'zustand',
  ])

  return packages.filter((pkg) => !skippedPackages.has(pkg))
}
