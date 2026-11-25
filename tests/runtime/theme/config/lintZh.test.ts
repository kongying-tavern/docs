import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createMarkdownRenderer } from 'vitepress'
import { afterAll, test } from 'vitest'
import { run } from 'zhlint'
import { markdownConfig } from '../../../../.vitepress/config/markdown.ts'
import { closeExtractRenderer, extractBlocks } from '../../../../scripts/lint-zh/extract.mjs'
import { createLintZhOptions } from '../../../../scripts/lint-zh/options.mjs'

afterAll(closeExtractRenderer)

async function checkTextOf(source: string): Promise<string> {
  const blocks = await extractBlocks(source)
  return blocks.map(block => block.checkText).join('\n')
}

test('Chinese formatting ignores emoji syntax but fixes surrounding prose', async () => {
  const source = '前缀 :smile: 中文: 测试'
  const checkText = await checkTextOf(source)

  assert.ok(!checkText.includes('smile'))
  assert.ok(checkText.includes('中文: 测试'))
  assert.equal(run(checkText, createLintZhOptions()).result, checkText.replace('中文: 测试', '中文：测试'))
})

test('Chinese formatting sees visible MDC text without touching its syntax', async () => {
  const source = '## 中文 {#stable-id}\n\n普通中文: 测试\n\n{color:red}中文: 测试{/color}\n\n::Card\n---\ntitle: 中文标题\ndesc: 中文描述\nlink: /docs/\n---\n::'
  const checkText = await checkTextOf(source)

  assert.ok(!checkText.includes('{#stable-id}'))
  assert.ok(!checkText.includes('color:red'))
  assert.ok(!checkText.includes('link:'))
  assert.ok(checkText.includes('普通中文: 测试'))
  assert.ok(checkText.includes('中文标题'))
  assert.ok(checkText.includes('中文描述'))
  assert.equal(run(checkText, createLintZhOptions()).result, checkText.replace('中文: 测试', '中文：测试'))
}, 30000)

test('component rendering decides whether a prop is visible text', async () => {
  const source = [
    '::Card',
    '---',
    'title: 中文标题',
    'desc: 中文描述',
    'link: /docs/',
    '---',
    '::',
  ].join('\n')
  const checkText = await checkTextOf(source)

  assert.ok(checkText.includes('中文标题'))
  assert.ok(checkText.includes('中文描述'))
  assert.ok(!checkText.includes('/docs/'))
}, 30000)

test('the web changelog stays clean through extraction and still renders emoji', async () => {
  const source = readFileSync(resolve('pages/zh/blog/posts/changelog-web.md'), 'utf8')
  const checkText = await checkTextOf(source)
  const { result, validations } = run(checkText, createLintZhOptions())

  assert.equal(result, checkText)
  assert.deepEqual(validations, [])

  const markdown = await createMarkdownRenderer(resolve('pages'), markdownConfig)
  const html = await markdown.renderAsync(source)
  assert.match(html, /✨ 新增功能/)
  assert.match(html, /🐛 BUG 修复/)
  assert.match(html, /🍱 资源更新/)
  assert.doesNotMatch(html, /:(?:sparkles|bug|bento|recycle|zap|lock|fire|page_facing_up|globe_with_meridians)[:：]/)
})
