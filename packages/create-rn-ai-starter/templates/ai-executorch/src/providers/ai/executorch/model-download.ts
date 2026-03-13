import AsyncStorage from '@react-native-async-storage/async-storage'
import * as FileSystem from 'expo-file-system/legacy'

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
}

const STORAGE_KEY = '@execuTorch:modelPath'

function sanitizeModelId(modelId: string): string {
  return modelId.replace(/[^a-z0-9]/gi, '_').toLowerCase()
}

function getModelConfig(modelId: string): ModelConfig {
  const config = MODEL_CONFIGS[modelId]
  if (!config) {
    throw new Error(`Unknown model ID: ${modelId}`)
  }
  return config
}

export async function getStoredModelPath(modelId: string): Promise<string | null> {
  return AsyncStorage.getItem(`${STORAGE_KEY}:${modelId}`)
}

async function downloadFile(
  url: string,
  destination: string,
  onProgress?: (progress: number) => void,
): Promise<void> {
  await FileSystem.makeDirectoryAsync(FileSystem.documentDirectory + 'execuTorch-models', {
    intermediates: true,
  })
  const download = FileSystem.createDownloadResumable(url, destination, {}, (event) => {
    const progress = event.totalBytesWritten / (event.totalBytesExpectedToWrite ||1)
    onProgress?.(progress)
  })
  await download.downloadAsync()
}

export async function downloadExecuTorchModel(
  modelId: string,
  onProgress?: (progress: number) => void,
): Promise<string> {
  const config = getModelConfig(modelId)
  const baseUrl = `https://huggingface.co/${config.repo}/resolve/main/`

  const targetDir = `${FileSystem.documentDirectory}execuTorch-models/${sanitizeModelId(modelId)}`
  await FileSystem.makeDirectoryAsync(targetDir, { intermediates: true })

  const files = [config.modelFile, ...config.tokenizerFiles]
  let overall = 0
  const chunk = 1 / files.length
  for (const fileName of files) {
    if (!fileName) continue
    const destination = `${targetDir}/${fileName.split('/').pop()}`
    const info = await FileSystem.getInfoAsync(destination)
    if (info.exists) {
      overall += chunk
      continue
    }
    await downloadFile(`${baseUrl}${fileName}`, destination, (progress) => {
      onProgress?.(overall + progress * chunk)
    })
    overall += chunk
    onProgress?.(overall)
  }
  const modelFileName = config.modelFile.split('/').pop() || ''
  await AsyncStorage.setItem(`${STORAGE_KEY}:${modelId}`, `${targetDir}/${modelFileName}`)
  return `${targetDir}/${modelFileName}`
}
