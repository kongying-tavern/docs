import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'vitest'

const projectRoot = fileURLToPath(new URL('../..', import.meta.url))
const require = createRequire(import.meta.url)

test('cache-key CLI writes action outputs without invoking Python or changing font artifacts', () => {
  const temporary = mkdtempSync(join(tmpdir(), 'font-cache-cli-'))
  const fonts = resolve(projectRoot, 'src/public/fonts')
  const snapshot = () => Object.fromEntries((existsSync(fonts) ? readdirSync(fonts) : []).map(file => [
    file,
    createHash('sha256').update(readFileSync(join(fonts, file))).digest('hex'),
  ]))
  const before = snapshot()
  const output = join(temporary, 'github-output')
  const sentinel = join(temporary, 'python-called')
  // Python would load this hook before even the toolchain import check.
  writeFileSync(join(temporary, 'sitecustomize.py'), `from pathlib import Path\nPath(${JSON.stringify(sentinel)}).write_text('called')\n`)
  writeFileSync(output, 'existing=value\n')
  try {
    const result = spawnSync(process.execPath, [require.resolve('tsx/cli'), 'scripts/buildFonts.ts', '--cache-key'], {
      cwd: projectRoot,
      env: { ...process.env, GITHUB_OUTPUT: output, PYTHONPATH: temporary },
      encoding: 'utf8',
      timeout: 20000,
    })
    assert.equal(result.status, 0, result.stderr)
    const inputs = JSON.parse(result.stdout)
    assert.match(inputs.standardHash, /^[a-f0-9]{64}$/)
    assert.match(inputs.siteHash, /^[a-f0-9]{64}$/)
    assert.equal(inputs.fontsDir, 'src/public/fonts')
    assert.equal(readFileSync(output, 'utf8'), `existing=value\nstandard-hash=${inputs.standardHash}\nsite-hash=${inputs.siteHash}\nfonts-dir=${inputs.fontsDir}\n`)
    assert.equal(readdirSync(temporary).includes('python-called'), false)
    assert.deepEqual(snapshot(), before)
  }
  finally {
    rmSync(temporary, { recursive: true, force: true })
  }
}, 25000)
