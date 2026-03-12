import { readFile, readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import ejs from 'ejs'
import { writeProjectFile } from '@/utils/fs.js'

export interface TemplateData {
  projectName: string
  ui: string
  auth: string
  ai: string[]
  payments: string
  dx: string
  preset: string
  hasAuth: boolean
  hasPayments: boolean
  isFullDx: boolean
  hasAi: boolean
  hasMlkit: boolean
  hasExecuTorch: boolean
  hasOpenRouter: boolean
  uiKit: {
    lib: string
    VStack: string
    HStack: string
  }
}

// In dev: import.meta.url is src/utils/template.ts → go up 3 levels
// In built bundle: import.meta.url is dist/index.js → go up 2 levels
// We detect by checking which path actually contains the templates/ dir
import { accessSync } from 'node:fs'

function resolveTemplatesRoot(): string {
  const fileDir = path.dirname(new URL(import.meta.url).pathname)
  // Try progressively fewer parent levels until we find templates/
  for (let levels = 1; levels <= 4; levels++) {
    const candidate = path.resolve(fileDir, ...Array(levels).fill('..'), 'templates')
    try {
      accessSync(candidate)
      return candidate
    } catch {
      continue
    }
  }
  throw new Error('Could not locate templates/ directory')
}

const TEMPLATES_ROOT = resolveTemplatesRoot()

export async function renderTemplates(
  templateDir: string,
  projectDir: string,
  data: TemplateData,
): Promise<void> {
  const srcDir = path.join(TEMPLATES_ROOT, templateDir)
  await walkAndRender(srcDir, srcDir, projectDir, data)
}

async function walkAndRender(
  baseDir: string,
  currentDir: string,
  projectDir: string,
  data: TemplateData,
): Promise<void> {
  const entries = await readdir(currentDir, { withFileTypes: true })

  for (const entry of entries) {
    const srcPath = path.join(currentDir, entry.name)
    const relativePath = path.relative(baseDir, srcPath)

    if (entry.isDirectory()) {
      await walkAndRender(baseDir, srcPath, projectDir, data)
      continue
    }

    if (entry.name.endsWith('.ejs')) {
      const raw = await readFile(srcPath, 'utf-8')
      const rendered = ejs.render(raw, data, { filename: srcPath })
      const outPath = relativePath.replace(/\.ejs$/, '')
      await writeProjectFile(projectDir, outPath, rendered)
    } else {
      const content = await readFile(srcPath, 'utf-8')
      await writeProjectFile(projectDir, relativePath, content)
    }
  }
}
