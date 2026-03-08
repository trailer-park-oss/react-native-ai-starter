export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  imageUri?: string
  timestamp: number
}

export interface ChatOptions {
  model?: string
  systemPrompt?: string
  temperature?: number
  maxTokens?: number
}

export interface VisionResult {
  type: 'object'
  label: string
  confidence: number
  bounds?: {
    x: number
    y: number
    width: number
    height: number
  }
}

export interface UseAiChatReturn {
  messages: ChatMessage[]
  isLoading: boolean
  error: string | null
  sendMessage: (text: string, imageUri?: string) => Promise<void>
  clearMessages: () => void
  capabilities: {
    text: boolean
    image: boolean
  }
}
