import type { AtomRegistry } from '../resolver/atom-registry.ts'
import type { Diagnostic } from './types.ts'

export interface FreshnessConfig {
  warnAfterDays: number
  errorAfterDays: number
}

export function checkFreshness(reg: AtomRegistry, cfg: FreshnessConfig): Diagnostic[] {
  const out: Diagnostic[] = []
  const now = Date.now()
  for (const atom of reg.allAtoms()) {
    const f = atom.fields.get('freshness')
    if (!f) continue
    if (f.kind !== 'identifier' && f.kind !== 'string') continue
    const dateStr = (f.kind === 'string' ? f.value : f.value).split(/\s+/)[0]!
    const t = Date.parse(dateStr)
    if (Number.isNaN(t)) continue
    const days = (now - t) / 86400000
    if (days > cfg.errorAfterDays) {
      out.push({
        code: 'KN3002',
        severity: 'error',
        message: `Atom freshness ${Math.floor(days)} days old (> errorAfterDays=${cfg.errorAfterDays}).`,
        loc: f.loc,
      })
    } else if (days > cfg.warnAfterDays) {
      out.push({
        code: 'KN3001',
        severity: 'warning',
        message: `Atom freshness ${Math.floor(days)} days old (> warnAfterDays=${cfg.warnAfterDays}).`,
        loc: f.loc,
      })
    }
  }
  return out
}
