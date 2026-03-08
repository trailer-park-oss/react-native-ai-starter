export interface ColorTokens {
  background: string
  backgroundSubtle: string
  surface: string
  surfaceRaised: string
  text: string
  textSubtle: string
  textOnPrimary: string
  border: string
  borderSubtle: string
  primary: string
  primaryPressed: string
  success: string
  warning: string
  critical: string
  info: string
  successSubtle: string
  warningSubtle: string
  criticalSubtle: string
  infoSubtle: string
}

export interface RadixScale {
  [key: string]: string
}

export interface SpacingTokens {
  xs: number
  sm: number
  md: number
  lg: number
  xl: number
  '2xl': number
  '3xl': number
}

export interface RadiusTokens {
  sm: number
  md: number
  lg: number
  xl: number
  full: number
}

export interface TypographyRole {
  fontSize: number
  lineHeight: number
  fontWeight: '400' | '500' | '600' | '700'
}

export interface TypographyTokens {
  caption: TypographyRole
  body: TypographyRole
  bodyLarge: TypographyRole
  heading: TypographyRole
  headingLarge: TypographyRole
  display: TypographyRole
}

export interface DesignTokens {
  colors: ColorTokens
  spacing: SpacingTokens
  radius: RadiusTokens
  typography: TypographyTokens
}

export type ThemePreset =
  | 'radix-blue'
  | 'radix-green'
  | 'radix-purple'
  | 'radix-orange'
  | 'radix-cyan'
  | 'radix-red'

export type ColorMode = 'light' | 'dark'

// ─── Shared Scales ───────────────────────────────────────────────────────────

export const spacing: SpacingTokens = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
}

export const radius: RadiusTokens = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
}

export const typography: TypographyTokens = {
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' },
  body: { fontSize: 14, lineHeight: 20, fontWeight: '400' },
  bodyLarge: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
  heading: { fontSize: 20, lineHeight: 28, fontWeight: '600' },
  headingLarge: { fontSize: 28, lineHeight: 36, fontWeight: '700' },
  display: { fontSize: 36, lineHeight: 44, fontWeight: '700' },
}

// ─── Radix Color Scales (@tamagui/colors) ───────────────────────────────────
// Each scale has 12 steps: 1 (lightest bg) → 12 (darkest fg)
// Semantic mapping:
//   1-2: backgrounds   3-5: borders/surfaces   6-8: UI elements
//   9-10: solid fills   11: text (low contrast)   12: text (high contrast)

