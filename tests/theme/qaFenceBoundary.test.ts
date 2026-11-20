import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { createMarkdownRenderer } from 'vitepress'
import { test } from 'vitest'
import { MarkdownExtQA } from '~/theme/markdown-ext/qa'

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
