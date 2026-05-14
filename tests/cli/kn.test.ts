import { test, expect } from 'bun:test'
import { rm } from 'node:fs/promises'

const BUN = process.execPath
const TMP = '/tmp/kn-query-cli-test'

async function setup() {
  await rm(TMP, { recursive: true, force: true })
  await Bun.write(`${TMP}/knowledge/a.kn`, '@a/x { type: flow } @b/y { type: entity } @a/x -uses-> @b/y')
  await Bun.write(`${TMP}/kn.config.json`, JSON.stringify({ include: ['knowledge/**/*.kn'] }))
  const build = Bun.spawn([BUN, 'src/cli-knc.ts', 'build', '--cwd', TMP], { stdout: 'pipe' })
  await build.exited
}

test('kn get returns atom JSON', async () => {
  await setup()
  const proc = Bun.spawn([BUN, 'src/cli-kn.ts', 'get', '@a/x', '--json', '--cwd', TMP], { stdout: 'pipe' })
  const out = await new Response(proc.stdout).text()
  await proc.exited
  const data = JSON.parse(out)
  expect(data.atoms[0].path).toBe('@a/x')
})

test('kn get with --depth 1 includes neighbor', async () => {
  await setup()
  const proc = Bun.spawn([BUN, 'src/cli-kn.ts', 'get', '@a/x', '--depth', '1', '--json', '--cwd', TMP], { stdout: 'pipe' })
  const out = await new Response(proc.stdout).text()
  await proc.exited
  const data = JSON.parse(out)
  expect(data.atoms.map((a: any) => a.path).sort()).toEqual(['@a/x', '@b/y'])
})

test('kn trace returns path', async () => {
  await setup()
  const proc = Bun.spawn([BUN, 'src/cli-kn.ts', 'trace', '@a/x', '@b/y', '--json', '--cwd', TMP], { stdout: 'pipe' })
  const out = await new Response(proc.stdout).text()
  await proc.exited
  const data = JSON.parse(out)
  expect(data.path).toEqual(['@a/x', '@b/y'])
})

test('kn ls returns flat list', async () => {
  await setup()
  const proc = Bun.spawn([BUN, 'src/cli-kn.ts', 'ls', '--json', '--cwd', TMP], { stdout: 'pipe' })
  const out = await new Response(proc.stdout).text()
  await proc.exited
  const data = JSON.parse(out)
  expect(data).toHaveLength(2)
  expect(data.map((e: any) => e.path).sort()).toEqual(['@a/x', '@b/y'])
})

test('kn tree returns hierarchical structure', async () => {
  await setup()
  const proc = Bun.spawn([BUN, 'src/cli-kn.ts', 'tree', '--json', '--cwd', TMP], { stdout: 'pipe' })
  const out = await new Response(proc.stdout).text()
  await proc.exited
  const data = JSON.parse(out)
  expect(data.children).toHaveLength(2)
})

test('kn search finds matching atoms', async () => {
  await setup()
  const proc = Bun.spawn([BUN, 'src/cli-kn.ts', 'search', 'flow', '--json', '--cwd', TMP], { stdout: 'pipe' })
  const out = await new Response(proc.stdout).text()
  await proc.exited
  const data = JSON.parse(out)
  expect(data.atoms.length).toBeGreaterThan(0)
})

test('kn manifest returns full corpus summary', async () => {
  await setup()
  const proc = Bun.spawn([BUN, 'src/cli-kn.ts', 'manifest', '--cwd', TMP], { stdout: 'pipe' })
  const out = await new Response(proc.stdout).text()
  await proc.exited
  const data = JSON.parse(out)
  expect(Object.keys(data.atoms)).toHaveLength(2)
  expect(data.namespaces.sort()).toEqual(['a', 'b'])
  expect(data.typeCounts.flow).toBe(1)
  expect(data.typeCounts.entity).toBe(1)
})
