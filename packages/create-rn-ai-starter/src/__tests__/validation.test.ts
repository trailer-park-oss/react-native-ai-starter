import { describe, it, expect, afterEach } from 'vitest'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import { validateConfig, resolveProjectPath } from '@/utils/validation.js'
import type { StarterConfig } from '@/types.js'
import { DEFAULT_CONFIG } from '@/config.js'

describe('validateConfig', () => {
  it('accepts valid default config', () => {
    expect(() => validateConfig(DEFAULT_CONFIG)).not.toThrow()
  })

  it('accepts all valid combinations', () => {
    const config: StarterConfig = {
      ui: 'gluestack',
      auth: 'clerk',
      ai: { providers: ['online-openrouter'], openrouter: { model: 'openai/gpt-4o-mini' } },
      payments: 'stripe',
      dx: 'full',
      preset: 'radix-blue',
    }
    expect(() => validateConfig(config)).not.toThrow()
  })

  it('rejects invalid ui value', () => {
    const config = { ...DEFAULT_CONFIG, ui: 'invalid' as StarterConfig['ui'] }
    expect(() => validateConfig(config)).toThrow('Invalid value "invalid" for --ui')
  })

  it('rejects invalid auth value', () => {
    const config = { ...DEFAULT_CONFIG, auth: 'firebase' as StarterConfig['auth'] }
    expect(() => validateConfig(config)).toThrow('Invalid value "firebase" for --auth')
  })

  it('accepts empty ai selection', () => {
    const config = { ...DEFAULT_CONFIG, ai: { providers: [] } }
    expect(() => validateConfig(config)).not.toThrow()
  })

  it('accepts multiple ai providers', () => {
    const config = {
      ...DEFAULT_CONFIG,
      ai: {
        providers: ['on-device-mlkit', 'online-openrouter'],
        openrouter: { model: 'openai/gpt-4o-mini' },
      },
    }
    expect(() => validateConfig(config)).not.toThrow()
  })

  it('rejects selecting mlkit and executorch together', () => {
    const config: StarterConfig = {
      ...DEFAULT_CONFIG,
      ai: {
        providers: ['on-device-mlkit', 'on-device-executorch'],
        executorch: { model: 'LLAMA3_2_1B' },
      },
    }
    expect(() => validateConfig(config)).toThrow(
      'Cannot combine on-device-mlkit and on-device-executorch in the same scaffold.',
    )
  })

  it('rejects invalid ai values inside array', () => {
    const config: StarterConfig = {
      ...DEFAULT_CONFIG,
      ai: { providers: ['local-llama' as StarterConfig['ai']['providers'][number]] },
    }
    expect(() => validateConfig(config)).toThrow('Invalid value "local-llama" for --ai')
  })

  it('accepts ai config with providers and models', () => {
    const config: StarterConfig = {
      ...DEFAULT_CONFIG,
      ai: {
        providers: ['online-openrouter', 'on-device-executorch'],
        openrouter: { model: 'openai/gpt-4o-mini' },
        executorch: { model: 'LLAMA3_2_1B' },
      },
    }
    expect(() => validateConfig(config)).not.toThrow()
  })

  it('rejects ai config when provider is selected but model missing', () => {
    const config: StarterConfig = {
      ...DEFAULT_CONFIG,
      ai: { providers: ['online-openrouter'] },
    }
    expect(() => validateConfig(config)).toThrow('Missing model for provider: online-openrouter')
  })

  it('rejects invalid ai provider values', () => {
    const config: StarterConfig = {
      ...DEFAULT_CONFIG,
      ai: { providers: ['local-llama' as StarterConfig['ai']['providers'][number]] },
    }
    expect(() => validateConfig(config)).toThrow('Invalid value "local-llama" for --ai')
  })

  it('accepts executorch modelPath when provided', () => {
    const config: StarterConfig = {
      ...DEFAULT_CONFIG,
      ai: {
        providers: ['on-device-executorch'],
        executorch: { model: 'LLAMA3_2_1B', modelPath: 'assets/models/llama3_2_1b.bin' },
      },
    }
    expect(() => validateConfig(config)).not.toThrow()
  })

  // it('rejects invalid payments value', () => {
  //   const config = { ...DEFAULT_CONFIG, payments: 'paypal' as StarterConfig['payments'] }
  //   expect(() => validateConfig(config)).toThrow('Invalid value "paypal" for --payments')
  // })

  // it('rejects invalid dx value', () => {
  //   const config = { ...DEFAULT_CONFIG, dx: 'extreme' as StarterConfig['dx'] }
  //   expect(() => validateConfig(config)).toThrow('Invalid value "extreme" for --dx')
  // })

  it('rejects invalid preset value', () => {
    const config = { ...DEFAULT_CONFIG, preset: 'ocean-red' as StarterConfig['preset'] }
    expect(() => validateConfig(config)).toThrow('Invalid value "ocean-red" for --preset')
  })
})

