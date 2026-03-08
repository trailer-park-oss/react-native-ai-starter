import type { FeaturePack } from '@/packs/pack.interface.js'
import type { PackContext } from '@/types.js'

export const uiPack: FeaturePack = {
  id: 'ui',
  // TODO: Phase 2 — populate based on ctx.config.ui (tamagui or gluestack)
  dependencies: {},
  devDependencies: {},
  ownedPaths: [
    'src/design-system/',
    'src/providers/ui/tamagui/',
    'src/providers/ui/gluestack/',
  ],
  async generate(ctx: PackContext) {
    ctx.logger.info('UI pack: stub (Phase 2 — design system & tokens)')
  },
  async postApplyValidation() {
    return { passed: true, checks: [] }
  },
}
