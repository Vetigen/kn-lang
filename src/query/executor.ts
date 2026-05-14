import type { IndexedKnowledge } from '../indexer/index.ts'
import type { AtomNode, AtomPath, ValueNode } from '../ast/types.ts'
import type { GetOptions, QueryResult, LsEntry, TreeNode, Manifest, ManifestAtomEntry } from './types.ts'

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

  ls(prefix?: string): LsEntry[] {
    const all = Array.from(this.idx.allAtoms())
    const filtered = prefix
      ? all.filter(a => a.path === prefix || a.path.startsWith(prefix + '/'))
      : all
    return filtered
      .map(a => {
        const type = getStringField(a, 'type') ?? 'unknown'
        const scope = getStringListField(a, 'scope')
        return scope ? { path: a.path, type, scope } : { path: a.path, type }
      })
      .sort((x, y) => x.path.localeCompare(y.path))
  }

  tree(prefix?: string): TreeNode {
    const root: TreeNode = { segment: prefix ?? '@', children: [] }
    const stripPrefix = prefix && prefix.startsWith('@') ? prefix.slice(1) : prefix
    const entries = this.ls(prefix)
    for (const entry of entries) {
      let rel = entry.path.slice(1)
      if (stripPrefix && rel.startsWith(stripPrefix + '/')) rel = rel.slice(stripPrefix.length + 1)
      else if (stripPrefix && rel === stripPrefix) continue
      insertIntoTree(root, rel.split('/'), entry)
    }
    return root
  }

  search(pattern: string): AtomNode[] {
    const re = new RegExp(pattern, 'i')
    return Array.from(this.idx.allAtoms()).filter(atom => {
      if (re.test(atom.path)) return true
      for (const v of atom.fields.values()) {
        if (valueMatchesRegex(v, re)) return true
      }
      return false
    })
  }

  manifest(): Manifest {
    const atoms: Record<string, ManifestAtomEntry> = {}
    const namespaces = new Set<string>()
    const typeCounts: Record<string, number> = {}
    let edgeCount = 0
    for (const atom of this.idx.allAtoms()) {
      const type = getStringField(atom, 'type') ?? 'unknown'
      const scope = getStringListField(atom, 'scope')
      const freshness = getStringField(atom, 'freshness')
      const summary = getStringField(atom, 'entry') ?? getStringField(atom, 'purpose')
      const entry: ManifestAtomEntry = { type }
      if (scope) entry.scope = scope
      if (freshness) entry.freshness = freshness
      if (summary) entry.summary = summary
      atoms[atom.path] = entry

      const ns = atom.path.slice(1).split('/')[0]
      if (ns) namespaces.add(ns)
      typeCounts[type] = (typeCounts[type] ?? 0) + 1
      edgeCount += this.idx.edgesOut(atom.path).length
    }
    return {
      version: '0.1.0',
      builtAt: new Date().toISOString(),
      atoms,
      namespaces: Array.from(namespaces).sort(),
      typeCounts,
      edgeCount,
    }
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

function getStringField(atom: AtomNode, key: string): string | undefined {
  const v = atom.fields.get(key)
  if (!v) return undefined
  if (v.kind === 'string' || v.kind === 'identifier') return String(v.value)
  return undefined
}

function getStringListField(atom: AtomNode, key: string): string[] | undefined {
  const v = atom.fields.get(key)
  if (!v || v.kind !== 'list') return undefined
  const out: string[] = []
  for (const item of v.items) {
    if (item.kind === 'string' || item.kind === 'identifier') out.push(String(item.value))
  }
  return out.length > 0 ? out : undefined
}

function valueMatchesRegex(v: ValueNode, re: RegExp): boolean {
  if (v.kind === 'string' || v.kind === 'identifier') return re.test(String(v.value))
  if (v.kind === 'list') return v.items.some(i => valueMatchesRegex(i, re))
  if (v.kind === 'object') {
    for (const f of v.fields.values()) if (valueMatchesRegex(f, re)) return true
  }
  if (v.kind === 'ref') return re.test(v.target)
  if (v.kind === 'typeref') return re.test(v.name)
  return false
}

function insertIntoTree(root: TreeNode, segments: string[], entry: LsEntry): void {
  let cur = root
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]!
    let child = cur.children.find(c => c.segment === seg)
    if (!child) {
      child = { segment: seg, children: [] }
      cur.children.push(child)
    }
    if (i === segments.length - 1) {
      child.path = entry.path
      child.type = entry.type
    }
    cur = child
  }
}
