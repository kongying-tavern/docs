import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { createMarkdownRenderer } from 'vitepress'
import { test } from 'vitest'
import { qa } from '~/theme/markdown/qa'

function renderer() {
  return createMarkdownRenderer(resolve('pages'), {
    config(md) { md.use(qa, {}) },
  })
}

test('qa fence keeps raw content and splits on ----', async () => {
  const markdown = await renderer()
  const html = await markdown.renderAsync(`:::qa
@config
collapsible: true
----
**Question** line
----
Answer *detail*
:::`)
  assert.match(html, /<QA v-bind='\{"collapsible":true\}'>/)
  assert.match(html, /<strong>Question<\/strong> line/)
  assert.match(html, /Answer <em>detail<\/em>/)
})

test('qa fence handles nested content and longer markers', async () => {
  const markdown = await renderer()
  const html = await markdown.renderAsync(`::::qa
@config
collapsible: false
----
Outer **summary**
----
Outer detail

Tail
::::`)
  assert.match(html, /<QA v-bind='\{"collapsible":false\}'>/)
  assert.match(html, /Outer <strong>summary<\/strong>/)
  assert.match(html, /Outer detail/)
  assert.match(html, /Tail/)
})

test('qa fence does not swallow following blocks', async () => {
  const markdown = await renderer()
  const html = await markdown.renderAsync(`:::qa
@config
collapsible: true
----
Q
----
A
:::

After paragraph`)
  assert.match(html, /After paragraph/)
  assert.equal((html.match(/<QA /g) || []).length, 1)
})
