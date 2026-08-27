/* eslint-disable test/no-import-node-test */
import type ForumAPI from '../../.vitepress/theme/apis/forum/api'
import assert from 'node:assert/strict'
import test from 'node:test'
import { applyOptimisticTopicPatch } from '../../src/services/forum/forumTopicOptimistic'

const topic = {
  id: '1',
  title: 'Old title',
  content: { text: 'Old body' },
  contentRaw: 'Old body',
  tags: [],
  commentCount: 3,
  user: { id: '1', login: 'alice', username: 'Alice' },
  state: 'open',
  type: 'BUG',
  link: '/feedback/1',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
} satisfies ForumAPI.Topic

test('optimistic Topic patch updates visible membership and content fields', () => {
  const next = applyOptimisticTopicPatch(topic, {
    title: 'FEAT: New title',
    body: 'New body\n![image](https://example.com/image.png)',
    state: 'closed',
    labels: 'TYP-FEAT,PINNED,COMMENT-CLOSED',
  })

  assert.equal(next.title, 'New title')
  assert.equal(next.content.text, 'New body')
  assert.equal(next.content.images?.[0]?.src, 'https://example.com/image.png')
  assert.equal(next.state, 'closed')
  assert.equal(next.type, 'FEAT')
  assert.equal(next.pinned, true)
  assert.equal(next.commentCount, -1)
  assert.deepEqual(next.tags, ['TYP-FEAT', 'PINNED', 'COMMENT-CLOSED'])
  assert.equal(topic.title, 'Old title')
})
