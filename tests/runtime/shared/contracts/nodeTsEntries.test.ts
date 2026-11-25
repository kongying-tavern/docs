import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { test } from 'vitest'
import { collectNodeEntries, nodeResolves } from '../../../../scripts/typecheckNodeEntries.ts'

interface PackageJson {
  scripts: Record<string, string>
}

function realScripts(): Record<string, string> {
  const { scripts } = JSON.parse(
    readFileSync(new URL('../../../../package.json', import.meta.url), 'utf8'),
  ) as PackageJson
  return scripts
}

test('collects the .ts file node runs, with flags around it', () => {
  assert.deepEqual(
    collectNodeEntries({ fix: 'node scripts/lint-zh/index.ts --fix' }),
    ['scripts/lint-zh/index.ts'],
  )
  assert.deepEqual(
    collectNodeEntries({ watch: 'node --enable-source-maps ./scripts/a.ts' }),
    ['./scripts/a.ts'],
  )
  assert.deepEqual(
    collectNodeEntries({ chained: 'pnpm clean && node scripts/b.ts' }),
    ['scripts/b.ts'],
  )
})

test('ignores inline scripts, .mjs entry points and tsx', () => {
  assert.deepEqual(collectNodeEntries({
    clean: 'node -e "require(\'node:fs\').rmSync(\'./dist\')"',
    lintMd: 'node scripts/lintMd.mjs',
    buildFonts: 'tsx ./scripts/buildFonts.ts',
    testUi: 'node --test tests/harness/a/browser.test.mjs',
  }), [])
})

test('resolves # imports natively and rejects tsconfig aliases', () => {
  assert.equal(nodeResolves('../x.ts'), true)
  assert.equal(nodeResolves('vite'), true)
  assert.equal(nodeResolves('@vitejs/plugin-vue'), true)
  // `#` 前缀镜像在 package.json 的 imports 里，Node 自己就能解析。
  assert.equal(nodeResolves('#data/x.ts'), true)
  assert.equal(nodeResolves('@theme/components/ui.ts'), false)
  assert.equal(nodeResolves('~/config/markdown.ts'), false)
  assert.equal(nodeResolves('@/src/constants/site.ts'), false)
})

test('resolves every collected entry to a file on disk', () => {
  const entries = collectNodeEntries(realScripts())
  assert.ok(entries.length > 0, 'expected at least one `node *.ts` script')
  for (const entry of entries)
    assert.ok(existsSync(new URL(`../../../../${entry}`, import.meta.url)), `${entry} does not exist`)
})
