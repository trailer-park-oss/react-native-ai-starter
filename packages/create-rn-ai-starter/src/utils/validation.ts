import { access } from 'node:fs/promises'
import path from 'node:path'
import type { StarterConfig } from '@/types.js'
import { ALLOWED_VALUES } from '@/config.js'

const PROJECT_NAME_RE = /^[a-zA-Z][a-zA-Z0-9_-]*$/

export async function validateProjectName(name: string, cwd: string): Promise<void> {
  if (!PROJECT_NAME_RE.test(name)) {
    throw new Error(
      `Invalid project name "${name}". Must start with a letter and contain only letters, numbers, hyphens, and underscores.`,
    )
  }

  try {
    await access(path.join(cwd, name))
    throw new Error(`Directory "${name}" already exists.`)
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('Directory')) throw err
  }
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
