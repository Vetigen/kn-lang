import type { AtomRegistry } from '../resolver/atom-registry.ts'
import type { Diagnostic } from './types.ts'

export function checkRequiredFields(reg: AtomRegistry): Diagnostic[] {
  const out: Diagnostic[] = []
  for (const atom of reg.allAtoms()) {
    if (!atom.fields.has('type')) {
      out.push({
        code: 'KN4001',
        severity: 'error',
        message: `Atom '${atom.path}' is missing required field 'type'.`,
        loc: atom.loc,
      })
    }
  }
  return out
}
