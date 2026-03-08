import type { PropsWithChildren } from 'react'
import { GluestackUIProvider } from '@gluestack-ui/themed'
import { config } from '@gluestack-ui/config'
import type { ColorMode } from '@/design-system/tokens'

interface GluestackAdapterProps {
  colorMode: ColorMode
}

export function GluestackAdapter({
  children,
  colorMode,
}: PropsWithChildren<GluestackAdapterProps>) {
  return (
    <GluestackUIProvider config={config} colorMode={colorMode}>
      {children}
    </GluestackUIProvider>
  )
}
