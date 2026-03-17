import { access, readdir } from 'node:fs/promises'
import path from 'node:path'
import type { StarterConfig } from '@/types.js'
import { ALLOWED_AI_PROVIDERS, ALLOWED_VALUES } from '@/config.js'

const PROJECT_NAME_RE = /^[a-zA-Z][a-zA-Z0-9_-]*$/

export interface ResolvedProject {
  projectName: string
  projectDir: string
}

export async function resolveProjectPath(argument: string): Promise<ResolvedProject> {
  const projectDir = path.resolve(argument)
  const projectName = path.basename(projectDir)

  if (!PROJECT_NAME_RE.test(projectName)) {
    throw new Error(
      `Invalid project name "${projectName}". Must start with a letter and contain only letters, numbers, hyphens, and underscores.`,
    )
  }

  const isDot = argument === '.'

  if (isDot) {
    const entries = await readdir(projectDir)
    if (entries.length > 0) {
      throw new Error(
        `Current directory is not empty. Use "." only in an empty folder.`,
      )
    }
    return { projectName, projectDir }
  }

  const parentDir = path.dirname(projectDir)
  try {
    await access(parentDir)
  } catch {
    throw new Error(
      `Parent directory "${parentDir}" does not exist.`,
    )
  }

  try {
    await access(projectDir)
    throw new Error(`Directory "${projectDir}" already exists.`)
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('Directory')) throw err
  }

  return { projectName, projectDir }
}

export function validateConfig(config: StarterConfig): void {
  const entries = Object.entries(ALLOWED_VALUES) as [keyof StarterConfig, readonly string[]][]
  for (const [key, allowed] of entries) {
    const value = config[key]
    if (typeof value !== 'string' || !allowed.includes(value)) {
      throw new Error(
        `Invalid value "${value}" for --${key}. Allowed: ${allowed.join(', ')}`,
      )
    }
  }

  for (const provider of config.ai.providers) {
    if (!ALLOWED_AI_PROVIDERS.includes(provider)) {
      throw new Error(
        `Invalid value "${provider}" for --ai. Allowed: ${ALLOWED_AI_PROVIDERS.join(', ')}`,
      )
    }
  }

  for (const provider of config.ai.providers) {
    if (provider === 'online-openrouter' && !config.ai.openrouter?.model) {
      throw new Error('Missing model for provider: online-openrouter')
    }
    if (provider === 'on-device-executorch' && !config.ai.executorch?.model) {
      throw new Error('Missing model for provider: on-device-executorch')
    }
  }

  if (
    config.ai.providers.includes('on-device-mlkit')
    && config.ai.providers.includes('on-device-executorch')
  ) {
    throw new Error('Cannot combine on-device-mlkit and on-device-executorch in the same scaffold.')
  }

  const execPath = config.ai.executorch?.modelPath
  if (typeof execPath !== 'undefined' && typeof execPath !== 'string') {
    throw new Error('Invalid value for executorch.modelPath. Must be a string.')
  }
}
