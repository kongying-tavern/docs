/* eslint-disable test/no-import-node-test -- use Node's built-in runner for this contract */
import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import {
  decodeCommentBody,
  decodeForumText,
  decodeTopicBody,
  encodeCommentBody,
  formatAttachmentMarkdown,
  formatAttachmentMarkdownList,
  parseAttachmentMarkdown,
  updateTopicMetadata,
} from '../../src/services/forum/forumContentCodec'
import {
  AMBIGUOUS_JSON_COMMENT,
  MALFORMED_AND_ORDINARY_COMMENTS,
  TIPTAP_WITH_IMAGES,
  TOPIC_WITH_METADATA_AND_IMAGE,
  VALID_JSON_PLAIN_TEXTS,
  VALID_TIPTAP_DOC,
} from './fixtures/content'

test('updates Topic metadata while preserving unknown keys and content', () => {
  const updated = updateTopicMetadata(TOPIC_WITH_METADATA_AND_IMAGE, {
    labels: ['WEB-FEEDBACK', 'CATA-DOCS'],
    state: 'closed',
  })
  const decoded = decodeTopicBody(updated)

  assert.deepEqual(decoded.metadata, {
    labels: ['WEB-FEEDBACK', 'CATA-DOCS'],
    state: 'closed',
    legacy: { keep: true },
  })
  assert.equal(decoded.content.text, 'Topic body')
  assert.deepEqual(decoded.attachments, [{
    src: 'https://webp.assets.interknot.site/a.webp',
    alt: 'diagram',
    thumbHash: 'hash',
    width: 800,
    height: 600,
  }])
})

test('preserves the existing Topic metadata bytes for the normal happy path', () => {
  assert.equal(
    updateTopicMetadata('Body', { labels: ['A'], state: 'open' }),
    '<!-- {"labels":["A"],"state":"open"} -->Body',
  )
  assert.equal(updateTopicMetadata('', { state: 'closed' }), '')
})

test('merges multiple legacy JSON comments and removes ordinary comments on rewrite', () => {
  const updated = updateTopicMetadata(
    '<!-- {"a":1,"labels":["old"]} -->\n<!-- {"a":2,"b":3} -->\nText',
    { state: 'progressing' },
  )

  assert.deepEqual(decodeTopicBody(updated).metadata, {
    a: 2,
    labels: ['old'],
    b: 3,
    state: 'progressing',
  })
  assert.equal(decodeTopicBody(updated).content.text, 'Text')
  assert.equal(updateTopicMetadata(MALFORMED_AND_ORDINARY_COMMENTS, { state: 'open' }), '<!-- {"state":"open"} -->Visible')
})

test('keeps arbitrary JSON Topic comments as ambiguous legacy metadata', () => {
  assert.deepEqual(decodeTopicBody(AMBIGUOUS_JSON_COMMENT).metadata, { unknown: 'legacy' })
  assert.equal(
    updateTopicMetadata(AMBIGUOUS_JSON_COMMENT, { state: 'open' }),
    '<!-- {"unknown":"legacy","state":"open"} -->Body',
  )
})

test('classifies only supported Tiptap documents as rich content', () => {
  const decoded = decodeForumText(JSON.stringify(VALID_TIPTAP_DOC))
  assert.equal(decoded.kind, 'tiptap')
  assert.equal(decoded.text, 'Hello @alice emoji/happy.webp\n')

  const invalidDocuments = [
    { type: 'doc' },
    { type: 'doc', content: 'not-an-array' },
    { type: 'doc', content: [] },
    { type: 'doc', content: [{ type: 'unsupported' }] },
    { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text' }] }] },
    { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'x', marks: [{ type: 'unsupported' }] }] }] },
  ]

  for (const value of invalidDocuments) {
    const raw = JSON.stringify(value)
    assert.deepEqual(decodeForumText(raw), { kind: 'plain', text: raw })
  }
})

test('keeps all valid JSON non-Tiptap values visible as plain text', () => {
  for (const text of VALID_JSON_PLAIN_TEXTS)
    assert.deepEqual(decodeForumText(text), { kind: 'plain', text })

  assert.deepEqual(decodeForumText('{broken'), { kind: 'plain', text: '{broken' })
  assert.deepEqual(decodeForumText('  '), { kind: 'plain', text: '  ' })
})

test('round-trips Comment Tiptap content and ordered attachments', () => {
  const decoded = decodeCommentBody(TIPTAP_WITH_IMAGES)
  assert.equal(decoded.content.kind, 'tiptap')
  assert.equal(decoded.content.text, 'Hello @alice emoji/happy.webp\n')
  assert.deepEqual(decoded.attachments, [
    {
      src: 'https://assets.example/one.webp',
      alt: 'first',
      thumbHash: 'abc+/=',
      width: 640,
      height: 480,
    },
    {
      src: 'https://assets.example/two.png?x=1&y=2',
      alt: 'second',
    },
  ])

  assert.equal(
    encodeCommentBody(VALID_TIPTAP_DOC, decoded.attachments),
    TIPTAP_WITH_IMAGES,
  )
})

test('parses repeated attachments and ignores invalid dimensions', () => {
  const markdown = `before\r\n![a](https://assets.example/a.png){thumbhash:"h",width:"NaN",height:"-1"}\r\n![a](https://assets.example/a.png)\r\nafter`
  const decoded = parseAttachmentMarkdown(markdown)

  assert.equal(decoded.text, 'before\n\nafter')
  assert.deepEqual(decoded.attachments, [
    { src: 'https://assets.example/a.png', alt: 'a', thumbHash: 'h' },
    { src: 'https://assets.example/a.png', alt: 'a' },
  ])
})

test('formats attachment metadata with the established grammar', () => {
  const attachment = {
    src: 'https://assets.example/photo.webp',
    alt: 'a, b (draft)',
    thumbHash: 'hash',
    width: 320,
    height: 240,
  }
  assert.equal(
    formatAttachmentMarkdown(attachment),
    '![a, b (draft)](https://assets.example/photo.webp){thumbhash:"hash",width:"320",height:"240"}',
  )
  assert.equal(formatAttachmentMarkdownList([]), '')
  assert.equal(
    formatAttachmentMarkdownList([{ src: 'https://assets.example/image.png' }]),
    '\n![Uploaded image](https://assets.example/image.png)',
  )
})

test('handles empty, whitespace and image-only Comment bodies', () => {
  assert.deepEqual(decodeCommentBody(), { content: { kind: 'plain', text: '' } })
  assert.deepEqual(decodeCommentBody('  '), { content: { kind: 'plain', text: '' } })
  assert.deepEqual(decodeCommentBody('![only](https://assets.example/only.png)'), {
    content: { kind: 'plain', text: '' },
    attachments: [{ src: 'https://assets.example/only.png', alt: 'only' }],
  })
})
