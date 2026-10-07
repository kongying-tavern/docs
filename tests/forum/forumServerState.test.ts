import type ForumAPI from '../../src/forum/api/types'
import assert from 'node:assert/strict'
import { test, vi } from 'vitest'
import { serializeTopicCommentMutation } from '../../src/forum/composables/data/useForumMutations'
import {
  collectForumTopics,
  flattenForumPages,
  forumKeys,
  forumTopicBelongsToList,
  mapTopicInForumPages,
  prependTopicToForumPages,
  removeTopicFromForumPages,
  requiresAuthoritativeRefetch,
} from '../../src/forum/services/forumQueryContracts'

const home = { filter: 'all', sort: 'created', creator: null, q: '', pageSize: 20 } as const

test('topic list keys normalize property order and never contain a page number', () => {
  const reordered = { q: '', creator: null, sort: 'created', pageSize: 20, filter: 'all' } as const
  assert.deepEqual(forumKeys.topicList(home), forumKeys.topicList(reordered))
  assert.equal(JSON.stringify(forumKeys.topicList(home)).includes('"page"'), false)
})

test('every list membership dimension changes the stable key', () => {
  const base = JSON.stringify(forumKeys.topicList(home))
  const keys = [
    { ...home, filter: 'bug' as const },
    { ...home, filter: 'everything' as const },
    { ...home, sort: 'updated' as const },
    { ...home, creator: 'alice' },
    { ...home, creator: 'bob' },
    { ...home, q: 'map' },
  ].map(params => JSON.stringify(forumKeys.topicList(params)))
  assert.equal(new Set([base, ...keys]).size, keys.length + 1)
})

test('detail, viewed profile, session user, and creator list keys stay separate', () => {
  assert.notDeepEqual(forumKeys.topic('A'), forumKeys.topic('B'))
  assert.notDeepEqual(forumKeys.user('alice'), forumKeys.user('bob'))
  assert.notDeepEqual(forumKeys.user('alice'), forumKeys.sessionUser())
  assert.notDeepEqual(forumKeys.user('alice'), forumKeys.topicList({ ...home, creator: 'alice' }))
})

test('infinite pages flatten in order and deduplicate by Topic ID', () => {
  assert.deepEqual(flattenForumPages([
    { items: [{ id: 'A' }, { id: 'B' }], total: 3, totalPage: 2 },
    { items: [{ id: 'B' }, { id: 'C' }], total: 3, totalPage: 2 },
  ]).map(item => item.id), ['A', 'B', 'C'])
})

test('topic suggestions collect detail, pinned, and paged cache shapes once', () => {
  const detail = { id: 'A', title: 'detail', content: { text: 'A' } } as ForumAPI.Topic
  const pinned = { id: 'B', title: 'pinned', content: { text: 'B' } } as ForumAPI.Topic
  const paged = { id: 'C', title: 'paged', content: { text: 'C' } } as ForumAPI.Topic

  assert.deepEqual(collectForumTopics([
    detail,
    [detail, pinned],
    { pages: [{ items: [pinned, paged] }] },
    { pages: [{ items: ['invalid'] }] },
  ]).map(topic => topic.id), ['A', 'B', 'C'])
})

test('closing a Topic removes it from every cached page and updates totals once', () => {
  const cached = {
    pages: [
      { items: [{ id: 'A' }, { id: 'B' }], total: 3, totalPage: 2 },
      { items: [{ id: 'C' }], total: 3, totalPage: 2 },
    ],
    pageParams: [1, 2],
  }

  const next = removeTopicFromForumPages(cached, 'B')
  assert.deepEqual(next.pages.map(page => page.items.map(item => item.id)), [['A'], ['C']])
  assert.deepEqual(next.pages.map(page => page.total), [2, 2])
  assert.deepEqual(next.pageParams, [1, 2])
  assert.equal(removeTopicFromForumPages(cached, 'missing'), cached)
})

test('authoritative Topic updates replace every cached copy without changing membership totals', () => {
  const cached = {
    pages: [
      { items: [{ id: 'A', title: 'old' }], total: 2, totalPage: 2 },
      { items: [{ id: 'B', title: 'other' }], total: 2, totalPage: 2 },
    ],
    pageParams: [1, 2],
  }

  const next = mapTopicInForumPages(cached, 'A', topic => ({ ...topic, title: 'new' }))
  assert.equal(next.pages[0].items[0].title, 'new')
  assert.deepEqual(next.pages.map(page => page.total), [2, 2])
  assert.equal(mapTopicInForumPages(cached, 'missing', topic => topic), cached)
})

