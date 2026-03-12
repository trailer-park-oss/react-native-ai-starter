import { useOnDeviceChat } from './useOnDeviceChat'
import type { UseAiChatReturn } from '../ai.interface'

type ModelId =
  | 'LLAMA3_2_1B'
  | 'LLAMA3_2_3B'
  | 'QWEN2_5_0_5B'
  | 'QWEN2_5_1_5B'
  | 'PHI_4_MINI'
  | 'SMOLLM_2_360M'

export function useAiChat(options?: { modelId?: ModelId }): UseAiChatReturn {
  return useOnDeviceChat(options)
}
