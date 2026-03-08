import { Text } from '@gluestack-ui/themed'
import { Pressable } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { useTokens } from '@/design-system'

interface PrimaryButtonProps {
  label: string
  onPress?: () => void
  disabled?: boolean
}

export function PrimaryButton({ label, onPress, disabled }: PrimaryButtonProps) {
  const tokens = useTokens()
  const scale = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 150 })
  }

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 })
  }

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    onPress?.()
  }

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
    >
      <Animated.View
        style={[
          animatedStyle,
          {
            backgroundColor: disabled
              ? tokens.colors.borderSubtle
              : tokens.colors.primary,
            paddingVertical: tokens.spacing.md,
            paddingHorizontal: tokens.spacing.xl,
            borderRadius: tokens.radius.lg,
            alignItems: 'center',
            justifyContent: 'center',
          },
        ]}
      >
        <Text
          fontSize={tokens.typography.bodyLarge.fontSize}
          lineHeight={tokens.typography.bodyLarge.lineHeight}
          fontWeight={tokens.typography.heading.fontWeight}
          color={disabled ? tokens.colors.textSubtle : tokens.colors.textOnPrimary}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  )
}
