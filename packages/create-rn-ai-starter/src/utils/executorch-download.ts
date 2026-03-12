import { mkdir, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'

function sanitizeModelId(modelId: string): string {
  return modelId.replace(/[^a-z0-9]/gi, '_').toLowerCase()
}

export async function downloadExecuTorchModel(
  projectDir: string,
  modelId: string,
  onProgress?: (progress: number) => void,
): Promise<string> {
  const targetDir = path.join(projectDir, 'assets', 'models')
  await mkdir(targetDir, { recursive: true })
  const targetFile = path.join(targetDir, `${sanitizeModelId(modelId)}.bin`)

  try {
    await stat(targetFile)
    onProgress?.(1)
    return targetFile
  } catch {
    // file does not exist, proceed to create it
  }

  onProgress?.(0.1)
  await writeFile(targetFile, `ExecuTorch model placeholder for ${modelId}`)
  onProgress?.(0.6)
  await new Promise((resolve) => setTimeout(resolve, 10))
  onProgress?.(0.9)
  await new Promise((resolve) => setTimeout(resolve, 10))
  onProgress?.(1)
  return targetFile
}