describe('resolveProjectPath', () => {
  let tmpDir: string

  afterEach(async () => {
    if (tmpDir) await rm(tmpDir, { recursive: true, force: true })
  })

  it('resolves a plain name to cwd/name', async () => {
    tmpDir = path.join(os.tmpdir(), `rn-resolve-${Date.now()}`)
    await mkdir(tmpDir, { recursive: true })

    const result = await resolveProjectPath(path.join(tmpDir, 'my-app'))
    expect(result.projectName).toBe('my-app')
    expect(result.projectDir).toBe(path.join(tmpDir, 'my-app'))
  })

  it('resolves a nested relative path and derives name from basename', async () => {
    tmpDir = path.join(os.tmpdir(), `rn-resolve-${Date.now()}`)
    const nestedParent = path.join(tmpDir, 'projects')
    await mkdir(nestedParent, { recursive: true })

    const result = await resolveProjectPath(path.join(nestedParent, 'cool-app'))
    expect(result.projectName).toBe('cool-app')
    expect(result.projectDir).toBe(path.join(nestedParent, 'cool-app'))
  })

  it('resolves an absolute path', async () => {
    tmpDir = path.join(os.tmpdir(), `rn-resolve-${Date.now()}`)
    await mkdir(tmpDir, { recursive: true })
    const absPath = path.join(tmpDir, 'abs-app')

    const result = await resolveProjectPath(absPath)
    expect(result.projectName).toBe('abs-app')
    expect(result.projectDir).toBe(absPath)
  })

  it('accepts valid project names', async () => {
    tmpDir = path.join(os.tmpdir(), `rn-resolve-${Date.now()}`)
    await mkdir(tmpDir, { recursive: true })

    for (const name of ['my-app', 'MyApp', 'app123', 'my_app']) {
      const result = await resolveProjectPath(path.join(tmpDir, name))
      expect(result.projectName).toBe(name)
    }
  })

  it('rejects names starting with a number', async () => {
    tmpDir = path.join(os.tmpdir(), `rn-resolve-${Date.now()}`)
    await mkdir(tmpDir, { recursive: true })

    await expect(resolveProjectPath(path.join(tmpDir, '123app'))).rejects.toThrow(
      'Invalid project name',
    )
  })

  it('rejects names starting with a hyphen', async () => {
    tmpDir = path.join(os.tmpdir(), `rn-resolve-${Date.now()}`)
    await mkdir(tmpDir, { recursive: true })

    await expect(resolveProjectPath(path.join(tmpDir, '-my-app'))).rejects.toThrow(
      'Invalid project name',
    )
  })

  it('rejects names with special characters', async () => {
    tmpDir = path.join(os.tmpdir(), `rn-resolve-${Date.now()}`)
    await mkdir(tmpDir, { recursive: true })

    await expect(resolveProjectPath(path.join(tmpDir, 'my.app'))).rejects.toThrow(
      'Invalid project name',
    )
  })

  it('rejects when target directory already exists', async () => {
    tmpDir = path.join(os.tmpdir(), `rn-resolve-${Date.now()}`)
    await mkdir(tmpDir, { recursive: true })
    const existing = path.join(tmpDir, 'existing-project')
    await mkdir(existing, { recursive: true })

    await expect(resolveProjectPath(existing)).rejects.toThrow('already exists')
  })

  it('rejects when parent directory does not exist', async () => {
    tmpDir = path.join(os.tmpdir(), `rn-resolve-${Date.now()}`)
    await mkdir(tmpDir, { recursive: true })

    await expect(
      resolveProjectPath(path.join(tmpDir, 'no-such-parent', 'my-app')),
    ).rejects.toThrow('does not exist')
  })

  it('allows "." in an empty directory', async () => {
    tmpDir = path.join(os.tmpdir(), `rn-resolve-${Date.now()}-emptydir`)
    await mkdir(tmpDir, { recursive: true })

    const origCwd = process.cwd()
    process.chdir(tmpDir)
    try {
      const result = await resolveProjectPath('.')
      expect(result.projectDir).toBe(path.resolve('.'))
      expect(result.projectName).toBe(path.basename(tmpDir))
    } finally {
      process.chdir(origCwd)
    }
  })

  it('rejects "." in a non-empty directory', async () => {
    tmpDir = path.join(os.tmpdir(), `rn-resolve-${Date.now()}-notempty`)
    await mkdir(tmpDir, { recursive: true })
    await writeFile(path.join(tmpDir, 'somefile.txt'), 'hi')

    const origCwd = process.cwd()
    process.chdir(tmpDir)
    try {
      await expect(resolveProjectPath('.')).rejects.toThrow('not empty')
    } finally {
      process.chdir(origCwd)
    }
  })
})
