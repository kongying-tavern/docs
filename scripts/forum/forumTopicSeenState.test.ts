/* eslint-disable test/no-import-node-test */
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  isClosedUnseen,
  markForumTopicSeen,
  readForumTopicSeenMap,
} from '../../src/services/forum/forumTopicSeenState'

function storage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial))
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  }
}

test('keeps one seen timestamp per topic across reads and writes', () => {
  const store = storage()
  markForumTopicSeen(store, '101', 1000)
  markForumTopicSeen(store, '102', 2000)
  markForumTopicSeen(store, '101', 3000)

  const map = readForumTopicSeenMap(store)
  assert.equal(map.get('101'), 3000)
  assert.equal(map.get('102'), 2000)
  assert.equal(readForumTopicSeenMap(storage()).size, 0)
})

test('drops the oldest entries once the seen map exceeds its cap', () => {
  const store = storage()
  for (let index = 1; index <= 501; index++)
    markForumTopicSeen(store, String(index), index * 1000)

  const map = readForumTopicSeenMap(store)
  assert.equal(map.size, 500)
  assert.equal(map.has('1'), false)
  assert.equal(map.has('501'), true)
})

test('closed topics count as unseen only when they closed after the last visit', () => {
  const closedAt = '2026-09-01T00:00:00.000Z'
  const closedAtMs = Date.parse(closedAt)

  assert.equal(isClosedUnseen({ state: 'closed', closedAt }, 0), true)
  assert.equal(isClosedUnseen({ state: 'closed', closedAt }, closedAtMs - 1), true)
  assert.equal(isClosedUnseen({ state: 'closed', closedAt }, closedAtMs), false)
  assert.equal(isClosedUnseen({ state: 'open', closedAt }, 0), false)
  assert.equal(isClosedUnseen({ state: 'progressing', closedAt }, 0), false)
  assert.equal(isClosedUnseen({ state: 'closed' }, 0), true)
  assert.equal(isClosedUnseen({ state: 'closed', closedAt: 'not-a-date' }, 0), true)
})
