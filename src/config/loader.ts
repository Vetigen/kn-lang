import { DEFAULT_CONFIG, type KnConfig } from './schema.ts'

export async function loadConfig(path = 'kn.config.json'): Promise<KnConfig> {
  const file = Bun.file(path)
  if (!(await file.exists())) return { ...DEFAULT_CONFIG }
  const raw = (await file.json()) as Partial<KnConfig>
  return {
    include: raw.include ?? DEFAULT_CONFIG.include,
    exclude: raw.exclude ?? DEFAULT_CONFIG.exclude,
    outDir: raw.outDir ?? DEFAULT_CONFIG.outDir,
    strict: raw.strict ?? DEFAULT_CONFIG.strict,
    freshness: { ...DEFAULT_CONFIG.freshness, ...(raw.freshness ?? {}) },
  }
}
