import { runPipeline, type CompileOptions, type CompileResult } from './pipeline.ts'
import { writeDist } from './dist-writer.ts'

export * from './pipeline.ts'

export async function compile(opts: CompileOptions): Promise<CompileResult> {
  const result = await runPipeline(opts)
  if (result.diagnostics.filter(d => d.severity === 'error').length === 0) {
    await writeDist(opts.outDir, result)
  }
  return result
}
