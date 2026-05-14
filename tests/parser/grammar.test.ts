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

test('parses atom with scalar fields', () => {
  const result = parseSource('@x { type: flow, name: "login" }', 'test.kn')
  expect(result.errors).toHaveLength(0)
  const atom = result.file.nodes[0]!
  if (!isAtom(atom)) throw new Error('expected atom')
  expect(atom.fields.size).toBe(2)
  const typeField = atom.fields.get('type')!
  expect(typeField.kind).toBe('identifier')
  if (typeField.kind === 'identifier') expect(typeField.value).toBe('flow')
  const nameField = atom.fields.get('name')!
  expect(nameField.kind).toBe('string')
  if (nameField.kind === 'string') expect(nameField.value).toBe('login')
})

test('parses boolean and number values', () => {
  const result = parseSource('@x { active: true, count: 42, ttl: 6h }', 'test.kn')
  expect(result.errors).toHaveLength(0)
  const atom = result.file.nodes[0]!
  if (!isAtom(atom)) throw new Error('expected atom')
  const active = atom.fields.get('active')!
  expect(active.kind).toBe('boolean')
  if (active.kind === 'boolean') expect(active.value).toBe(true)
  const ttl = atom.fields.get('ttl')!
  expect(ttl.kind).toBe('number')
  if (ttl.kind === 'number') {
    expect(ttl.value).toBe(6)
    expect(ttl.unit).toBe('h')
  }
})

test('parses list value', () => {
  const result = parseSource('@x { scope: [clinic, customer] }', 'test.kn')
  expect(result.errors).toHaveLength(0)
  const atom = result.file.nodes[0]!
  if (!isAtom(atom)) throw new Error('expected atom')
  const v = atom.fields.get('scope')!
  expect(v.kind).toBe('list')
  if (v.kind === 'list') {
    expect(v.items).toHaveLength(2)
    expect(v.items[0]!.kind).toBe('identifier')
  }
})

test('parses object value', () => {
  const result = parseSource('@x { contract: { in: foo, out: bar } }', 'test.kn')
  expect(result.errors).toHaveLength(0)
  const atom = result.file.nodes[0]!
  if (!isAtom(atom)) throw new Error('expected atom')
  const v = atom.fields.get('contract')!
  expect(v.kind).toBe('object')
  if (v.kind === 'object') {
    expect(v.fields.size).toBe(2)
  }
})

test('parses ref value', () => {
  const result = parseSource('@x { user: ref(@auth/user) }', 'test.kn')
  expect(result.errors).toHaveLength(0)
  const atom = result.file.nodes[0]!
  if (!isAtom(atom)) throw new Error('expected atom')
  const v = atom.fields.get('user')!
  expect(v.kind).toBe('ref')
  if (v.kind === 'ref') expect(v.target).toBe('@auth/user')
})

test('parses typeref with args', () => {
  const result = parseSource('@x { id: fp(user_) }', 'test.kn')
  expect(result.errors).toHaveLength(0)
  const atom = result.file.nodes[0]!
  if (!isAtom(atom)) throw new Error('expected atom')
  const v = atom.fields.get('id')!
  expect(v.kind).toBe('typeref')
  if (v.kind === 'typeref') {
    expect(v.name).toBe('fp')
    expect(v.args).toEqual(['user_'])
  }
})
