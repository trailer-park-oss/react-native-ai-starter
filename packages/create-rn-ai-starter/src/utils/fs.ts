import { mkdir, writeFile as fsWriteFile, access } from 'node:fs/promises'
import path from 'node:path'

export async function writeProjectFile(
  projectDir: string,
  relativePath: string,
  content: string,
): Promise<void> {
  const fullPath = path.join(projectDir, relativePath)
  await mkdir(path.dirname(fullPath), { recursive: true })
  await fsWriteFile(fullPath, content, 'utf-8')
}

export async function fileExists(
  projectDir: string,
  relativePath: string,
): Promise<boolean> {
  try {
    await access(path.join(projectDir, relativePath))
    return true
  } catch {
    return false
  }
}
