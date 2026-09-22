/* eslint-disable test/no-import-node-test */
import assert from 'node:assert/strict'
import test from 'node:test'
import { composeTopicBody } from '../../src/composables/composeTopicBody'
import { decodeTopicBody } from '../../src/services/forum/forumContentCodec'
import {
  buildTopicCreationLabels,
  getEditableTopicLabels,
  parseTopicLabels,
  replaceEditableTopicLabels,
  replaceTopicTypeLabel,
  toggleTopicLabel,
} from '../../src/services/forum/forumTopicLabels'
import {
  getAvailableTopicStatuses,
  getConclusiveTopicStatuses,
  getTopicDisplayStatus,
  getTopicStatus,
  replaceTopicStatus,
  topicStatusHidesTopic,
} from '../../src/services/forum/forumTopicStatus'

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
