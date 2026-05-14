import type { IndexedKnowledge } from '../indexer/index.ts'
import type { AtomNode, AtomPath } from '../ast/types.ts'
import type { GetOptions, QueryResult } from './types.ts'

export class QueryExecutor {
  constructor(private readonly idx: IndexedKnowledge) {}

  get(query: AtomPath, opts: GetOptions = {}): QueryResult {
    const seeds = query.endsWith('/*')
      ? this.idx.pathsMatching(query)
      : this.idx.has(query) ? [query] : []

    const expanded = this.expand(seeds, opts.depth ?? 0)
    let atoms = expanded.map(p => this.idx.get(p)!).filter(Boolean)
    if (opts.type) atoms = atoms.filter(a => fieldEquals(a, 'type', opts.type!))
    if (opts.scope) atoms = atoms.filter(a => scopeContains(a, opts.scope!))

    const atomSet = new Set(atoms.map(a => a.path))
    const edges = atoms.flatMap(a => this.idx.edgesOut(a.path)).filter(e => atomSet.has(e.to))
    return { atoms, edges }
  }

  private expand(seeds: AtomPath[], depth: number): AtomPath[] {
    const seen = new Set<AtomPath>(seeds)
    let frontier = seeds
    for (let d = 0; d < depth; d++) {
      const next: AtomPath[] = []
      for (const p of frontier) {
        for (const e of this.idx.edgesOut(p)) if (!seen.has(e.to)) { seen.add(e.to); next.push(e.to) }
        for (const e of this.idx.edgesIn(p))  if (!seen.has(e.from)) { seen.add(e.from); next.push(e.from) }
      }
      if (next.length === 0) break
      frontier = next
    }
    return Array.from(seen)
  }
}

function fieldEquals(atom: AtomNode, key: string, value: string): boolean {
  const f = atom.fields.get(key)
  if (!f) return false
  if (f.kind === 'identifier' || f.kind === 'string') return f.value === value
  return false
}

function scopeContains(atom: AtomNode, scope: string): boolean {
  const f = atom.fields.get('scope')
  if (!f || f.kind !== 'list') return false
  return f.items.some(s => (s.kind === 'identifier' || s.kind === 'string') && s.value === scope)
}
