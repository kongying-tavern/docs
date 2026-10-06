import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { normalizeComment, normalizeIssue } from '../../src/forum/api/gitee/normalize'
import { extractOfficialAndAuthorComments } from '../../src/forum/api/gitee/officialComments'
import { composeTopicBody, writeTopicBodyComment } from '../../src/forum/composables/util/composeTopicBody'
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

test('official comment extraction receives permission state from its caller', () => {
  const authorComment = { ...comment('author'), id: 1, user, target: { issue: { id: 101 } } }
  const officialComment = {
    ...comment('official'),
    id: 2,
    user: { ...user, id: 8, login: 'moderator' },
    target: { issue: { id: 101 } },
  }
  const sourceIssue = { ...issue('body'), id: 101 } as GITEE.IssueInfo
  const result = extractOfficialAndAuthorComments(
    sourceIssue,
    [authorComment, officialComment] as unknown as GITEE.CommentList,
    userId => Number(userId) === 8,
  )

  assert.deepEqual(result?.map(item => item.id), [1, 2])
})

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

test('normalizes rich Topics to readable text while retaining the source document', () => {
  const raw = JSON.stringify(VALID_TIPTAP_DOC)
  const topic = normalizeIssue(issue(raw))
  assert.equal(topic.content.text, 'Hello @alice emoji/happy.webp\n')
  assert.equal(topic.contentRaw, raw)
  assert.equal(topic.type, 'BUG')
  assert.equal(topic.title, 'Codec contract')
})

test('normalizes only valid quoted Topic metadata into the public Topic contract', () => {
  const valid = normalizeIssue(issue('<!-- {"quotedTopic":{"id":"ICROD8","type":"BUG"}} -->Body'))
  const invalid = normalizeIssue(issue('<!-- {"quotedTopic":{"id":"../admin","type":"BUG"}} -->Body'))

  assert.deepEqual(valid.quotedTopic, { id: 'ICROD8', type: 'BUG' })
  assert.equal(invalid.quotedTopic, undefined)
  assert.equal(valid.content.text, 'Body')
})

test('normalizes pinned state from the authoritative Gitee label', () => {
  const pinnedIssue = issue('Body')
  pinnedIssue.labels = [{ name: 'PINNED' }] as GITEE.IssueLabel[]
  assert.equal(normalizeIssue(pinnedIssue).pinned, true)
  assert.equal(normalizeIssue(issue('Body')).pinned, false)
})

test('normalizes provider labels separately from editable tags and status fields', () => {
  const labeledIssue = issue('Body')
  labeledIssue.labels = [
    { name: 'TYP-BUG' },
    { name: 'CATA-DOCS' },
    { name: 'ST-CONFIRMED' },
    { name: 'GOOD-ISSUE' },
  ] as GITEE.IssueLabel[]

  const topic = normalizeIssue(labeledIssue)
  assert.deepEqual(topic.labels, ['TYP-BUG', 'CATA-DOCS', 'ST-CONFIRMED', 'GOOD-ISSUE'])
  assert.deepEqual(topic.tags, ['CATA-DOCS'])
  assert.equal(topic.status, 'confirmed')
  assert.equal(topic.goodIssue, true)
})

test('normalizes the authoritative Gitee close time', () => {
  const closedIssue = issue('Body')
  closedIssue.state = 'closed'
  closedIssue.finished_at = '2026-08-25T12:00:00Z'
  assert.equal(normalizeIssue(closedIssue).closedAt, closedIssue.finished_at)
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
