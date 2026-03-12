import { describe, it, expect, afterEach } from 'vitest'
import { mkdtemp, rm, readFile, access } from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import type { StarterConfig, ThemePreset, Logger } from '@/types.js'
import { DEFAULT_CONFIG } from '@/config.js'
import { getActivePacks } from '@/pack-registry.js'
import { renderTemplates, type TemplateData } from '@/utils/template.js'
import { getUIKit } from '@/packs/ui/kits.js'

async function exists(p: string): Promise<boolean> {
  try {
    await access(p)
    return true
  } catch {
    return false
  }
}

function toTemplateData(projectName: string, config: StarterConfig): TemplateData {
  const hasMlkit = config.ai.includes('on-device-mlkit')
  const hasExecuTorch = config.ai.includes('on-device-executorch')
  const hasOpenRouter = config.ai.includes('online-openrouter')

  return {
    projectName,
    ui: config.ui,
    auth: config.auth,
    ai: config.ai,
    payments: config.payments,
    dx: config.dx,
    preset: config.preset,
    hasAuth: config.auth !== 'none',
    hasPayments: config.payments !== 'none',
    isFullDx: config.dx === 'full',
    uiKit: getUIKit(config.ui),
    hasAi: config.ai.length > 0,
    hasMlkit,
    hasExecuTorch,
    hasOpenRouter,
  }
}

const noopLogger: Logger = {
  info() {},
  success() {},
  warn() {},
  error() {},
  step() {},
}

async function renderFullProject(tmpDir: string, config: StarterConfig): Promise<void> {
  const packs = getActivePacks(config)
  const context = { projectName: 'test-app', projectDir: tmpDir, config, logger: noopLogger }
  for (const pack of packs) {
    await pack.generate(context)
  }
}

// Radix step-9 colors (primary) per preset — the source of truth for validation.
// These are the exact values from @tamagui/colors and are the same in light and dark.
const EXPECTED_PRIMARY: Record<ThemePreset, string> = {
  'radix-blue': '#0090ff',
  'radix-green': '#30a46c',
  'radix-purple': '#8e4ec6',
  'radix-orange': '#f76b15',
  'radix-cyan': '#00a2c7',
  'radix-red': '#e5484d',
}

// Radix step-10 colors (primaryPressed) per preset
const EXPECTED_PRIMARY_PRESSED_LIGHT: Record<ThemePreset, string> = {
  'radix-blue': '#0588f0',
  'radix-green': '#2b9a66',
  'radix-purple': '#8347b9',
  'radix-orange': '#ef5f00',
  'radix-cyan': '#0797b9',
  'radix-red': '#dc3e42',
}

const EXPECTED_PRIMARY_PRESSED_DARK: Record<ThemePreset, string> = {
  'radix-blue': '#3b9eff',
  'radix-green': '#33b074',
  'radix-purple': '#9a5cd0',
  'radix-orange': '#ff801f',
  'radix-cyan': '#23afd0',
  'radix-red': '#ec5d5e',
}

const ALL_PRESETS: ThemePreset[] = [
  'radix-blue',
  'radix-green',
  'radix-purple',
  'radix-orange',
  'radix-cyan',
  'radix-red',
]

// ─── Unit: generated tokens.ts contains correct Radix hex values ────────────

