import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import { execFile } from 'node:child_process'
import { mkdir, rm, access, readFile } from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'

const PKG_ROOT = path.resolve(__dirname, '..', '..')
const CLI_BIN = path.join(PKG_ROOT, 'dist', 'index.js')

function runCli(args: string[]): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve) => {
    const child = execFile('node', [CLI_BIN, ...args], { timeout: 15_000 }, (err, stdout, stderr) => {
      resolve({
        stdout: stdout ?? '',
        stderr: stderr ?? '',
        exitCode: child.exitCode ?? (err ? 1 : 0),
      })
    })
  })
}

async function exists(p: string): Promise<boolean> {
  try {
    await access(p)
    return true
  } catch {
    return false
  }
}

describe('CLI integration — built binary', () => {
  beforeAll(async () => {
    const distExists = await exists(CLI_BIN)
    if (!distExists) {
      throw new Error(
        'dist/index.js not found. Run `npm run build` before running integration tests.',
      )
    }
  })

  describe('--help', () => {
    it('prints usage with <project-path> argument', async () => {
      const { stdout } = await runCli(['--help'])
      expect(stdout).toContain('project-path')
      expect(stdout).toContain('--ui')
      expect(stdout).toContain('--auth')
      expect(stdout).toContain('--payments')
      expect(stdout).toContain('--dx')
      expect(stdout).toContain('--preset')
      expect(stdout).toContain('--yes')
    })
  })

  describe('path resolution with real paths', () => {
    let tmpDir: string
    const dirs: string[] = []

    afterEach(async () => {
      for (const d of dirs) {
        await rm(d, { recursive: true, force: true }).catch(() => {})
      }
      dirs.length = 0
      if (tmpDir) {
        await rm(tmpDir, { recursive: true, force: true }).catch(() => {})
      }
    })

    it('accepts an absolute path like /tmp/my-app', async () => {
      const projectDir = path.join(os.tmpdir(), `rn-cli-abs-${Date.now()}`)
      dirs.push(projectDir)

      const { stdout, stderr, exitCode } = await runCli([projectDir, '--yes'])

      expect(stderr).not.toContain('Invalid project name')
      expect(stdout).toContain('Creating project directory')
      expect(await exists(projectDir)).toBe(true)
    })

    it('accepts a nested path like /tmp/projects/my-app', async () => {
      tmpDir = path.join(os.tmpdir(), `rn-cli-nested-${Date.now()}`)
      await mkdir(tmpDir, { recursive: true })
      const projectDir = path.join(tmpDir, 'my-app')
      dirs.push(projectDir)

      const { stdout, stderr } = await runCli([projectDir, '--yes'])

      expect(stderr).not.toContain('Invalid project name')
      expect(stdout).toContain('Creating project directory')
      expect(await exists(projectDir)).toBe(true)
    })

    it('accepts a plain name and creates in cwd', async () => {
      tmpDir = path.join(os.tmpdir(), `rn-cli-plain-${Date.now()}`)
      await mkdir(tmpDir, { recursive: true })
      const projectName = `testapp${Date.now()}`

      const result = await new Promise<{ stdout: string; stderr: string; exitCode: number }>((resolve) => {
        const child = execFile(
          'node',
          [CLI_BIN, projectName, '--yes'],
          { timeout: 15_000, cwd: tmpDir },
          (err, stdout, stderr) => {
            resolve({
              stdout: stdout ?? '',
              stderr: stderr ?? '',
              exitCode: child.exitCode ?? (err ? 1 : 0),
            })
          },
        )
      })
      dirs.push(path.join(tmpDir, projectName))

      expect(result.stderr).not.toContain('Invalid project name')
      expect(result.stdout).toContain('Creating project directory')
      expect(await exists(path.join(tmpDir, projectName))).toBe(true)
    })

    it('scaffolds files in the project directory (not just mkdir)', async () => {
      const projectDir = path.join(os.tmpdir(), `rn-cli-files-${Date.now()}`)
      dirs.push(projectDir)

      await runCli([projectDir, '--yes'])

      expect(await exists(path.join(projectDir, 'app.json'))).toBe(true)
      expect(await exists(path.join(projectDir, 'src', 'starter.config.ts'))).toBe(true)
      expect(await exists(path.join(projectDir, 'app', '_layout.tsx'))).toBe(true)
      expect(await exists(path.join(projectDir, 'app', '(onboarding)', '_layout.tsx'))).toBe(true)
      expect(await exists(path.join(projectDir, 'app', '(app)', '_layout.tsx'))).toBe(true)
    })

    it('interpolates project name from path basename in app.json', async () => {
      const projectDir = path.join(os.tmpdir(), `rn-cli-interp-${Date.now()}`, 'coolproject')
      await mkdir(path.dirname(projectDir), { recursive: true })
      dirs.push(path.dirname(projectDir))

      await runCli([projectDir, '--yes'])

      const appJson = JSON.parse(await readFile(path.join(projectDir, 'app.json'), 'utf-8'))
      expect(appJson.expo.name).toBe('coolproject')
      expect(appJson.expo.slug).toBe('coolproject')
    })

    it('rejects a path where parent does not exist', async () => {
      const projectDir = path.join(os.tmpdir(), `rn-cli-noparent-${Date.now()}`, 'deep', 'my-app')

      const { stderr, exitCode } = await runCli([projectDir, '--yes'])

      expect(exitCode).not.toBe(0)
      expect(stderr).toContain('does not exist')
    })

    it('rejects a path where target already exists', async () => {
      tmpDir = path.join(os.tmpdir(), `rn-cli-exists-${Date.now()}`)
      await mkdir(tmpDir, { recursive: true })

      const { stderr, exitCode } = await runCli([tmpDir, '--yes'])

      expect(exitCode).not.toBe(0)
      expect(stderr).toContain('already exists')
    })

    it('rejects a path with an invalid basename', async () => {
      tmpDir = path.join(os.tmpdir(), `rn-cli-badname-${Date.now()}`)
      await mkdir(tmpDir, { recursive: true })
      const badPath = path.join(tmpDir, '123-bad')

      const { stderr, exitCode } = await runCli([badPath, '--yes'])

      expect(exitCode).not.toBe(0)
      expect(stderr).toContain('Invalid project name')
    })
  })
})
