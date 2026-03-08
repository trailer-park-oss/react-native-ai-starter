import { useState, useCallback, useRef } from 'react'
import { openRouterClient, type SendMessageOptions } from './client'
import type { ChatMessage } from '../ai.interface'

export interface UseChatReturn {
  messages: ChatMessage[]
  isLoading: boolean
  error: string | null
  sendMessage: (content: string) => Promise<void>
  clearMessages: () => void
}

let messageIdCounter = 0
function createId(): string {
  return `msg_${Date.now()}_${++messageIdCounter}`
}

export function useChat(options: {
  model?: string
  systemPrompt?: string
  temperature?: number
  maxTokens?: number
  streaming?: boolean
} = {}): UseChatReturn {
  const {
    model,
    systemPrompt = 'You are a helpful assistant.',
    temperature,
    maxTokens,
    streaming = true,
  } = options

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef(false)

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return

    setError(null)
    abortRef.current = false

    const userMessage: ChatMessage = {
      id: createId(),
      role: 'user',
      content: content.trim(),
      timestamp: Date.now(),
    }

    const assistantMessage: ChatMessage = {
      id: createId(),
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    }

    setMessages(prev => [...prev, userMessage, assistantMessage])
    setIsLoading(true)

    try {
      const apiMessages = [
        { role: 'system' as const, content: systemPrompt },
        ...messages.map(m => ({ role: m.role, content: m.content })),
        { role: 'user' as const, content: content.trim() },
      ]

      const sendOptions: SendMessageOptions = {
        model,
        temperature,
        maxTokens,
        stream: streaming,
      }

      if (streaming) {
        sendOptions.onToken = (token: string) => {
          if (abortRef.current) return
          setMessages(prev =>
            prev.map(m =>
              m.id === assistantMessage.id
                ? { ...m, content: m.content + token }
                : m,
            ),
          )
        }
      }

      const result = await openRouterClient.sendMessage(apiMessages, sendOptions)

      // Always set final content from the returned result to ensure
      // completeness — covers both non-streaming and the streaming
      // fallback where ReadableStream is unavailable.
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantMessage.id ? { ...m, content: result } : m,
        ),
      )
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send message'
      setError(message)
      setMessages(prev => prev.filter(m => m.id !== assistantMessage.id))
    } finally {
      setIsLoading(false)
    }
  }, [messages, isLoading, model, systemPrompt, temperature, maxTokens, streaming])

  const clearMessages = useCallback(() => {
    setMessages([])
    setError(null)
    abortRef.current = true
  }, [])

  return { messages, isLoading, error, sendMessage, clearMessages }
}
