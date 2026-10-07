import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createMarkdownRenderer } from 'vitepress'
import { test } from 'vitest'
import { markdownConfig } from '../../.vitepress/config/markdown'
import { extractBlogExcerpt } from '../../src/utils/blogExcerpt'

test('blog summaries render macros and Markdown from the latest update only', async () => {
  const source = readFileSync('src/zh/blog/posts/hotupdatelog-client.md', 'utf8')
  const markdown = await createMarkdownRenderer(resolve('src'), markdownConfig)
  const html = await markdown.renderAsync(extractBlogExcerpt(source.replace(/\r?\n/g, '\r\n')))
  assert.ok(html.includes('Rc1.1.0'))
  assert.ok(html.includes('<strong>普通级</strong>'))
  assert.ok(html.includes('color: #2bbc6e'))
  assert.ok(html.includes('搜索栏有异常字体溢出'))
  assert.equal(html.match(/<li>/g)?.length, 2)
  assert.ok(!html.includes('{%='))
  assert.ok(!html.includes('点位图标仍显示旧缓存'))
})

test('ordinary blog posts retain their custom Markdown excerpt', () => {
  assert.equal(extractBlogExcerpt('Intro\n\n----\n\n**Summary**\n\n<!-- more -->\nBody'), '**Summary**')
})

test('ordinary posts without a real delimiter do not expose their full body', () => {
  for (const source of ['Full body', '{define:A}sample{/define}\nFull body', '```md\n<!-- more -->\n```\nFull body', '    <!-- more -->\n\nFull body'])
    assert.equal(extractBlogExcerpt(source), '')
})

test('ordinary posts use the delimiter and fall back from empty custom intervals', () => {
  assert.equal(extractBlogExcerpt('Intro\n\n<!-- more -->\nBody'), 'Intro')
  assert.equal(extractBlogExcerpt('Intro\n\n----\n  \n<!-- more -->\nBody'), 'Intro')
  assert.equal(extractBlogExcerpt('----\n<!-- more -->\nBody'), '')
  assert.equal(extractBlogExcerpt('----\n**Summary**\n<!--  more  -->\nBody'), '**Summary**')
})

test('code examples cannot supply a timeline or a custom separator', () => {
  for (const fence of ['```md', '~~~~md']) {
    const close = fence.replace('md', '')
    assert.equal(extractBlogExcerpt(`${fence}\n::: timeline sample\n- hidden\n:::\n${close}`), '')
    assert.equal(extractBlogExcerpt(`${fence}\n::: timeline sample\n- hidden\n:::\n${close}\n\n::: timeline real\n- first\n- second\n- third\n:::`), '**real**\n\n- first\n- second')
  }
})

test('timeline excerpts exclude nested containers, code and nested list items', () => {
  const source = '::: timeline v1.0\n- first\n  - nested item\n::: tip\n- hidden item\n:::\n```md\n- code item\n```\n- second\n- third\n:::'
  assert.equal(extractBlogExcerpt(source), '**v1.0**\n\n- first\n- second')
  assert.equal(extractBlogExcerpt(source.replace(/\n/g, '\r\n')), '**v1.0**\n\n- first\n- second')
  assert.equal(extractBlogExcerpt(source.replace('::: timeline', ':::: timeline')), '')
  assert.equal(extractBlogExcerpt(`${source.replace('::: timeline', ':::: timeline')}:`), '**v1.0**\n\n- first\n- second')
})

test('only the first heading group in the first closed timeline supplies items', () => {
  assert.equal(extractBlogExcerpt('::: timeline v1\nIntro\n## First\n- first\n- second\n## Older\n- old\n:::\n::: timeline v0\n- older\n:::'), '**v1**\n\n- first\n- second')
  assert.equal(extractBlogExcerpt('::: timeline unclosed\n- first'), '')
  assert.equal(extractBlogExcerpt('   ::: timeline indented\n+ first\n* second\n   :::'), '**indented**\n\n- first\n- second')
  assert.equal(extractBlogExcerpt('::: timeline v1  \n- first\n:::   '), '**v1**\n\n- first')
})
