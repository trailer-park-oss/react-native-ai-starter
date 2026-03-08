import { createTamagui, createTokens } from 'tamagui'
import { createAnimations } from '@tamagui/animations-react-native'
import { createInterFont } from '@tamagui/font-inter'
import {
  colorPalettes,
  spacing,
  radius,
  typography,
} from '@/design-system/tokens'

const animations = createAnimations({
  fast: { damping: 20, mass: 1.2, stiffness: 250 },
  medium: { damping: 15, mass: 1, stiffness: 150 },
  slow: { damping: 10, mass: 1, stiffness: 100 },
})

const headingFont = createInterFont({
  size: {
    1: typography.caption.fontSize,
    2: typography.body.fontSize,
    3: typography.bodyLarge.fontSize,
    4: typography.heading.fontSize,
    5: typography.headingLarge.fontSize,
    6: typography.display.fontSize,
  },
  weight: {
    4: typography.caption.fontWeight,
    5: typography.heading.fontWeight,
    7: typography.display.fontWeight,
  },
})

const bodyFont = createInterFont({
  size: {
    1: typography.caption.fontSize,
    2: typography.body.fontSize,
    3: typography.bodyLarge.fontSize,
    4: typography.heading.fontSize,
    5: typography.headingLarge.fontSize,
    6: typography.display.fontSize,
  },
  weight: {
    4: typography.body.fontWeight,
    5: typography.heading.fontWeight,
    7: typography.display.fontWeight,
  },
})

const tokens = createTokens({
  color: {
    ...colorPalettes['neutral-green'].light,
  },
  space: {
    ...spacing,
    true: spacing.md,
  },
  size: {
    ...spacing,
    true: spacing.md,
  },
  radius: {
    ...radius,
    true: radius.md,
  },
  zIndex: {
    xs: 0,
    sm: 100,
    md: 200,
    lg: 300,
    xl: 400,
    '2xl': 500,
    '3xl': 600,
    true: 200,
  },
})

export const tamaguiConfig = createTamagui({
  tokens,
  animations,
  fonts: {
    heading: headingFont,
    body: bodyFont,
  },
  themes: {
    'neutral-green-light': colorPalettes['neutral-green'].light,
    'neutral-green-dark': colorPalettes['neutral-green'].dark,
    'fluent-blue-light': colorPalettes['fluent-blue'].light,
    'fluent-blue-dark': colorPalettes['fluent-blue'].dark,
  },
})

export type AppConfig = typeof tamaguiConfig

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}
