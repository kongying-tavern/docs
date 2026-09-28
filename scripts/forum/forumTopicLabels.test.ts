/* eslint-disable test/no-import-node-test */
import type ForumAPI from '../../src/forum/api/types'
import assert from 'node:assert/strict'
import test from 'node:test'
import { isTopicTypeChangeConfirmed } from '../../src/forum/api/gitee/issues'
import { normalizeIssue } from '../../src/forum/api/gitee/normalize'
import { buildTopicMembershipPatch, buildTopicTypeChangePatch, composeTopicBody } from '../../src/forum/composables/util/composeTopicBody'
import { decodeTopicBody } from '../../src/forum/services/forumContentCodec'
import {
  buildTopicCreationLabels,
  getEditableTopicLabels,
  parseTopicLabels,
  replaceEditableTopicLabels,
  replaceTopicTypeLabel,
  toggleTopicLabel,
} from '../../src/forum/services/forumTopicLabels'
import {
  getAvailableTopicStatuses,
  getConclusiveTopicStatuses,
  getTopicDisplayStatus,
  getTopicStatus,
  replaceTopicStatus,
  topicStatusHidesTopic,
} from '../../src/forum/services/forumTopicStatus'

test('Topic label edits preserve provider labels and keep one type', () => {
  const labels = ['WEB-FEEDBACK', 'LC-ZH', 'TYP-BUG', 'CATA-DOCS', 'PINNED']

  assert.deepEqual(replaceTopicTypeLabel(labels, 'FEAT'), [
    'WEB-FEEDBACK',
    'LC-ZH',
    'CATA-DOCS',
    'PINNED',
    'TYP-FEAT',
  ])
  assert.deepEqual(replaceEditableTopicLabels(labels, ['CATA-LOGIN', 'CATA-LOGIN']), [
    'WEB-FEEDBACK',
    'LC-ZH',
    'TYP-BUG',
    'PINNED',
    'CATA-LOGIN',
  ])
  assert.deepEqual(getEditableTopicLabels(labels), ['CATA-DOCS'])
  assert.deepEqual(toggleTopicLabel(labels, 'PINNED', false), ['WEB-FEEDBACK', 'LC-ZH', 'TYP-BUG', 'CATA-DOCS'])
  assert.deepEqual(parseTopicLabels('TYP-BUG, PINNED,TYP-BUG'), ['TYP-BUG', 'PINNED'])
})

test('new Topic labels include the selected provider type in request and body metadata', () => {
  for (const type of ['BUG', 'FEAT', 'ANN'] as const) {
    const labels = buildTopicCreationLabels(type, 'WEB-FEEDBACK', 'LC-ZH', ['CATA-DOCS'])
    assert.deepEqual(labels, ['WEB-FEEDBACK', 'LC-ZH', 'CATA-DOCS', `TYP-${type}`])
    assert.equal(labels.join(',').includes(`TYP-${type}`), true)
    assert.deepEqual(decodeTopicBody(composeTopicBody('Feedback', { labels })).metadata.labels, labels)
  }
})

test('type change writes label and body metadata without altering the title', () => {
  const topic = {
    title: 'Existing title',
    labels: ['WEB-FEEDBACK', 'TYP-BUG', 'CATA-DOCS'],
    contentRaw: '<!-- {"labels":["WEB-FEEDBACK","TYP-BUG"],"legacy":{"keep":true}} -->Body',
  } as ForumAPI.Topic
  const patch = buildTopicTypeChangePatch(topic, 'FEAT')

  assert.equal('title' in patch, false)
  assert.equal(patch.labels, 'WEB-FEEDBACK,CATA-DOCS,TYP-FEAT')
  const decoded = decodeTopicBody(patch.body)
  assert.equal(decoded.content.text, 'Body')
  assert.deepEqual(decoded.metadata.labels, ['WEB-FEEDBACK', 'CATA-DOCS', 'TYP-FEAT'])
  assert.deepEqual(decoded.metadata.legacy, { keep: true })
})

