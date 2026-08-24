/* eslint-disable test/no-import-node-test -- use Node's built-in runner for this contract */
import type { UploadedUserFile } from '../../src/composables/useImageUpload'
import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { normalizeComment, normalizeIssue } from '../../.vitepress/theme/apis/forum/gitee/utils'
import { formatMarkdownImages } from '../../src/components/forum/utils/formatting'
import { composeTopicBody, writeTopicBodyComment } from '../../src/composables/composeTopicBody'
import {
  LEGACY_PLAIN_COMMENT,
  LEGACY_PLAIN_TOPIC,
  MALFORMED_COMMENT_JSON,
  TIPTAP_WITH_LITERAL_MENTION_TEXT,
  VALID_JSON_PLAIN_TEXTS,
  VALID_TIPTAP_DOC,
} from './fixtures/content'

const user = {
  id: 7,
  login: 'alice',
  name: 'Alice',
  avatar_url: 'https://assets.example/alice.png',
  html_url: 'https://gitee.com/alice',
} as GITEE.User

function issue(body: string): GITEE.IssueInfo {
  return {
    number: 'I12345',
    title: 'BUG:Codec contract',
    body,
    user: user as unknown as GITEE.UserInfo,
    labels: [],
    state: 'open',
    html_url: 'https://gitee.com/example/issues/I12345',
    comments: 0,
    created_at: '2026-08-24T00:00:00Z',
    updated_at: '2026-08-24T01:00:00Z',
  } as unknown as GITEE.IssueInfo
}

function comment(body: string): GITEE.Comment {
  return {
    id: 42,
    body,
    user,
    created_at: '2026-08-24T00:00:00Z',
    updated_at: '2026-08-24T01:00:00Z',
  } as GITEE.Comment
}

test('composeTopicBody keeps labels unique and state rewrites preserve existing labels', () => {
  const body = 'Body\n![diagram](https://assets.example/diagram.webp){thumbhash:"hash",width:"640",height:"480"}'
  const composed = composeTopicBody(body, {
    labels: ['WEB-FEEDBACK', null, 'WEB-FEEDBACK', 'CATA-DOCS'],
    state: 'open',
  })
  assert.equal(
    composed,
    `<!-- {"labels":["WEB-FEEDBACK","CATA-DOCS"],"state":"open"} -->${body}`,
  )
  const rewritten = writeTopicBodyComment(composed, { state: 'closed' })
  assert.equal(rewritten, `<!-- {"labels":["WEB-FEEDBACK","CATA-DOCS"],"state":"closed"} -->${body}`)
  assert.equal(rewritten.slice(rewritten.indexOf('-->') + 3), body)
})

test('normalizes Topics as plain text even when their content looks like Tiptap', () => {
  const raw = JSON.stringify(VALID_TIPTAP_DOC)
  const topic = normalizeIssue(issue(raw))
  assert.equal(topic.content.text, raw)
  assert.equal(topic.type, 'BUG')
  assert.equal(topic.title, 'Codec contract')
})

test('preserves legacy plain Topic and Comment bodies', () => {
  assert.equal(normalizeIssue(issue(LEGACY_PLAIN_TOPIC)).content.text, LEGACY_PLAIN_TOPIC)
  assert.equal(normalizeComment(comment(LEGACY_PLAIN_COMMENT)).content.text, LEGACY_PLAIN_COMMENT)
})

test('keeps serialized Comment JSON parseable and never injects mention HTML', () => {
  const raw = JSON.stringify(VALID_TIPTAP_DOC)
  const normalized = normalizeComment(comment(raw))

  assert.deepEqual(JSON.parse(normalized.content.text), VALID_TIPTAP_DOC)
  assert.equal(normalized.content.text.includes('<a'), false)
  assert.equal(normalized.content.text.includes('@alice'), false)
  assert.equal(normalizeComment(comment('hello @alice')).content.text, 'hello @alice')
})

test('does not inject HTML into an ordinary Tiptap text node containing @alice', () => {
  const normalized = normalizeComment(comment(JSON.stringify(TIPTAP_WITH_LITERAL_MENTION_TEXT)))

  assert.deepEqual(JSON.parse(normalized.content.text), TIPTAP_WITH_LITERAL_MENTION_TEXT)
  assert.equal(normalized.content.text.includes('<a'), false)
  assert.equal(normalized.content.text.includes('hello @alice'), true)
})

test('keeps malformed Comment JSON byte-visible without throwing', () => {
  assert.doesNotThrow(() => normalizeComment(comment(MALFORMED_COMMENT_JSON)))
  assert.equal(normalizeComment(comment(MALFORMED_COMMENT_JSON)).content.text, MALFORMED_COMMENT_JSON)
})

test('keeps valid JSON plain Comments visible after provider normalization', () => {
  for (const raw of VALID_JSON_PLAIN_TEXTS)
    assert.equal(normalizeComment(comment(raw)).content.text, raw)
})

test('normalizes Comment attachments without changing content order', () => {
  const normalized = normalizeComment(comment('Text\n![one](https://assets.example/one.png)\n![two](https://assets.example/two.png){thumbhash:"h",width:"10",height:"20"}'))

  assert.equal(normalized.content.text, 'Text')
  assert.deepEqual(normalized.content.images, [
    { src: 'https://assets.example/one.png', alt: 'one' },
    { src: 'https://assets.example/two.png', alt: 'two', thumbHash: 'h', width: 10, height: 20 },
  ])
})

test('existing image formatter delegates to the codec without wire changes', () => {
  const uploaded = [{
    uid: 1,
    name: 'photo.webp',
    status: 'success',
    url: 'https://assets.example/photo.webp',
    alt: 'photo.webp',
    thumbHash: { dataBase64: 'hash', width: 640, height: 480 },
  }] as UploadedUserFile[]

  assert.equal(
    formatMarkdownImages(uploaded),
    '\n![photo.webp](https://assets.example/photo.webp){thumbhash:"hash",width:"640",height:"480"}',
  )
})
