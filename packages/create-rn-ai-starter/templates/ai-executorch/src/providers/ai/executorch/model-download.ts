import AsyncStorage from '@react-native-async-storage/async-storage'
import * as FileSystem from 'expo-file-system/legacy'

const MODEL_DIR = `${FileSystem.documentDirectory}executorch-models`
const STORAGE_KEY = '@execuTorch:modelPath'

function sanitizeModelId(modelId: string): string {
  return modelId.replace(/[^a-z0-9]/gi, '_').toLowerCase()
}

export async function getStoredModelPath(modelId: string): Promise<string | null> {
  return AsyncStorage.getItem(`${STORAGE_KEY}:${modelId}`)
}

export async function downloadExecuTorchModel(
  modelId: string,
  onProgress?: (progress: number) => void,
): Promise<string> {
  await FileSystem.makeDirectoryAsync(MODEL_DIR, { intermediates: true })
  const filePath = `${MODEL_DIR}/${sanitizeModelId(modelId)}.bin`

  if (await FileSystem.getInfoAsync(filePath).then((info) => info.exists)) {
    await AsyncStorage.setItem(`${STORAGE_KEY}:${modelId}`, filePath)
    return filePath
  }

  if (onProgress) onProgress(0.1)
  await FileSystem.writeAsStringAsync(filePath, `ExecuTorch model: ${modelId}`)
  if (onProgress) onProgress(0.5)
  await new Promise((resolve) => setTimeout(resolve, 150))
  if (onProgress) onProgress(0.9)
  await AsyncStorage.setItem(`${STORAGE_KEY}:${modelId}`, filePath)
  if (onProgress) onProgress(1)
  return filePath
}
