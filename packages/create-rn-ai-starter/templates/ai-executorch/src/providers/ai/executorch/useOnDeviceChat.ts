import { useCallback, useEffect, useRef, useState } from 'react'
import {
  useLLM,
  LLAMA3_2_1B,
  LLAMA3_2_3B,
  QWEN2_5_0_5B,
  QWEN2_5_1_5B,
  PHI_4_MINI,
  SMOLLM_2_360M,
  type Message,
} from 'react-native-executorch'
import type { ChatMessage, UseAiChatReturn } from '../ai.interface'

let idCounter = 0
function createId(): string {
  return `msg_${Date.now()}_${++idCounter}`
}

const MODEL_MAP = {
  LLAMA3_2_1B,
  LLAMA3_2_3B,
  QWEN2_5_0_5B,
  QWEN2_5_1_5B,
  PHI_4_MINI,
  SMOLLM_2_360M,
} as const

type ModelId = keyof typeof MODEL_MAP

export function useOnDeviceChat(options?: { modelId?: ModelId }): UseAiChatReturn {
  const modelId = options?.modelId ?? 'LLAMA3_2_1B'
  const llm = useLLM({ model: MODEL_MAP[modelId] })
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesRef = useRef<ChatMessage[]>([])

  const updateMessages = useCallback((next: ChatMessage[]) => {
    messagesRef.current = next
    setMessages(next)
  }, [])

  useEffect(() => {
    if (llm.error) {
      setError(llm.error instanceof Error ? llm.error.message : String(llm.error))
    }
  }, [llm.error])

  const sendMessage = useCallback(async (text: string) => {
    setError(null)
    if (!text.trim()) return

    const userMsg: ChatMessage = {
      id: createId(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    }

    const nextMessages = [...messagesRef.current, userMsg]
    updateMessages(nextMessages)

    if (!llm.isReady) {
      setError('Model is still loading. Please try again in a moment.')
      return
    }

    setIsLoading(true)
    try {
      const chat: Message[] = nextMessages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }))

      const response = await llm.generate(chat)
      const assistantMsg: ChatMessage = {
        id: createId(),
        role: 'assistant',
        content: response || '...',
        timestamp: Date.now(),
      }
      updateMessages([...nextMessages, assistantMsg])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setIsLoading(false)
    }
  }, [llm.isReady, llm.generate, updateMessages])

  const clearMessages = useCallback(() => {
    updateMessages([])
    setError(null)
  }, [updateMessages])

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    capabilities: { text: true, image: false },
  }
}
