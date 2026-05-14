import { test, expect } from 'bun:test'
import { IndexedKnowledge } from '../../src/indexer/index.ts'
import { AtomRegistry } from '../../src/resolver/index.ts'
import { parseSource } from '../../src/parser/index.ts'

function build(...src: string[]): IndexedKnowledge {
  const reg = new AtomRegistry()
  src.forEach((s, i) => reg.addFile(parseSource(s, `f${i}.kn`).file))
  return IndexedKnowledge.fromRegistry(reg)
}

test('indexes atoms by type', () => {
  const idx = build(
    '@a/x { type: flow }',
    '@a/y { type: entity }',
    '@a/z { type: flow }',
  )
  expect(idx.byType('flow').size).toBe(2)
  expect(idx.byType('entity').size).toBe(1)
})

test('returns outgoing edges', () => {
  const idx = build('@a/x { type: flow } @b/y { type: flow } @a/x -uses-> @b/y')
  const out = idx.edgesOut('@a/x')
  expect(out).toHaveLength(1)
  expect(out[0]!.to).toBe('@b/y')
})

test('returns incoming edges', () => {
  const idx = build('@a/x { type: flow } @b/y { type: flow } @a/x -uses-> @b/y')
  const inn = idx.edgesIn('@b/y')
  expect(inn).toHaveLength(1)
  expect(inn[0]!.from).toBe('@a/x')
})
