import { createConfig } from '@gluestack-style/react'
import {
  colorPalettes,
  spacing,
  radius,
  type ColorMode,
  type ThemePreset,
  type ColorTokens,
} from '@/design-system/tokens'

function flattenColorTokens(
  palettes: Record<ThemePreset, Record<ColorMode, ColorTokens>>,
): Record<string, string> {
  const flat: Record<string, string> = {}
  for (const [preset, modes] of Object.entries(palettes)) {
    for (const [mode, tokens] of Object.entries(modes)) {
      for (const [key, value] of Object.entries(tokens)) {
        flat[`${preset}-${mode}-${key}`] = value
      }
    }
  }
  return flat
}

export const gluestackConfig = createConfig({
  aliases: {
    bg: 'backgroundColor',
    p: 'padding',
    px: 'paddingHorizontal',
    py: 'paddingVertical',
    m: 'margin',
    mx: 'marginHorizontal',
    my: 'marginVertical',
    rounded: 'borderRadius',
  } as const,
  tokens: {
    colors: {
      ...colorPalettes['radix-blue'].light,
      ...flattenColorTokens(colorPalettes),
    },
    space: {
      ...spacing,
    },
    radii: {
      ...radius,
    },
    mediaQueries: {},
  },
})

type GluestackConfig = typeof gluestackConfig

declare module '@gluestack-style/react' {
  interface ICustomConfig extends GluestackConfig {}
}
