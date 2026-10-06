import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { loadFontSubsetConfig } from '../../scripts/font_subset/config'
import { detectPython, runProcess } from '../../scripts/font_subset/process'

test('keeps font weights independent throughout the Python subset pipeline', async () => {
  const projectRoot = resolve(fileURLToPath(new URL('../..', import.meta.url)))
  const python = await detectPython(projectRoot, loadFontSubsetConfig().python)
  assert.ok(python, 'The font build requires Python with fontTools and brotli')
  let output = ''
  const code = await runProcess(
    python.command,
    [...python.args, 'tests/fonts/multiweight.py'],
    projectRoot,
    { stderr: text => output += text },
  )
  assert.equal(code, 0, output)
})
