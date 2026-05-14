import { test, expect } from 'bun:test'
import { sourceLocationFromToken, formatLocation } from '../../src/ast/source-location.ts'
import { knLexer } from '../../src/parser/tokens.ts'

test('extracts source location from token', () => {
  const result = knLexer.tokenize('@auth\n  -uses-> @b')
  const arrow = result.tokens.find(t => t.image === '->')!
  const loc = sourceLocationFromToken(arrow, 'test.kn')
  expect(loc.file).toBe('test.kn')
  expect(loc.line).toBe(2)
  expect(loc.column).toBeGreaterThan(1)
})

test('formats location TS-style', () => {
  const loc = { file: 'a.kn', line: 42, column: 18, length: 5 }
  expect(formatLocation(loc)).toBe('a.kn:42:18')
})
