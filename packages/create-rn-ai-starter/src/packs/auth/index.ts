import type { FeaturePack } from '@/packs/pack.interface.js'
import type { PackContext } from '@/types.js'

export const authPack: FeaturePack = {
  id: 'auth',
  // TODO: Phase 3 — populate Clerk deps when auth === 'clerk'
  dependencies: {},
  devDependencies: {},
  ownedPaths: [
    'src/providers/auth/clerk/',
    'app/(auth)/',
  ],
  async generate(ctx: PackContext) {
    ctx.logger.info('Auth pack: stub (Phase 3 — auth provider & screens)')
  },
  async postApplyValidation() {
    return { passed: true, checks: [] }
  },
}
