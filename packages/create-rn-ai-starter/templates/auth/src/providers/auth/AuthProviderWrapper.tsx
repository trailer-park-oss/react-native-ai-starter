import type { PropsWithChildren } from 'react'
import { ClerkAuthProvider } from '@/providers/auth/clerk/clerk-provider'

export function AuthProviderWrapper({ children }: PropsWithChildren) {
  return (
    <ClerkAuthProvider>
      {children}
    </ClerkAuthProvider>
  )
}
