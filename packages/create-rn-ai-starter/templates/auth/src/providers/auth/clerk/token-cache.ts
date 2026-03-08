import * as SecureStore from 'expo-secure-store'
import type { TokenCache } from '@clerk/expo'

async function getToken(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key)
  } catch {
    return null
  }
}

async function saveToken(key: string, value: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(key, value)
  } catch {
    // Silently fail — token cache is best-effort
  }
}

async function clearToken(key: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(key)
  } catch {
    // Silently fail
  }
}

export const tokenCache: TokenCache = {
  getToken,
  saveToken,
  clearToken,
}