const radix = {
  blue: {
    light: { blue1: '#fbfdff', blue2: '#f4faff', blue3: '#e6f4fe', blue4: '#d5efff', blue5: '#c2e5ff', blue6: '#acd8fc', blue7: '#8ec8f6', blue8: '#5eb1ef', blue9: '#0090ff', blue10: '#0588f0', blue11: '#0d74ce', blue12: '#113264' },
    dark:  { blue1: '#0d1520', blue2: '#111927', blue3: '#0d2847', blue4: '#003362', blue5: '#004074', blue6: '#104d87', blue7: '#205d9e', blue8: '#2870bd', blue9: '#0090ff', blue10: '#3b9eff', blue11: '#70b8ff', blue12: '#c2e6ff' },
  },
  green: {
    light: { green1: '#fbfefc', green2: '#f4fbf6', green3: '#e6f6eb', green4: '#d6f1df', green5: '#c4e8d1', green6: '#adddc0', green7: '#8eceaa', green8: '#5bb98b', green9: '#30a46c', green10: '#2b9a66', green11: '#218358', green12: '#193b2d' },
    dark:  { green1: '#0e1512', green2: '#121b17', green3: '#132d21', green4: '#113b29', green5: '#174933', green6: '#20573e', green7: '#28684a', green8: '#2f7c57', green9: '#30a46c', green10: '#33b074', green11: '#3dd68c', green12: '#b1f1cb' },
  },
  purple: {
    light: { purple1: '#fefcfe', purple2: '#fbf7fe', purple3: '#f7edfe', purple4: '#f2e2fc', purple5: '#ead5f9', purple6: '#e0c4f4', purple7: '#d1afec', purple8: '#be93e4', purple9: '#8e4ec6', purple10: '#8347b9', purple11: '#8145b5', purple12: '#402060' },
    dark:  { purple1: '#18111b', purple2: '#1e1523', purple3: '#301c3b', purple4: '#3d224e', purple5: '#48295c', purple6: '#54346b', purple7: '#664282', purple8: '#8457aa', purple9: '#8e4ec6', purple10: '#9a5cd0', purple11: '#d19dff', purple12: '#ecd9fa' },
  },
  orange: {
    light: { orange1: '#fefcfb', orange2: '#fff7ed', orange3: '#ffefd6', orange4: '#ffdfb5', orange5: '#ffd19a', orange6: '#ffc182', orange7: '#f5ae73', orange8: '#ec9455', orange9: '#f76b15', orange10: '#ef5f00', orange11: '#cc4e00', orange12: '#582d1d' },
    dark:  { orange1: '#17120e', orange2: '#1e160f', orange3: '#331e0b', orange4: '#462100', orange5: '#562800', orange6: '#66350c', orange7: '#7e451d', orange8: '#a35829', orange9: '#f76b15', orange10: '#ff801f', orange11: '#ffa057', orange12: '#ffe0c2' },
  },
  cyan: {
    light: { cyan1: '#fafdfe', cyan2: '#f2fafb', cyan3: '#def7f9', cyan4: '#caf1f6', cyan5: '#b5e9f0', cyan6: '#9ddde7', cyan7: '#7dcedc', cyan8: '#3db9cf', cyan9: '#00a2c7', cyan10: '#0797b9', cyan11: '#107d98', cyan12: '#0d3c48' },
    dark:  { cyan1: '#0b161a', cyan2: '#101b20', cyan3: '#082c36', cyan4: '#003848', cyan5: '#004558', cyan6: '#045468', cyan7: '#12677e', cyan8: '#11809c', cyan9: '#00a2c7', cyan10: '#23afd0', cyan11: '#4ccce6', cyan12: '#b6ecf7' },
  },
  red: {
    light: { red1: '#fffcfc', red2: '#fff7f7', red3: '#feebec', red4: '#ffdbdc', red5: '#ffcdce', red6: '#fdbdbe', red7: '#f4a9aa', red8: '#eb8e90', red9: '#e5484d', red10: '#dc3e42', red11: '#ce2c31', red12: '#641723' },
    dark:  { red1: '#191111', red2: '#201314', red3: '#3b1219', red4: '#500f1c', red5: '#611623', red6: '#72232d', red7: '#8c333a', red8: '#b54548', red9: '#e5484d', red10: '#ec5d5e', red11: '#ff9592', red12: '#ffd1d9' },
  },
  gray: {
    light: { gray1: '#fcfcfc', gray2: '#f9f9f9', gray3: '#f0f0f0', gray4: '#e8e8e8', gray5: '#e0e0e0', gray6: '#d9d9d9', gray7: '#cecece', gray8: '#bbbbbb', gray9: '#8d8d8d', gray10: '#838383', gray11: '#646464', gray12: '#202020' },
    dark:  { gray1: '#111111', gray2: '#191919', gray3: '#222222', gray4: '#2a2a2a', gray5: '#313131', gray6: '#3a3a3a', gray7: '#484848', gray8: '#606060', gray9: '#6e6e6e', gray10: '#7b7b7b', gray11: '#b4b4b4', gray12: '#eeeeee' },
  },
  slate: {
    light: { slate1: '#fcfcfd', slate2: '#f9f9fb', slate3: '#f0f0f3', slate4: '#e8e8ec', slate5: '#e0e1e6', slate6: '#d9d9e0', slate7: '#cdced6', slate8: '#b9bbc6', slate9: '#8b8d98', slate10: '#80838d', slate11: '#60646c', slate12: '#1c2024' },
    dark:  { slate1: '#111113', slate2: '#18191b', slate3: '#212225', slate4: '#272a2d', slate5: '#2e3135', slate6: '#363a3f', slate7: '#43484e', slate8: '#5a6169', slate9: '#696e77', slate10: '#777b84', slate11: '#b0b4ba', slate12: '#edeef0' },
  },
} as const

export { radix }

