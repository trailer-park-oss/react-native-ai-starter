import type { PackContext } from '@/types.js'

export interface FeaturePack {
  id: string
  dependencies: Record<string, string>
  devDependencies: Record<string, string>
  expoInstallPackages?: string[]
  ownedPaths: string[]
  generate(context: PackContext): Promise<void>
  postApplyValidation(context: PackContext): Promise<ValidationResult>
}

export interface ValidationResult {
  passed: boolean
  checks: ValidationCheck[]
}

export interface ValidationCheck {
  name: string
  passed: boolean
  message?: string
}
