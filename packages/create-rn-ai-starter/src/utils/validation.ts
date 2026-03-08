import { access, readdir } from 'node:fs/promises'
import path from 'node:path'
import type { StarterConfig } from '@/types.js'
import { ALLOWED_VALUES } from '@/config.js'

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
    if (!allowed.includes(config[key])) {
      throw new Error(
        `Invalid value "${config[key]}" for --${key}. Allowed: ${allowed.join(', ')}`,
      )
    }
  }
}
