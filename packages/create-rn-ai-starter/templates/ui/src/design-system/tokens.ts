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

export type ThemePreset = 'neutral-green' | 'fluent-blue'
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

// ─── Color Palettes ──────────────────────────────────────────────────────────

const neutralGreenLight: ColorTokens = {
  background: '#FFFFFF',
  backgroundSubtle: '#F5F5F5',
  surface: '#FFFFFF',
  surfaceRaised: '#FFFFFF',
  text: '#171717',
  textSubtle: '#6B6B6B',
  textOnPrimary: '#FFFFFF',
  border: '#E5E5E5',
  borderSubtle: '#F0F0F0',
  primary: '#22C55E',
  primaryPressed: '#16A34A',
  success: '#22C55E',
  warning: '#F59E0B',
  critical: '#EF4444',
  info: '#3B82F6',
  successSubtle: '#DCFCE7',
  warningSubtle: '#FEF3C7',
  criticalSubtle: '#FEE2E2',
  infoSubtle: '#DBEAFE',
}

const neutralGreenDark: ColorTokens = {
  background: '#0A0A0A',
  backgroundSubtle: '#171717',
  surface: '#1C1C1C',
  surfaceRaised: '#262626',
  text: '#FAFAFA',
  textSubtle: '#A3A3A3',
  textOnPrimary: '#FFFFFF',
  border: '#333333',
  borderSubtle: '#262626',
  primary: '#4ADE80',
  primaryPressed: '#22C55E',
  success: '#4ADE80',
  warning: '#FBBF24',
  critical: '#F87171',
  info: '#60A5FA',
  successSubtle: '#052E16',
  warningSubtle: '#451A03',
  criticalSubtle: '#450A0A',
  infoSubtle: '#172554',
}

const fluentBlueLight: ColorTokens = {
  background: '#FFFFFF',
  backgroundSubtle: '#F3F2F1',
  surface: '#FFFFFF',
  surfaceRaised: '#FFFFFF',
  text: '#201F1E',
  textSubtle: '#605E5C',
  textOnPrimary: '#FFFFFF',
  border: '#EDEBE9',
  borderSubtle: '#F3F2F1',
  primary: '#0078D4',
  primaryPressed: '#106EBE',
  success: '#107C10',
  warning: '#FFB900',
  critical: '#D13438',
  info: '#0078D4',
  successSubtle: '#DFF6DD',
  warningSubtle: '#FFF4CE',
  criticalSubtle: '#FDE7E9',
  infoSubtle: '#CFE4FA',
}

const fluentBlueDark: ColorTokens = {
  background: '#1B1A19',
  backgroundSubtle: '#252423',
  surface: '#292827',
  surfaceRaised: '#323130',
  text: '#FAF9F8',
  textSubtle: '#A19F9D',
  textOnPrimary: '#FFFFFF',
  border: '#484644',
  borderSubtle: '#3B3A39',
  primary: '#2B88D8',
  primaryPressed: '#106EBE',
  success: '#6BB700',
  warning: '#FFC83D',
  critical: '#F1707B',
  info: '#2B88D8',
  successSubtle: '#0B2A0B',
  warningSubtle: '#3D2C00',
  criticalSubtle: '#3D0A0F',
  infoSubtle: '#0A2A4A',
}

export const colorPalettes: Record<ThemePreset, Record<ColorMode, ColorTokens>> = {
  'neutral-green': { light: neutralGreenLight, dark: neutralGreenDark },
  'fluent-blue': { light: fluentBlueLight, dark: fluentBlueDark },
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
