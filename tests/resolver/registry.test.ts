import { test, expect } from 'bun:test'
import { AtomRegistry } from '../../src/resolver/index.ts'
import { parseSource } from '../../src/parser/index.ts'

test('registers atoms from a file', () => {
  const result = parseSource('@a/x { type: flow } @b/y { type: entity }', 'test.kn')
  const reg = new AtomRegistry()
  reg.addFile(result.file)
  expect(reg.has('@a/x')).toBe(true)
  expect(reg.has('@b/y')).toBe(true)
  expect(reg.size).toBe(2)
})

test('reports duplicate via getDuplicates()', () => {
  const r1 = parseSource('@a/x { type: flow }', 'one.kn').file
  const r2 = parseSource('@a/x { type: entity }', 'two.kn').file
  const reg = new AtomRegistry()
  reg.addFile(r1)
  reg.addFile(r2)
  const dups = reg.getDuplicates()
  expect(dups).toHaveLength(1)
  expect(dups[0]!.path).toBe('@a/x')
  expect(dups[0]!.locations).toHaveLength(2)
})
