import assert from 'node:assert/strict'
import { ESLint } from 'eslint'
import { test } from 'vitest'

const eslint = new ESLint()

async function messages(source: string, filePath: string) {
  const [result] = await eslint.lintText(source, { filePath })
  return result.messages
}

test('ESLint covers config languages, source and maintained tests', async () => {
  for (const file of ['package.json', 'pnpm-workspace.yaml', '.github/workflows/check.yml', '.vscode/settings.json', 'tsconfig.vue.json', 'vitest.config.ts', 'src/forum/components/comment/ForumCommentArea.vue', 'tests/e2e/forum.spec.ts', 'src/components/links/Join.css']) {
    assert.equal(await eslint.isPathIgnored(file), false, file)
    assert.ok(await eslint.calculateConfigForFile(file), file)
  }
  for (const file of ['src/zh/index.md', 'pnpm-lock.yaml', 'src/public/fonts/fonts-standard.css', '.vitepress/theme/mdc-components.mjs', '.vitepress/cache/generated.ts', 'tests/e2e/state-compare.json'])
    assert.equal(await eslint.isPathIgnored(file), true, file)
}, 30_000)

test('forum services retain both layer and theme import restrictions', async () => {
  for (const path of ['~/forum/components/Example.vue', '~/forum/composables/data/example', '../composables/example', '../../composables/example', '../../../../.vitepress/locales/types']) {
    const result = await messages(`import type { Example } from '${path}'\nexport type { Example }\n`, 'src/forum/services/eslintProbe.ts')
    assert.ok(result.some(message => message.ruleId === 'no-restricted-imports'), path)
  }
  for (const file of ['src/forum/types.ts', 'src/composables/usePostData.ts']) {
    const result = await messages('import type { Example } from \'../../.vitepress/locales/types\'\nexport type { Example }\n', file)
    assert.ok(!result.some(message => message.ruleId === 'no-restricted-imports'), file)
  }
})

test('unused variables report once and unused imports retain a separate error', async () => {
  for (const file of ['src/eslintProbe.ts', 'src/eslintProbe.js']) {
    const result = await messages('import { unusedImport } from \'vue\'\nconst unusedValue = 1\nconst _intentional = 2\n', file)
    assert.equal(result.filter(message => message.ruleId?.endsWith('/no-unused-vars')).length, 1, file)
    assert.ok(result.some(message => message.ruleId === 'unused-imports/no-unused-vars' && message.severity === 1), file)
    assert.ok(result.some(message => message.ruleId === 'unused-imports/no-unused-imports' && message.severity === 2), file)
  }
})

test('data JSON checks correctness without changing generator formatting', async () => {
  const valid = await messages('{"items":[1,2]}', 'src/_data/eslint-probe.json')
  assert.deepEqual(valid, [])
  const duplicate = await messages('{"key":1,"key":2}', 'src/_data/eslint-probe.json')
  assert.ok(duplicate.some(message => message.ruleId === 'jsonc/no-dupe-keys'))
  const invalid = await messages('{"key":}', 'src/_data/eslint-probe.json')
  assert.ok(invalid.some(message => message.fatal))
})

test('vitest suites reject Node imports and focused tests while the browser harness keeps its runner', async () => {
  const result = await messages('import test from \'node:test\'\ntest.only(\'example\', () => {})\n', 'tests/shared/eslintProbe.test.ts')
  assert.ok(result.some(message => message.ruleId === 'test/no-import-node-test'))
  assert.ok(result.some(message => message.ruleId === 'test/no-only-tests'))
  const browser = await messages('import test from \'node:test\'\ntest(\'example\', () => {})\n', 'tests/theme/swipe-actions/browser.test.mjs')
  assert.ok(!browser.some(message => message.ruleId === 'test/no-import-node-test'))
})