test('membership changes keep request labels and state aligned with Webhook metadata', () => {
  const topic = {
    labels: ['WEB-FEEDBACK', 'TYP-BUG', 'CATA-DOCS'],
    tags: ['CATA-DOCS'],
    state: 'open',
    contentRaw: '<!-- {"labels":["TYP-BUG"],"state":"closed","legacy":{"keep":true}} -->Body',
  } as ForumAPI.Topic

  for (const changes of [
    { labels: ['WEB-FEEDBACK', 'TYP-BUG', 'CATA-LOGIN'] },
    { labels: ['WEB-FEEDBACK', 'TYP-BUG', 'CATA-DOCS', 'PINNED'] },
    { state: 'progressing' as const },
    { labels: ['WEB-FEEDBACK', 'TYP-BUG', 'ST-FIXED'], state: 'closed' as const },
  ]) {
    const patch = buildTopicMembershipPatch(topic, changes)
    const metadata = decodeTopicBody(patch.body).metadata
    assert.deepEqual(metadata.labels, parseTopicLabels(patch.labels))
    assert.equal(metadata.state, patch.state)
    assert.deepEqual(metadata.legacy, { keep: true })
  }
})

test('type label overrides the legacy title prefix, and read-back confirmation requires the new label', () => {
  const issue = {
    number: 'I1',
    title: 'BUG:Existing title',
    body: 'Body',
    labels: [{ name: 'TYP-FEAT' }],
    comments: 0,
    state: 'open',
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
  } as unknown as GITEE.IssueInfo
  const updated = normalizeIssue(issue)
  assert.equal(updated.type, 'FEAT')
  assert.equal(updated.title, 'Existing title')
  assert.equal(isTopicTypeChangeConfirmed(updated, 'FEAT'), true)
  assert.equal(isTopicTypeChangeConfirmed(normalizeIssue({ ...issue, labels: [{ name: 'TYP-BUG' }] } as GITEE.IssueInfo), 'FEAT'), false)
  assert.equal(normalizeIssue({ ...issue, labels: [] }).type, 'BUG')
})

test('Topic status labels are exclusive while preserving unrelated labels', () => {
  const labels = ['TYP-BUG', 'CATA-DOCS', 'ST-CONFIRMED', 'GOOD-ISSUE']

  assert.deepEqual(replaceTopicStatus(labels, 'fixed'), [
    'TYP-BUG',
    'CATA-DOCS',
    'GOOD-ISSUE',
    'ST-FIXED',
  ])
  assert.deepEqual(replaceTopicStatus([...labels, 'ST-STALE'], null), [
    'TYP-BUG',
    'CATA-DOCS',
    'GOOD-ISSUE',
  ])
  assert.equal(getTopicStatus(['ST-STALE', 'ST-FIXED']), 'stale')
})

test('Topic status definitions expose type and hiding semantics', () => {
  assert.deepEqual(
    getAvailableTopicStatuses('FEAT').map(definition => definition.id),
    ['roadmap', 'rfc', 'not-planned', 'stale', 'duplicate', 'invalid'],
  )
  assert.deepEqual(
    getConclusiveTopicStatuses('BUG').map(definition => definition.id),
    ['wontfix', 'fixed', 'not-reproducible', 'duplicate', 'invalid'],
  )
  assert.equal(topicStatusHidesTopic('fixed'), true)
  assert.equal(topicStatusHidesTopic('confirmed'), false)
})

test('closed Topics without a label expose the default closed display status', () => {
  assert.equal(getTopicDisplayStatus(undefined, 'closed'), 'closed')
  assert.equal(getTopicDisplayStatus(undefined, 'progressing'), 'closed')
  assert.equal(getTopicDisplayStatus('fixed', 'closed'), 'fixed')
  assert.equal(getTopicDisplayStatus(undefined, 'open'), undefined)
})
