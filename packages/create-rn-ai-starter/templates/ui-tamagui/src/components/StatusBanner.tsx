import { XStack, Text } from 'tamagui'
import { useTokens } from '@/design-system'
import type { ColorTokens } from '@/design-system/tokens'

type StatusVariant = 'success' | 'warning' | 'critical' | 'info'

interface StatusBannerProps {
  variant: StatusVariant
  message: string
}

const variantMap: Record<StatusVariant, { bg: keyof ColorTokens; fg: keyof ColorTokens }> = {
  success: { bg: 'successSubtle', fg: 'success' },
  warning: { bg: 'warningSubtle', fg: 'warning' },
  critical: { bg: 'criticalSubtle', fg: 'critical' },
  info: { bg: 'infoSubtle', fg: 'info' },
}

export function StatusBanner({ variant, message }: StatusBannerProps) {
  const tokens = useTokens()
  const { bg, fg } = variantMap[variant]

  return (
    <XStack
      padding="$md"
      borderRadius="$md"
      backgroundColor={tokens.colors[bg]}
      borderLeftWidth={3}
      borderLeftColor={tokens.colors[fg]}
      alignItems="center"
    >
      <Text
        fontFamily="$body"
        fontSize={tokens.typography.body.fontSize}
        fontWeight="500"
        color={tokens.colors[fg]}
        flex={1}
      >
        {message}
      </Text>
    </XStack>
  )
}
