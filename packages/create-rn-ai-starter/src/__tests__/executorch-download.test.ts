import { mkdtemp, rm, access } from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import { downloadExecuTorchModel } from '@/utils/executorch-download.js'

describe('downloadExecuTorchModel', () => {
  let tmpDir: string | undefined

  afterEach(async () => {
    if (tmpDir) {
      await rm(tmpDir, { recursive: true, force: true })
      tmpDir = undefined
    }
  })

  it('writes a placeholder file and reports progress', async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rn-exec-download-'))
    const progressCalls: number[] = []
    const downloadedPath = await downloadExecuTorchModel(tmpDir, 'LLAMA3_2_1B', (progress) => {
      progressCalls.push(progress)
    })

    expect(downloadedPath).toContain(path.join('assets', 'models'))
    await expect(access(downloadedPath)).resolves.not.toThrow()
    expect(progressCalls.length).toBeGreaterThanOrEqual(3)
  })
})
