import { Box, Text } from '@gluestack-ui/themed'
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
    <Box
      p={tokens.spacing.md}
      borderRadius={tokens.radius.md}
      bg={tokens.colors[bg]}
      borderLeftWidth={3}
      borderLeftColor={tokens.colors[fg]}
      flexDirection="row"
      alignItems="center"
    >
      <Text
        fontSize={tokens.typography.body.fontSize}
        lineHeight={tokens.typography.body.lineHeight}
        fontWeight="500"
        color={tokens.colors[fg]}
        flex={1}
      >
        {message}
      </Text>
    </Box>
  )
}