test('list membership follows the same state, type, creator, and full-text tuple as queries', () => {
  const topic = {
    id: 'A',
    state: 'open',
    type: 'BUG',
    title: 'Map position',
    content: { text: 'tracking details' },
    user: { login: 'alice' },
  } as ForumAPI.Topic
  const params = { filter: 'all', sort: 'created', creator: null, q: '', pageSize: 20 } as const

  assert.equal(forumTopicBelongsToList(topic, params), true)
  assert.equal(forumTopicBelongsToList(topic, { ...params, filter: 'feat' }), false)
  assert.equal(forumTopicBelongsToList(topic, { ...params, creator: 'bob' }), false)
  assert.equal(forumTopicBelongsToList(topic, { ...params, q: 'TRACKING' }), true)
  assert.equal(forumTopicBelongsToList({ ...topic, state: 'closed' }, params), false)
  assert.equal(forumTopicBelongsToList({ ...topic, state: 'progressing' }, { ...params, filter: 'closed' }), true)
  assert.equal(forumTopicBelongsToList({ ...topic, state: 'progressing' }, { ...params, filter: 'closed', topicType: 'bug' }), true)
  assert.equal(forumTopicBelongsToList({ ...topic, state: 'progressing' }, { ...params, filter: 'closed', topicType: 'feat' }), false)
  assert.equal(forumTopicBelongsToList({ ...topic, state: 'closed' }, { ...params, filter: 'archived' }), true)
  assert.equal(forumTopicBelongsToList({ ...topic, state: 'open' }, { ...params, filter: 'archived' }), false)
  assert.equal(forumTopicBelongsToList({ ...topic, state: 'progressing' }, { ...params, filter: 'everything' }), true)
  assert.equal(forumTopicBelongsToList({ ...topic, state: 'closed' }, { ...params, filter: 'everything' }), false)
})

test('reopening a missing Topic restores it at the start of cached lists', () => {
  const cached = {
    pages: [
      { items: [{ id: 'B', title: 'second' }], total: 2, totalPage: 1 },
      { items: [{ id: 'C', title: 'third' }], total: 2, totalPage: 1 },
    ],
    pageParams: [1, 2],
  }

  const restored = prependTopicToForumPages(cached, { id: 'A', title: 'reopened' })
  assert.deepEqual(restored.pages[0].items.map(topic => topic.id), ['A', 'B'])
  assert.deepEqual(restored.pages.map(page => page.total), [3, 3])
})

test('partial and unknown mutation outcomes require authoritative refetch', () => {
  assert.equal(requiresAuthoritativeRefetch('success'), false)
  assert.equal(requiresAuthoritativeRefetch('partial'), true)
  assert.equal(requiresAuthoritativeRefetch('unknown'), true)
})

test('comment writes for one Topic are serialized while different Topics stay independent', async () => {
  const events: string[] = []
  let releaseFirst!: () => void
  const first = serializeTopicCommentMutation('A', async () => {
    events.push('A1:start')
    await new Promise<void>((resolve) => {
      releaseFirst = resolve
    })
    events.push('A1:end')
  })
  const second = serializeTopicCommentMutation('A', async () => {
    events.push('A2')
  })
  const other = serializeTopicCommentMutation('B', async () => {
    events.push('B')
  })

  await other
  assert.deepEqual(events, ['A1:start', 'B'])
  releaseFirst()
  await Promise.all([first, second])
  assert.deepEqual(events, ['A1:start', 'B', 'A1:end', 'A2'])
})

test('a failed comment write does not block the next queued write', async () => {
  const events: string[] = []
  const first = serializeTopicCommentMutation('failed-queue', async () => {
    events.push('failed')
    throw new Error('Rejected')
  })
  const second = serializeTopicCommentMutation('failed-queue', async () => {
    events.push('next')
    return 'confirmed'
  })
  await assert.rejects(first, /Rejected/)
  assert.equal(await second, 'confirmed')
  assert.deepEqual(events, ['failed', 'next'])
})

test('browser comment writes use a topic-specific Web Lock and propagate failures', async () => {
  const navigatorDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'navigator')
  const request = vi.fn(async (_name: string, task: () => Promise<unknown>) => task())
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { locks: { request } } })
  try {
    assert.equal(await serializeTopicCommentMutation(42, async () => 'confirmed'), 'confirmed')
    await assert.rejects(serializeTopicCommentMutation('42', async () => {
      throw new Error('Rejected')
    }), /Rejected/)
    assert.deepEqual(request.mock.calls.map(call => call[0]), ['forum-topic-comments:42', 'forum-topic-comments:42'])
  }
  finally {
    if (navigatorDescriptor)
      Object.defineProperty(globalThis, 'navigator', navigatorDescriptor)
    else
      Reflect.deleteProperty(globalThis, 'navigator')
  }
})