describe('preset colors — tokens.ts has correct Radix values for every preset', () => {
  let tmpDir: string

  afterEach(async () => {
    if (tmpDir) await rm(tmpDir, { recursive: true, force: true })
  })

  it('tokens.ts exports colorPalettes with all 6 presets', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-colors-'))
    await renderFullProject(tmpDir, DEFAULT_CONFIG)

    const content = await readFile(path.join(tmpDir, 'src/design-system/tokens.ts'), 'utf-8')
    for (const preset of ALL_PRESETS) {
      expect(content, `tokens.ts should reference ${preset}`).toContain(`'${preset}'`)
    }
  })

  for (const preset of ALL_PRESETS) {
    it(`tokens.ts contains the expected primary hex for ${preset}: ${EXPECTED_PRIMARY[preset]}`, async () => {
      tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-colors-'))
      await renderFullProject(tmpDir, { ...DEFAULT_CONFIG, preset })

      const content = await readFile(path.join(tmpDir, 'src/design-system/tokens.ts'), 'utf-8')
      expect(content).toContain(EXPECTED_PRIMARY[preset])
    })

    it(`tokens.ts contains light primaryPressed hex for ${preset}: ${EXPECTED_PRIMARY_PRESSED_LIGHT[preset]}`, async () => {
      tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-colors-'))
      await renderFullProject(tmpDir, { ...DEFAULT_CONFIG, preset })

      const content = await readFile(path.join(tmpDir, 'src/design-system/tokens.ts'), 'utf-8')
      expect(content).toContain(EXPECTED_PRIMARY_PRESSED_LIGHT[preset])
    })

    it(`tokens.ts contains dark primaryPressed hex for ${preset}: ${EXPECTED_PRIMARY_PRESSED_DARK[preset]}`, async () => {
      tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-colors-'))
      await renderFullProject(tmpDir, { ...DEFAULT_CONFIG, preset })

      const content = await readFile(path.join(tmpDir, 'src/design-system/tokens.ts'), 'utf-8')
      expect(content).toContain(EXPECTED_PRIMARY_PRESSED_DARK[preset])
    })
  }

  it('tokens.ts has a resolveTokens function that accepts ThemePreset and ColorMode', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-colors-'))
    await renderFullProject(tmpDir, DEFAULT_CONFIG)

    const content = await readFile(path.join(tmpDir, 'src/design-system/tokens.ts'), 'utf-8')
    expect(content).toContain('function resolveTokens')
    expect(content).toContain('ThemePreset')
    expect(content).toContain('ColorMode')
  })

  it('tokens.ts exports accentScales for Tamagui full 12-step scales', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-colors-'))
    await renderFullProject(tmpDir, DEFAULT_CONFIG)

    const content = await readFile(path.join(tmpDir, 'src/design-system/tokens.ts'), 'utf-8')
    expect(content).toContain('accentScales')
    expect(content).toContain('light')
    expect(content).toContain('dark')
  })
})

// ─── CLI preset → generated store default ───────────────────────────────────

describe('preset colors — CLI preset flows into theme store default', () => {
  let tmpDir: string

  afterEach(async () => {
    if (tmpDir) await rm(tmpDir, { recursive: true, force: true })
  })

  for (const preset of ALL_PRESETS) {
    it(`--preset ${preset} sets theme store default to '${preset}'`, async () => {
      tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-store-'))
      await renderFullProject(tmpDir, { ...DEFAULT_CONFIG, preset })

      const content = await readFile(path.join(tmpDir, 'src/store/theme.ts'), 'utf-8')
      expect(content).toContain(`preset: '${preset}'`)
    })

    it(`--preset ${preset} sets starter.config.ts to '${preset}'`, async () => {
      tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-store-'))
      await renderFullProject(tmpDir, { ...DEFAULT_CONFIG, preset })

      const content = await readFile(path.join(tmpDir, 'src/starter.config.ts'), 'utf-8')
      expect(content).toContain(`preset: '${preset}'`)
    })
  }
})

// ─── Tamagui: theme keys match ThemeProvider's expected naming ───────────────

describe('preset colors — Tamagui theme keys match ThemeProvider pattern', () => {
  let tmpDir: string

  afterEach(async () => {
    if (tmpDir) await rm(tmpDir, { recursive: true, force: true })
  })

  for (const preset of ALL_PRESETS) {
    it(`tamagui.config.ts includes '${preset}' in the presets array for theme generation`, async () => {
      tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-tam-theme-'))
      await renderFullProject(tmpDir, { ...DEFAULT_CONFIG, ui: 'tamagui', preset })

      const content = await readFile(
        path.join(tmpDir, 'src/providers/ui/tamagui/tamagui.config.ts'),
        'utf-8',
      )
      // Theme keys are built dynamically: `${preset}-${mode}`
      // Verify the preset is in the presets array and the key construction pattern exists
      expect(content, `should list ${preset} in presets array`).toContain(`'${preset}'`)
      expect(content, 'should build theme keys dynamically').toContain('`${preset}-${mode}`')
    })
  }

  it('ThemeProvider constructs themeName as `${preset}-${mode}`', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-tam-tp-'))
    await renderFullProject(tmpDir, { ...DEFAULT_CONFIG, ui: 'tamagui' })

    const content = await readFile(path.join(tmpDir, 'src/design-system/ThemeProvider.tsx'), 'utf-8')
    expect(content).toContain('`${preset}-${mode}`')
  })

  it('tamagui.config.ts imports colorPalettes and accentScales from tokens', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-tam-import-'))
    await renderFullProject(tmpDir, { ...DEFAULT_CONFIG, ui: 'tamagui' })

    const content = await readFile(
      path.join(tmpDir, 'src/providers/ui/tamagui/tamagui.config.ts'),
      'utf-8',
    )
    expect(content).toContain('colorPalettes')
    expect(content).toContain('accentScales')
    expect(content).toContain("from '@/design-system/tokens'")
  })

  it('tamagui.config.ts theme includes the 12-step accent scale keys', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-tam-scale-'))
    await renderFullProject(tmpDir, { ...DEFAULT_CONFIG, ui: 'tamagui' })

    const content = await readFile(
      path.join(tmpDir, 'src/providers/ui/tamagui/tamagui.config.ts'),
      'utf-8',
    )
    expect(content).toContain('scaleToNumbered')
  })
})

