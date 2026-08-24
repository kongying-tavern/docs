/* eslint-disable test/no-import-node-test */
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  flattenForumPages,
  forumKeys,
  forumMutationPolicies,
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
  assert.equal(requiresAuthoritativeRefetch('failure'), false)
  assert.equal(requiresAuthoritativeRefetch('partial'), true)
  assert.equal(requiresAuthoritativeRefetch('unknown'), true)
})
