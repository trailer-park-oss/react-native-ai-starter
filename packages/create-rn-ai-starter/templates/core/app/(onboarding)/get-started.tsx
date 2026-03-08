import { View, Text, StyleSheet, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { useOnboardingStore } from '@/store/onboarding'

export default function GetStartedScreen() {
  const router = useRouter()
  const { complete } = useOnboardingStore()

  const handleComplete = () => {
    complete()
    router.replace('/(app)')
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ready!</Text>
      <Text style={styles.subtitle}>You're all set. Let's dive in.</Text>
      <Pressable style={styles.button} onPress={handleComplete}>
        <Text style={styles.buttonText}>Let's Go</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 32, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 32 },
  button: {
    backgroundColor: '#000',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
})
