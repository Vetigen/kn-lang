import { Glob } from 'bun'
import { parseSource } from '../parser/index.ts'
import { AtomRegistry } from '../resolver/index.ts'
import { runChecks, type Diagnostic, type FreshnessConfig } from '../checker/index.ts'
import { IndexedKnowledge } from '../indexer/index.ts'

export interface CompileOptions {
  include: string[]
  exclude?: string[]
  outDir: string
  freshness: FreshnessConfig
}

export interface CompileResult {
  registry: AtomRegistry
  index: IndexedKnowledge
  diagnostics: Diagnostic[]
  manifest: { version: string; builtAt: string; sourceHash: string; atomCount: number; edgeCount: number }
}

export async function runPipeline(opts: CompileOptions): Promise<CompileResult> {
  const registry = new AtomRegistry()
  const diagnostics: Diagnostic[] = []
  const filesProcessed: string[] = []

  for (const pattern of opts.include) {
    const glob = new Glob(pattern)
    for await (const path of glob.scan('.')) {
      if (opts.exclude?.some(e => new Glob(e).match(path))) continue
      const src = await Bun.file(path).text()
      const result = parseSource(src, path)
      for (const e of result.errors) {
        diagnostics.push({
          code: e.code,
          severity: 'error',
          message: e.message,
          loc: { file: e.file, line: e.line, column: e.column, length: 1 },
        })
      }
      registry.addFile(result.file)
      filesProcessed.push(path)
    }
  }

  diagnostics.push(...runChecks(registry, { freshness: opts.freshness }))
  const index = IndexedKnowledge.fromRegistry(registry)

  const sourceHash = await hashFiles(filesProcessed)
  const manifest = {
    version: '0.1.0',
    builtAt: new Date().toISOString(),
    sourceHash,
    atomCount: index.size,
    edgeCount: Array.from(index.allAtoms()).reduce((acc, a) => acc + index.edgesOut(a.path).length, 0),
  }

  return { registry, index, diagnostics, manifest }
}

async function hashFiles(paths: string[]): Promise<string> {
  const hasher = new Bun.CryptoHasher('sha256')
  for (const p of paths.sort()) {
    hasher.update(p)
    hasher.update(await Bun.file(p).arrayBuffer())
  }
  return hasher.digest('hex')
}
