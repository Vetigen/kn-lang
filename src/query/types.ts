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

export interface LsEntry {
  path: AtomPath
  type: string
  scope?: string[]
}

export interface TreeNode {
  segment: string
  path?: AtomPath
  type?: string
  children: TreeNode[]
}

export interface ManifestAtomEntry {
  type: string
  scope?: string[]
  freshness?: string
  summary?: string
}

export interface Manifest {
  version: string
  builtAt: string
  atoms: Record<AtomPath, ManifestAtomEntry>
  namespaces: string[]
  typeCounts: Record<string, number>
  edgeCount: number
}
