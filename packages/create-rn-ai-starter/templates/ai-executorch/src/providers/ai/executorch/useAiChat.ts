import { useOnDeviceChat } from './useOnDeviceChat'
import type { UseAiChatReturn } from '../ai.interface'

type ModelId = 'LLAMA3_2_1B' | 'LLAMA3_2_3B'

export function useAiChat(options?: { modelId?: ModelId; modelPath?: string }): UseAiChatReturn {
  return useOnDeviceChat({
    modelId: options?.modelId,
    modelPath: options?.modelPath,
  })
}
