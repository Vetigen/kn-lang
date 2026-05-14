import { test, expect } from 'bun:test'
import { QueryExecutor } from '../../src/query/index.ts'
import { IndexedKnowledge } from '../../src/indexer/index.ts'
import { AtomRegistry } from '../../src/resolver/index.ts'
import { parseSource } from '../../src/parser/index.ts'

function build(src: string): QueryExecutor {
  const reg = new AtomRegistry()
  reg.addFile(parseSource(src, 'a.kn').file)
  return new QueryExecutor(IndexedKnowledge.fromRegistry(reg))
}

test('why returns provenance from invariants block', () => {
  const qx = build(`@a/x { type: flow, invariants: [{ name: "max-active", since: "2025-11-03", reason: "incident" }] }`)
  const r = qx.why('@a/x#max-active')
  expect(r).toBeDefined()
  expect(r!.since).toBe('2025-11-03')
  expect(r!.reason).toBe('incident')
})

test('why returns null for unknown invariant', () => {
  const qx = build('@a/x { type: flow }')
  expect(qx.why('@a/x#nope')).toBeNull()
})
