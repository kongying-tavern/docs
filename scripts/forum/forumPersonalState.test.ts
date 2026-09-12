/* eslint-disable test/no-import-node-test -- use Node's built-in runner for this contract */
import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import {
  decodeForumPersonalState,
  emptyForumPersonalState,
  isRecentClosedTopic,
  parseForumPersonalState,
  recordParticipation,
  removeFollowedTopic,
  serializeForumPersonalState,
  toggleFollowedTopic,
} from '../../src/services/forum/forumPersonalState'
import {
  ForumPersonalStateCorruptionError,
  readForumStateGist,
} from '../../src/services/forum/forumPersonalStateRepository'

const first = {
  topicId: '1',
  title: 'First topic',
  type: 'BUG' as const,
  authorLogin: 'alice',
  recordedAt: '2026-08-25T00:00:00.000Z',
}
const second = { ...first, topicId: '2', title: 'Second topic' }

test('personal state safely parses malformed and duplicate gist data', () => {
  assert.deepEqual(parseForumPersonalState('{'), emptyForumPersonalState())
  assert.deepEqual(parseForumPersonalState(JSON.stringify({
    version: 1,
    followedTopics: [first, first, { title: 'invalid' }],
    recentParticipated: [second],
  })), {
    version: 1,
    followedTopics: [first],
    recentParticipated: [second],
  })
})

test('strict gist decoding rejects data that must not be overwritten', () => {
  assert.equal(decodeForumPersonalState('{').ok, false)
  assert.equal(decodeForumPersonalState(JSON.stringify({ version: 2, followedTopics: [], recentParticipated: [] })).ok, false)
  assert.equal(decodeForumPersonalState(JSON.stringify({ version: 1, followedTopics: [{ title: 'invalid' }], recentParticipated: [] })).ok, false)

  assert.throws(() => serializeForumPersonalState({
    version: 1,
    followedTopics: [{ ...first, type: null }],
    recentParticipated: [],
  }), /Refusing to save invalid forum personal state/)
})

test('valid gist state round-trips through the guarded serializer', () => {
  const state = { ...emptyForumPersonalState(), followedTopics: [first] }
  const decoded = decodeForumPersonalState(serializeForumPersonalState(state))
  assert.equal(decoded.ok, true)
  if (decoded.ok)
    assert.deepEqual(decoded.state, state)
})

test('repository rejects a corrupt remote gist instead of treating it as empty', () => {
  const gist = {
    id: 'gist-1',
    description: 'Kongying Forum State',
    files: { 'kongying-forum-state.json': { content: '{' } },
    public: false,
  }
  assert.throws(
    () => readForumStateGist(gist),
    (error: unknown) => error instanceof ForumPersonalStateCorruptionError && error.gistId === gist.id,
  )
})

test('following toggles and participation stays deduplicated and recent-first', () => {
  const followed = toggleFollowedTopic(emptyForumPersonalState(), first)
  assert.deepEqual(followed.followedTopics, [first])
  assert.deepEqual(toggleFollowedTopic(followed, first).followedTopics, [])
  assert.deepEqual(removeFollowedTopic(followed, first.topicId).followedTopics, [])

  const participated = recordParticipation(recordParticipation(followed, first), second)
  assert.deepEqual(participated.recentParticipated, [second, first])
  assert.deepEqual(recordParticipation(participated, first).recentParticipated, [first, second])
})

test('closed sidebar topics expire seven days after their authoritative close time', () => {
  const now = Date.parse('2026-08-28T00:00:00.000Z')
  assert.equal(isRecentClosedTopic({ state: 'open' }, now), true)
  assert.equal(isRecentClosedTopic({ state: 'closed' }, now), true)
  assert.equal(isRecentClosedTopic({ state: 'closed', closedAt: '2026-08-21T00:00:00.000Z' }, now), true)
  assert.equal(isRecentClosedTopic({ state: 'closed', closedAt: '2026-08-20T23:59:59.999Z' }, now), false)
})
