import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createMarkdownRenderer } from 'vitepress'
import { test } from 'vitest'
import { run } from 'zhlint'
import { markdownConfig } from '../../.vitepress/config/markdown'
import { createLintZhOptions } from '../../scripts/lintZhOptions.mjs'

test('Chinese formatting preserves emoji syntax while fixing surrounding prose', () => {
  const options = createLintZhOptions()
  const source = '{define:T}:sparkles: 中文: 测试{/define}\n\n:smile: 中文: 测试\n\n:1.小黄脸/呲牙.png: 中文: 测试'
  const expected = '{define:T}:sparkles: 中文：测试{/define}\n\n:smile: 中文：测试\n\n:1.小黄脸/呲牙.png: 中文：测试'
  const { result } = run(source, options)
  assert.equal(result, expected)
  assert.equal(run(result, options).result, expected)
})

test('Chinese formatting preserves MDC syntax and checks its content', () => {
  const options = createLintZhOptions()
  const source = '## 中文 {#stable-id}\n\n{color:red}中文: 测试{/color}\n\n::: timeline 2022-08-29\n\n中文: 测试\n\n:::\n\n::Card\n---\ntitle: ":sparkles: 中文标题"\nlink: /docs/\n---\n中文: 测试\n::'
  const { result } = run(source, options)
  assert.equal(result, source.replaceAll('中文: 测试', '中文：测试'))
  assert.equal(run(result, options).result, result)
})

test('the web changelog keeps its emoji through formatting and VitePress rendering', async () => {
  const source = readFileSync(resolve('src/zh/blog/posts/changelog-web.md'), 'utf8')
  const { result, validations } = run(source, createLintZhOptions())
  assert.equal(result, source)
  assert.deepEqual(validations, [])
  const markdown = await createMarkdownRenderer(resolve('src'), markdownConfig)
  const html = await markdown.renderAsync(result)
  assert.match(html, /✨ 新增功能/)
  assert.match(html, /🐛 BUG 修复/)
  assert.match(html, /🍱 资源更新/)
  assert.doesNotMatch(html, /:(?:sparkles|bug|bento|recycle|zap|lock|fire|page_facing_up|globe_with_meridians)[:：]/)
})
