import assert from 'node:assert/strict'
import { test } from 'vitest'
import { constrainSwipe, fullSwipeThreshold, resolveSwipeRelease, swipeSide, swipeVelocity } from '../../../.vitepress/theme/components/ui/swipe-actions/gesture'

const input = { value: 100, velocity: 0, count: 2, width: 400, fullSwipe: true, armed: false }

test('full swipe threshold accounts for both action count and measured row width', () => {
  assert.ok(Math.abs(fullSwipeThreshold(152, 400) - 224) < 0.001)
  assert.equal(fullSwipeThreshold(228, 320), 276)
})

test('short drags close while half-open drags settle on their side', () => {
  assert.deepEqual(resolveSwipeRelease({ ...input, value: 60 }), { commit: false, target: 0 })
  assert.deepEqual(resolveSwipeRelease(input), { commit: false, target: 152 })
  assert.deepEqual(resolveSwipeRelease({ ...input, value: -100 }), { commit: false, target: -152 })
})

test('full swipe and outward flick commit, but an inward flick cancels an armed swipe', () => {
  assert.equal(resolveSwipeRelease({ ...input, armed: true }).commit, true)
  assert.equal(resolveSwipeRelease({ ...input, value: 180, velocity: 1000 }).commit, true)
  assert.deepEqual(resolveSwipeRelease({ ...input, value: 240, velocity: -2000, armed: true }), { commit: false, target: 0 })
  assert.equal(resolveSwipeRelease({ ...input, value: -180, velocity: -1000 }).commit, true)
})

test('cancelled gestures never commit, including an armed full swipe', () => {
  assert.deepEqual(resolveSwipeRelease({ ...input, armed: true, cancelled: true }), { commit: false, target: 0 })
})

test('fullSwipe false and missing actions never commit', () => {
  assert.equal(resolveSwipeRelease({ ...input, armed: true, fullSwipe: false }).commit, false)
  assert.deepEqual(resolveSwipeRelease({ ...input, armed: true, count: 0 }), { commit: false, target: 0 })
})

test('elastic overscroll is symmetric and limits missing-side travel', () => {
  const overscroll = constrainSwipe(200, 1, 400, false)
  assert.ok(overscroll > 76 && overscroll < 200)
  assert.equal(constrainSwipe(-200, 1, 400, false), -overscroll)
  assert.ok(constrainSwipe(100, 0, 400, true) < 100)
  assert.equal(constrainSwipe(200, 1, 400, true), 200)
  assert.ok(Number.isFinite(constrainSwipe(100, 0, 0, true)))
})

test('release velocity uses the last 80ms and a pause cancels stale momentum', () => {
  assert.equal(swipeVelocity([[0, 0], [100, 100], [150, 150]]), 1000)
  assert.equal(swipeVelocity([[0, 0], [100, 100], [250, 100]]), 0)
  assert.equal(swipeVelocity([]), 0)
  assert.equal(swipeVelocity([[0, 0], [0, 10]]), 0)
})

test('narrow rows cap the resting action width', () => {
  assert.equal(resolveSwipeRelease({ ...input, width: 100, value: 80 }).target, 100)
  assert.equal(swipeSide(0), null)
  assert.equal(swipeSide(-1), 'trailing')
  assert.equal(swipeSide(1), 'leading')
})
