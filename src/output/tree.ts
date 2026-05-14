import chalk from 'chalk'
import type { TreeNode, LsEntry } from '../query/types.ts'

export function outputTreeHuman(root: TreeNode): string {
  const lines: string[] = []
  if (root.segment !== '@') lines.push(chalk.bold(root.segment))
  renderChildren(root.children, '', lines)
  return lines.join('\n') + '\n'
}

function renderChildren(nodes: TreeNode[], prefix: string, lines: string[]): void {
  const sorted = [...nodes].sort((a, b) => a.segment.localeCompare(b.segment))
  sorted.forEach((node, idx) => {
    const isLast = idx === sorted.length - 1
    const branch = isLast ? '└── ' : '├── '
    const continuation = isLast ? '    ' : '│   '
    const label = node.type
      ? `${node.segment}  ${chalk.gray(node.type)}`
      : chalk.bold(node.segment) + '/'
    lines.push(prefix + branch + label)
    if (node.children.length > 0) {
      renderChildren(node.children, prefix + continuation, lines)
    }
  })
}

export function outputLsHuman(entries: LsEntry[]): string {
  if (entries.length === 0) return chalk.gray('(no atoms)\n')
  const pathWidth = Math.min(60, Math.max(...entries.map(e => e.path.length)))
  return entries
    .map(e => `${e.path.padEnd(pathWidth)}  ${chalk.gray(e.type)}`)
    .join('\n') + '\n'
}
