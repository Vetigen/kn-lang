import { test, expect } from 'bun:test'
import { compile } from '../../src/compiler/index.ts'
import { rm } from 'node:fs/promises'

const TMP = '/tmp/kn-compiler-test'

test('compiles clean .kn files and writes dist', async () => {
  await rm(TMP, { recursive: true, force: true })
  await Bun.write(`${TMP}/a.kn`, '@a/x { type: flow }')
  await Bun.write(`${TMP}/b.kn`, '@a/y { type: entity } @a/x -uses-> @a/y')
  const result = await compile({
    include: [`${TMP}/*.kn`],
    outDir: `${TMP}/.kn-dist`,
    freshness: { warnAfterDays: 90, errorAfterDays: 365 },
  })
  expect(result.diagnostics.filter(d => d.severity === 'error')).toHaveLength(0)
  const atoms = await Bun.file(`${TMP}/.kn-dist/atoms.json`).json()
  expect(Object.keys(atoms)).toContain('@a/x')
  expect(Object.keys(atoms)).toContain('@a/y')
  const edges = await Bun.file(`${TMP}/.kn-dist/edges.json`).json()
  expect(edges).toHaveLength(1)
})

test('returns errors on broken files', async () => {
  await rm(TMP, { recursive: true, force: true })
  await Bun.write(`${TMP}/a.kn`, '@a/x { user: ref(@nope/atom) }')
  const result = await compile({
    include: [`${TMP}/*.kn`],
    outDir: `${TMP}/.kn-dist`,
    freshness: { warnAfterDays: 90, errorAfterDays: 365 },
  })
  expect(result.diagnostics.some(d => d.code === 'KN2001')).toBe(true)
})
