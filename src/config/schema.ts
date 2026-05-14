export interface KnConfig {
  include: string[]
  exclude: string[]
  outDir: string
  strict: boolean
  freshness: { warnAfterDays: number; errorAfterDays: number }
}

export const DEFAULT_CONFIG: KnConfig = {
  include: ['knowledge/**/*.kn'],
  exclude: ['**/node_modules/**'],
  outDir: '.kn-dist',
  strict: false,
  freshness: { warnAfterDays: 90, errorAfterDays: 365 },
}
