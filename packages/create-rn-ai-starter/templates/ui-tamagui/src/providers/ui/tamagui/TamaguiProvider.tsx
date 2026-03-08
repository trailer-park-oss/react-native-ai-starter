import type { PropsWithChildren } from 'react'
import { TamaguiProvider as TamaguiProviderBase } from 'tamagui'
import { tamaguiConfig } from '@/providers/ui/tamagui/tamagui.config'

interface TamaguiAdapterProps {
  themeName: string
}

export function TamaguiAdapter({
  children,
  themeName,
}: PropsWithChildren<TamaguiAdapterProps>) {
  return (
    <TamaguiProviderBase config={tamaguiConfig} defaultTheme={themeName}>
      {children}
    </TamaguiProviderBase>
  )
}
