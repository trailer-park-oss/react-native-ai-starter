import { withDangerousMod } from '@expo/config-plugins'
import fs from 'fs'
import path from 'path'

export function withIosDeploymentTarget(config: any): any {
  return withDangerousMod(config, [
    'ios',
    async (modConfig) => {
      const projectRoot = modConfig.modRequest.projectRoot
      const projectName = getProjectNameFromPackageJson(projectRoot)

      if (!projectName) {
        return modConfig
      }

      const podfilePath = path.join(projectRoot, 'ios', 'Podfile')
      const projectPath = path.join(projectRoot, 'ios', `${projectName}.xcodeproj`, 'project.pbxproj')
      const expoHeadPodspecPath = path.join(
        projectRoot,
        'node_modules',
        'expo-router',
        'ios',
        'ExpoHead.podspec',
      )
      const expoPodspecPath = path.join(projectRoot, 'node_modules', 'expo', 'Expo.podspec')
      const appDelegatePath = path.join(projectRoot, 'ios', projectName, 'AppDelegate.swift')

      // Only fix if ExecuTorch is installed
      const packageJsonPath = path.join(projectRoot, 'package.json')
      if (!fs.existsSync(packageJsonPath)) {
        return modConfig
      }

      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
      const hasExecuTorch = Object.keys(packageJson.dependencies || {}).includes('react-native-executorch')
      const needsReactNative076Compatibility = requiresReactNative076Compatibility(packageJson)

      if (!hasExecuTorch) {
        return modConfig
      }

      // Fix Podfile
      if (fs.existsSync(podfilePath)) {
        const podfileContent = fs.readFileSync(podfilePath, 'utf-8')
        const fixedPodfileContent = podfileContent.replace(
          /platform :ios, podfile_properties\['ios\.deploymentTarget'\] \|\| '15\.1'/,
          "platform :ios, podfile_properties['ios.deploymentTarget'] || '17.0'",
        )

        if (podfileContent !== fixedPodfileContent) {
          fs.writeFileSync(podfilePath, fixedPodfileContent, 'utf-8')
          console.log('✅ Fixed iOS deployment target to 17.0 in Podfile')
        }
      }

      // Fix Xcode project
      if (fs.existsSync(projectPath)) {
        const projectContent = fs.readFileSync(projectPath, 'utf-8')
        const fixedProjectContent = projectContent.replace(
          /IPHONEOS_DEPLOYMENT_TARGET = 15\.1;/g,
          'IPHONEOS_DEPLOYMENT_TARGET = 17.0;',
        )

        if (projectContent !== fixedProjectContent) {
          fs.writeFileSync(projectPath, fixedProjectContent, 'utf-8')
          console.log('✅ Fixed iOS deployment target to 17.0 in Xcode project')
        }
      }

      if (needsReactNative076Compatibility && fs.existsSync(expoHeadPodspecPath)) {
        const expoHeadPodspecContent = fs.readFileSync(expoHeadPodspecPath, 'utf-8')
        const fixedExpoHeadPodspecContent = patchExpoHeadPodspec(expoHeadPodspecContent)

        if (expoHeadPodspecContent !== fixedExpoHeadPodspecContent) {
          fs.writeFileSync(expoHeadPodspecPath, fixedExpoHeadPodspecContent, 'utf-8')
          console.log('✅ Patched ExpoHead podspec for React Native 0.76 compatibility')
        }
      }

      if (needsReactNative076Compatibility && fs.existsSync(expoPodspecPath)) {
        const expoPodspecContent = fs.readFileSync(expoPodspecPath, 'utf-8')
        const fixedExpoPodspecContent = patchExpoPodspec(expoPodspecContent)

        if (expoPodspecContent !== fixedExpoPodspecContent) {
          fs.writeFileSync(expoPodspecPath, fixedExpoPodspecContent, 'utf-8')
          console.log('✅ Patched Expo podspec for React Native 0.76 compatibility')
        }
      }

      if (needsReactNative076Compatibility && fs.existsSync(appDelegatePath)) {
        const appDelegateContent = fs.readFileSync(appDelegatePath, 'utf-8')
        const fixedAppDelegateContent = patchAppDelegate(appDelegateContent)

        if (appDelegateContent !== fixedAppDelegateContent) {
          fs.writeFileSync(appDelegatePath, fixedAppDelegateContent, 'utf-8')
          console.log('✅ Patched AppDelegate for React Native 0.76 compatibility')
        }
      }

      return modConfig
    },
  ])
}

function getProjectNameFromPackageJson(projectRoot: string): string | null {
  const packageJsonPath = path.join(projectRoot, 'package.json')
  if (!fs.existsSync(packageJsonPath)) {
    return null
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
  return packageJson.name || null
}

function requiresReactNative076Compatibility(packageJson: { dependencies?: Record<string, string> }): boolean {
  const reactNativeVersion = packageJson.dependencies?.['react-native']
  return typeof reactNativeVersion === 'string' && reactNativeVersion.startsWith('0.76.')
}

function patchExpoHeadPodspec(content: string): string {
  let patchedContent = content

  if (!patchedContent.includes("s.pod_target_xcconfig = {}")) {
    patchedContent = patchedContent.replace(
      "  s.dependency 'ExpoModulesCore'\n\n",
      "  s.dependency 'ExpoModulesCore'\n\n  s.pod_target_xcconfig = {}\n\n",
    )
  }

  patchedContent = patchedContent.replace(
    /s\.pod_target_xcconfig = \{\n([\s\S]*?)\n  \}/,
    "s.pod_target_xcconfig = (s.to_hash['pod_target_xcconfig'] || {}).merge({\n$1\n  })",
  )

  return patchedContent
}

function patchExpoPodspec(content: string): string {
  return content.replace(/\n\s*s\.dependency 'ReactAppDependencyProvider'\n/, '\n')
}

function patchAppDelegate(content: string): string {
  return content
    .replace(/\nimport ReactAppDependencyProvider\n/, '\n')
    .replace(/\n\s*delegate\.dependencyProvider = RCTAppDependencyProvider\(\)\n/, '\n')
}
