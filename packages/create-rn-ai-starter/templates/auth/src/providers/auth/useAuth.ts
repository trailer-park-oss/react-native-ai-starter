import { useClerkAuthAdapter } from '@/providers/auth/clerk/clerk-adapter'
import type { AuthProvider } from '@/providers/auth/auth.interface'

export function useAuth(): AuthProvider {
  return useClerkAuthAdapter()
}
