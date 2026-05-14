import type { AtomNode, EdgeNode, AtomPath } from '../ast/types.ts'
import type { AtomRegistry } from '../resolver/atom-registry.ts'

export class IndexedKnowledge {
  private atoms = new Map<AtomPath, AtomNode>()
  private edgesOutMap = new Map<AtomPath, EdgeNode[]>()
  private edgesInMap = new Map<AtomPath, EdgeNode[]>()
  private byTypeMap = new Map<string, Set<AtomPath>>()
  private byScopeMap = new Map<string, Set<AtomPath>>()

  static fromRegistry(reg: AtomRegistry): IndexedKnowledge {
    const idx = new IndexedKnowledge()
    for (const atom of reg.allAtoms()) idx.addAtom(atom)
    for (const edge of reg.allEdges()) idx.addEdge(edge, reg)
    return idx
  }

  private addAtom(atom: AtomNode): void {
    this.atoms.set(atom.path, atom)
    const typeField = atom.fields.get('type')
    if (typeField?.kind === 'identifier' || typeField?.kind === 'string') {
      const t = typeField.value as string
      if (!this.byTypeMap.has(t)) this.byTypeMap.set(t, new Set())
      this.byTypeMap.get(t)!.add(atom.path)
    }
    const scopeField = atom.fields.get('scope')
    if (scopeField?.kind === 'list') {
      for (const s of scopeField.items) {
        if (s.kind === 'identifier' || s.kind === 'string') {
          const sv = s.value as string
          if (!this.byScopeMap.has(sv)) this.byScopeMap.set(sv, new Set())
          this.byScopeMap.get(sv)!.add(atom.path)
        }
      }
    }
  }

  private addEdge(edge: EdgeNode, reg: AtomRegistry): void {
    const targets = edge.isGlob ? reg.pathsMatching(edge.to + '/*') : [edge.to]
    for (const to of targets) {
      const resolved: EdgeNode = { ...edge, to, isGlob: false }
      if (!this.edgesOutMap.has(edge.from)) this.edgesOutMap.set(edge.from, [])
      this.edgesOutMap.get(edge.from)!.push(resolved)
      if (!this.edgesInMap.has(to)) this.edgesInMap.set(to, [])
      this.edgesInMap.get(to)!.push(resolved)
    }
  }

  get(path: AtomPath): AtomNode | undefined { return this.atoms.get(path) }
  has(path: AtomPath): boolean { return this.atoms.has(path) }
  get size(): number { return this.atoms.size }
  *allAtoms(): IterableIterator<AtomNode> { yield* this.atoms.values() }
  edgesOut(path: AtomPath): EdgeNode[] { return this.edgesOutMap.get(path) ?? [] }
  edgesIn(path: AtomPath): EdgeNode[] { return this.edgesInMap.get(path) ?? [] }
  byType(type: string): Set<AtomPath> { return this.byTypeMap.get(type) ?? new Set() }
  byScope(scope: string): Set<AtomPath> { return this.byScopeMap.get(scope) ?? new Set() }

  pathsMatching(glob: string): AtomPath[] {
    const prefix = glob.endsWith('/*') ? glob.slice(0, -2) : glob
    return Array.from(this.atoms.keys()).filter(p => p === prefix || p.startsWith(prefix + '/'))
  }
}
