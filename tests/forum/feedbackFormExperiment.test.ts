import assert from 'node:assert/strict'
import { test } from 'vitest'
import { resolveFeedbackFormVariant, selectFeedbackFormVariant } from '../../src/forum/services/form/feedbackFormExperiment'

test('only identified administrators can override rollout in either direction', () => {
  assert.equal(resolveFeedbackFormVariant('123', 0, true, true), 'compact')
  assert.equal(resolveFeedbackFormVariant('123', 100, true, false), 'legacy')
  assert.equal(resolveFeedbackFormVariant('123', 0, true, false), 'legacy')
  assert.equal(resolveFeedbackFormVariant('123', 0, false, true), 'legacy')
  assert.equal(resolveFeedbackFormVariant('123', 100, false, false), 'compact')
  assert.equal(resolveFeedbackFormVariant(undefined, 100, true, true), 'legacy')
  assert.equal(resolveFeedbackFormVariant('123', 10, true), selectFeedbackFormVariant('123', 10))
})

test('the switch selects the opposite of the assigned variant and clearing it restores assignment', () => {
  for (const percentage of [0, 10, 100]) {
    const assigned = selectFeedbackFormVariant('123', percentage)
    const override = assigned !== 'compact'
    assert.notEqual(resolveFeedbackFormVariant('123', percentage, true, override), assigned)
    assert.equal(resolveFeedbackFormVariant('123', percentage, true), assigned)
  }
})

test('rollout is deterministic, supports rollback and excludes unidentified accounts', () => {
  assert.equal(selectFeedbackFormVariant(undefined, 100), 'legacy')
  for (const percentage of [0, -1, Number.NaN])
    assert.equal(selectFeedbackFormVariant('123', percentage), 'legacy')
  assert.equal(selectFeedbackFormVariant('123', 100), 'compact')
  assert.equal(selectFeedbackFormVariant(123, 10), selectFeedbackFormVariant('123', 10))
})

test('increasing traffic preserves participants and roughly allocates the configured percentage', () => {
  let participants = 0
  for (let id = 1; id <= 10000; id++) {
    const variant = selectFeedbackFormVariant(id, 10)
    assert.equal(selectFeedbackFormVariant(id, 10), variant)
    if (variant === 'compact') {
      participants++
      assert.equal(selectFeedbackFormVariant(id, 50), 'compact')
    }
  }
  assert.ok(participants > 850 && participants < 1150, `Allocated ${participants}/10000`)
})
