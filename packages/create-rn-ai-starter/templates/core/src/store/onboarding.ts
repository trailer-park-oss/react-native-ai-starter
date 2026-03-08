import { create } from 'zustand'

interface OnboardingState {
  hasCompletedOnboarding: boolean
  complete: () => void
  reset: () => void
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  hasCompletedOnboarding: false,
  complete: () => set({ hasCompletedOnboarding: true }),
  reset: () => set({ hasCompletedOnboarding: false }),
}))
