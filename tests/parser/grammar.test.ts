import { test, expect } from 'bun:test'
import { parseSource } from '../../src/parser/index.ts'
import { isAtom } from '../../src/ast/types.ts'

test('parses empty atom', () => {
  const result = parseSource('@auth/login { }', 'test.kn')
  expect(result.errors).toHaveLength(0)
  expect(result.file.nodes).toHaveLength(1)
  const node = result.file.nodes[0]!
  expect(isAtom(node)).toBe(true)
  if (isAtom(node)) {
    expect(node.path).toBe('@auth/login')
  }
})

test('parses module declaration', () => {
  const result = parseSource('@module auth { }', 'test.kn')
  expect(result.errors).toHaveLength(0)
  expect(result.file.nodes[0]!.kind).toBe('module')
})

test('reports syntax error on malformed atom', () => {
  const result = parseSource('@auth/login {', 'test.kn')
  expect(result.errors.length).toBeGreaterThan(0)
})
