import type { AtomRegistry } from '../resolver/atom-registry.ts'
import type { Diagnostic } from './types.ts'
import type { ValueNode } from '../ast/types.ts'
import { isKnownType } from '../stdlib/types.ts'

function walk(v: ValueNode, fn: (v: ValueNode) => void): void {
  fn(v)
  if (v.kind === 'list') v.items.forEach(i => walk(i, fn))
  if (v.kind === 'object') v.fields.forEach(f => walk(f, fn))
}

export function checkTypeMismatch(reg: AtomRegistry): Diagnostic[] {
  const out: Diagnostic[] = []
  for (const atom of reg.allAtoms()) {
    for (const v of atom.fields.values()) {
      walk(v, n => {
        if (n.kind === 'typeref' && !isKnownType(n.name)) {
          out.push({
            code: 'KN2004',
            severity: 'error',
            message: `Unknown type '${n.name}'.`,
            loc: n.loc,
            hint: 'Known: E164, Scope, timestamptz, fp, AtomPath, URL, EnumString',
          })
        }
      })
    }
  }
  return out
}