// ─── Helpers ─────────────────────────────────────────────────────────────────

type ScaleValues<T> = T extends Record<string, infer V> ? V : never
function val<T extends Record<string, string>>(scale: T, step: number): string {
  return Object.values(scale)[step - 1]
}

// ─── Semantic Color Derivation ──────────────────────────────────────────────
// Maps Radix 12-step scales into our semantic ColorTokens interface.
// accent = the primary hue, neutral = the gray variant for surfaces/text.

interface PaletteInput {
  accent: { light: RadixScale; dark: RadixScale }
  neutral: { light: RadixScale; dark: RadixScale }
}

function deriveLightTokens(p: PaletteInput): ColorTokens {
  const n = p.neutral.light
  const a = p.accent.light
  return {
    background:      val(n, 1),
    backgroundSubtle: val(n, 2),
    surface:         val(n, 1),
    surfaceRaised:   val(n, 3),
    text:            val(n, 12),
    textSubtle:      val(n, 11),
    textOnPrimary:   '#FFFFFF',
    border:          val(n, 6),
    borderSubtle:    val(n, 4),
    primary:         val(a, 9),
    primaryPressed:  val(a, 10),
    success:         val(radix.green.light, 9),
    warning:         val(radix.orange.light, 9),
    critical:        val(radix.red.light, 9),
    info:            val(radix.blue.light, 9),
    successSubtle:   val(radix.green.light, 3),
    warningSubtle:   val(radix.orange.light, 3),
    criticalSubtle:  val(radix.red.light, 3),
    infoSubtle:      val(radix.blue.light, 3),
  }
}

function deriveDarkTokens(p: PaletteInput): ColorTokens {
  const n = p.neutral.dark
  const a = p.accent.dark
  return {
    background:      val(n, 1),
    backgroundSubtle: val(n, 2),
    surface:         val(n, 3),
    surfaceRaised:   val(n, 4),
    text:            val(n, 12),
    textSubtle:      val(n, 11),
    textOnPrimary:   '#FFFFFF',
    border:          val(n, 6),
    borderSubtle:    val(n, 4),
    primary:         val(a, 9),
    primaryPressed:  val(a, 10),
    success:         val(radix.green.dark, 9),
    warning:         val(radix.orange.dark, 9),
    critical:        val(radix.red.dark, 9),
    info:            val(radix.blue.dark, 9),
    successSubtle:   val(radix.green.dark, 3),
    warningSubtle:   val(radix.orange.dark, 3),
    criticalSubtle:  val(radix.red.dark, 3),
    infoSubtle:      val(radix.blue.dark, 3),
  }
}

function buildPalette(accent: keyof typeof radix, neutral: 'gray' | 'slate' = 'gray'): Record<ColorMode, ColorTokens> {
  const input: PaletteInput = {
    accent: radix[accent],
    neutral: radix[neutral],
  }
  return {
    light: deriveLightTokens(input),
    dark: deriveDarkTokens(input),
  }
}

// ─── Color Palettes ──────────────────────────────────────────────────────────

export const colorPalettes: Record<ThemePreset, Record<ColorMode, ColorTokens>> = {
  'radix-blue':   buildPalette('blue', 'slate'),
  'radix-green':  buildPalette('green', 'gray'),
  'radix-purple': buildPalette('purple', 'slate'),
  'radix-orange': buildPalette('orange', 'gray'),
  'radix-cyan':   buildPalette('cyan', 'slate'),
  'radix-red':    buildPalette('red', 'gray'),
}

// Full 12-step accent scales for libraries that support them (e.g. Tamagui)
export const accentScales: Record<ThemePreset, { light: RadixScale; dark: RadixScale }> = {
  'radix-blue':   radix.blue,
  'radix-green':  radix.green,
  'radix-purple': radix.purple,
  'radix-orange': radix.orange,
  'radix-cyan':   radix.cyan,
  'radix-red':    radix.red,
}

// ─── Token Resolution ────────────────────────────────────────────────────────

export function resolveTokens(preset: ThemePreset, mode: ColorMode): DesignTokens {
  return {
    colors: colorPalettes[preset][mode],
    spacing,
    radius,
    typography,
  }
}
