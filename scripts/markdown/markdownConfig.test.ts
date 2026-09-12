/* eslint-disable test/no-import-node-test -- use Node's built-in runner for this contract */
import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import test from 'node:test'
import { createMarkdownRenderer } from 'vitepress'
import { markdownConfig } from '../../.vitepress/config/markdown'

test('VitePress built-ins render once alongside Comark', async () => {
  const markdown = await createMarkdownRenderer(resolve('src'), markdownConfig)
  const html = await markdown.renderAsync(`
## Heading {#stable-heading}

- [ ] one
- [x] two

note[^1]

[^1]: footnote

*attrs*{.vp-link}

:span{width=300 class="mt-4"}
`)

  assert.equal(html.match(/id="stable-heading"/g)?.length, 1)
  assert.equal(html.match(/type="checkbox"/g)?.length, 2)
  assert.equal(html.match(/<section class="footnotes"/g)?.length, 1)
  assert.match(html, /<em class="vp-link">attrs<\/em>/)
  assert.match(html, /<span[^>]*width="300"[^>]*class="mt-4"/)
})

test('reserved containers yield to VitePress and site plugins instead of Comark', async () => {
  const markdown = await createMarkdownRenderer(resolve('src'), markdownConfig)
  const html = await markdown.renderAsync(`
::: tip
handled tip
:::

::::raw

raw content

::::

::: timeline 2026-1-1

timeline entry

:::

::: my-widget
mdc block content
:::
`)

  assert.match(html, /<div class="tip custom-block">/)
  assert.match(html, /<div class="vp-raw">/)
  assert.match(html, /timeline-dot/)
  assert.match(html, /<my-widget>/)
})
