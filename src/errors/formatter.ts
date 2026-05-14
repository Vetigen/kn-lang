import chalk from 'chalk'
import type { Diagnostic } from '../checker/types.ts'

export interface FormatOptions {
  color?: boolean
  sourceLine?: string
}

export function formatDiagnostic(d: Diagnostic, opts: FormatOptions = {}): string {
  const useColor = opts.color !== false && process.stdout.isTTY !== false
  const c = useColor ? chalk : { red: (s: string) => s, yellow: (s: string) => s, gray: (s: string) => s, bold: (s: string) => s }
  const sev = d.severity === 'error' ? c.red('error') : c.yellow('warning')
  const loc = c.gray(`${d.loc.file}:${d.loc.line}:${d.loc.column}`)
  const codeName = c.bold(d.code)
  let out = `${loc} - ${sev} ${codeName}: ${d.message}`
  if (opts.sourceLine) {
    out += `\n\n${d.loc.line.toString().padStart(2)} ${opts.sourceLine}`
    const caret = '~'.repeat(Math.max(1, d.loc.length))
    out += `\n   ${' '.repeat(d.loc.column - 1)}${c.red(caret)}`
  }
  if (d.hint) out += `\n  ${c.gray('hint: ' + d.hint)}`
  return out + '\n'
}

export function summary(diags: Diagnostic[], opts: FormatOptions = {}): string {
  const useColor = opts.color !== false && process.stdout.isTTY !== false
  const c = useColor ? chalk : { red: (s: string) => s, yellow: (s: string) => s }
  const errors = diags.filter(d => d.severity === 'error').length
  const warnings = diags.filter(d => d.severity === 'warning').length
  const files = new Set(diags.map(d => d.loc.file)).size
  const e = errors === 0 ? 'no errors' : c.red(`${errors} error${errors !== 1 ? 's' : ''}`)
  const w = warnings === 0 ? '' : ` and ${c.yellow(`${warnings} warning${warnings !== 1 ? 's' : ''}`)}`
  return `Found ${e}${w} in ${files} file${files !== 1 ? 's' : ''}.`
}
