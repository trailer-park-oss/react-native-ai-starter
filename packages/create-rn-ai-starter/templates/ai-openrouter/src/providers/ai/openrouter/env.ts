export function getOpenRouterApiKey(): string {
  const key = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY
  if (!key) {
    throw new Error(
      'Missing EXPO_PUBLIC_OPENROUTER_API_KEY. ' +
      'Add it to your .env file. Get a key at https://openrouter.ai/keys',
    )
  }
  return key
}

export function getOpenRouterBaseUrl(): string {
  return process.env.EXPO_PUBLIC_OPENROUTER_BASE_URL ?? 'https://openrouter.ai/api/v1'
}
