import type { CstNode, IToken } from 'chevrotain'
import type { FileNode, TopLevelNode, AtomNode, ModuleNode, ValueNode } from '../ast/types.ts'
import { sourceLocationFromToken } from '../ast/source-location.ts'

export function buildFile(cst: CstNode, filePath: string): FileNode {
  const nodes: TopLevelNode[] = []
  const children = cst.children as Record<string, CstNode[]>

  for (const moduleCst of children.moduleDecl ?? []) {
    nodes.push(buildModule(moduleCst, filePath))
  }
  for (const atomCst of children.atomDecl ?? []) {
    nodes.push(buildAtom(atomCst, filePath))
  }

  return { kind: 'file', filePath, nodes }
}

function buildModule(cst: CstNode, filePath: string): ModuleNode {
  const children = cst.children as Record<string, IToken[] | CstNode[]>
  const atToken = (children.At as IToken[])[0]!
  const path = buildPath(children.atomPath![0] as CstNode)
  return {
    kind: 'module',
    path: `@${path}`,
    fields: buildFields(cst, filePath),
    loc: sourceLocationFromToken(atToken, filePath),
  }
}

function buildAtom(cst: CstNode, filePath: string): AtomNode {
  const children = cst.children as Record<string, IToken[] | CstNode[]>
  const atToken = (children.At as IToken[])[0]!
  const path = buildPath(children.atomPath![0] as CstNode)
  return {
    kind: 'atom',
    path: `@${path}`,
    fields: buildFields(cst, filePath),
    loc: sourceLocationFromToken(atToken, filePath),
  }
}

function buildPath(cst: CstNode): string {
  const tokens = (cst.children.Identifier as IToken[]) ?? []
  return tokens.map(t => t.image).join('/')
}

function buildFields(cst: CstNode, filePath: string): Map<string, ValueNode> {
  const fieldCsts = (cst.children.field as CstNode[]) ?? []
  const map = new Map<string, ValueNode>()
  for (const f of fieldCsts) {
    const key = (f.children.Identifier as IToken[])[0]!.image
    const valueCst = (f.children.value as CstNode[])[0]!
    map.set(key, buildValue(valueCst, filePath))
  }
  return map
}

function buildValue(cst: CstNode, filePath: string): ValueNode {
  const c = cst.children
  if (c.StringLiteral) {
    const tok = (c.StringLiteral as IToken[])[0]!
    const raw = tok.image
    return {
      kind: 'string',
      value: raw.slice(1, -1),
      loc: sourceLocationFromToken(tok, filePath),
    }
  }
  if (c.NumberLiteral) {
    const tok = (c.NumberLiteral as IToken[])[0]!
    const m = tok.image.match(/^(\d+(?:\.\d+)?)(.*)$/)
    return {
      kind: 'number',
      value: parseFloat(m![1]!),
      ...(m![2] ? { unit: m![2] } : {}),
      loc: sourceLocationFromToken(tok, filePath),
    }
  }
  if (c.True) {
    const tok = (c.True as IToken[])[0]!
    return { kind: 'boolean', value: true, loc: sourceLocationFromToken(tok, filePath) }
  }
  if (c.False) {
    const tok = (c.False as IToken[])[0]!
    return { kind: 'boolean', value: false, loc: sourceLocationFromToken(tok, filePath) }
  }
  if (c.Identifier) {
    const tok = (c.Identifier as IToken[])[0]!
    return { kind: 'identifier', value: tok.image, loc: sourceLocationFromToken(tok, filePath) }
  }
  throw new Error('unknown value kind')
}
