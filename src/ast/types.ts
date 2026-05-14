import type { SourceLocation } from './source-location.ts'

export type AtomPath = string  // "@auth/login"
export type EdgeType = string  // validated against stdlib later

export type ScalarValue =
  | { kind: 'string'; value: string; loc: SourceLocation }
  | { kind: 'number'; value: number; unit?: string; loc: SourceLocation }
  | { kind: 'boolean'; value: boolean; loc: SourceLocation }
  | { kind: 'identifier'; value: string; loc: SourceLocation }

export interface ListValue {
  kind: 'list'
  items: ValueNode[]
  loc: SourceLocation
}

export interface ObjectValue {
  kind: 'object'
  fields: Map<string, ValueNode>
  loc: SourceLocation
}

export interface RefValue {
  kind: 'ref'
  target: AtomPath
  loc: SourceLocation
}

export interface TypeRefValue {
  kind: 'typeref'
  name: string
  args: Array<string | number>
  loc: SourceLocation
}

export interface PipelineValue {
  kind: 'pipeline'
  steps: Array<{ index: number; label: string; loc: SourceLocation }>
  loc: SourceLocation
}

export interface InvariantsValue {
  kind: 'invariants'
  items: Array<{ text: string; loc: SourceLocation }>
  loc: SourceLocation
}

export type ValueNode =
  | ScalarValue
  | ListValue
  | ObjectValue
  | RefValue
  | TypeRefValue
  | PipelineValue
  | InvariantsValue

export interface AtomNode {
  kind: 'atom'
  path: AtomPath
  fields: Map<string, ValueNode>
  loc: SourceLocation
}

export interface ModuleNode {
  kind: 'module'
  path: AtomPath
  fields: Map<string, ValueNode>
  loc: SourceLocation
}

export interface EdgeNode {
  kind: 'edge'
  from: AtomPath
  edgeType: EdgeType
  to: AtomPath
  isGlob: boolean
  loc: SourceLocation
}

export type TopLevelNode = AtomNode | ModuleNode | EdgeNode

export interface FileNode {
  kind: 'file'
  filePath: string
  nodes: TopLevelNode[]
}

export const isAtom   = (n: { kind: string }): n is AtomNode   => n.kind === 'atom'
export const isModule = (n: { kind: string }): n is ModuleNode => n.kind === 'module'
export const isEdge   = (n: { kind: string }): n is EdgeNode   => n.kind === 'edge'
