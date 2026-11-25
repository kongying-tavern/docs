import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createMarkdownRenderer } from 'vitepress'
import { afterAll, beforeAll, test } from 'vitest'
import { run } from 'zhlint'
import { markdownConfig } from '../../../../.vitepress/config/markdown.ts'
import { closeExtractRenderer, extractBlocks } from '../../../../scripts/lint-zh/extract.ts'
import { createLintZhOptions } from '../../../../scripts/lint-zh/options.ts'

// 首次提取要编译文档用到的组件；预热一次，避免各用例各自承担冷启动。
beforeAll(async () => {
  await extractBlocks('预热')
}, 60000)

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
    // 只进 style / img src，渲染后不是文字：不该交给 zhlint。
    'color: 红色底',
    'logo: 中文图标',
    '---',
    '::',
  ].join('\n')
  const checkText = await checkTextOf(source)

  assert.ok(checkText.includes('中文标题'))
  assert.ok(checkText.includes('中文描述'))
  assert.ok(!checkText.includes('/docs/'))
  assert.ok(!checkText.includes('红色底'))
  assert.ok(!checkText.includes('中文图标'))
}, 60000)

test('MDC tags resolve to registered components the way Vue resolves them', async () => {
  // 块标签已 kebab（`::QA` → `qa`），行内标签保留原写法（`Kbd`）；
  // 两者都靠 Vue 的 精确 → camelize → capitalize 规则命中注册名。
  const inline = await checkTextOf('这是 :Kbd[中文快捷键] 结束')
  assert.ok(inline.includes('中文快捷键'))

  const block = await checkTextOf(':::QAGroup\n中文问题\n:::')
  assert.ok(block.includes('中文问题'))
}, 60000)

test('single-line components decide props by rendering too', async () => {
  // `:Name[槽]{属性}` 的属性写在槽之后，不能被源码游标越过。
  const checkText = await checkTextOf(':Card[槽内容]{title="中文标题" logo="中文图标"}')

  assert.ok(checkText.includes('槽内容'))
  assert.ok(checkText.includes('中文标题'))
  assert.ok(!checkText.includes('中文图标'))
}, 60000)

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
