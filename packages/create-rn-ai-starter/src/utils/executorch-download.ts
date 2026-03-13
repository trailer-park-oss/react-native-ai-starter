import { mkdir, stat } from 'node:fs/promises'
import fs from 'node:fs'
import path from 'node:path'
import https from 'node:https'
import { pipeline } from 'node:stream/promises'

interface ModelConfig {
  repo: string
  modelFile: string
  tokenizerFiles: string[]
}

const MODEL_CONFIGS: Record<string, ModelConfig> = {
  LLAMA3_2_1B: {
    repo: 'software-mansion/react-native-executorch-llama-3.2',
    modelFile: 'llama-3.2-1B/QLoRA/llama3_2_qat_lora.pte',
    tokenizerFiles: ['tokenizer.json', 'tokenizer_config.json'],
  },
  LLAMA3_2_3B: {
    repo: 'software-mansion/react-native-executorch-llama-3.2',
    modelFile: 'llama-3.2-3B/QLoRA/llama3_2-3B_qat_lora.pte',
    tokenizerFiles: ['tokenizer.json', 'tokenizer_config.json'],
  },
  QWEN2_5_0_5B: {
    repo: 'software-mansion/react-native-executorch-qwen-2.5',
    modelFile: 'qwen-2.5-0.5B/quantized/qwen2_5_0_5b_8da4w.pte',
    tokenizerFiles: ['tokenizer.json', 'tokenizer_config.json'],
  },
  QWEN2_5_1_5B: {
    repo: 'software-mansion/react-native-executorch-qwen-2.5',
    modelFile: 'qwen-2.5-1.5B/quantized/qwen2_5_1_5b_8da4w.pte',
    tokenizerFiles: ['tokenizer.json', 'tokenizer_config.json'],
  },
  SMOLLM_2_360M: {
    repo: 'software-mansion/react-native-executorch-smolLm-2',
    modelFile: 'smolLm-2-360M/quantized/smolLm2_360M_8da4w.pte',
    tokenizerFiles: ['tokenizer.json', 'tokenizer_config.json'],
  },
  PHI_4_MINI: {
    repo: 'software-mansion/react-native-executorch-phi-4',
    modelFile: '',
    tokenizerFiles: [],
  },
}

function getModelConfig(modelId: string): ModelConfig {
  const config = MODEL_CONFIGS[modelId]
  if (!config) {
    throw new Error(`Unknown model ID: ${modelId}`)
  }
  return config
}

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
  const config = getModelConfig(modelId)
  const baseUrl = `https://huggingface.co/${config.repo}/resolve/main/`

  const targetDir = path.join(projectDir, 'assets', 'models', sanitizeModelId(modelId))
  await mkdir(targetDir, { recursive: true })

  const files = [config.modelFile, ...config.tokenizerFiles]
  let overall = 0
  const chunk = 1 / files.length
  for (const fileName of files) {
    if (!fileName) continue
    const targetPath = path.join(targetDir, path.basename(fileName))
    try {
      await stat(targetPath)
      overall += chunk
      continue
    } catch {
      // not exists, proceed
    }

    await downloadFile(
      `${baseUrl}${fileName}`,
      targetPath,
      (downloaded, total) => {
        const fileProgress = total ? downloaded / total : 0
        onProgress?.(overall + fileProgress * chunk)
      },
    )
    overall += chunk
    onProgress?.(overall)
  }

  return path.join(targetDir, path.basename(config.modelFile))
}
