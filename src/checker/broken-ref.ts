import type { AtomRegistry } from '../resolver/atom-registry.ts'
import type { Diagnostic } from './types.ts'
import type { ValueNode } from '../ast/types.ts'

function walkValues(value: ValueNode, fn: (v: ValueNode) => void): void {
  fn(value)
  if (value.kind === 'list') value.items.forEach(i => walkValues(i, fn))
  if (value.kind === 'object') value.fields.forEach(v => walkValues(v, fn))
}

export function checkBrokenRefs(reg: AtomRegistry): Diagnostic[] {
  const out: Diagnostic[] = []
  for (const atom of reg.allAtoms()) {
    for (const v of atom.fields.values()) {
      walkValues(v, ref => {
        if (ref.kind === 'ref' && !reg.has(ref.target)) {
          out.push({
            code: 'KN2001',
            severity: 'error',
            message: `Broken reference '${ref.target}'.`,
            loc: ref.loc,
          })
        }
      })
    }
  }
  return out
}