// ─── Gluestack: config references correct default palette ───────────────────

describe('preset colors — Gluestack config consumes colorPalettes', () => {
  let tmpDir: string

  afterEach(async () => {
    if (tmpDir) await rm(tmpDir, { recursive: true, force: true })
  })

  it('gluestack.config.ts imports colorPalettes from tokens', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-gs-config-'))
    await renderFullProject(tmpDir, { ...DEFAULT_CONFIG, ui: 'gluestack' })

    const content = await readFile(
      path.join(tmpDir, 'src/providers/ui/gluestack/gluestack.config.ts'),
      'utf-8',
    )
    expect(content).toContain('colorPalettes')
    expect(content).toContain("from '@/design-system/tokens'")
  })

  it('gluestack.config.ts flattens all preset palettes into tokens', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-gs-flat-'))
    await renderFullProject(tmpDir, { ...DEFAULT_CONFIG, ui: 'gluestack' })

    const content = await readFile(
      path.join(tmpDir, 'src/providers/ui/gluestack/gluestack.config.ts'),
      'utf-8',
    )
    expect(content).toContain('flattenColorTokens')
    expect(content).toContain('flattenColorTokens(colorPalettes)')
  })

  it('ThemeProvider constructs colorMode for GluestackAdapter', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-gs-tp-'))
    await renderFullProject(tmpDir, { ...DEFAULT_CONFIG, ui: 'gluestack' })

    const content = await readFile(path.join(tmpDir, 'src/design-system/ThemeProvider.tsx'), 'utf-8')
    expect(content).toContain('GluestackAdapter')
    expect(content).toContain('colorMode={mode}')
  })
})

// ─── Cross-preset consistency: both UI libs get the same semantic tokens ─────

describe('preset colors — both UI paths share the same semantic tokens', () => {
  let tmpDir: string

  afterEach(async () => {
    if (tmpDir) await rm(tmpDir, { recursive: true, force: true })
  })

  for (const preset of ALL_PRESETS) {
    it(`tokens.ts is identical for ui=tamagui and ui=gluestack when preset=${preset}`, async () => {
      const tmpTam = await mkdtemp(path.join(os.tmpdir(), 'rn-consist-tam-'))
      const tmpGs = await mkdtemp(path.join(os.tmpdir(), 'rn-consist-gs-'))

      try {
        await renderFullProject(tmpTam, { ...DEFAULT_CONFIG, ui: 'tamagui', preset })
        await renderFullProject(tmpGs, { ...DEFAULT_CONFIG, ui: 'gluestack', preset })

        const tamTokens = await readFile(path.join(tmpTam, 'src/design-system/tokens.ts'), 'utf-8')
        const gsTokens = await readFile(path.join(tmpGs, 'src/design-system/tokens.ts'), 'utf-8')

        expect(tamTokens).toBe(gsTokens)
      } finally {
        await rm(tmpTam, { recursive: true, force: true })
        await rm(tmpGs, { recursive: true, force: true })
      }
    })
  }
})

// ─── Semantic roles: each preset derives correct semantic color roles ────────

