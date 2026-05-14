import { knLexer } from './tokens.ts'
import { knParser } from './grammar.ts'
import { buildFile } from './ast-builder.ts'
import type { FileNode } from '../ast/types.ts'

export interface ParseError {
  code: string
  message: string
  file: string
  line: number
  column: number
}

export interface ParseResult {
  file: FileNode
  errors: ParseError[]
}

export function parseSource(source: string, filePath: string): ParseResult {
  const lex = knLexer.tokenize(source)
  const errors: ParseError[] = []

  for (const e of lex.errors) {
    errors.push({
      code: 'KN1001',
      message: e.message,
      file: filePath,
      line: e.line ?? 1,
      column: e.column ?? 1,
    })
  }

  knParser.input = lex.tokens
  const cst = knParser.file()

  for (const e of knParser.errors) {
    errors.push({
      code: 'KN1002',
      message: e.message,
      file: filePath,
      line: e.token.startLine ?? 1,
      column: e.token.startColumn ?? 1,
    })
  }

  const file: FileNode =
    errors.length > 0 && !cst
      ? { kind: 'file', filePath, nodes: [] }
      : buildFile(cst, filePath)

  return { file, errors }
}
