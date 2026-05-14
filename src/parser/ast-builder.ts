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
  if (c.refValue) return buildRef((c.refValue as CstNode[])[0]!, filePath)
  if (c.listValue) return buildList((c.listValue as CstNode[])[0]!, filePath)
  if (c.objectValue) return buildObject((c.objectValue as CstNode[])[0]!, filePath)
  if (c.scalarOrTypeRef) return buildScalarOrTypeRef((c.scalarOrTypeRef as CstNode[])[0]!, filePath)
  throw new Error('unknown value kind')
}

function buildRef(cst: CstNode, filePath: string): ValueNode {
  const atTok = (cst.children.At as IToken[])[0]!
  const path = buildPath((cst.children.atomPath as CstNode[])[0]!)
  return {
    kind: 'ref',
    target: `@${path}`,
    loc: sourceLocationFromToken(atTok, filePath),
  }
}

function buildList(cst: CstNode, filePath: string): ValueNode {
  const items = ((cst.children.value as CstNode[]) ?? []).map(v => buildValue(v, filePath))
  const lbr = (cst.children.LBracket as IToken[])[0]!
  return { kind: 'list', items, loc: sourceLocationFromToken(lbr, filePath) }
}

function buildObject(cst: CstNode, filePath: string): ValueNode {
  const fields = buildFields(cst, filePath)
  const lbr = (cst.children.LBrace as IToken[])[0]!
  return { kind: 'object', fields, loc: sourceLocationFromToken(lbr, filePath) }
}

function buildScalarOrTypeRef(cst: CstNode, filePath: string): ValueNode {
  const c = cst.children
  if (c.StringLiteral) {
    const tok = (c.StringLiteral as IToken[])[0]!
    return { kind: 'string', value: tok.image.slice(1, -1), loc: sourceLocationFromToken(tok, filePath) }
  }
  if (c.NumberLiteral) {
    const tok = (c.NumberLiteral as IToken[])[0]!
    const m = tok.image.match(/^(\d+(?:\.\d+)?)(.*)$/)!
    return {
      kind: 'number',
      value: parseFloat(m[1]!),
      ...(m[2] ? { unit: m[2] } : {}),
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
    const idents = c.Identifier as IToken[]
    const nameTok = idents[0]!
    if (c.LParen) {
      const args: Array<string | number> = []
      for (let i = 1; i < idents.length; i++) args.push(idents[i]!.image)
      for (const s of ((c.StringLiteral as IToken[] | undefined) ?? [])) args.push(s.image.slice(1, -1))
      for (const n of ((c.NumberLiteral as IToken[] | undefined) ?? [])) args.push(parseFloat(n.image))
      return { kind: 'typeref', name: nameTok.image, args, loc: sourceLocationFromToken(nameTok, filePath) }
    }
    return { kind: 'identifier', value: nameTok.image, loc: sourceLocationFromToken(nameTok, filePath) }
  }
  throw new Error('unknown scalar/typeref')
}
