import type { CstNode, IToken } from 'chevrotain'
import type { FileNode, TopLevelNode, AtomNode, ModuleNode } from '../ast/types.ts'
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
    fields: new Map(),
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
    fields: new Map(),
    loc: sourceLocationFromToken(atToken, filePath),
  }
}

function buildPath(cst: CstNode): string {
  const tokens = (cst.children.Identifier as IToken[]) ?? []
  return tokens.map(t => t.image).join('/')
}
