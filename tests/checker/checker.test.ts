import { test, expect } from 'bun:test'
import { runChecks } from '../../src/checker/index.ts'
import { parseSource } from '../../src/parser/index.ts'
import { AtomRegistry } from '../../src/resolver/index.ts'

function buildRegistry(...sources: Array<[string, string]>): AtomRegistry {
  const reg = new AtomRegistry()
  for (const [src, file] of sources) reg.addFile(parseSource(src, file).file)
  return reg
}

test('KN2002 — duplicate atom', () => {
  const reg = buildRegistry(['@a/x { type: flow }', 'a.kn'], ['@a/x { type: entity }', 'b.kn'])
  const diags = runChecks(reg)
  const dup = diags.find(d => d.code === 'KN2002')
  expect(dup).toBeDefined()
})

test('KN2001 — broken ref', () => {
  const reg = buildRegistry(['@a/x { user: ref(@missing/atom) }', 'a.kn'])
  const diags = runChecks(reg)
  const broken = diags.find(d => d.code === 'KN2001')
  expect(broken).toBeDefined()
  expect(broken!.message).toContain('@missing/atom')
})

test('KN2003 — broken edge target', () => {
  const reg = buildRegistry(['@a/x { type: flow } @a/x -uses-> @nope/here', 'a.kn'])
  const diags = runChecks(reg)
  const brokenEdge = diags.find(d => d.code === 'KN2003')
  expect(brokenEdge).toBeDefined()
})

test('KN2005 — unknown edge type', () => {
  const reg = buildRegistry([
    '@a/x { type: flow } @a/y { type: flow } @a/x -invents-> @a/y',
    'a.kn',
  ])
  const diags = runChecks(reg)
  const unk = diags.find(d => d.code === 'KN2005')
  expect(unk).toBeDefined()
})

test('clean input — no diagnostics', () => {
  const reg = buildRegistry(['@a/x { type: flow } @a/y { type: flow } @a/x -uses-> @a/y', 'a.kn'])
  const diags = runChecks(reg)
  expect(diags.filter(d => d.severity === 'error')).toHaveLength(0)
})
