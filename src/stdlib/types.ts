export const BUILTIN_TYPES = [
  'E164',
  'Scope',
  'timestamptz',
  'fp',
  'AtomPath',
  'URL',
  'EnumString',
] as const

export type BuiltinType = typeof BUILTIN_TYPES[number]

export function isKnownType(name: string): boolean {
  return (BUILTIN_TYPES as readonly string[]).includes(name)
}
