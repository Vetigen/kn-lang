import { test, expect } from 'bun:test'
import { loadConfig } from '../../src/config/index.ts'

test('loads kn.config.json with defaults', async () => {
  await Bun.write('/tmp/kn-config-test/kn.config.json', JSON.stringify({
    include: ['knowledge/**/*.kn'],
  }))
  const cfg = await loadConfig('/tmp/kn-config-test/kn.config.json')
  expect(cfg.include).toEqual(['knowledge/**/*.kn'])
  expect(cfg.outDir).toBe('.kn-dist')
  expect(cfg.strict).toBe(false)
  expect(cfg.freshness.warnAfterDays).toBe(90)
})

test('returns defaults when file missing', async () => {
  const cfg = await loadConfig('/tmp/kn-config-test/nope.json')
  expect(cfg.include).toEqual(['knowledge/**/*.kn'])
})
