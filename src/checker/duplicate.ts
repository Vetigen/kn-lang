import type { AtomRegistry } from '../resolver/atom-registry.ts'
import type { Diagnostic } from './types.ts'

export function checkDuplicates(reg: AtomRegistry): Diagnostic[] {
  const out: Diagnostic[] = []
  for (const { path, locations } of reg.getDuplicates()) {
    for (let i = 1; i < locations.length; i++) {
      out.push({
        code: 'KN2002',
        severity: 'error',
        message: `Duplicate atom '${path}'. Previously declared at ${locations[0]!.file}:${locations[0]!.line}.`,
        loc: locations[i]!,
      })
    }
  }
  return out
}
