import { getOpenRouterApiKey, getOpenRouterBaseUrl } from './env'
import type { ChatMessage } from '../ai.interface'

interface OpenRouterResponse {
  id: string
  choices: Array<{
    message: { role: string; content: string }
    finish_reason: string
  }>
  model: string
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

interface StreamDelta {
  choices: Array<{
    delta: { role?: string; content?: string }
    finish_reason: string | null
  }>
}

export interface SendMessageOptions {
  model?: string
  temperature?: number
  maxTokens?: number
  stream?: boolean
  onToken?: (token: string) => void
}

const DEFAULT_MODEL = 'openai/gpt-4o-mini'

function parseSseEvents(
  text: string,
  onToken: (token: string) => void,
): string {
  let fullContent = ''
  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || !trimmed.startsWith('data: ')) continue
    const payload = trimmed.slice(6)
    if (payload === '[DONE]') break
    try {
      const chunk: StreamDelta = JSON.parse(payload)
      const content = chunk.choices[0]?.delta?.content
      if (content) {
        fullContent += content
        onToken(content)
      }
    } catch {
      // Skip malformed SSE chunks
    }
  }
  return fullContent
}

async function processStream(
  response: Response,
  onToken: (token: string) => void,
): Promise<string> {
  // React Native's fetch often lacks ReadableStream support on response.body.
  // When unavailable, fall back to reading the full SSE payload as text.
  const reader = response.body?.getReader?.()
  if (!reader) {
    const text = await response.text()
    return parseSseEvents(text, onToken)
  }

  const decoder = new TextDecoder()
  let fullContent = ''
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    fullContent += parseSseEvents(lines.join('\n'), onToken)
  }

  return fullContent
}

export const openRouterClient = {
  async sendMessage(
    messages: Pick<ChatMessage, 'role' | 'content'>[],
    options: SendMessageOptions = {},
  ): Promise<string> {
    const apiKey = getOpenRouterApiKey()
    const baseUrl = getOpenRouterBaseUrl()
    const {
      model = DEFAULT_MODEL,
      temperature = 0.7,
      maxTokens = 1024,
      stream = false,
      onToken,
    } = options

    const useStream = stream && !!onToken

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream: useStream,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`OpenRouter API error (${response.status}): ${error}`)
    }

    if (useStream) {
      return processStream(response, onToken!)
    }

    const data: OpenRouterResponse = await response.json()
    return data.choices[0]?.message?.content ?? ''
  },
}
