import chalk from 'chalk'
import type { QueryResult, TraceResult } from '../query/types.ts'

export function outputGetHuman(result: QueryResult): string {
  if (result.atoms.length === 0) return chalk.gray('(no atoms matched)\n')
  let s = ''
  for (const atom of result.atoms) {
    s += chalk.bold(atom.path) + '\n'
    for (const [k, v] of atom.fields) {
      s += `  ${chalk.cyan(k)}: ${formatValue(v)}\n`
    }
    s += '\n'
  }
  if (result.edges.length > 0) {
    s += chalk.bold('Edges:\n')
    for (const e of result.edges) s += `  ${e.from} ${chalk.yellow('-' + e.edgeType + '->')} ${e.to}\n`
  }
  return s
}

export function outputTraceHuman(result: TraceResult): string {
  if (!result.found) return chalk.gray('(no path found)\n')
  return result.path.join(chalk.yellow(' → ')) + '\n'
}

function formatValue(v: import('../ast/types.ts').ValueNode): string {
  switch (v.kind) {
    case 'string': return JSON.stringify(v.value)
    case 'number': return `${v.value}${v.unit ?? ''}`
    case 'boolean': return String(v.value)
    case 'identifier': return v.value
    case 'list': return '[' + v.items.map(formatValue).join(', ') + ']'
    case 'object': return '{ ... }'
    case 'ref': return `ref(${v.target})`
    case 'typeref': return `${v.name}(${v.args.join(', ')})`
    case 'pipeline': return v.steps.map(s => `${s.index}. ${s.label}`).join(' → ')
    case 'invariants': return v.items.map(i => '- ' + i.text).join('\n  ')
  }
}
