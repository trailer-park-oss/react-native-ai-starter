export type UiProvider = 'tamagui' | 'gluestack'
export type AuthProvider = 'clerk' | 'none'
export type AiProvider = 'on-device-mlkit' | 'on-device-executorch' | 'online-openrouter'
export type PaymentsProvider = 'stripe' | 'none'
export type DxProfile = 'basic' | 'full'
export type ThemePreset =
  | 'radix-blue'
  | 'radix-green'
  | 'radix-purple'
  | 'radix-orange'
  | 'radix-cyan'
  | 'radix-red'

export interface StarterConfig {
  ui: UiProvider
  auth: AuthProvider
  ai: AiConfig
  payments: PaymentsProvider
  dx: DxProfile
  preset: ThemePreset
}

export interface AiConfig {
  providers: AiProvider[]
  openrouter?: { model: string }
  executorch?: { model: string }
}

export interface PackContext {
  projectName: string
  projectDir: string
  config: StarterConfig
  logger: Logger
}

export interface Logger {
  info(msg: string): void
  success(msg: string): void
  warn(msg: string): void
  error(msg: string): void
  step(current: number, total: number, msg: string): void
}
