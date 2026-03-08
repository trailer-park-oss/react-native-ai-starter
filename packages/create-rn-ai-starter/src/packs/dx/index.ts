import type { FeaturePack } from '@/packs/pack.interface.js'
import type { PackContext } from '@/types.js'

export const dxPack: FeaturePack = {
  id: 'dx',
  // TODO: Phase 5 — populate based on ctx.config.dx (basic or full)
  dependencies: {},
  devDependencies: {},
  ownedPaths: [
    'eslint.config.mjs',
    '.prettierrc',
    'jest.config.ts',
    '.github/',
    '.husky/',
  ],
  async generate(ctx: PackContext) {
    ctx.logger.info(`DX pack: stub (Phase 5 — ${ctx.config.dx} profile)`)
  },
  async postApplyValidation() {
    return { passed: true, checks: [] }
  },
}
