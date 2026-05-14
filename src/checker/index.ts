import type { AtomRegistry } from '../resolver/atom-registry.ts'
import type { Diagnostic } from './types.ts'
import { checkDuplicates } from './duplicate.ts'
import { checkBrokenRefs } from './broken-ref.ts'
import { checkEdges } from './broken-edge.ts'

export * from './types.ts'

export function runChecks(reg: AtomRegistry): Diagnostic[] {
  return [
    ...checkDuplicates(reg),
    ...checkBrokenRefs(reg),
    ...checkEdges(reg),
  ]
}
