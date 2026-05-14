import { test, expect } from 'bun:test'
import { createToken, Lexer } from 'chevrotain'

const At = createToken({ name: 'At', pattern: /@/ })
const Ident = createToken({ name: 'Ident', pattern: /[a-zA-Z_][a-zA-Z0-9_-]*/ })
const Ws = createToken({ name: 'Ws', pattern: /\s+/, group: Lexer.SKIPPED })

const lexer = new Lexer([Ws, At, Ident])

test('chevrotain runs on bun', () => {
  const result = lexer.tokenize('@auth')
  expect(result.errors).toHaveLength(0)
  expect(result.tokens).toHaveLength(2)
  expect(result.tokens[0]!.image).toBe('@')
  expect(result.tokens[1]!.image).toBe('auth')
})
