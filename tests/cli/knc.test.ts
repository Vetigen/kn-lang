import { test, expect } from 'bun:test'
import { rm } from 'node:fs/promises'

const TMP = '/tmp/kn-cli-test'
const BUN = process.execPath

test('knc init scaffolds kn.config.json + AUTHORING.md + _examples', async () => {
  await rm(TMP, { recursive: true, force: true })
  const proc = Bun.spawn([BUN, 'src/cli-knc.ts', 'init', '--cwd', TMP], { stdout: 'pipe' })
  await proc.exited
  expect(proc.exitCode).toBe(0)
  expect(await Bun.file(`${TMP}/kn.config.json`).exists()).toBe(true)
  expect(await Bun.file(`${TMP}/AUTHORING.md`).exists()).toBe(true)
  expect(await Bun.file(`${TMP}/knowledge/_examples/flow.example.kn`).exists()).toBe(true)
  expect(await Bun.file(`${TMP}/knowledge/_examples/entity.example.kn`).exists()).toBe(true)
  expect(await Bun.file(`${TMP}/knowledge/_examples/convention.example.kn`).exists()).toBe(true)
})

test('knc build produces dist when clean', async () => {
  await rm(TMP, { recursive: true, force: true })
  await Bun.write(`${TMP}/knowledge/a.kn`, '@a/x { type: flow }')
  await Bun.write(`${TMP}/kn.config.json`, JSON.stringify({ include: ['knowledge/**/*.kn'] }))
  const proc = Bun.spawn([BUN, 'src/cli-knc.ts', 'build', '--cwd', TMP], { stdout: 'pipe', stderr: 'pipe' })
  await proc.exited
  expect(proc.exitCode).toBe(0)
  expect(await Bun.file(`${TMP}/.kn-dist/atoms.json`).exists()).toBe(true)
})

test('knc check --strict exits 1 on warnings', async () => {
  await rm(TMP, { recursive: true, force: true })
  await Bun.write(`${TMP}/knowledge/a.kn`, '@a/x { type: flow, freshness: "2020-01-01" }')
  await Bun.write(`${TMP}/kn.config.json`, JSON.stringify({ include: ['knowledge/**/*.kn'] }))
  const proc = Bun.spawn([BUN, 'src/cli-knc.ts', 'check', '--strict', '--cwd', TMP], { stderr: 'pipe' })
  await proc.exited
  expect(proc.exitCode).toBe(1)
})
