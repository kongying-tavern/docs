import assert from 'node:assert/strict'
import { test } from 'vitest'
import { createToastQueue } from '../../src/services/telemetry/toastQueue'

test('queued notifications start only after the active notification finishes', () => {
  const queue = createToastQueue()
  const shown: string[] = []
  queue.enqueue('first', () => shown.push('first'))
  queue.enqueue('second', () => shown.push('second'))
  queue.enqueue('third', () => shown.push('third'))
  assert.deepEqual(shown, ['first'])
  queue.finish('first')
  assert.deepEqual(shown, ['first', 'second'])
  queue.finish('first')
  assert.deepEqual(shown, ['first', 'second'])
  queue.finish('second')
  assert.deepEqual(shown, ['first', 'second', 'third'])
})

test('same-id updates replace waiting entries and update active entries in place', () => {
  const queue = createToastQueue()
  const shown: string[] = []
  queue.enqueue(1, () => shown.push('loading'))
  queue.enqueue(2, () => shown.push('stale'))
  queue.enqueue(2, () => shown.push('latest'))
  queue.enqueue(1, () => shown.push('success'))
  queue.finish(1)
  assert.deepEqual(shown, ['loading', 'success', 'latest'])
})

test('dismiss pending, clear all, and desktop flush preserve queue contracts', () => {
  const queue = createToastQueue()
  const shown: number[] = []
  queue.enqueue(1, () => shown.push(1))
  queue.enqueue(2, () => shown.push(2))
  queue.enqueue(3, () => shown.push(3))
  queue.finish(2)
  queue.flush()
  assert.deepEqual(shown, [1, 3])
  queue.enqueue(4, () => shown.push(4))
  queue.enqueue(5, () => shown.push(5))
  queue.clear()
  queue.finish(4)
  queue.enqueue(6, () => shown.push(6))
  assert.deepEqual(shown, [1, 3, 4, 6])
})
