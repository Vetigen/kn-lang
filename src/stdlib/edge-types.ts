export const EDGE_TYPES = [
  'uses',
  'publishes',
  'consumes',
  'invalidates',
  'owned-by',
  'creates',
  'revokes',
  'see-also',
] as const

export type EdgeType = typeof EDGE_TYPES[number]

export function isKnownEdgeType(name: string): boolean {
  return (EDGE_TYPES as readonly string[]).includes(name)
}
