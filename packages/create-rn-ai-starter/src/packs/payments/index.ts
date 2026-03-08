import type { FeaturePack } from '@/packs/pack.interface.js'
import type { PackContext } from '@/types.js'
import { writeProjectFile } from '@/utils/fs.js'

const STRIPE_STUB = `// TODO: Prompt 4 — replace with real Stripe integration
export function usePayments() {
  return { isReady: false }
}
`

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
    ctx.logger.info('Payments pack: generating placeholder (Phase 4 — payments provider & screens)')
    await writeProjectFile(ctx.projectDir, 'src/providers/payments/stripe/index.ts', STRIPE_STUB)
  },
  async postApplyValidation() {
    return { passed: true, checks: [] }
  },
}
