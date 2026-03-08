import { YStack, Text } from 'tamagui'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated'
import { Pressable } from 'react-native'
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
        <YStack
          padding="$md"
          borderRadius="$lg"
          backgroundColor={tokens.colors.surface}
          borderWidth={1}
          borderColor={tokens.colors.borderSubtle}
          gap="$xs"
          style={elevation.card}
        >
          <Text
            fontFamily="$heading"
            fontSize={tokens.typography.heading.fontSize}
            fontWeight={tokens.typography.heading.fontWeight}
            color={tokens.colors.text}
          >
            {title}
          </Text>
          {description ? (
            <Text
              fontFamily="$body"
              fontSize={tokens.typography.body.fontSize}
              color={tokens.colors.textSubtle}
            >
              {description}
            </Text>
          ) : null}
        </YStack>
      </Animated.View>
    </Pressable>
  )
}
