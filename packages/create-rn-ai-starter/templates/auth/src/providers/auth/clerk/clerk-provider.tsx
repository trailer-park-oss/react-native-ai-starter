import type { PropsWithChildren } from 'react'
import { ClerkProvider, ClerkLoaded } from '@clerk/expo'
import { tokenCache } from '@/providers/auth/clerk/token-cache'
import { validateClerkEnv } from '@/providers/auth/clerk/env'

const publishableKey = validateClerkEnv()

export function ClerkAuthProvider({ children }: PropsWithChildren) {
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <ClerkLoaded>
        {children}
      </ClerkLoaded>
    </ClerkProvider>
  )
}
