import assert from 'node:assert/strict'
import { beforeEach, test, vi } from 'vitest'
import { buildFonts, getFontCacheInputs } from '../../../../scripts/buildFonts.ts'
import { FontArtifacts } from '../../../../scripts/font_subset/artifacts.ts'

const mocks = vi.hoisted(() => ({ detectPython: vi.fn(async () => null), runProcess: vi.fn() }))
vi.mock('../../../../scripts/font_subset/process.ts', () => mocks)
beforeEach(() => vi.clearAllMocks())

// 缓存输入会读取全站内容并计算哈希，满载并行时接近 6s，默认 5s 不够。
test('calculating cache inputs does not require the Python toolchain', { timeout: 20_000 }, async () => {
  const inputs = await getFontCacheInputs()
  assert.match(inputs.standardHash, /^[a-f0-9]{64}$/)
  assert.match(inputs.siteHash, /^[a-f0-9]{64}$/)
  assert.equal(mocks.detectPython.mock.calls.length, 0)
  assert.equal(mocks.runProcess.mock.calls.length, 0)
})

test.each([false, true])('build force=%s still checks Python before accepting cached artifacts', { timeout: 20_000 }, async (force) => {
  const current = vi.spyOn(FontArtifacts.prototype, 'isCurrent').mockReturnValue(true)
  await assert.rejects(buildFonts({ force }), /Python 3 with fontTools and brotli is required/)
  assert.equal(mocks.detectPython.mock.calls.length, 1)
  assert.equal(current.mock.calls.length, 0)
  assert.equal(mocks.runProcess.mock.calls.length, 0)
})
