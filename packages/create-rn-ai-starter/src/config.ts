import type {
  StarterConfig,
  UiProvider,
  AuthProvider,
  PaymentsProvider,
  DxProfile,
  ThemePreset,
} from '@/types.js'

export const ALLOWED_VALUES = {
  ui: ['tamagui', 'gluestack'] as readonly UiProvider[],
  auth: ['clerk', 'none'] as readonly AuthProvider[],
  payments: ['stripe', 'none'] as readonly PaymentsProvider[],
  dx: ['basic', 'full'] as readonly DxProfile[],
  preset: ['radix-blue', 'radix-green', 'radix-purple', 'radix-orange', 'radix-cyan', 'radix-red'] as readonly ThemePreset[],
} as const

export const DEFAULT_CONFIG: StarterConfig = {
  ui: 'tamagui',
  auth: 'none',
  payments: 'none',
  dx: 'basic',
  preset: 'radix-blue',
}
