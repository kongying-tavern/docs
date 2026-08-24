/* eslint-disable test/no-import-node-test -- use Node's built-in runner for this contract */
import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { resolveExtensions } from '@tiptap/core'
import { decodeCommentBody, decodeForumText, decodeTopicBody } from '../../src/services/forum/forumContentCodec'
import {
  renderForumComment,
  renderForumTopic,
  renderTiptapToHtml,
} from '../../src/services/forum/forumContentRenderer'
import { createForumContentExtensions } from '../../src/services/forum/forumTiptapExtensions'
import {
  RICH_TIPTAP_DOC,
  RICH_TIPTAP_WITH_ATTACHMENT,
  UNSAFE_LINK_TIPTAP_DOC,
  VALID_JSON_PLAIN_TEXTS,
} from './fixtures/content'

test('valid JSON-looking Topic and legacy Comment bodies stay exact plain text', () => {
  for (const raw of VALID_JSON_PLAIN_TEXTS) {
    assert.deepEqual(decodeTopicBody(raw).content, { kind: 'plain', text: raw })
    assert.deepEqual(decodeCommentBody(raw).content, { kind: 'plain', text: raw })
  }
})

test('rich Comment codec derives text once and keeps its ordered attachment separate', () => {
  const decoded = decodeCommentBody(RICH_TIPTAP_WITH_ATTACHMENT)

  assert.equal(decoded.content.kind, 'tiptap')
  assert.match(decoded.content.text, /hello @alice/)
  assert.match(decoded.content.text, /@alice/)
  assert.match(decoded.content.text, /emoji\/happy\.webp/)
  assert.match(decoded.content.text, /Bullet/)
  assert.deepEqual(decoded.attachments, [{
    src: 'https://assets.example/attachment.webp',
    alt: 'attachment',
    thumbHash: 'rich',
    width: 800,
    height: 600,
  }])
})

test('static rich Comment rendering covers the writer schema without an Editor', () => {
  const html = renderTiptapToHtml(RICH_TIPTAP_DOC)

  assert.match(html, /<strong>hello @alice<\/strong>/)
  assert.match(html, /<br/)
  assert.match(html, /href="https:\/\/gitee\.com\/alice"/)
  assert.match(html, />@alice<\/a>/)
  assert.match(html, /data-emoji="emoji\/happy\.webp"/)
  assert.match(html, /<em>italic<\/em>/)
  assert.match(html, /<s> strike<\/s>/)
  assert.match(html, /<code> code<\/code>/)
  assert.match(html, /<u> underline<\/u>/)
  assert.match(html, /href="https:\/\/example\.com\/path\?q=1"/)
  assert.match(html, /<h2>Heading<\/h2>/)
  assert.match(html, /<blockquote>/)
  assert.match(html, /<ul>/)
  assert.match(html, /<ol start=2/)
  assert.match(html, /<pre><code/)
  assert.match(html, /<hr/)
})

test('writer and static renderer share duplicate-free extension names', () => {
  const names = resolveExtensions(createForumContentExtensions()).map(extension => extension.name)
  assert.deepEqual(names.filter((name, index) => names.indexOf(name) !== index), [])
  assert.equal(names.filter(name => name === 'link').length, 1)
})

test('unsafe link protocols and user HTML never reach rendered Comment HTML', () => {
  const unsafeLinkHtml = renderTiptapToHtml(UNSAFE_LINK_TIPTAP_DOC)
  const userHtml = renderTiptapToHtml({
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text: '<img src=x onerror=alert(1)>' }] }],
  })

  assert.equal(unsafeLinkHtml.includes('javascript:'), false)
  assert.equal(unsafeLinkHtml.includes('<a'), false)
  assert.match(unsafeLinkHtml, /unsafe link/)
  assert.equal(userHtml.includes('<img'), false)
  assert.match(userHtml, /&lt;img src=x onerror=alert\(1\)&gt;/)
})

test('malformed or unsupported rich roots fall back to exact interpolated plain text', () => {
  const invalidDocuments = [
    { type: 'doc', content: [{ type: 'unknown', content: [] }] },
    { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'mention' }] }] },
    { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'emoji', attrs: {} }] }] },
    { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'x', marks: [{ type: 'link', attrs: {} }] }] }] },
  ]

  for (const value of invalidDocuments) {
    const raw = JSON.stringify(value)
    const decoded = decodeForumText(raw)
    assert.deepEqual(decoded, { kind: 'plain', text: raw })
    assert.deepEqual(renderForumComment(decoded), { kind: 'plain', text: raw })
  }
})

test('Topic Markdown disables raw HTML, linkifies, and preserves JSON-looking text', () => {
  const rendered = renderForumTopic('123\nhttps://example.com\n<script>alert(1)</script>')

  assert.match(rendered, /^<p>123<br>/)
  assert.match(rendered, /href="https:\/\/example\.com"/)
  assert.equal(rendered.includes('<script>'), false)
  assert.match(rendered, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/)
})

test('Topic detail is the only forum surface that renders body HTML', () => {
  const readSource = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8')
  const topicContent = readSource('src/components/forum/topic/composables/useTopicContent.ts')
  const topicPageState = readSource('src/components/forum/topic/composables/useTopicPageState.ts')
  const topicPage = readSource('src/components/forum/topic/ForumTopicPage.vue')
  const translator = readSource('src/components/forum/ForumTopicTranslator.vue')
  const forumHome = readSource('src/components/forum/ForumHome.vue')

  assert.match(topicContent, /computed\(\(\) => topic\.content\.text\)/)
  assert.match(topicPageState, /renderForumTopic\(topic\.value\.content\.text\)/)
  assert.match(topicPage, /:content="topic\.content\.text"/)
  assert.match(translator, /\{\{ displayText \}\}/)
  assert.equal(translator.includes('v-html="displayText"'), false)
  assert.equal(forumHome.includes('v-html'), false)
  assert.equal(forumHome.includes('BlogPostAsTopic'), false)
  assert.equal(forumHome.includes('renderMarkdownPreview'), false)
})
