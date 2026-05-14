import type { AtomNode, EdgeNode, FileNode, AtomPath } from '../ast/types.ts'
import type { SourceLocation } from '../ast/source-location.ts'
import { isAtom, isEdge } from '../ast/types.ts'

export interface DuplicateReport {
  path: AtomPath
  locations: SourceLocation[]
}

export class AtomRegistry {
  private atoms = new Map<AtomPath, AtomNode>()
  private duplicates = new Map<AtomPath, SourceLocation[]>()
  private edges: EdgeNode[] = []

  addFile(file: FileNode): void {
    for (const node of file.nodes) {
      if (isAtom(node)) {
        if (this.atoms.has(node.path)) {
          const existing = this.atoms.get(node.path)!
          const list = this.duplicates.get(node.path) ?? [existing.loc]
          list.push(node.loc)
          this.duplicates.set(node.path, list)
        } else {
          this.atoms.set(node.path, node)
        }
      } else if (isEdge(node)) {
        this.edges.push(node)
      }
    }
  }

  get(path: AtomPath): AtomNode | undefined {
    return this.atoms.get(path)
  }

  has(path: AtomPath): boolean {
    return this.atoms.has(path)
  }

  get size(): number {
    return this.atoms.size
  }

  *allAtoms(): IterableIterator<AtomNode> {
    yield* this.atoms.values()
  }

  allEdges(): readonly EdgeNode[] {
    return this.edges
  }

  getDuplicates(): DuplicateReport[] {
    return Array.from(this.duplicates.entries()).map(([path, locations]) => ({ path, locations }))
  }

  pathsMatching(glob: string): AtomPath[] {
    const prefix = glob.endsWith('/*') ? glob.slice(0, -2) : glob
    return Array.from(this.atoms.keys()).filter(p => p === prefix || p.startsWith(prefix + '/'))
  }
}
