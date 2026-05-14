import { createToken, Lexer } from 'chevrotain'

// Skipped (whitespace + comments)
export const Whitespace = createToken({
  name: 'Whitespace',
  pattern: /[ \t\r\n]+/,
  group: Lexer.SKIPPED,
})

export const Comment = createToken({
  name: 'Comment',
  pattern: /#[^\n]*/,
  group: Lexer.SKIPPED,
})

// Punctuation
export const At        = createToken({ name: 'At', pattern: /@/ })
export const LBrace    = createToken({ name: 'LBrace', pattern: /\{/ })
export const RBrace    = createToken({ name: 'RBrace', pattern: /\}/ })
export const LBracket  = createToken({ name: 'LBracket', pattern: /\[/ })
export const RBracket  = createToken({ name: 'RBracket', pattern: /\]/ })
export const LParen    = createToken({ name: 'LParen', pattern: /\(/ })
export const RParen    = createToken({ name: 'RParen', pattern: /\)/ })
export const Colon     = createToken({ name: 'Colon', pattern: /:/ })
export const Comma     = createToken({ name: 'Comma', pattern: /,/ })
export const Slash     = createToken({ name: 'Slash', pattern: /\// })
export const Arrow     = createToken({ name: 'Arrow', pattern: /->/ })
export const Dash      = createToken({ name: 'Dash', pattern: /-/ })
export const PipelineArrow = createToken({ name: 'PipelineArrow', pattern: /→/ })
export const Dot       = createToken({ name: 'Dot', pattern: /\./ })
export const Star      = createToken({ name: 'Star', pattern: /\*/ })
export const Hash      = createToken({ name: 'Hash', pattern: /#/ })

// Literals
export const StringLiteral = createToken({
  name: 'StringLiteral',
  pattern: /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/,
})

export const NumberLiteral = createToken({
  name: 'NumberLiteral',
  pattern: /\d+(?:\.\d+)?(?:h|min|s|d|gün|gun)?/,
})

// Keywords (must come before Identifier)
// NOTE: Plan included `longer_alt: undefined` in createToken options — incompatible with
// chevrotain v12 + exactOptionalPropertyTypes. The LONGER_ALT assignment below is what
// actually wires up the longer-alt resolution.
export const True      = createToken({ name: 'True', pattern: /true\b/ })
export const False     = createToken({ name: 'False', pattern: /false\b/ })
export const RefKw     = createToken({ name: 'RefKw', pattern: /ref\b/ })
export const ModuleKw  = createToken({ name: 'ModuleKw', pattern: /module\b/ })

// Identifier (kebab-case)
// NOTE: Pattern tightened from plan's /[a-zA-Z_][a-zA-Z0-9_-]*/ to disallow trailing dash —
// otherwise `uses-` is greedily matched, breaking `-uses->` Arrow tokenization.
export const Identifier = createToken({
  name: 'Identifier',
  pattern: /[a-zA-Z_][a-zA-Z0-9_]*(?:-[a-zA-Z0-9_]+)*/,
})

// Fix keyword longer_alt
True.LONGER_ALT = Identifier
False.LONGER_ALT = Identifier
RefKw.LONGER_ALT = Identifier
ModuleKw.LONGER_ALT = Identifier

export const allTokens = [
  Whitespace,
  Comment,
  // Multi-char first
  Arrow,
  PipelineArrow,
  // Keywords
  True,
  False,
  RefKw,
  ModuleKw,
  // Literals
  StringLiteral,
  NumberLiteral,
  // Single-char punctuation
  // NOTE: Hash is exported but excluded from allTokens — Comment /#[^\n]*/ subsumes Hash /#/,
  // making Hash unreachable. Future slot-ref work (Task 6+) needs to redesign disambiguation.
  At, LBrace, RBrace, LBracket, RBracket, LParen, RParen,
  Colon, Comma, Slash, Dash, Dot, Star,
  // Identifier last
  Identifier,
]

export const knLexer = new Lexer(allTokens, {
  positionTracking: 'full',
  ensureOptimizations: false,
})
