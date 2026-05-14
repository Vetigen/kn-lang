import { CstParser } from 'chevrotain'
import {
  allTokens, At, ModuleKw, LBrace, RBrace, Slash, Identifier,
  Colon, Comma, StringLiteral, NumberLiteral, True, False,
  LBracket, RBracket, LParen, RParen, RefKw,
} from './tokens.ts'

export class KnParser extends CstParser {
  constructor() {
    super(allTokens, { recoveryEnabled: true })
    this.performSelfAnalysis()
  }

  public file = this.RULE('file', () => {
    this.MANY(() => {
      this.OR([
        { ALT: () => this.SUBRULE(this.moduleDecl) },
        { ALT: () => this.SUBRULE(this.atomDecl) },
      ])
    })
  })

  public moduleDecl = this.RULE('moduleDecl', () => {
    this.CONSUME(At)
    this.CONSUME(ModuleKw)
    this.SUBRULE(this.atomPath)
    this.CONSUME(LBrace)
    this.MANY_SEP({
      SEP: Comma,
      DEF: () => this.SUBRULE(this.field),
    })
    this.CONSUME(RBrace)
  })

  public atomDecl = this.RULE('atomDecl', () => {
    this.CONSUME(At)
    this.SUBRULE(this.atomPath)
    this.CONSUME(LBrace)
    this.MANY_SEP({
      SEP: Comma,
      DEF: () => this.SUBRULE(this.field),
    })
    this.CONSUME(RBrace)
  })

  public atomPath = this.RULE('atomPath', () => {
    this.CONSUME(Identifier)
    this.MANY(() => {
      this.CONSUME(Slash)
      this.CONSUME2(Identifier)
    })
  })

  public field = this.RULE('field', () => {
    this.CONSUME(Identifier)
    this.CONSUME(Colon)
    this.SUBRULE(this.value)
  })

  public value = this.RULE('value', () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.refValue) },
      { ALT: () => this.SUBRULE(this.listValue) },
      { ALT: () => this.SUBRULE(this.objectValue) },
      { ALT: () => this.SUBRULE(this.scalarOrTypeRef) },
    ])
  })

  public refValue = this.RULE('refValue', () => {
    this.CONSUME(RefKw)
    this.CONSUME(LParen)
    this.CONSUME(At)
    this.SUBRULE(this.atomPath)
    this.CONSUME(RParen)
  })

  public listValue = this.RULE('listValue', () => {
    this.CONSUME(LBracket)
    this.MANY_SEP({
      SEP: Comma,
      DEF: () => this.SUBRULE(this.value),
    })
    this.CONSUME(RBracket)
  })

  public objectValue = this.RULE('objectValue', () => {
    this.CONSUME(LBrace)
    this.MANY_SEP({
      SEP: Comma,
      DEF: () => this.SUBRULE(this.field),
    })
    this.CONSUME(RBrace)
  })

  public scalarOrTypeRef = this.RULE('scalarOrTypeRef', () => {
    this.OR([
      { ALT: () => this.CONSUME(StringLiteral) },
      { ALT: () => this.CONSUME(NumberLiteral) },
      { ALT: () => this.CONSUME(True) },
      { ALT: () => this.CONSUME(False) },
      {
        ALT: () => {
          this.CONSUME(Identifier)
          this.OPTION(() => {
            this.CONSUME(LParen)
            this.MANY_SEP({
              SEP: Comma,
              DEF: () => this.OR2([
                { ALT: () => this.CONSUME2(Identifier) },
                { ALT: () => this.CONSUME2(StringLiteral) },
                { ALT: () => this.CONSUME2(NumberLiteral) },
              ]),
            })
            this.CONSUME(RParen)
          })
        },
      },
    ])
  })
}

export const knParser = new KnParser()
