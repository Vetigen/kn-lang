import type { AtomRegistry } from '../resolver/atom-registry.ts'
import type { Diagnostic } from './types.ts'
import { isKnownEdgeType } from '../stdlib/edge-types.ts'

export function checkEdges(reg: AtomRegistry): Diagnostic[] {
  const out: Diagnostic[] = []
  for (const edge of reg.allEdges()) {
    if (!isKnownEdgeType(edge.edgeType)) {
      out.push({
        code: 'KN2005',
        severity: 'error',
        message: `Unknown edge type '${edge.edgeType}'.`,
        loc: edge.loc,
        hint: 'Known: uses, publishes, consumes, invalidates, owned-by, creates, revokes, see-also',
      })
    }
    if (!reg.has(edge.from)) {
      out.push({
        code: 'KN2003',
        severity: 'error',
        message: `Edge source '${edge.from}' is not a declared atom.`,
        loc: edge.loc,
      })
    }
    if (edge.isGlob) {
      if (reg.pathsMatching(edge.to + '/*').length === 0) {
        out.push({
          code: 'KN2003',
          severity: 'error',
          message: `Edge target glob '${edge.to}/*' matches no atoms.`,
          loc: edge.loc,
        })
      }
    } else if (!reg.has(edge.to)) {
      out.push({
        code: 'KN2003',
        severity: 'error',
        message: `Edge target '${edge.to}' is not a declared atom.`,
        loc: edge.loc,
      })
    }
  }
  return out
}
