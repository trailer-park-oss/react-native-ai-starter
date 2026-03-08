import { useChat } from './useChat'
import type { UseAiChatReturn } from '../ai.interface'

export function useAiChat(options?: {
  model?: string
  systemPrompt?: string
}): UseAiChatReturn {
  const chat = useChat({
    model: options?.model,
    systemPrompt:
      options?.systemPrompt ??
      'You are a helpful, friendly assistant. Keep responses concise.',
  })

  return {
    messages: chat.messages,
    isLoading: chat.isLoading,
    error: chat.error,
    sendMessage: async (text: string) => {
      await chat.sendMessage(text)
    },
    clearMessages: chat.clearMessages,
    capabilities: { text: true, image: false },
  }
}
