import { test, expect } from 'bun:test'
import { knLexer } from '../../src/parser/tokens.ts'

test('tokenizes atom declaration', () => {
  const result = knLexer.tokenize('@auth/login { type: flow }')
  expect(result.errors).toHaveLength(0)
  const images = result.tokens.map(t => t.image)
  expect(images).toEqual(['@', 'auth', '/', 'login', '{', 'type', ':', 'flow', '}'])
})

test('tokenizes edge declaration', () => {
  const result = knLexer.tokenize('@a -uses-> @b')
  expect(result.errors).toHaveLength(0)
  const images = result.tokens.map(t => t.image)
  expect(images).toEqual(['@', 'a', '-', 'uses', '->', '@', 'b'])
})

test('skips comments', () => {
  const result = knLexer.tokenize('# comment line\n@x { }')
  expect(result.errors).toHaveLength(0)
  const images = result.tokens.map(t => t.image)
  expect(images).toEqual(['@', 'x', '{', '}'])
})

test('tokenizes string literals', () => {
  const result = knLexer.tokenize('"hello world"')
  expect(result.errors).toHaveLength(0)
  expect(result.tokens[0]!.image).toBe('"hello world"')
})

test('tokenizes numbers with units', () => {
  const result = knLexer.tokenize('6h 90gün 1.5')
  expect(result.errors).toHaveLength(0)
  expect(result.tokens.map(t => t.image)).toEqual(['6h', '90gün', '1.5'])
})
