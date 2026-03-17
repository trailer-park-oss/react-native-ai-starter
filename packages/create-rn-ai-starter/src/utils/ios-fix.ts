import fs from 'node:fs'
import path from 'node:path'

export async function fixIosDeploymentTarget(projectDir: string): Promise<boolean> {
  const podfilePath = path.join(projectDir, 'ios', 'Podfile')
  const projectPath = path.join(projectDir, 'ios', `${path.basename(projectDir)}.xcodeproj`, 'project.pbxproj')

  let fixedPodfile = false
  let fixedProject = false

  // Fix Podfile
  if (fs.existsSync(podfilePath)) {
    const podfileContent = fs.readFileSync(podfilePath, 'utf-8')
    const fixedPodfileContent = podfileContent.replace(
      /platform :ios, podfile_properties\['ios\.deploymentTarget'\] \|\| '15\.1'/,
      "platform :ios, podfile_properties['ios.deploymentTarget'] || '17.0'",
    )

    if (podfileContent !== fixedPodfileContent) {
      fs.writeFileSync(podfilePath, fixedPodfileContent, 'utf-8')
      fixedPodfile = true
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
      fixedProject = true
    }
  }

  return fixedPodfile || fixedProject
}
