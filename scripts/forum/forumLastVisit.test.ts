/* eslint-disable test/no-import-node-test */
import type ForumAPI from '../../.vitepress/theme/apis/forum/api'
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  beginForumVisitWithStorage,
  findLastVisitedDividerIndex,
} from '../../src/services/forum/forumLastVisit'

function storage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial))
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  }
}

function topic(id: string, createdAt: string, updatedAt = createdAt, pinned = false): ForumAPI.Topic {
  return { id, createdAt, updatedAt, pinned } as ForumAPI.Topic
}

test('keeps the previous visit stable for the browser session', () => {
  const persistent = storage({ 'forum:last-visited-at:v1': '100' })
  const session = storage()

  assert.equal(beginForumVisitWithStorage(persistent, session, 200), 100)
  assert.equal(beginForumVisitWithStorage(persistent, session, 300), 100)
  assert.equal(persistent.getItem('forum:last-visited-at:v1'), '200')
})

test('places the divider only between newer and older topics', () => {
  const topics = [
    topic('pinned', '2020-01-01', '2020-01-01', true),
    topic('new', '2026-08-25', '2026-08-25'),
    topic('old', '2026-08-23', '2026-08-23'),
  ]
  const previousVisitAt = Date.parse('2026-08-24')

  assert.equal(findLastVisitedDividerIndex(topics, previousVisitAt, 'created'), 2)
  assert.equal(findLastVisitedDividerIndex(topics.slice(1, 2), previousVisitAt, 'created'), -1)
  assert.equal(findLastVisitedDividerIndex(topics.slice(2), previousVisitAt, 'created'), -1)
})

test('uses the active list sort timestamp', () => {
  const topics = [
    topic('updated', '2026-08-20', '2026-08-25'),
    topic('created', '2026-08-24', '2026-08-23'),
  ]
  const previousVisitAt = Date.parse('2026-08-24T12:00:00Z')

  assert.equal(findLastVisitedDividerIndex(topics, previousVisitAt, 'updated'), 1)
  assert.equal(findLastVisitedDividerIndex(topics, previousVisitAt, 'created'), -1)
})
