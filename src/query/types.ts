import type { AtomNode, EdgeNode, AtomPath } from '../ast/types.ts'

export interface GetOptions {
  depth?: number
  type?: string
  scope?: string
}

export interface QueryResult {
  atoms: AtomNode[]
  edges: EdgeNode[]
}

export interface TraceResult {
  path: AtomPath[]
  edges: EdgeNode[]
  found: boolean
}
