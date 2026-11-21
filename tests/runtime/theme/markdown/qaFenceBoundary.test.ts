import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { createMarkdownRenderer } from 'vitepress'
import { test } from 'vitest'
import { markdownConfig } from '../../../../.vitepress/config/markdown.ts'
import { MarkdownExtQA } from '../../../../.vitepress/theme/markdown-ext/qa/index.ts'

test('qa fence ignores colon containers it does not own', async () => {
  const markdown = await createMarkdownRenderer(resolve('pages'), {
    config(md) {
      md.use(MarkdownExtQA, {})
    },
  })
  const html = await markdown.renderAsync(`:::qa
@config
collapsible: true
----
Q
----
A
:::

::: timeline 2025-01-15
- Event
:::`)
  assert.equal((html.match(/<QA /g) || []).length, 1, 'Only the qa block becomes a QA component')
  assert.match(html, /<template #detail><p>A<\/p>/, 'The QA block keeps only its own detail')
  assert.match(html, /<\/QA>\s*<p>::: timeline /, 'QA closes before the timeline block instead of swallowing it')
})

test('qa fence survives Comark in the full markdown config', async () => {
  const markdown = await createMarkdownRenderer(resolve('pages'), markdownConfig)
  const html = await markdown.renderAsync(`:::qa
@config
collapsible: true
----
Question
----
Answer
:::`)
  assert.match(html, /<QA v-bind=/, 'Comark yields :::qa so the QA plugin renders the component')
  assert.doesNotMatch(html, /<qa>/, 'The raw MDC <qa> tag must not leak into output')
})
