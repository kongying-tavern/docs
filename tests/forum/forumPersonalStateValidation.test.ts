import { expect, test } from 'vitest'
import { decodeForumPersonalState, serializeForumPersonalState } from '../../src/forum/services/forumPersonalState'

const validTopic = {
  topicId: 'IABC',
  title: 'Saved topic',
  type: 'BUG' as const,
  authorLogin: 'alice',
  recordedAt: '2026-10-12T00:00:00.000Z',
}

test.each([
  ['object topic ID', { topicId: {} }],
  ['object title', { title: {} }],
  ['array author', { authorLogin: ['alice'] }],
  ['invalid recorded date', { recordedAt: 'not-a-date' }],
  ['empty normalized title', { title: ' ![cover](https://example.com/cover.png) ' }],
  ['blank author', { authorLogin: '  ' }],
])('strict personal-state decoding rejects %s', (_name, patch) => {
  const result = decodeForumPersonalState(JSON.stringify({
    version: 1,
    followedTopics: [{ ...validTopic, ...patch }],
    recentParticipated: [],
  }))
  expect(result.ok).toBe(false)
})

test('invalid optional counters must not survive as valid state', () => {
  const result = decodeForumPersonalState(JSON.stringify({
    version: 1,
    followedTopics: [{ ...validTopic, commentCount: -1.5 }],
    recentParticipated: [],
  }))
  if (result.ok) {
    const count = result.state.followedTopics[0].commentCount
    expect(count === undefined || (Number.isSafeInteger(count) && count >= 0)).toBe(true)
  }
})

test('serialization writes the validated normalized representation', () => {
  const serialized = JSON.parse(serializeForumPersonalState({ version: 1, followedTopics: [{ ...validTopic, commentCount: -1, closedAt: 'not-a-date' }], recentParticipated: [] }))
  expect(serialized.followedTopics[0].commentCount).toBeUndefined()
  expect(serialized.followedTopics[0].closedAt).toBeUndefined()
})

test('a newer state version is distinguished from damaged JSON', () => {
  expect(decodeForumPersonalState('{')).toMatchObject({ ok: false, kind: 'corrupt' })
  expect(decodeForumPersonalState(JSON.stringify({ version: 2, followedTopics: [], recentParticipated: [] }))).toMatchObject({ ok: false, kind: 'unsupported-version' })
})

test('valid numeric legacy topic IDs remain compatible and are deduplicated after normalization', () => {
  const result = decodeForumPersonalState(JSON.stringify({
    version: 1,
    followedTopics: [{ ...validTopic, topicId: 123 }, { ...validTopic, topicId: '123' }],
    recentParticipated: [],
  }))
  expect(result).toEqual({ ok: true, state: {
    version: 1,
    followedTopics: [{ ...validTopic, topicId: '123' }],
    recentParticipated: [],
  } })
})
