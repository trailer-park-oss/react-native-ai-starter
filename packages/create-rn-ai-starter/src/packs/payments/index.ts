import type { FeaturePack } from '@/packs/pack.interface.js'
import type { PackContext } from '@/types.js'

export const paymentsPack: FeaturePack = {
  id: 'payments',
  // TODO: Phase 4 — populate Stripe deps when payments === 'stripe'
  dependencies: {},
  devDependencies: {},
  ownedPaths: [
    'src/providers/payments/stripe/',
    'src/features/payments/',
    'app/(app)/paywall.tsx',
  ],
  async generate(ctx: PackContext) {
    ctx.logger.info('Payments pack: stub (Phase 4 — payments provider & screens)')
  },
  async postApplyValidation() {
    return { passed: true, checks: [] }
  },
}
