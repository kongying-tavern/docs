import assert from 'node:assert/strict'
import { beforeEach, test, vi } from 'vitest'
import { buildFonts, getFontCacheInputs } from '../../scripts/buildFonts'
import { FontArtifacts } from '../../scripts/font_subset/artifacts'

const mocks = vi.hoisted(() => ({ detectPython: vi.fn(async () => null), runProcess: vi.fn() }))
vi.mock('../../scripts/font_subset/process', () => mocks)
beforeEach(() => vi.clearAllMocks())

test('calculating cache inputs does not require the Python toolchain', async () => {
  const inputs = await getFontCacheInputs()
  assert.match(inputs.standardHash, /^[a-f0-9]{64}$/)
  assert.match(inputs.siteHash, /^[a-f0-9]{64}$/)
  assert.equal(mocks.detectPython.mock.calls.length, 0)
  assert.equal(mocks.runProcess.mock.calls.length, 0)
})

test.each([false, true])('build force=%s still checks Python before accepting cached artifacts', async (force) => {
  const current = vi.spyOn(FontArtifacts.prototype, 'isCurrent').mockReturnValue(true)
  await assert.rejects(buildFonts({ force }), /Python 3 with fontTools and brotli is required/)
  assert.equal(mocks.detectPython.mock.calls.length, 1)
  assert.equal(current.mock.calls.length, 0)
  assert.equal(mocks.runProcess.mock.calls.length, 0)
})
