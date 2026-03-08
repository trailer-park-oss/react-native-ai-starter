import { useState } from 'react'
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { useTokens } from '@/design-system'
import { MLKitProvider, useVision } from '@/providers/ai'

function VisionContent() {
  const { colors, typography, spacing, radius } = useTokens()
  const { results, isProcessing, error, isReady, analyzeImage, clearResults } = useVision()
  const [imageUri, setImageUri] = useState<string | null>(null)

  const pickImage = async (useCamera: boolean) => {
    const launch = useCamera
      ? ImagePicker.launchCameraAsync
      : ImagePicker.launchImageLibraryAsync

    const result = await launch({
      mediaTypes: ['images'],
      quality: 0.8,
    })

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri
      setImageUri(uri)
      clearResults()
      await analyzeImage(uri)
    }
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: spacing.md }}
    >
      {!imageUri ? (
        <View style={styles.emptyState}>
          <Text
            style={{
              fontSize: typography.headingLarge.fontSize,
              fontWeight: typography.headingLarge.fontWeight,
              color: colors.text,
              marginBottom: spacing.sm,
            }}
          >
            On-Device Vision
          </Text>
          <Text
            style={{
              fontSize: typography.body.fontSize,
              color: colors.textSubtle,
              textAlign: 'center',
              lineHeight: typography.bodyLarge.lineHeight,
            }}
          >
            Powered by ML Kit. Pick an image to detect objects.
          </Text>
          {!isReady && (
            <View
              style={{
                marginTop: spacing.md,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={{ color: colors.textSubtle, fontSize: typography.caption.fontSize }}>
                Loading ML model...
              </Text>
            </View>
          )}
        </View>
      ) : (
        <View
          style={{
            borderRadius: radius.lg,
            overflow: 'hidden',
            marginBottom: spacing.md,
          }}
        >
          <Image
            source={{ uri: imageUri }}
            style={{
              width: '100%',
              aspectRatio: 1,
              backgroundColor: colors.surfaceRaised,
            }}
            resizeMode="cover"
          />
        </View>
      )}

      {isProcessing && (
        <View style={[styles.statusBanner, { backgroundColor: colors.infoSubtle }]}>
          <ActivityIndicator size="small" color={colors.info} />
          <Text style={{ color: colors.info, marginLeft: 8, fontSize: typography.body.fontSize }}>
            Analyzing image...
          </Text>
        </View>
      )}

      {error && (
        <View style={[styles.statusBanner, { backgroundColor: colors.criticalSubtle }]}>
          <Text style={{ color: colors.critical, fontSize: typography.body.fontSize }}>
            {error}
          </Text>
        </View>
      )}

      {results.length > 0 && (
        <View style={{ marginBottom: spacing.md }}>
          <Text
            style={{
              fontSize: typography.bodyLarge.fontSize,
              fontWeight: '600',
              color: colors.text,
              marginBottom: spacing.sm,
            }}
          >
            Detected Objects ({results.length})
          </Text>
          {results.map((item, i) => (
            <View
              key={i}
              style={[
                styles.resultCard,
                { backgroundColor: colors.surfaceRaised, borderRadius: radius.md },
              ]}
            >
              <Text
                style={{
                  color: colors.text,
                  fontWeight: '600',
                  fontSize: typography.body.fontSize,
                }}
              >
                {item.label}
              </Text>
              <View style={styles.confidenceRow}>
                <View
                  style={[
                    styles.confidenceTrack,
                    { backgroundColor: colors.borderSubtle, borderRadius: radius.sm },
                  ]}
                >
                  <View
                    style={{
                      width: `${Math.round(item.confidence * 100)}%`,
                      height: '100%',
                      backgroundColor: colors.primary,
                      borderRadius: radius.sm,
                    }}
                  />
                </View>
                <Text style={{ color: colors.textSubtle, fontSize: typography.caption.fontSize }}>
                  {Math.round(item.confidence * 100)}%
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <TouchableOpacity
          onPress={() => pickImage(false)}
          disabled={isProcessing}
          style={[
            styles.actionButton,
            { backgroundColor: colors.primary, borderRadius: radius.md },
          ]}
        >
          <Text style={[styles.actionButtonText, { fontSize: typography.body.fontSize }]}>
            Gallery
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => pickImage(true)}
          disabled={isProcessing}
          style={[
            styles.actionButton,
            { backgroundColor: colors.primary, borderRadius: radius.md },
          ]}
        >
          <Text style={[styles.actionButtonText, { fontSize: typography.body.fontSize }]}>
            Camera
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

export default function AiVisionScreen() {
  return (
    <MLKitProvider>
      <VisionContent />
    </MLKitProvider>
  )
}

const styles = StyleSheet.create({
  emptyState: {
    paddingVertical: 80,
    alignItems: 'center',
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  resultCard: {
    padding: 12,
    marginBottom: 8,
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 8,
  },
  confidenceTrack: {
    flex: 1,
    height: 6,
    overflow: 'hidden',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
})
