import type { IToken } from 'chevrotain'

export interface SourceLocation {
  file: string
  line: number
  column: number
  length: number
}

export function sourceLocationFromToken(token: IToken, file: string): SourceLocation {
  return {
    file,
    line: token.startLine ?? 1,
    column: token.startColumn ?? 1,
    length: token.image.length,
  }
}

export function formatLocation(loc: SourceLocation): string {
  return `${loc.file}:${loc.line}:${loc.column}`
}
