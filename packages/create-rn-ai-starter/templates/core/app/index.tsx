import { Redirect } from 'expo-router'
import { useOnboardingStore } from '@/store/onboarding'

export default function EntryScreen() {
  const { hasCompletedOnboarding } = useOnboardingStore()

  return (
    <Redirect href={hasCompletedOnboarding ? '/(app)' : '/(onboarding)/welcome'} />
  )
}
