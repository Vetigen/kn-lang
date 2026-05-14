import { mkdir } from 'node:fs/promises'
import type { CompileResult } from './pipeline.ts'

export async function writeDist(outDir: string, result: CompileResult): Promise<void> {
  await mkdir(outDir, { recursive: true })

  const atomsObj: Record<string, unknown> = {}
  for (const atom of result.index.allAtoms()) {
    atomsObj[atom.path] = serializeAtom(atom)
  }
  await Bun.write(`${outDir}/atoms.json`, JSON.stringify(atomsObj, null, 2))

  const edges: unknown[] = []
  for (const atom of result.index.allAtoms()) {
    for (const e of result.index.edgesOut(atom.path)) {
      edges.push({ from: e.from, type: e.edgeType, to: e.to, loc: e.loc })
    }
  }
  await Bun.write(`${outDir}/edges.json`, JSON.stringify(edges, null, 2))

  const sourceMap: Record<string, { file: string; line: number; column: number }> = {}
  for (const atom of result.index.allAtoms()) {
    sourceMap[atom.path] = { file: atom.loc.file, line: atom.loc.line, column: atom.loc.column }
  }
  await Bun.write(`${outDir}/source-map.json`, JSON.stringify(sourceMap, null, 2))

  await Bun.write(`${outDir}/manifest.json`, JSON.stringify(result.manifest, null, 2))
}

function serializeAtom(atom: import('../ast/types.ts').AtomNode): unknown {
  return {
    path: atom.path,
    fields: serializeFields(atom.fields),
    loc: atom.loc,
  }
}

function serializeFields(fields: Map<string, import('../ast/types.ts').ValueNode>): unknown {
  const out: Record<string, unknown> = {}
  for (const [k, v] of fields) out[k] = serializeValue(v)
  return out
}

function serializeValue(v: import('../ast/types.ts').ValueNode): unknown {
  switch (v.kind) {
    case 'string': case 'number': case 'boolean': case 'identifier':
      return { kind: v.kind, value: v.value, ...('unit' in v && v.unit ? { unit: v.unit } : {}) }
    case 'list':
      return { kind: 'list', items: v.items.map(serializeValue) }
    case 'object':
      return { kind: 'object', fields: serializeFields(v.fields) }
    case 'ref':
      return { kind: 'ref', target: v.target }
    case 'typeref':
      return { kind: 'typeref', name: v.name, args: v.args }
    case 'pipeline':
      return { kind: 'pipeline', steps: v.steps }
    case 'invariants':
      return { kind: 'invariants', items: v.items.map(i => i.text) }
  }
}
