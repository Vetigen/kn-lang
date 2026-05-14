import { test, expect } from 'bun:test'
import { QueryExecutor } from '../../src/query/index.ts'
import { IndexedKnowledge } from '../../src/indexer/index.ts'
import { AtomRegistry } from '../../src/resolver/index.ts'
import { parseSource } from '../../src/parser/index.ts'

function build(...src: string[]): QueryExecutor {
  const reg = new AtomRegistry()
  src.forEach((s, i) => reg.addFile(parseSource(s, `f${i}.kn`).file))
  return new QueryExecutor(IndexedKnowledge.fromRegistry(reg))
}

test('get single atom', () => {
  const qx = build('@a/x { type: flow }')
  const result = qx.get('@a/x')
  expect(result.atoms).toHaveLength(1)
  expect(result.atoms[0]!.path).toBe('@a/x')
})

test('get with glob', () => {
  const qx = build('@a/x { type: flow } @a/y { type: entity } @b/z { type: flow }')
  const result = qx.get('@a/*')
  expect(result.atoms).toHaveLength(2)
})

test('get with depth includes neighbors', () => {
  const qx = build('@a/x { type: flow } @b/y { type: flow } @a/x -uses-> @b/y')
  const result = qx.get('@a/x', { depth: 1 })
  expect(result.atoms.map(a => a.path).sort()).toEqual(['@a/x', '@b/y'])
})

test('get with type filter', () => {
  const qx = build('@a/x { type: flow } @a/y { type: entity }')
  const result = qx.get('@a/*', { type: 'entity' })
  expect(result.atoms).toHaveLength(1)
  expect(result.atoms[0]!.path).toBe('@a/y')
})

test('returns empty for unknown atom', () => {
  const qx = build('@a/x { type: flow }')
  const result = qx.get('@nope/here')
  expect(result.atoms).toHaveLength(0)
})
