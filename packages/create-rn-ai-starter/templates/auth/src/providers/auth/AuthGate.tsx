import type { PropsWithChildren } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { Redirect } from 'expo-router'
import { useAuth } from '@/providers/auth/useAuth'

export function AuthGate({ children }: PropsWithChildren) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/sign-in" />
  }

  return <>{children}</>
}
