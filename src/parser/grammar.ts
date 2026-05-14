import { CstParser } from 'chevrotain'
import {
  allTokens, At, ModuleKw, LBrace, RBrace, Slash, Identifier,
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
    this.CONSUME(RBrace)
  })

  public atomDecl = this.RULE('atomDecl', () => {
    this.CONSUME(At)
    this.SUBRULE(this.atomPath)
    this.CONSUME(LBrace)
    this.CONSUME(RBrace)
  })

  public atomPath = this.RULE('atomPath', () => {
    this.CONSUME(Identifier)
    this.MANY(() => {
      this.CONSUME(Slash)
      this.CONSUME2(Identifier)
    })
  })
}

export const knParser = new KnParser()
