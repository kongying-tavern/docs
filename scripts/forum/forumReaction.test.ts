/* eslint-disable test/no-import-node-test -- use Node's built-in runner for this contract */
import type { TopicReaction } from '../../src/services/forum/forumReaction'
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  applyReactionIntent,
  coordinateReactionMutation,
  createEmptyReaction,
  reactionCacheIdentity,
  reactionEnvironmentForOrigin,
  resolveReactionViewer,
  topicReactionResource,
} from '../../src/services/forum/forumReaction'

function reaction(state: TopicReaction['state'], likeCount = 0, dislikeCount = 0): TopicReaction {
  return {
    data: { ...createEmptyReaction('https://example.test/topic/1'), likeCount, dislikeCount },
    state,
  }
}

test('reaction intent toggles, switches, stays nonnegative, and does not mutate input', () => {
  const neutral = reaction(null)
  assert.deepEqual(applyReactionIntent(neutral, 'like'), reaction('like', 1, 0))
  assert.deepEqual(applyReactionIntent(neutral, 'dislike'), reaction('dislike', 0, 1))

  const liked = reaction('like', 1, 0)
  assert.deepEqual(applyReactionIntent(liked, 'like'), reaction(null, 0, 0))
  assert.deepEqual(applyReactionIntent(liked, 'dislike'), reaction('dislike', 0, 1))
  assert.deepEqual(liked, reaction('like', 1, 0))

  assert.deepEqual(applyReactionIntent(reaction('dislike', 0, 0), 'like'), reaction('like', 1, 0))
})

test('empty reactions are independent objects', () => {
  const first = createEmptyReaction('https://example.test/1')
  const second = createEmptyReaction('https://example.test/2')
  first.likeCount = 2
  assert.equal(second.likeCount, 0)
  assert.notEqual(first, second)
})

test('resource and viewer identities are stable and separated', () => {
  const production = reactionEnvironmentForOrigin('https://yuanshen.site')
  const zh = topicReactionResource('ICR OD8', production)
  const en = topicReactionResource('ICR OD8', production)
  const development = topicReactionResource('ICR OD8', reactionEnvironmentForOrigin('http://localhost:5196/en/'))
  const productionBundlePreview = topicReactionResource('ICR OD8', reactionEnvironmentForOrigin('http://127.0.0.1:4173'))
  const staging = topicReactionResource('ICR OD8', reactionEnvironmentForOrigin('https://staging.yuanshen.site'))

  assert.equal(zh, 'https://yuanshen.site/docs/feedback/topic/ICR%20OD8')
  assert.equal(en, zh)
  assert.equal(development, 'http://localhost:5196/feedback/topic/ICR%20OD8')
  assert.equal(productionBundlePreview, 'http://127.0.0.1:4173/feedback/topic/ICR%20OD8')
  assert.equal(staging, 'https://staging.yuanshen.site/feedback/topic/ICR%20OD8')
  assert.notEqual(development, zh)
  assert.deepEqual(resolveReactionViewer(false, 42), { identity: 'guest', ready: true })
  assert.deepEqual(resolveReactionViewer(true), { identity: 'user:pending', ready: false })
  assert.deepEqual(resolveReactionViewer(true, 42), { identity: 'user:42', ready: true, userId: '42' })
  assert.notEqual(
    reactionCacheIdentity(zh, resolveReactionViewer(false).identity),
    reactionCacheIdentity(zh, resolveReactionViewer(true, 42).identity),
  )
})

test('mutation coordinator deduplicates a key, allows other keys, and keeps acknowledged optimistic data', async () => {
  const pending = new Set<string>()
  const values = new Map<string, TopicReaction>([
    ['guest:a', reaction(null)],
    ['user:a', reaction(null)],
    ['user:b', reaction(null)],
  ])
  let resolveA!: () => void
  let writes = 0
  const deferredA = new Promise<void>(resolve => (resolveA = resolve))
  const run = (key: string, write: () => Promise<void>) => coordinateReactionMutation({
    pending,
    key,
    current: values.get(key)!,
    requested: 'like',
    update: value => values.set(key, value),
    write: async () => {
      writes += 1
      return write()
    },
  })

  const first = run('user:a', () => deferredA)
  const duplicate = await run('user:a', async () => {})
  const other = run('user:b', async () => {})
  assert.equal(duplicate, false)
  assert.equal(values.get('user:a')?.data.likeCount, 1)
  assert.equal(await other, true)
  assert.equal(values.get('user:b')?.data.likeCount, 1)
  assert.deepEqual(values.get('guest:a'), reaction(null))

  resolveA()
  assert.equal(await first, true)
  assert.equal(values.get('user:a')?.data.likeCount, 1)
  assert.equal(writes, 2)
})

test('mutation coordinator rolls back a failed optimistic update', async () => {
  const pending = new Set<string>()
  let value = reaction(null, 4)
  await assert.rejects(coordinateReactionMutation({
    pending,
    key: 'user:a',
    current: value,
    requested: 'like',
    update: next => (value = next),
    write: async () => { throw new Error('network') },
  }))
  assert.deepEqual(value, reaction(null, 4))
  assert.equal(pending.size, 0)
})
