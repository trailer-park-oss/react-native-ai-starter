import type { ReactNode } from 'react'
import { MLKitProvider } from './MLKitProvider'

export function AiChatProvider({ children }: { children: ReactNode }) {
  return <MLKitProvider>{children}</MLKitProvider>
}
