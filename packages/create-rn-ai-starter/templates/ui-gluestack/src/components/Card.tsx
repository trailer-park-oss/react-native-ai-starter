import { Box, Text } from '@gluestack-ui/themed'
import { Pressable } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { useTokens } from '@/design-system'
import { elevation } from '@/design-system/elevation'

interface CardProps {
  title: string
  description?: string
  onPress?: () => void
}

export function Card({ title, description, onPress }: CardProps) {
  const tokens = useTokens()
  const scale = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 150 })
  }

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 })
  }

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onPress?.()
  }

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={animatedStyle}>
        <Box
          p={tokens.spacing.md}
          borderRadius={tokens.radius.lg}
          bg={tokens.colors.surface}
          borderWidth={1}
          borderColor={tokens.colors.borderSubtle}
          gap={tokens.spacing.xs}
          style={elevation.card}
        >
          <Text
            fontSize={tokens.typography.heading.fontSize}
            lineHeight={tokens.typography.heading.lineHeight}
            fontWeight={tokens.typography.heading.fontWeight}
            color={tokens.colors.text}
          >
            {title}
          </Text>
          {description ? (
            <Text
              fontSize={tokens.typography.body.fontSize}
              lineHeight={tokens.typography.body.lineHeight}
              color={tokens.colors.textSubtle}
            >
              {description}
            </Text>
          ) : null}
        </Box>
      </Animated.View>
    </Pressable>
  )
}