describe('preset colors — semantic color roles in generated tokens', () => {
  let tmpDir: string

  afterEach(async () => {
    if (tmpDir) await rm(tmpDir, { recursive: true, force: true })
  })

  it('tokens.ts defines all required ColorTokens interface fields', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-roles-'))
    await renderFullProject(tmpDir, DEFAULT_CONFIG)

    const content = await readFile(path.join(tmpDir, 'src/design-system/tokens.ts'), 'utf-8')
    const requiredFields = [
      'background',
      'backgroundSubtle',
      'surface',
      'surfaceRaised',
      'text',
      'textSubtle',
      'textOnPrimary',
      'border',
      'borderSubtle',
      'primary',
      'primaryPressed',
      'success',
      'warning',
      'critical',
      'info',
      'successSubtle',
      'warningSubtle',
      'criticalSubtle',
      'infoSubtle',
    ]
    for (const field of requiredFields) {
      expect(content, `should define ${field}`).toContain(`${field}:`)
    }
  })

  it('status colors (success/warning/critical/info) always use green/orange/red/blue Radix scales', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-status-'))
    await renderFullProject(tmpDir, DEFAULT_CONFIG)

    const content = await readFile(path.join(tmpDir, 'src/design-system/tokens.ts'), 'utf-8')
    // These are Radix step-9 values for the status hues
    expect(content).toContain('#30a46c') // green9 = success
    expect(content).toContain('#f76b15') // orange9 = warning
    expect(content).toContain('#e5484d') // red9 = critical
    expect(content).toContain('#0090ff') // blue9 = info
  })
})

// ─── Tamagui: each preset has full 12-step accent scale in generated config ──

describe('preset colors — Tamagui config includes numbered accent scale', () => {
  let tmpDir: string

  afterEach(async () => {
    if (tmpDir) await rm(tmpDir, { recursive: true, force: true })
  })

  it('tamagui.config.ts references all 6 presets in theme generation loop', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-tam-all-'))
    await renderFullProject(tmpDir, { ...DEFAULT_CONFIG, ui: 'tamagui' })

    const content = await readFile(
      path.join(tmpDir, 'src/providers/ui/tamagui/tamagui.config.ts'),
      'utf-8',
    )
    for (const preset of ALL_PRESETS) {
      expect(content, `config should reference ${preset}`).toContain(`'${preset}'`)
    }
  })

  it('tamagui.config.ts uses buildTamaguiTheme to merge semantic + numbered scale', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-tam-build-'))
    await renderFullProject(tmpDir, { ...DEFAULT_CONFIG, ui: 'tamagui' })

    const content = await readFile(
      path.join(tmpDir, 'src/providers/ui/tamagui/tamagui.config.ts'),
      'utf-8',
    )
    expect(content).toContain('buildTamaguiTheme')
    expect(content).toContain('colorPalettes[preset][mode]')
    expect(content).toContain('accentScales[preset][mode]')
  })
})

// ─── End-to-end: for each preset × UI, the full pipeline produces valid output

describe('preset colors — e2e: every preset × UI combination renders valid output', () => {
  let tmpDir: string

  afterEach(async () => {
    if (tmpDir) await rm(tmpDir, { recursive: true, force: true })
  })

  for (const ui of ['tamagui', 'gluestack'] as const) {
    for (const preset of ALL_PRESETS) {
      it(`ui=${ui} preset=${preset}: starter config, store, and tokens are consistent`, async () => {
        tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-e2e-'))
        await renderFullProject(tmpDir, { ...DEFAULT_CONFIG, ui, preset })

        // 1. starter.config.ts has the correct preset
        const starterConfig = await readFile(
          path.join(tmpDir, 'src/starter.config.ts'),
          'utf-8',
        )
        expect(starterConfig).toContain(`preset: '${preset}'`)

        // 2. theme store defaults to the correct preset
        const themeStore = await readFile(path.join(tmpDir, 'src/store/theme.ts'), 'utf-8')
        expect(themeStore).toContain(`preset: '${preset}'`)

        // 3. tokens.ts contains the correct Radix primary hex for this preset
        const tokens = await readFile(
          path.join(tmpDir, 'src/design-system/tokens.ts'),
          'utf-8',
        )
        expect(tokens).toContain(EXPECTED_PRIMARY[preset])

        // 4. ThemeProvider resolves tokens via resolveTokens(preset, mode)
        const themeProvider = await readFile(
          path.join(tmpDir, 'src/design-system/ThemeProvider.tsx'),
          'utf-8',
        )
        expect(themeProvider).toContain('resolveTokens(preset, mode)')

        // 5. UI-specific config references the tokens
        if (ui === 'tamagui') {
          const tamConfig = await readFile(
            path.join(tmpDir, 'src/providers/ui/tamagui/tamagui.config.ts'),
            'utf-8',
          )
          expect(tamConfig).toContain('colorPalettes')
          expect(tamConfig).toContain('accentScales')
        } else {
          const gsConfig = await readFile(
            path.join(tmpDir, 'src/providers/ui/gluestack/gluestack.config.ts'),
            'utf-8',
          )
          expect(gsConfig).toContain('colorPalettes')
        }
      })
    }
  }
})
