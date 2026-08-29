/* eslint-disable test/no-import-node-test */
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  getEditableTopicLabels,
  parseTopicLabels,
  replaceEditableTopicLabels,
  replaceTopicTypeLabel,
  toggleTopicLabel,
} from '../../src/services/forum/forumTopicLabels'

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
