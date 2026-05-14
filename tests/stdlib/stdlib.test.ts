import { test, expect } from 'bun:test'
import { isKnownType, isKnownEdgeType, EDGE_TYPES } from '../../src/stdlib/index.ts'

test('recognizes built-in types', () => {
  expect(isKnownType('E164')).toBe(true)
  expect(isKnownType('Scope')).toBe(true)
  expect(isKnownType('timestamptz')).toBe(true)
  expect(isKnownType('fp')).toBe(true)
  expect(isKnownType('NotAType')).toBe(false)
})

test('recognizes 8 edge types', () => {
  expect(EDGE_TYPES.length).toBe(8)
  for (const t of ['uses', 'publishes', 'consumes', 'invalidates', 'owned-by', 'creates', 'revokes', 'see-also']) {
    expect(isKnownEdgeType(t)).toBe(true)
  }
  expect(isKnownEdgeType('makes-coffee')).toBe(false)
})
