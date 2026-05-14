#!/usr/bin/env bun
import { Command } from 'commander'
import { IndexedKnowledge } from './indexer/index.ts'
import { AtomRegistry } from './resolver/index.ts'
import { QueryExecutor } from './query/index.ts'
import { parseSource } from './parser/index.ts'
import { loadConfig } from './config/index.ts'
import { outputJson, outputGetHuman, outputTraceHuman, outputLsHuman, outputTreeHuman } from './output/index.ts'
import { Glob } from 'bun'

async function loadIndex(cwd: string): Promise<QueryExecutor> {
  process.chdir(cwd)
  const cfg = await loadConfig()
  const reg = new AtomRegistry()
  for (const pattern of cfg.include) {
    const glob = new Glob(pattern)
    for await (const path of glob.scan('.')) {
      const src = await Bun.file(path).text()
      reg.addFile(parseSource(src, path).file)
    }
  }
  return new QueryExecutor(IndexedKnowledge.fromRegistry(reg))
}

const program = new Command()
program.name('kn').version('0.1.0').description('KN query CLI')

program
  .command('get <path>')
  .option('--depth <n>', 'expand N hops', '0')
  .option('--type <t>', 'filter by atom type')
  .option('--scope <s>', 'filter by scope')
  .option('--json', 'JSON output')
  .option('--cwd <dir>', 'working directory', process.cwd())
  .action(async (path, opts) => {
    const qx = await loadIndex(opts.cwd)
    const result = qx.get(path, {
      depth: parseInt(opts.depth, 10),
      ...(opts.type ? { type: opts.type } : {}),
      ...(opts.scope ? { scope: opts.scope } : {}),
    })
    process.stdout.write(opts.json ? outputJson(result) : outputGetHuman(result))
  })

program
  .command('trace <from> <to>')
  .option('--json', 'JSON output')
  .option('--cwd <dir>', 'working directory', process.cwd())
  .action(async (from, to, opts) => {
    const qx = await loadIndex(opts.cwd)
    const result = qx.trace(from, to)
    process.stdout.write(opts.json ? outputJson(result) : outputTraceHuman(result))
  })

program
  .command('why <query>')
  .option('--json', 'JSON output')
  .option('--cwd <dir>', 'working directory', process.cwd())
  .action(async (query, opts) => {
    const qx = await loadIndex(opts.cwd)
    const result = qx.why(query)
    process.stdout.write(opts.json ? outputJson(result) : JSON.stringify(result, null, 2) + '\n')
  })

program
  .command('diff')
  .requiredOption('--since <date>', 'ISO date YYYY-MM-DD')
  .option('--json', 'JSON output')
  .option('--cwd <dir>', 'working directory', process.cwd())
  .action(async (opts) => {
    const qx = await loadIndex(opts.cwd)
    const result = qx.diff(opts.since)
    process.stdout.write(opts.json ? outputJson({ atoms: result }) : outputGetHuman({ atoms: result, edges: [] }))
  })

program
  .command('check')
  .option('--strict', 'treat warnings as errors')
  .option('--cwd <dir>', 'working directory', process.cwd())
  .action(async (opts) => {
    const args = ['src/cli-knc.ts', 'check', '--cwd', opts.cwd]
    if (opts.strict) args.push('--strict')
    const proc = Bun.spawn([process.execPath, ...args], { stdout: 'inherit', stderr: 'inherit' })
    await proc.exited
    process.exit(proc.exitCode ?? 0)
  })

program
  .command('ls [prefix]')
  .description('list atoms (path + type)')
  .option('--json', 'JSON output')
  .option('--cwd <dir>', 'working directory', process.cwd())
  .action(async (prefix, opts) => {
    const qx = await loadIndex(opts.cwd)
    const result = qx.ls(prefix)
    process.stdout.write(opts.json ? outputJson(result) : outputLsHuman(result))
  })

program
  .command('tree [prefix]')
  .description('hierarchical tree of atoms')
  .option('--json', 'JSON output')
  .option('--cwd <dir>', 'working directory', process.cwd())
  .action(async (prefix, opts) => {
    const qx = await loadIndex(opts.cwd)
    const result = qx.tree(prefix)
    process.stdout.write(opts.json ? outputJson(result) : outputTreeHuman(result))
  })

program
  .command('search <pattern>')
  .description('regex/case-insensitive search across paths and field values')
  .option('--json', 'JSON output')
  .option('--cwd <dir>', 'working directory', process.cwd())
  .action(async (pattern, opts) => {
    const qx = await loadIndex(opts.cwd)
    const result = qx.search(pattern)
    process.stdout.write(opts.json ? outputJson({ atoms: result }) : outputGetHuman({ atoms: result, edges: [] }))
  })

program
  .command('manifest')
  .description('AI-friendly corpus summary (JSON)')
  .option('--cwd <dir>', 'working directory', process.cwd())
  .action(async (opts) => {
    const qx = await loadIndex(opts.cwd)
    process.stdout.write(JSON.stringify(qx.manifest(), null, 2) + '\n')
  })

program.parseAsync(Bun.argv).catch(e => { console.error(e); process.exit(2) })
