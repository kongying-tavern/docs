import assert from 'node:assert/strict'
import { test } from 'vitest'
import { resolveAccountLoginRollout, selectAccountLoginRollout } from '../../src/forum/services/experiment/accountLoginExperiment'
import { selectFeedbackFormVariant } from '../../src/forum/services/form/feedbackFormExperiment'

test('administrators are enrolled by default and other accounts stay out', () => {
  assert.equal(selectAccountLoginRollout('123', 0, true), true)
  assert.equal(selectAccountLoginRollout('123', 10, true), true)
  assert.equal(selectAccountLoginRollout('123', 0, false), false)
  assert.equal(selectAccountLoginRollout('123', Number.NaN, false), false)
  assert.equal(selectAccountLoginRollout(undefined, 100, false), false)
  assert.equal(selectAccountLoginRollout(undefined, 100, true), false)
})

test('only identified administrators can override the rollout in either direction', () => {
  assert.equal(resolveAccountLoginRollout('123', 0, true, true), true)
  assert.equal(resolveAccountLoginRollout('123', 0, true, false), false)
  assert.equal(resolveAccountLoginRollout('123', 0, false, true), false)
  assert.equal(resolveAccountLoginRollout('123', 100, false, false), true)
  assert.equal(resolveAccountLoginRollout(undefined, 0, true, true), false)
  assert.equal(resolveAccountLoginRollout('123', 0, true), selectAccountLoginRollout('123', 0, true))
})

test('rollout is deterministic and keeps participants when traffic grows', () => {
  let participants = 0
  for (let id = 1; id <= 10000; id++) {
    const enrolled = selectAccountLoginRollout(id, 10, false)
    assert.equal(selectAccountLoginRollout(id, 10, false), enrolled)
    if (!enrolled)
      continue
    participants++
    assert.equal(selectAccountLoginRollout(id, 50, false), true)
  }
  assert.ok(participants > 850 && participants < 1150, `Enrolled ${participants}/10000`)
})

test('the rollout is independent from the feedback form rollout', () => {
  let participants = 0
  let overlap = 0
  for (let id = 1; id <= 1000; id++) {
    if (!selectAccountLoginRollout(id, 10, false))
      continue
    participants++
    if (selectFeedbackFormVariant(id, 10) === 'compact')
      overlap++
  }
  assert.ok(participants > 70, `Enrolled ${participants}/1000`)
  assert.ok(overlap < participants * 0.4, `Overlap ${overlap}/${participants}`)
})
