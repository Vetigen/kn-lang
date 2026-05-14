import { test, expect } from 'bun:test'
import { rm } from 'node:fs/promises'

const BUN = process.execPath

test('knc watch starts and exits on SIGTERM', async () => {
  const TMP = '/tmp/kn-watch-test'
  await rm(TMP, { recursive: true, force: true })
  await Bun.write(`${TMP}/knowledge/a.kn`, '@a/x { type: flow }')
  await Bun.write(`${TMP}/kn.config.json`, JSON.stringify({ include: ['knowledge/**/*.kn'] }))
  const proc = Bun.spawn([BUN, 'src/cli-knc.ts', 'watch', '--cwd', TMP], { stdout: 'pipe' })
  await Bun.sleep(500)
  proc.kill('SIGTERM')
  await proc.exited
  expect(await Bun.file(`${TMP}/.kn-dist/atoms.json`).exists()).toBe(true)
})
