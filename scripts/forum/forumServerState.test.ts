/* eslint-disable test/no-import-node-test */
import type ForumAPI from '../../.vitepress/theme/apis/forum/api'
import assert from 'node:assert/strict'
import test from 'node:test'
import { serializeTopicCommentMutation } from '../../src/composables/forum/useForumMutations'
import {
  collectForumTopics,
  flattenForumPages,
  forumKeys,
  forumMutationPolicies,
  forumTopicBelongsToList,
  mapTopicInForumPages,
  prependTopicToForumPages,
  removeTopicFromForumPages,
  requiresAuthoritativeRefetch,
} from '../../src/services/forum/forumQueryContracts'

const home = { filter: 'all', sort: 'created', creator: null, q: '', pageSize: 20 } as const

test('topic list keys normalize property order and never contain a page number', () => {
  const reordered = { q: '', creator: null, sort: 'created', pageSize: 20, filter: 'all' } as const
  assert.deepEqual(forumKeys.topicList(home), forumKeys.topicList(reordered))
  assert.equal(JSON.stringify(forumKeys.topicList(home)).includes('"page"'), false)
})

test('every list membership dimension changes the stable key', () => {
  const base = JSON.stringify(forumKeys.topicList(home))
  for (const params of [
    { ...home, filter: 'bug' as const },
    { ...home, sort: 'updated' as const },
    { ...home, creator: 'alice' },
    { ...home, q: 'map' },
  ])
    assert.notEqual(JSON.stringify(forumKeys.topicList(params)), base)
})

test('Home and User share one list key factory without colliding', () => {
  const homeKey = forumKeys.topicList(home)
  const userKey = forumKeys.topicList({ ...home, creator: 'alice' })
  assert.deepEqual(homeKey.slice(0, 3), userKey.slice(0, 3))
  assert.notDeepEqual(homeKey, userKey)
})

test('detail, viewed profile, session user, and creator list keys stay separate', () => {
  assert.notDeepEqual(forumKeys.topic('A'), forumKeys.topic('B'))
  assert.notDeepEqual(forumKeys.user('alice'), forumKeys.user('bob'))
  assert.notDeepEqual(forumKeys.user('alice'), forumKeys.sessionUser())
  assert.notDeepEqual(forumKeys.user('alice'), forumKeys.topicList({ ...home, creator: 'alice' }))
})

test('creator A cannot populate creator B list or profile keys', () => {
  assert.notDeepEqual(forumKeys.topicList({ ...home, creator: 'alice' }), forumKeys.topicList({ ...home, creator: 'bob' }))
  assert.notDeepEqual(forumKeys.user('alice'), forumKeys.user('bob'))
})

test('legacy submitted-row composition reproduces duplicate Topic IDs', () => {
  const topic = { id: 'A' }
  assert.deepEqual([topic, ...[topic]].map(item => item.id), ['A', 'A'])
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

test('mutation matrix invalidates authoritative memberships exactly once', () => {
  assert.equal(forumMutationPolicies.createTopic.patchDetail, true)
  assert.equal(forumMutationPolicies.editTopic.invalidateTopicLists, true)
  assert.equal(forumMutationPolicies.changeTopicMembership.invalidateTopicLists, true)
  assert.equal(forumMutationPolicies.pinTopic.invalidatePinned, true)
  assert.equal(forumMutationPolicies.closeTopic.invalidateTopicLists, true)
  assert.equal(forumMutationPolicies.createComment.invalidateComments, true)
  assert.equal(forumMutationPolicies.createComment.invalidateDetail, true)
  assert.equal(forumMutationPolicies.deleteComment.invalidateComments, true)
  assert.equal(forumMutationPolicies.deleteComment.invalidateDetail, true)
  assert.equal(forumMutationPolicies.toggleCommentArea.invalidateComments, true)
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
