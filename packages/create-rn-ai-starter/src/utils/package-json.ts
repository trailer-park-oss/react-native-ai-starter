import type { FeaturePack } from '@/packs/pack.interface.js'

interface PackageJson {
  name: string
  version: string
  private: boolean
  main: string
  scripts: Record<string, string>
  dependencies: Record<string, string>
  devDependencies: Record<string, string>
  overrides: Record<string, string>
}

export function buildBasePackageJson(projectName: string): PackageJson {
  return {
    name: projectName,
    version: '0.1.0',
    private: true,
    main: 'expo-router/entry',
    scripts: {
      dev: 'expo start',
      'dev:ios': 'expo start --ios',
      'dev:android': 'expo start --android',
      'dev:web': 'expo start --web',
    },
    dependencies: {},
    devDependencies: {},
    overrides: {},
  }
}

export function mergePackDependencies(
  base: PackageJson,
  packs: FeaturePack[],
): PackageJson {
  const merged = { ...base }
  const deps = { ...merged.dependencies }
  const devDeps = { ...merged.devDependencies }

  for (const pack of packs) {
    Object.assign(deps, pack.dependencies)
    Object.assign(devDeps, pack.devDependencies)
  }

  merged.dependencies = sortObject(deps)
  merged.devDependencies = sortObject(devDeps)

  // Pin react to match react-native's bundled renderer
  if (deps['react']) {
    merged.overrides = { react: deps['react'] }
  }

  return merged
}

function sortObject(obj: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(obj).sort(([a], [b]) => a.localeCompare(b)))
}
