import type { FeaturePack } from '@/packs/pack.interface.js'
import type { PackContext } from '@/types.js'
import { writeProjectFile } from '@/utils/fs.js'

const CLERK_STUB = `// TODO: Prompt 3 — replace with real Clerk integration
export function useAuth() {
  return { isAuthenticated: false, isLoading: false }
}
`

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
    ctx.logger.info('Auth pack: generating placeholder (Phase 3 — auth provider & screens)')
    await writeProjectFile(ctx.projectDir, 'src/providers/auth/clerk/index.ts', CLERK_STUB)
  },
  async postApplyValidation() {
    return { passed: true, checks: [] }
  },
}
