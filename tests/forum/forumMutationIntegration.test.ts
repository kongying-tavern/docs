import type ForumAPI from '../../src/forum/api/types'
import assert from 'node:assert/strict'
import test, { mock } from 'node:test'
import { PiniaColada, useQueryCache } from '@pinia/colada'
import { createPinia } from 'pinia'
import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { useForumCommentMutations, useForumTopicMutations } from '../../src/forum/composables/data/useForumMutations'
import { forumKeys } from '../../src/forum/services/forumQueryContracts'
import { getStructuredForumTopics } from '../../src/forum/services/forumTopics'

const rawIssue = {
  number: 'A',
  state: 'open',
  title: 'BUG:Original',
  body: 'Body',
  comments: 2,
  html_url: 'https://gitee.com/example/issues/A',
  labels: [{ name: 'TYP-BUG' }, { name: 'PINNED' }],
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

const topic = {
  id: 'A',
  title: 'Original',
  content: { text: 'Body' },
  contentRaw: 'Body',
  labels: ['TYP-BUG', 'PINNED'],
  tags: [],
  goodIssue: false,
  pinned: true,
  commentCount: 2,
  user: { id: 1, login: 'alice', username: 'Alice' },
  state: 'open',
  type: 'BUG',
  link: '/feedback/topic/A',
  createdAt: rawIssue.created_at,
  updatedAt: rawIssue.updated_at,
} satisfies ForumAPI.Topic

const listKey = forumKeys.topicList({ filter: 'all', sort: 'created', creator: null, q: '', pageSize: 20 })

test('confirmed edits invalidate structured search data as well as Colada list entries', async () => {
  const originalFetch = globalThis.fetch
  const { mutations, invalidations } = await setup()
  const params = { filter: 'all' as const, sort: 'created' as const, creator: null, q: '', tags: ['CATA-LOGIN'] }
  let title = 'Original'
  let fetches = 0
  const fetchTopics = async () => {
    fetches++
    return { data: [{ ...topic, title, labels: [...topic.labels, 'CATA-LOGIN'], tags: ['CATA-LOGIN'] }], totalPage: 1 }
  }
  globalThis.fetch = async () => new Response(JSON.stringify({ ...rawIssue, title: 'BUG:Changed' }), { headers: { 'Content-Type': 'application/json' } })
  try {
    assert.equal((await getStructuredForumTopics(params, () => false, fetchTopics)).topics[0].title, 'Original')
    assert.equal((await mutations.updateTopic('editTopic', 'A', { title: 'Changed' }, topic)).status, 'success')
    title = 'Changed'
    assert.equal((await getStructuredForumTopics(params, () => false, fetchTopics)).topics[0].title, 'Changed')
    assert.equal(fetches, 2)
  }
  finally {
    invalidations.mock.restore()
    globalThis.fetch = originalFetch
  }
})

async function setup() {
  let mutations!: ReturnType<typeof useForumTopicMutations>
  let comments!: ReturnType<typeof useForumCommentMutations>
  const app = createSSRApp({
    setup() {
      mutations = useForumTopicMutations()
      comments = useForumCommentMutations()
      return () => null
    },
  })
  app.use(createPinia()).use(PiniaColada)
  await renderToString(app)
  const cache = app.runWithContext(() => useQueryCache())
  const other = { ...topic, id: 'B', title: 'Other' }
  cache.setQueryData(forumKeys.topic('A'), topic)
  cache.setQueryData(listKey, { pages: [{ items: [topic, other], total: 2, totalPage: 1 }], pageParams: [1] })
  cache.setQueryData(forumKeys.pinned(), [topic])
  const invalidations = mock.method(cache, 'invalidateQueries')
  return { cache, mutations, comments, invalidations }
}

test('unknown topic update restores list membership and pinned data without overwriting another topic', { timeout: 3000 }, async () => {
  const originalFetch = globalThis.fetch
  let respond!: (response: Response) => void
  let started!: () => void
  const requestStarted = new Promise<void>(resolve => started = resolve)
  globalThis.fetch = async () => {
    started()
    return new Promise<Response>(resolve => respond = resolve)
  }
  const { cache, mutations, invalidations } = await setup()
  try {
    const pending = mutations.updateTopic('closeTopic', 'A', { state: 'closed' }, topic)
    await requestStarted
    assert.deepEqual(cache.getQueryData<ForumAPI.Topic[]>(forumKeys.pinned()), [])
    const pages = cache.getQueryData<{ pages: Array<{ items: ForumAPI.Topic[] }> }>(listKey)!
    assert.deepEqual(pages.pages[0].items.map(item => item.id), ['B'])
    cache.setQueryData(listKey, {
      ...pages,
      pages: pages.pages.map(page => ({ ...page, items: page.items.map(item => ({ ...item, title: 'Concurrent update' })) })),
    })
    respond(new Response('Rejected', { status: 400 }))
    assert.equal((await pending).status, 'unknown')
    const restored = cache.getQueryData<{ pages: Array<{ items: ForumAPI.Topic[], total: number }> }>(listKey)!
    assert.deepEqual(restored.pages[0].items.map(item => item.id), ['A', 'B'])
    assert.equal(restored.pages[0].items[1].title, 'Concurrent update')
    assert.equal(restored.pages[0].total, 2)
    assert.equal(cache.getQueryData<ForumAPI.Topic>(forumKeys.topic('A'))?.state, 'open')
    assert.deepEqual(cache.getQueryData(forumKeys.pinned()), [topic])
    assert.deepEqual(invalidations.mock.calls.map(call => call.arguments[0]), [
      { key: forumKeys.topicLists() },
      { key: forumKeys.topicTimeline('A'), exact: true },
      { key: forumKeys.topic('A'), exact: true },
    ])
  }
  finally {
    invalidations.mock.restore()
    globalThis.fetch = originalFetch
  }
})

test('failed reopening removes only its optimistic row and preserves concurrent insertions and totals', { timeout: 3000 }, async () => {
  const { cache, mutations, invalidations } = await setup()
  const originalFetch = globalThis.fetch
  const closed = { ...topic, state: 'closed' as const, pinned: false }
  const other = { ...topic, id: 'B', pinned: false }
  const added = { ...topic, id: 'C', pinned: false }
  cache.setQueryData(forumKeys.topic('A'), closed)
  cache.setQueryData(forumKeys.pinned(), [])
  cache.setQueryData(listKey, { pages: [{ items: [other], total: 1, totalPage: 1 }], pageParams: [1] })
  let respond!: (response: Response) => void
  let started!: () => void
  const requestStarted = new Promise<void>(resolve => started = resolve)
  globalThis.fetch = async () => {
    started()
    return new Promise<Response>(resolve => respond = resolve)
  }
  try {
    const pending = mutations.updateTopic('closeTopic', 'A', { state: 'open' }, closed)
    await requestStarted
    const optimistic = cache.getQueryData<{ pages: Array<{ items: ForumAPI.Topic[], total: number }>, pageParams: number[] }>(listKey)!
    assert.deepEqual(optimistic.pages[0].items.map(item => item.id), ['A', 'B'])
    cache.setQueryData(listKey, {
      ...optimistic,
      pages: optimistic.pages.map(page => ({ ...page, items: [...page.items, added], total: page.total + 1 })),
    })
    respond(new Response('Rejected', { status: 400 }))
    assert.equal((await pending).status, 'unknown')
    const restored = cache.getQueryData<typeof optimistic>(listKey)!
    assert.deepEqual(restored.pages[0].items.map(item => item.id), ['B', 'C'])
    assert.equal(restored.pages[0].total, 2)
    assert.equal(cache.getQueryData<ForumAPI.Topic>(forumKeys.topic('A'))?.state, 'closed')
  }
  finally {
    invalidations.mock.restore()
    globalThis.fetch = originalFetch
  }
})

test('confirmed comment writes synchronize counts and invalidate each affected cache once', async () => {
  const { cache, comments, invalidations } = await setup()
  const originalFetch = globalThis.fetch
  const methods: string[] = []
  globalThis.fetch = async (input, init) => {
    const request = new Request(input, init)
    methods.push(request.method)
    if (request.method === 'DELETE')
      return new Response(null, { status: 204 })
    assert.equal(request.method, 'POST')
    assert.equal((await request.json()).body, 'Reply')
    return new Response(JSON.stringify({
      id: 42,
      body: 'Reply',
      user: { id: 1, login: 'alice', name: 'Alice', avatar_url: '', html_url: '' },
      created_at: rawIssue.created_at,
      updated_at: rawIssue.updated_at,
    }), { headers: { 'Content-Type': 'application/json' } })
  }
  const assertCounts = (expected: number) => {
    assert.equal(cache.getQueryData<ForumAPI.Topic>(forumKeys.topic('A'))?.commentCount, expected)
    assert.equal(cache.getQueryData<ForumAPI.Topic[]>(forumKeys.pinned())?.[0].commentCount, expected)
    assert.equal(cache.getQueryData<{ pages: Array<{ items: ForumAPI.Topic[] }> }>(listKey)?.pages[0].items[0].commentCount, expected)
  }
  try {
    assert.equal((await comments.createComment({ repo: 'Feedback', topicId: 'A', body: 'Reply' })).content.text, 'Reply')
    assertCounts(3)
    assert.equal(await comments.deleteComment({ repo: 'Feedback', topicId: 'A', commentId: '42' }), true)
    assertCounts(2)
    assert.deepEqual(methods, ['POST', 'DELETE'])
    const expectedInvalidations = [
      { key: forumKeys.topicLists() },
      { key: forumKeys.topic('A'), exact: true },
      { key: forumKeys.comments('A'), exact: true },
    ]
    assert.deepEqual(invalidations.mock.calls.map(call => call.arguments[0]), [...expectedInvalidations, ...expectedInvalidations])
  }
  finally {
    invalidations.mock.restore()
    globalThis.fetch = originalFetch
  }
})

test('partial topic update keeps authoritative data and refetches detail', async () => {
  const { cache, mutations, invalidations } = await setup()
  const originalFetch = globalThis.fetch
  globalThis.fetch = async (input, init) => {
    const request = new Request(input, init)
    if (request.method === 'POST')
      return new Response('Webhook failed', { status: 400 })
    return new Response(JSON.stringify({ ...rawIssue, labels: [{ name: 'TYP-FEAT' }] }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }
  try {
    const outcome = await mutations.updateTopic('changeTopicMembership', 'A', { labels: 'TYP-FEAT' }, topic, 'FEAT')
    assert.equal(outcome.status, 'partial')
    assert.equal(cache.getQueryData<ForumAPI.Topic>(forumKeys.topic('A'))?.type, 'FEAT')
    assert.deepEqual(cache.getQueryData(forumKeys.pinned()), [])
    assert.deepEqual(invalidations.mock.calls.map(call => call.arguments[0]), [
      { key: forumKeys.topicLists() },
      { key: forumKeys.topicTimeline('A'), exact: true },
      { key: forumKeys.topic('A'), exact: true },
    ])
  }
  finally {
    invalidations.mock.restore()
    globalThis.fetch = originalFetch
  }
})

test('malformed topic response rolls back optimistic data without invalidating confirmed caches', async () => {
  const { cache, mutations, invalidations } = await setup()
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => new Response('{}', { headers: { 'Content-Type': 'application/json' } })
  try {
    await assert.rejects(mutations.updateTopic('editTopic', 'A', { title: 'Changed' }, topic), /Invalid Gitee response/)
    assert.equal(cache.getQueryData<ForumAPI.Topic>(forumKeys.topic('A'))?.title, 'Original')
    assert.equal(cache.getQueryData<ForumAPI.Topic[]>(forumKeys.pinned())?.[0].title, 'Original')
    assert.equal(cache.getQueryData<{ pages: Array<{ items: ForumAPI.Topic[] }> }>(listKey)?.pages[0].items[0].title, 'Original')
    assert.equal(invalidations.mock.callCount(), 0)
  }
  finally {
    invalidations.mock.restore()
    globalThis.fetch = originalFetch
  }
})

test('failed comment deletion restores counts in detail, paged lists and pinned topics', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => new Response('Rejected', { status: 400 })
  const { cache, comments, invalidations } = await setup()
  try {
    await assert.rejects(comments.deleteComment({ repo: 'Feedback', topicId: 'A', commentId: '42' }))
    assert.equal(cache.getQueryData<ForumAPI.Topic>(forumKeys.topic('A'))?.commentCount, 2)
    assert.equal(cache.getQueryData<ForumAPI.Topic[]>(forumKeys.pinned())?.[0].commentCount, 2)
    const pages = cache.getQueryData<{ pages: Array<{ items: ForumAPI.Topic[] }> }>(listKey)!
    assert.equal(pages.pages[0].items[0].commentCount, 2)
    assert.equal(invalidations.mock.callCount(), 0)
  }
  finally {
    invalidations.mock.restore()
    globalThis.fetch = originalFetch
  }
})
