import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { zustandStorage } from '@/lib/storage'

interface OnboardingState {
  hasCompletedOnboarding: boolean
  complete: () => void
  reset: () => void
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      hasCompletedOnboarding: false,
      complete: () => set({ hasCompletedOnboarding: true }),
      reset: () => set({ hasCompletedOnboarding: false }),
    }),
    {
      name: 'onboarding-storage',
      storage: zustandStorage,
    }
  )
)
