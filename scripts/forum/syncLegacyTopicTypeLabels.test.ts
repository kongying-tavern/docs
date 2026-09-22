/* eslint-disable test/no-import-node-test */
import type { LegacyTopicIssue } from './syncLegacyTopicTypeLabelsCore'
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  planTopicTypeLabels,
  verifiesTopicTypeLabels,
} from './syncLegacyTopicTypeLabelsCore'

function issue(overrides: Partial<LegacyTopicIssue> = {}): LegacyTopicIssue {
  return {
    number: '42',
    title: 'BUG: broken interaction',
    body: 'content',
    labels: [{ name: 'STA-PROGRESSING' }, { name: 'TYP-FEAT' }],
    ...overrides,
  }
}

test('plans one title-derived type label while preserving unrelated labels', () => {
  assert.deepEqual(planTopicTypeLabels(issue()), {
    type: 'BUG',
    labels: ['STA-PROGRESSING', 'TYP-BUG'],
    otherLabels: ['STA-PROGRESSING'],
  })
})

test('skips issues without a legacy prefix or with the correct type label', () => {
  assert.equal(planTopicTypeLabels(issue({ title: 'ordinary title' })), undefined)
  assert.equal(planTopicTypeLabels(issue({ labels: [{ name: 'TYP-BUG' }] })), undefined)
})

test('verification requires the intended type, preserved labels, and unchanged body', () => {
  const before = issue()
  const planned = planTopicTypeLabels(before)
  assert.ok(planned)
  assert.equal(verifiesTopicTypeLabels(before, issue({ labels: [
    { name: 'STA-PROGRESSING' },
    { name: 'TYP-BUG' },
  ] }), planned), true)
  assert.equal(verifiesTopicTypeLabels(before, issue({ body: 'changed', labels: [
    { name: 'STA-PROGRESSING' },
    { name: 'TYP-BUG' },
  ] }), planned), false)
  assert.equal(verifiesTopicTypeLabels(before, issue({ labels: [{ name: 'TYP-BUG' }] }), planned), false)
})
