import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { createMarkdownRenderer } from 'vitepress'
import { test } from 'vitest'
import { markdownConfig } from '../../../../.vitepress/config/markdown.ts'

function renderer() {
  return createMarkdownRenderer(resolve('pages'), markdownConfig)
}

test('qa block renders question and answer slots via MDC', async () => {
  const markdown = await renderer()
  const html = await markdown.renderAsync(`::QA
#question
**Question** line
#answer
Answer *detail*
::`)
  assert.match(html, /<qa>/)
  assert.match(html, /<template #question="">/)
  assert.match(html, /<template #answer="">/)
  assert.match(html, /<strong>Question<\/strong> line/)
  assert.match(html, /Answer <em>detail<\/em>/)
})

test('qa block binds collapsible from brace props and YAML props', async () => {
  const markdown = await renderer()
  const braceHtml = await markdown.renderAsync(`::QA{collapsible=false}
#question
Q
#answer
A
::`)
  assert.match(braceHtml, /<qa :collapsible="false">/)

  const yamlHtml = await markdown.renderAsync(`::QA
---
collapsible: false
---
#question
Q
#answer
A
::`)
  assert.match(yamlHtml, /<qa :collapsible="false">/)
})

test('qa block binds collapsed from brace props and YAML props', async () => {
  const markdown = await renderer()
  const braceHtml = await markdown.renderAsync(`::QA{collapsed=true}
#question
Q
#answer
A
::`)
  assert.match(braceHtml, /<qa :collapsed="true">/)

  const yamlHtml = await markdown.renderAsync(`::QA
---
collapsed: true
---
#question
Q
#answer
A
::`)
  assert.match(yamlHtml, /<qa :collapsed="true">/)
})

test('qa block keeps following blocks and emits valid slots', async () => {
  const markdown = await renderer()
  const html = await markdown.renderAsync(`::QA
#question
Q
#answer
A
::

After paragraph`)
  assert.match(html, /After paragraph/)
  assert.equal((html.match(/<qa[ >]/g) || []).length, 1)
  assert.match(html, /<template #question="">/)
  assert.match(html, /<template #answer="">/)
})

test('qa block closes before an adjacent container', async () => {
  const markdown = await renderer()
  const html = await markdown.renderAsync(`::QA
#question
Q
#answer
A
::

::: timeline
2020-01-01: entry
:::`)
  assert.equal((html.match(/<qa[ >]/g) || []).length, 1)
  assert.doesNotMatch(html, /:::/, 'Container markers must not leak as text')

  const qaClose = html.indexOf('</qa>')
  const timeline = html.indexOf('timeline-dot')
  assert.notEqual(qaClose, -1, 'QA block should render')
  assert.ok(timeline > qaClose, 'Timeline must render after the QA block closes')
  assert.match(html, /2020-01-01: entry/)
})

test('qa block tolerates a blank line between slots', async () => {
  const markdown = await renderer()
  const html = await markdown.renderAsync(`::QA
#question
First paragraph

#answer
Second paragraph
::`)
  assert.match(html, /<template #question="">/)
  assert.match(html, /<template #answer="">/)
  assert.match(html, /First paragraph/)
  assert.match(html, /Second paragraph/)
})
