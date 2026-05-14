import { test, expect } from 'bun:test'
import { isAtom, isEdge, type AtomNode, type EdgeNode } from '../../src/ast/types.ts'

test('isAtom narrows correctly', () => {
  const atom: AtomNode = {
    kind: 'atom',
    path: '@auth/login',
    fields: new Map(),
    loc: { file: 't.kn', line: 1, column: 1, length: 1 },
  }
  expect(isAtom(atom)).toBe(true)
  expect(isEdge(atom)).toBe(false)
})

test('isEdge narrows correctly', () => {
  const edge: EdgeNode = {
    kind: 'edge',
    from: '@a',
    edgeType: 'uses',
    to: '@b',
    isGlob: false,
    loc: { file: 't.kn', line: 1, column: 1, length: 1 },
  }
  expect(isEdge(edge)).toBe(true)
})
