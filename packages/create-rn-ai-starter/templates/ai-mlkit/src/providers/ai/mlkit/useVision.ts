import { useState, useCallback } from 'react'
import { useObjectDetection } from '@infinitered/react-native-mlkit-object-detection'
import type { VisionResult } from '../ai.interface'

export function useVision() {
  const detector = useObjectDetection('default')
  const [results, setResults] = useState<VisionResult[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const analyzeImage = useCallback(
    async (imageUri: string) => {
      if (!detector || !detector.isLoaded()) {
        setError('Object detection model is not loaded yet')
        return
      }

      setIsProcessing(true)
      setError(null)

      try {
        const detections = await detector.detectObjects(imageUri)
        const mapped: VisionResult[] = detections.map((obj) => ({
          type: 'object' as const,
          label: obj.labels[0]?.text ?? 'Unknown',
          confidence: obj.labels[0]?.confidence ?? 0,
          bounds: {
            x: obj.frame.origin.x,
            y: obj.frame.origin.y,
            width: obj.frame.size.x,
            height: obj.frame.size.y,
          },
        }))
        setResults(mapped)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Object detection failed')
      } finally {
        setIsProcessing(false)
      }
    },
    [detector],
  )

  const clearResults = useCallback(() => {
    setResults([])
    setError(null)
  }, [])

  return {
    results,
    isProcessing,
    error,
    isReady: detector?.isLoaded() ?? false,
    analyzeImage,
    clearResults,
  }
}
