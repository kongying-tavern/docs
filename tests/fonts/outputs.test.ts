import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'vitest'
import { loadFontSubsetConfig } from '../../scripts/font_subset/config'
import { detectPython, runProcess } from '../../scripts/font_subset/process'

test('font outputs install on fresh Windows checkouts and preserve custom files', async () => {
  const projectRoot = resolve(fileURLToPath(new URL('../..', import.meta.url)))
  const python = await detectPython(projectRoot, loadFontSubsetConfig().python)
  assert.ok(python, 'The font build requires Python with fontTools and brotli')
  let output = ''
  const code = await runProcess(python.command, [...python.args, 'tests/fonts/outputs.py'], projectRoot, {
    stderr: text => output += text,
  })
  assert.equal(code, 0, output)
})
