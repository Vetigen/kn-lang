import type { AtomRegistry } from '../resolver/atom-registry.ts'
import type { Diagnostic } from './types.ts'
import { checkDuplicates } from './duplicate.ts'
import { checkBrokenRefs } from './broken-ref.ts'
import { checkEdges } from './broken-edge.ts'
import { checkTypeMismatch } from './type-mismatch.ts'
import { checkFreshness, type FreshnessConfig } from './freshness.ts'
import { checkRequiredFields } from './required-fields.ts'

export * from './types.ts'
export type { FreshnessConfig } from './freshness.ts'

export interface CheckOptions {
  freshness?: FreshnessConfig
}

const DEFAULT_FRESHNESS: FreshnessConfig = { warnAfterDays: 90, errorAfterDays: 365 }

export function runChecks(reg: AtomRegistry, opts: CheckOptions = {}): Diagnostic[] {
  return [
    ...checkDuplicates(reg),
    ...checkBrokenRefs(reg),
    ...checkEdges(reg),
    ...checkTypeMismatch(reg),
    ...checkFreshness(reg, opts.freshness ?? DEFAULT_FRESHNESS),
    ...checkRequiredFields(reg),
  ]
}
