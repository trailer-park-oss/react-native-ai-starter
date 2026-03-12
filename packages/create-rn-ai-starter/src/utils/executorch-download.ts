import { mkdir, stat } from 'node:fs/promises'
import fs from 'node:fs'
import path from 'node:path'
import https from 'node:https'
import { pipeline } from 'node:stream/promises'

const BASE_URL =
  'https://huggingface.co/software-mansion/react-native-executorch-llama-3.2/resolve/v0.7.0/'

const FILES = [
  'ggml-llama-3.2-1b.bin',
  'tokenizer.json',
  'tokenizer_config.json',
]

function sanitizeModelId(modelId: string): string {
  return modelId.replace(/[^a-z0-9]/gi, '_').toLowerCase()
}

async function downloadFile(
  url: string,
  dest: string,
  onProgress?: (downloaded: number, total?: number) => void,
): Promise<void> {
  await mkdir(path.dirname(dest), { recursive: true })
  const file = fs.createWriteStream(dest)
  await new Promise<void>((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode && res.statusCode >= 400) {
        reject(new Error(`Failed to download ${url}: ${res.statusCode}`))
        return
      }
      const total = Number(res.headers['content-length']) || undefined
      let loaded = 0
      res.on('data', (chunk) => {
        loaded += chunk.length
        onProgress?.(loaded, total)
      })
      pipeline(res, file)
        .then(resolve)
        .catch(reject)
    }).on('error', reject)
  })
}

export async function downloadExecuTorchModel(
  projectDir: string,
  modelId: string,
  onProgress?: (progress: number) => void,
): Promise<string> {
  const targetDir = path.join(projectDir, 'assets', 'models', sanitizeModelId(modelId))
  await mkdir(targetDir, { recursive: true })

  let overall = 0
  const chunk = 1 / FILES.length
  for (const fileName of FILES) {
    const targetPath = path.join(targetDir, fileName)
    try {
      await stat(targetPath)
      overall += chunk
      continue
    } catch {
      // not exists, proceed
    }

    await downloadFile(
      `${BASE_URL}${fileName}`,
      targetPath,
      (downloaded, total) => {
        const fileProgress = total ? downloaded / total : 0
        onProgress?.(overall + fileProgress * chunk)
      },
    )
    overall += chunk
    onProgress?.(overall)
  }

  return path.join(targetDir, FILES[0])
}
