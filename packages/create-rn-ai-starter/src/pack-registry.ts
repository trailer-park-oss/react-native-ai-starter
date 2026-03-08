import type { FeaturePack } from '@/packs/pack.interface.js'
import type { StarterConfig } from '@/types.js'
import { corePack } from '@/packs/core/index.js'
import { uiPack } from '@/packs/ui/index.js'
import { authPack } from '@/packs/auth/index.js'
import { paymentsPack } from '@/packs/payments/index.js'
import { dxPack } from '@/packs/dx/index.js'

const ALL_PACKS: FeaturePack[] = [corePack, uiPack, authPack, paymentsPack, dxPack]

export function getActivePacks(config: StarterConfig): FeaturePack[] {
  return ALL_PACKS.filter((pack) => isPackEnabled(pack.id, config))
}

function isPackEnabled(id: string, config: StarterConfig): boolean {
  switch (id) {
    case 'core':
      return true
    case 'ui':
      return true
    case 'auth':
      return config.auth !== 'none'
    case 'payments':
      return config.payments !== 'none'
    case 'dx':
      return true
    default:
      return false
  }
}
