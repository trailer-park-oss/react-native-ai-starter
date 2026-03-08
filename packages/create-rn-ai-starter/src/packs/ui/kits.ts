import type { UiProvider } from '@/types.js'

export interface UIKit {
  lib: string
  VStack: string
  HStack: string
}

const tamaguiKit: UIKit = {
  lib: 'tamagui',
  VStack: 'YStack',
  HStack: 'XStack',
}

const gluestackKit: UIKit = {
  lib: '@gluestack-ui/themed',
  VStack: 'VStack',
  HStack: 'HStack',
}

const kits: Record<UiProvider, UIKit> = {
  tamagui: tamaguiKit,
  gluestack: gluestackKit,
}

export function getUIKit(provider: UiProvider): UIKit {
  return kits[provider]
}
