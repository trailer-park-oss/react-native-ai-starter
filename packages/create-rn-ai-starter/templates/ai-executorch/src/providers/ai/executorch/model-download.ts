import AsyncStorage from '@react-native-async-storage/async-storage'
import * as FileSystem from 'expo-file-system/legacy'

const BASE_URL =
  'https://huggingface.co/software-mansion/react-native-executorch-llama-3.2/resolve/v0.7.0/'

const FILES = ['ggml-llama-3.2-1b.bin', 'tokenizer.json', 'tokenizer_config.json']
const STORAGE_KEY = '@execuTorch:modelPath'

function sanitizeModelId(modelId: string): string {
  return modelId.replace(/[^a-z0-9]/gi, '_').toLowerCase()
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
    const progress = event.totalBytesWritten / (event.totalBytesExpectedToWrite || 1)
    onProgress?.(progress)
  })
  await download.downloadAsync()
}

export async function downloadExecuTorchModel(
  modelId: string,
  onProgress?: (progress: number) => void,
): Promise<string> {
  const targetDir = `${FileSystem.documentDirectory}execuTorch-models/${sanitizeModelId(modelId)}`
  await FileSystem.makeDirectoryAsync(targetDir, { intermediates: true })

  let overall = 0
  const chunk = 1 / FILES.length
  for (const fileName of FILES) {
    const destination = `${targetDir}/${fileName}`
    const info = await FileSystem.getInfoAsync(destination)
    if (info.exists) {
      overall += chunk
      continue
    }
    await downloadFile(`${BASE_URL}${fileName}`, destination, (progress) => {
      onProgress?.(overall + progress * chunk)
    })
    overall += chunk
    onProgress?.(overall)
  }
  await AsyncStorage.setItem(`${STORAGE_KEY}:${modelId}`, `${targetDir}/${FILES[0]}`)
  return `${targetDir}/${FILES[0]}`
}
