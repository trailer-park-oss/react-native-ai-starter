export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
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
