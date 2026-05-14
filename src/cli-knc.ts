#!/usr/bin/env bun
import { Command } from 'commander'
import { mkdir } from 'node:fs/promises'
import { compile, runPipeline } from './compiler/index.ts'
import { loadConfig, DEFAULT_CONFIG } from './config/index.ts'
import { formatDiagnostic, summary } from './errors/index.ts'

const AUTHORING_TEMPLATE = `# Authoring KN

## Atom shape

    @<namespace>/<name> {
      type: flow | entity | convention | module | decision
      <field>: <value>
      ref: src/path/to/code.ts
      freshness: YYYY-MM-DD
    }

## Edge shape

    @<from> -<edge-type>-> @<to>

## Edge types (closed list, 8)
uses · publishes · consumes · invalidates ·
owned-by · creates · revokes · see-also

## Value types
"string"  42  6h  true  identifier  [list]  { obj }
ref(@path)  E164  fp(prefix_)  timestamptz

## Required fields
- \`type\` (KN4001 if missing)
- \`freshness\` recommended (KN3001/2 warning)

## Validate

    knc check --strict

## Session workflow (for AI tools)

1. \`kn ls\`              ← atom map
2. \`kn get @<path>\`     ← read a module
3. write new atom        ← see knowledge/_examples/
4. \`knc check --strict\` ← validate

## Discovery decision matrix

| Scenario                                | Command                          |
|-----------------------------------------|----------------------------------|
| Session start, no context               | \`kn ls\` or \`kn manifest\`     |
| Know module, want atoms                 | \`kn tree @<module>\`            |
| Know keyword, want atoms                | \`kn search "<keyword>"\`        |
| Know path, want atom                    | \`kn get @<path>\`               |
| Atom + neighbors                        | \`kn get @<path> --depth 1\`     |
| How is A connected to B?                | \`kn trace @a @b\`               |
| Why this rule?                          | \`kn why @atom#field\`           |
| What changed recently?                  | \`kn diff --since <date>\`       |
`

const FLOW_EXAMPLE = `# Flow atom example
@example/login-flow {
  type: flow
  entry: "POST /auth/login"
  contract: {
    in: { phone: E164, password: "string" }
    out: { jwt: "string", scope: Scope }
    err: [AUTH.INVALID_CREDENTIALS]
  }
  invariants: [
    { name: "rate-limit", since: "2026-01-01", reason: "brute force protection" }
  ]
  ref: "src/auth/login.ts"
  freshness: "2026-05-14"
}
`

const ENTITY_EXAMPLE = `# Entity atom example
@example/user {
  type: entity
  identity: fp(user_)
  storage: postgres
  ref: "src/users/user.entity.ts"
  freshness: "2026-05-14"
}
`

const CONVENTION_EXAMPLE = `# Convention atom example
@example/cache-invalidation {
  type: convention
  invalidation: "bumpScopeVersion(ns) AFTER commit"
  ttl-entry: 60s
  ref: "src/cache/conventions.md"
  freshness: "2026-05-14"
}
`

const program = new Command()
program.name('knc').version('0.1.0').description('KN compiler')

program
  .command('init')
  .option('--cwd <dir>', 'working directory', process.cwd())
  .action(async (opts) => {
    await mkdir(opts.cwd, { recursive: true })
    process.chdir(opts.cwd)
    const path = 'kn.config.json'
    if (await Bun.file(path).exists()) {
      console.error('kn.config.json already exists.')
      process.exit(1)
    }
    await Bun.write(path, JSON.stringify(DEFAULT_CONFIG, null, 2))
    await Bun.write('knowledge/.gitkeep', '')
    await Bun.write('AUTHORING.md', AUTHORING_TEMPLATE)
    await Bun.write('knowledge/_examples/flow.example.kn', FLOW_EXAMPLE)
    await Bun.write('knowledge/_examples/entity.example.kn', ENTITY_EXAMPLE)
    await Bun.write('knowledge/_examples/convention.example.kn', CONVENTION_EXAMPLE)
    console.log('Initialized kn.config.json, AUTHORING.md, and knowledge/_examples/.')
  })

program
  .command('build')
  .option('--cwd <dir>', 'working directory', process.cwd())
  .action(async (opts) => {
    process.chdir(opts.cwd)
    const cfg = await loadConfig()
    const result = await compile({
      include: cfg.include,
      exclude: cfg.exclude,
      outDir: cfg.outDir,
      freshness: cfg.freshness,
    })
    for (const d of result.diagnostics) process.stderr.write(formatDiagnostic(d))
    process.stderr.write(summary(result.diagnostics) + '\n')
    const errCount = result.diagnostics.filter(d => d.severity === 'error').length
    process.exit(errCount > 0 ? 1 : 0)
  })

program
  .command('check')
  .option('--cwd <dir>', 'working directory', process.cwd())
  .option('--strict', 'treat warnings as errors')
  .action(async (opts) => {
    process.chdir(opts.cwd)
    const cfg = await loadConfig()
    const result = await runPipeline({
      include: cfg.include,
      exclude: cfg.exclude,
      outDir: cfg.outDir,
      freshness: cfg.freshness,
    })
    for (const d of result.diagnostics) process.stderr.write(formatDiagnostic(d))
    process.stderr.write(summary(result.diagnostics) + '\n')
    const errCount = result.diagnostics.filter(d => d.severity === 'error').length
    const warnCount = result.diagnostics.filter(d => d.severity === 'warning').length
    const failOn = opts.strict ? errCount + warnCount : errCount
    process.exit(failOn > 0 ? 1 : 0)
  })

program.parseAsync(Bun.argv).catch(e => {
  console.error(e)
  process.exit(2)
})
