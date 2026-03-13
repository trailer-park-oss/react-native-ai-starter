import { useCallback, useEffect, useRef, useState } from 'react'
import {
  useLLM,
  LLAMA3_2_1B,
  LLAMA3_2_1B_QLORA,
  LLAMA3_2_3B,
  LLAMA3_2_3B_QLORA,
  type Message,
} from 'react-native-executorch'
import type { ChatMessage, UseAiChatReturn } from '../ai.interface'

let idCounter = 0
function createId(): string {
  return `msg_${Date.now()}_${++idCounter}`
}

const MODEL_MAP = {
  LLAMA3_2_1B: LLAMA3_2_1B_QLORA,
  LLAMA3_2_3B: LLAMA3_2_3B_QLORA,
} as const

type ModelId = keyof typeof MODEL_MAP

export function useOnDeviceChat(options?: { modelId?: ModelId; modelPath?: string }): UseAiChatReturn {
  const modelId = options?.modelId ?? 'LLAMA3_2_1B'
  const defaultModel = MODEL_MAP[modelId]

  let model
  if (options?.modelPath) {
    const dir = options.modelPath.substring(0, options.modelPath.lastIndexOf('/'))
    model = {
      modelSource: options.modelPath,
      tokenizerSource: `${dir}/tokenizer.json`,
      tokenizerConfigSource: `${dir}/tokenizer_config.json`,
    }
  } else {
    model = defaultModel
  }

  const llm = useLLM({ model })
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

  const sendMessage = useCallback(async (text: string, imageUri?: string) => {
    setError(null)
    if (!text.trim()) return

    if (imageUri) {
      setError('This model does not support image input. Please use a text-only message or switch to a model that supports images.')
      return
    }

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
