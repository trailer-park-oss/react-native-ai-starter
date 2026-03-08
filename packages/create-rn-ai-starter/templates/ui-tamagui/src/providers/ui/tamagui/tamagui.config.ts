import { createTamagui, createTokens } from 'tamagui'
import { createAnimations } from '@tamagui/animations-react-native'
import { createInterFont } from '@tamagui/font-inter'
import {
  colorPalettes,
  accentScales,
  spacing,
  radius,
  typography,
  type ThemePreset,
  type ColorMode,
  type ColorTokens,
  type RadixScale,
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

function scaleToNumbered(scale: RadixScale, prefix: string): Record<string, string> {
  const entries = Object.values(scale)
  const result: Record<string, string> = {}
  for (let i = 0; i < entries.length; i++) {
    result[`${prefix}${i + 1}`] = entries[i]
  }
  return result
}

function buildTamaguiTheme(
  semantic: ColorTokens,
  accentScale: RadixScale,
  prefix: string,
): Record<string, string> {
  return {
    ...semantic,
    ...scaleToNumbered(accentScale, prefix),
  }
}

const presets: ThemePreset[] = [
  'radix-blue',
  'radix-green',
  'radix-purple',
  'radix-orange',
  'radix-cyan',
  'radix-red',
]
const modes: ColorMode[] = ['light', 'dark']

const prefixMap: Record<ThemePreset, string> = {
  'radix-blue': 'blue',
  'radix-green': 'green',
  'radix-purple': 'purple',
  'radix-orange': 'orange',
  'radix-cyan': 'cyan',
  'radix-red': 'red',
}

const themes: Record<string, Record<string, string>> = {}
for (const preset of presets) {
  for (const mode of modes) {
    const key = `${preset}-${mode}`
    themes[key] = buildTamaguiTheme(
      colorPalettes[preset][mode],
      accentScales[preset][mode],
      prefixMap[preset],
    )
  }
}

const defaultSemantic = colorPalettes['radix-blue'].light
const tokens = createTokens({
  color: {
    ...defaultSemantic,
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
  themes,
})

export type AppConfig = typeof tamaguiConfig

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}
