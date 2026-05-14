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

test('trace finds path A → B (direct)', () => {
  const qx = build(
    '@a/x { type: flow } @b/y { type: flow }',
    '@a/x -uses-> @b/y',
  )
  const r = qx.trace('@a/x', '@b/y')
  expect(r.found).toBe(true)
  expect(r.path).toEqual(['@a/x', '@b/y'])
})

test('trace finds 2-hop path', () => {
  const qx = build(
    '@a/x { type: flow } @b/y { type: flow } @c/z { type: flow }',
    '@a/x -uses-> @b/y @b/y -uses-> @c/z',
  )
  const r = qx.trace('@a/x', '@c/z')
  expect(r.found).toBe(true)
  expect(r.path).toEqual(['@a/x', '@b/y', '@c/z'])
})

test('trace returns not-found when disconnected', () => {
  const qx = build('@a/x { type: flow } @b/y { type: flow }')
  const r = qx.trace('@a/x', '@b/y')
  expect(r.found).toBe(false)
})
