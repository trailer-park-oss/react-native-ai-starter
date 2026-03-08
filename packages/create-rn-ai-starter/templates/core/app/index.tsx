import { Redirect } from 'expo-router'
import { useOnboardingStore } from '@/store/onboarding'

export default function EntryScreen() {
  const { hasCompletedOnboarding } = useOnboardingStore()

  if (!hasCompletedOnboarding) {
    return <Redirect href="/(onboarding)/welcome" />
  }

  return <Redirect href="/(app)" />
}
