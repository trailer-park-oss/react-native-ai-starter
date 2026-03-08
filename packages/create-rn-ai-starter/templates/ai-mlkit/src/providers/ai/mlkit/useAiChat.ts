import { useState, useCallback } from 'react'
import { useObjectDetection } from '@infinitered/react-native-mlkit-object-detection'
import type { ChatMessage, UseAiChatReturn } from '../ai.interface'

let idCounter = 0
function createId(): string {
  return `msg_${Date.now()}_${++idCounter}`
}

export function useAiChat(): UseAiChatReturn {
  const detector = useObjectDetection('default')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendMessage = useCallback(
    async (text: string, imageUri?: string) => {
      setError(null)

      const userMsg: ChatMessage = {
        id: createId(),
        role: 'user',
        content: text || (imageUri ? 'Analyze this image' : ''),
        imageUri,
        timestamp: Date.now(),
      }
      setMessages((prev) => [...prev, userMsg])

      if (!imageUri) {
        const hint: ChatMessage = {
          id: createId(),
          role: 'assistant',
          content:
            "I'm an on-device AI powered by ML Kit. I can analyze images to detect objects. Tap the image button to send me a photo!",
          timestamp: Date.now(),
        }
        setMessages((prev) => [...prev, hint])
        return
      }

      if (!detector || !detector.isLoaded()) {
        setError('ML model is still loading. Please try again in a moment.')
        return
      }

      setIsLoading(true)
      try {
        const detections = await detector.detectObjects(imageUri)
        const labels = detections.flatMap((obj) =>
          obj.labels.map(
            (l) => `${l.text} (${Math.round(l.confidence * 100)}%)`,
          ),
        )

        const content =
          labels.length > 0
            ? `I detected the following:\n\n${labels.map((l) => `• ${l}`).join('\n')}`
            : "I couldn't detect any objects in this image. Try a different photo with clearer subjects."

        const assistantMsg: ChatMessage = {
          id: createId(),
          role: 'assistant',
          content,
          timestamp: Date.now(),
        }
        setMessages((prev) => [...prev, assistantMsg])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Analysis failed')
      } finally {
        setIsLoading(false)
      }
    },
    [detector],
  )

  const clearMessages = useCallback(() => {
    setMessages([])
    setError(null)
  }, [])

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    capabilities: { text: false, image: true },
  }
}
