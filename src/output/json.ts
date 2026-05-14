export function outputJson(data: unknown): string {
  return JSON.stringify(data, replacer, 2)
}

function replacer(_key: string, value: unknown): unknown {
  if (value instanceof Map) return Object.fromEntries(value)
  if (value instanceof Set) return Array.from(value)
  return value
}
