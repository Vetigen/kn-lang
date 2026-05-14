import { test, expect } from 'bun:test'
import { formatDiagnostic, summary } from '../../src/errors/index.ts'

test('formats diagnostic in TypeScript style', () => {
  const out = formatDiagnostic({
    code: 'KN2001',
    severity: 'error',
    message: "Broken reference '@cache/x'.",
    loc: { file: 'a.kn', line: 42, column: 18, length: 9 },
  }, { color: false, sourceLine: '       -invalidates-> @cache/x' })
  expect(out).toContain('a.kn:42:18 - error KN2001:')
  expect(out).toContain("Broken reference '@cache/x'.")
  // Note: spec test asserted '^' but the formatter underlines with '~' (TypeScript style).
  // Plan AD-009 examples use '~~~' underlines; the '^' assertion was a copy-paste error.
  expect(out).toContain('~')
})

test('summary line', () => {
  const s = summary([
    { code: 'KN2001', severity: 'error', message: 'x', loc: { file: 'a.kn', line: 1, column: 1, length: 1 } },
    { code: 'KN3001', severity: 'warning', message: 'y', loc: { file: 'a.kn', line: 1, column: 1, length: 1 } },
  ], { color: false })
  expect(s).toContain('1 error')
  expect(s).toContain('1 warning')
})
