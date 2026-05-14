import type { SourceLocation } from '../ast/source-location.ts'

export interface Diagnostic {
  code: string
  severity: 'error' | 'warning'
  message: string
  loc: SourceLocation
  hint?: string
}
