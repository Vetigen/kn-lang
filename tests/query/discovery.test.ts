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

test('ls returns flat list of all atoms', () => {
  const qx = build(
    '@auth/login { type: flow }',
    '@auth/session { type: entity }',
    '@cache/conventions { type: convention }',
  )
  const result = qx.ls()
  expect(result).toHaveLength(3)
  expect(result.map(e => e.path).sort()).toEqual(['@auth/login', '@auth/session', '@cache/conventions'])
  expect(result.find(e => e.path === '@auth/login')!.type).toBe('flow')
})

test('ls with prefix filters by namespace', () => {
  const qx = build(
    '@auth/login { type: flow }',
    '@auth/session { type: entity }',
    '@cache/conventions { type: convention }',
  )
  const result = qx.ls('@auth')
  expect(result).toHaveLength(2)
  expect(result.every(e => e.path.startsWith('@auth'))).toBe(true)
})

test('tree builds hierarchical node structure', () => {
  const qx = build(
    '@auth/login { type: flow }',
    '@auth/session { type: entity }',
    '@cache/conventions { type: convention }',
  )
  const tree = qx.tree()
  expect(tree.children).toHaveLength(2)
  const auth = tree.children.find(c => c.segment === 'auth')!
  expect(auth.children).toHaveLength(2)
  expect(auth.children.find(c => c.segment === 'login')!.type).toBe('flow')
})

test('tree with prefix returns subtree', () => {
  const qx = build('@a/b/c { type: flow }', '@a/b/d { type: flow }', '@e/f { type: flow }')
  const tree = qx.tree('@a/b')
  expect(tree.children).toHaveLength(2)
  expect(tree.children.map(c => c.segment).sort()).toEqual(['c', 'd'])
})

test('search matches atom path (case-insensitive)', () => {
  const qx = build('@auth/login { type: flow }', '@sales/order { type: flow }')
  const result = qx.search('AUTH')
  expect(result).toHaveLength(1)
  expect(result[0]!.path).toBe('@auth/login')
})

test('search matches field values', () => {
  const qx = build('@auth/login { type: flow, entry: "POST /auth/login" }')
  const result = qx.search('POST')
  expect(result).toHaveLength(1)
})

test('manifest returns full summary', () => {
  const qx = build(
    '@auth/login { type: flow, entry: "POST /auth/login", freshness: "2026-05-14" }',
    '@auth/session { type: entity }',
    '@cache/conventions { type: convention }',
  )
  const m = qx.manifest()
  expect(Object.keys(m.atoms)).toHaveLength(3)
  expect(m.atoms['@auth/login']!.type).toBe('flow')
  expect(m.atoms['@auth/login']!.summary).toBe('POST /auth/login')
  expect(m.atoms['@auth/login']!.freshness).toBe('2026-05-14')
  expect(m.namespaces.sort()).toEqual(['auth', 'cache'])
  expect(m.typeCounts.flow).toBe(1)
  expect(m.typeCounts.entity).toBe(1)
  expect(m.typeCounts.convention).toBe(1)
})
