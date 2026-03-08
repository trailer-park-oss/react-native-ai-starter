import type { ReactNode } from 'react'
import {
  useObjectDetectionModels,
  useObjectDetectionProvider,
} from '@infinitered/react-native-mlkit-object-detection'

export function MLKitProvider({ children }: { children: ReactNode }) {
  const models = useObjectDetectionModels({
    assets: {},
    loadDefaultModel: true,
    defaultModelOptions: {
      shouldEnableMultipleObjects: true,
      shouldEnableClassification: true,
      detectorMode: 'singleImage',
    },
  })

  const { ObjectDetectionModelProvider } = useObjectDetectionProvider(models)

  return <ObjectDetectionModelProvider>{children}</ObjectDetectionModelProvider>
}
