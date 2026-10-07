import assert from 'node:assert/strict'
import { test } from 'vitest'
import { putTopic } from '../../src/forum/api/gitee/issues'
import { applyOptimisticTopicPatch } from '../../src/forum/services/forumTopicOptimistic'

const issue = {
  number: 'I1',
  state: 'open',
  title: 'BUG:Privacy',
  body: 'Body',
  html_url: 'https://gitee.com/KYJGYSDT/Feedback/issues/I1',
  comments: 0,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  labels: [{ name: 'TYP-BUG' }],
}

for (const isPrivate of [true, false]) {
  test(`privacy update persists and reads back security_hole=${isPrivate}`, async () => {
    const originalFetch = globalThis.fetch
    const requests: Request[] = []
    globalThis.fetch = async (input, init) => {
      const request = new Request(input, init)
      requests.push(request)
      return Response.json({ ...issue, security_hole: isPrivate })
    }
    try {
      const outcome = await putTopic('I1', { security_hole: isPrivate })
      assert.equal(outcome.status, 'success')
      assert.ok(outcome.status === 'success')
      assert.equal(outcome.topic.isPrivate, isPrivate)
      assert.deepEqual(requests.map(request => request.method), ['PATCH', 'GET'])
      assert.deepEqual(await requests[0]!.json(), { security_hole: isPrivate })
      const optimistic = applyOptimisticTopicPatch(outcome.topic, { security_hole: !isPrivate })
      assert.equal(optimistic.isPrivate, !isPrivate)
      assert.equal(optimistic.contentRaw, outcome.topic.contentRaw)
      assert.deepEqual(optimistic.labels, outcome.topic.labels)
    }
    finally {
      globalThis.fetch = originalFetch
    }
  })
}

test('privacy update rejects an unchanged authoritative visibility', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => Response.json({ ...issue, security_hole: false })
  try {
    const outcome = await putTopic('I1', { security_hole: true })
    assert.equal(outcome.status, 'unknown')
  }
  finally {
    globalThis.fetch = originalFetch
  }
})
