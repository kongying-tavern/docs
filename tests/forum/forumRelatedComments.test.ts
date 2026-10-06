import type { ForumTopicListParams } from '../../src/forum/services/forumQueryContracts'
import assert from 'node:assert/strict'
import test from 'node:test'
import { setImmediate } from 'node:timers/promises'
import { PiniaColada, useQueryCache } from '@pinia/colada'
import { createPinia } from 'pinia'
import { createSSRApp, effectScope, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { clearApiCache } from '../../src/forum/api/gitee'
import { parseGiteeIssue } from '../../src/forum/api/gitee/contracts'
import { getTopicListRelatedComments } from '../../src/forum/api/gitee/issues'
import { normalizeIssue } from '../../src/forum/api/gitee/normalize'
import { useForumTopicsQuery } from '../../src/forum/composables/data/useForumQueries'
import { forumKeys } from '../../src/forum/services/forumQueryContracts'
import { useUserInfoStore } from '../../src/forum/stores/auth/useUserInfo'

const rawIssue = {
  id: 101,
  number: 'I12345',
  state: 'open',
  title: 'BUG: List must not wait for comments',
  body: 'Body',
  comments: 1,
  user: { id: 7, login: 'alice', name: 'Alice', avatar_url: 'https://example.com/avatar.png', html_url: 'https://gitee.com/alice' },
  html_url: 'https://gitee.com/example/issues/I12345',
  labels: [{ name: 'TYP-BUG' }],
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}
const rawComment = {
  id: 42,
  body: 'Author reply',
  user: rawIssue.user,
  target: { issue: { id: 101 } },
  created_at: '2026-01-01T01:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
}

async function setup(initial: Partial<ForumTopicListParams> = {}) {
  clearApiCache()
  const app = createSSRApp({
    setup() {
      useUserInfoStore()
      return () => null
    },
  }).use(createPinia()).use(PiniaColada, { queryOptions: { gcTime: 0 } })
  await renderToString(app)
  const scope = effectScope()
  const params = ref<ForumTopicListParams>({ filter: 'all', sort: 'created', creator: null, q: '', ...initial })
  const query = app.runWithContext(() => scope.run(() => useForumTopicsQuery(params))!)
  const cache = app.runWithContext(() => useQueryCache())
  return { scope, params, query, cache }
}

async function until(predicate: () => boolean) {
  const deadline = Date.now() + 2000
  while (Date.now() < deadline) {
    if (predicate())
      return
    await setImmediate()
  }
  assert.ok(predicate(), 'query did not settle')
}

test('pending related comments do not delay list success and fill rows after resolution', { timeout: 3000 }, async () => {
  const originalFetch = globalThis.fetch
  let respond!: (response: Response) => void
  let commentStarted!: () => void
  const started = new Promise<void>(resolve => commentStarted = resolve)
  globalThis.fetch = async (input) => {
    if (String(input instanceof Request ? input.url : input).includes('/issues/comments')) {
      commentStarted()
      return new Promise<Response>(resolve => respond = resolve)
    }
    return json([rawIssue])
  }
  const { scope, query, cache } = await setup()
  try {
    await query.refresh(true)
    await until(() => query.rows.value.length === 1 && !query.isLoading.value)
    await started
    assert.equal(query.error.value, null)
    const initialComments = query.rows.value[0].relatedComments
    assert.equal(initialComments, undefined)
    const total = query.total.value
    const canLoadMore = query.canLoadMore.value
    respond(json([rawComment]))
    await until(() => query.rows.value[0]?.relatedComments?.length === 1)
    assert.equal(query.rows.value[0].relatedComments?.[0].id, 42)
    assert.equal(query.total.value, total)
    assert.equal(query.canLoadMore.value, canLoadMore)
    assert.equal(query.isLoading.value, false)
    assert.ok(cache.getEntries({ key: forumKeys.topicLists() }).some(entry => entry.key[3] === 'related-comments'))
  }
  finally {
    scope.stop()
    globalThis.fetch = originalFetch
  }
})

for (const mode of ['no-comments', 'count', 'search'] as const) {
  test(`${mode} queries skip related comment requests`, { timeout: 3000 }, async () => {
    const originalFetch = globalThis.fetch
    let attempts = 0
    globalThis.fetch = async (input) => {
      if (String(input instanceof Request ? input.url : input).includes('/issues/comments'))
        attempts++
      return json([{ ...rawIssue, comments: mode === 'no-comments' ? 0 : 1 }])
    }
    const { scope, query } = await setup(mode === 'count' ? { pageSize: 1 } : mode === 'search' ? { q: 'test' } : {})
    try {
      await query.refresh(true)
      await until(() => query.rows.value.length === 1 && !query.isLoading.value)
      await setImmediate()
      assert.equal(attempts, 0)
      assert.equal(query.rows.value[0].relatedComments, undefined)
    }
    finally {
      scope.stop()
      globalThis.fetch = originalFetch
    }
  })
}

test('comment window is capped at three pages and preserves earlier pages on a later failure', async () => {
  const originalFetch = globalThis.fetch
  const pageComments = Array.from({ length: 100 }, (_, index) => ({ ...rawComment, id: 42 + index }))
  const topic = normalizeIssue(parseGiteeIssue(rawIssue, 'test'))
  for (const failOnSecondPage of [false, true]) {
    let attempts = 0
    clearApiCache()
    globalThis.fetch = async () => {
      attempts++
      return failOnSecondPage && attempts === 2 ? json({ message: 'Forbidden' }, 403) : json(pageComments)
    }
    try {
      const related = await getTopicListRelatedComments([topic], () => true)
      assert.equal(attempts, failOnSecondPage ? 2 : 3)
      assert.deepEqual(related[topic.id]?.map(comment => comment.id), [42], 'author and official reply must be deduplicated')
    }
    finally {
      globalThis.fetch = originalFetch
    }
  }
})

for (const response of [() => json({ message: 'Forbidden' }, 403), () => json([{ body: null }])]) {
  test(`related comment ${response().status === 403 ? 'request' : 'parse'} failure leaves the list successful`, { timeout: 3000 }, async () => {
    const originalFetch = globalThis.fetch
    let attempts = 0
    let fail = true
    globalThis.fetch = async (input) => {
      if (String(input instanceof Request ? input.url : input).includes('/issues/comments')) {
        attempts++
        return fail ? response() : json([rawComment])
      }
      return json([rawIssue])
    }
    const { scope, query, cache } = await setup()
    try {
      await query.refresh(true)
      await until(() => query.rows.value.length === 1 && !query.isLoading.value)
      await until(() => cache.getEntries({ key: forumKeys.relatedTopicComments() }).some(entry =>
        Array.isArray(entry.key[5]) && entry.key[5].length === 1
        && entry.asyncStatus.value === 'idle' && entry.state.value.status !== 'pending'))
      assert.equal(query.rows.value[0].id, rawIssue.number)
      assert.equal(query.error.value, null)
      assert.equal(query.status.value, 'success')
      assert.equal(query.isLoading.value, false)
      assert.equal(attempts, 1)
      const entry = cache.getEntries({ key: forumKeys.relatedTopicComments() }).find(entry =>
        Array.isArray(entry.key[5]) && entry.key[5].length === 1)!
      assert.equal(entry.state.value.status, 'success')
      assert.equal(query.rows.value[0].relatedComments, null)
      fail = false
      await query.refetch(true)
      await until(() => query.rows.value[0]?.relatedComments?.[0]?.id === rawComment.id)
      assert.equal(attempts, 2, 'manual reload must retry failed or malformed responses')
    }
    finally {
      scope.stop()
      globalThis.fetch = originalFetch
    }
  })
}

test('late comments from a previous filter cannot replace current list rows', { timeout: 3000 }, async () => {
  const originalFetch = globalThis.fetch
  let respond!: (response: Response) => void
  let commentStarted!: () => void
  const started = new Promise<void>(resolve => commentStarted = resolve)
  const pending = new Promise<Response>(resolve => respond = resolve)
  globalThis.fetch = async (input) => {
    const url = String(input instanceof Request ? input.url : input)
    if (url.includes('/issues/comments')) {
      commentStarted()
      return pending
    }
    return json(url.includes('creator=bob') ? [{ ...rawIssue, number: 'I67890', comments: 0 }] : [rawIssue])
  }
  const { scope, query, params } = await setup()
  try {
    await query.refresh(true)
    await until(() => query.rows.value.length === 1 && !query.isLoading.value)
    await started
    params.value = { ...params.value, creator: 'bob' }
    await until(() => query.rows.value[0]?.id === 'I67890' && !query.isLoading.value)
    respond(json([rawComment]))
    await setImmediate()
    await setImmediate()
    assert.equal(query.rows.value[0].id, 'I67890')
    assert.equal(query.rows.value[0].relatedComments, undefined)
    assert.equal(query.error.value, null)
  }
  finally {
    scope.stop()
    globalThis.fetch = originalFetch
  }
})

test('pagination finishes while the related comment request is still pending', { timeout: 3000 }, async () => {
  const originalFetch = globalThis.fetch
  let respond!: (response: Response) => void
  let commentStarted!: () => void
  const started = new Promise<void>(resolve => commentStarted = resolve)
  const pending = new Promise<Response>(resolve => respond = resolve)
  globalThis.fetch = async (input) => {
    const url = String(input instanceof Request ? input.url : input)
    if (url.includes('/issues/comments')) {
      commentStarted()
      return pending.then(response => response.clone())
    }
    const secondPage = new URL(url).searchParams.get('page') === '2'
    const response = json([{ ...rawIssue, id: secondPage ? 202 : rawIssue.id, number: secondPage ? 'I67890' : rawIssue.number }])
    response.headers.set('Total_count', '2')
    response.headers.set('Total_page', '2')
    return response
  }
  const { scope, query } = await setup()
  try {
    await query.refresh(true)
    await started
    assert.equal(query.canLoadMore.value, true)
    await query.loadMore()
    assert.deepEqual(query.rows.value.map(topic => topic.id), [rawIssue.number, 'I67890'])
    assert.equal(query.total.value, 2)
    assert.equal(query.loadingMore.value, false)
    assert.equal(query.isLoading.value, false)
    assert.equal(query.error.value, null)
    respond(json([rawComment]))
    await until(() => query.rows.value[0]?.relatedComments?.length === 1)
    assert.deepEqual(query.rows.value.map(topic => topic.id), [rawIssue.number, 'I67890'])
  }
  finally {
    scope.stop()
    globalThis.fetch = originalFetch
  }
})

test('refresh returns before comments and replaces the previous response without session caching', { timeout: 3000 }, async () => {
  const originalFetch = globalThis.fetch
  let respond!: (response: Response) => void
  let attempts = 0
  globalThis.fetch = async (input) => {
    if (!String(input instanceof Request ? input.url : input).includes('/issues/comments'))
      return json([rawIssue])
    attempts++
    return attempts === 1 ? json([rawComment]) : new Promise<Response>(resolve => respond = resolve)
  }
  const { scope, query } = await setup()
  try {
    await query.refresh(true)
    await until(() => query.rows.value[0]?.relatedComments?.[0]?.id === 42)
    await query.refetch(true)
    await until(() => attempts === 2)
    assert.equal(query.isLoading.value, false)
    assert.equal(query.rows.value[0].relatedComments?.[0].id, 42)
    respond(json([{ ...rawComment, id: 43, body: 'New author reply' }]))
    await until(() => query.rows.value[0]?.relatedComments?.[0]?.id === 43)
    assert.equal(attempts, 2)
  }
  finally {
    scope.stop()
    globalThis.fetch = originalFetch
  }
})

test('pagination retains existing summaries and permission changes reclassify official replies', { timeout: 3000 }, async () => {
  const originalFetch = globalThis.fetch
  let respond!: (response: Response) => void
  let attempts = 0
  const officialComment = { ...rawComment, id: 99, user: { ...rawIssue.user, id: 987654321 } }
  globalThis.fetch = async (input) => {
    const url = String(input instanceof Request ? input.url : input)
    if (url.includes('/issues/comments')) {
      attempts++
      return attempts === 2
        ? new Promise<Response>(resolve => respond = resolve)
        : json([officialComment, rawComment])
    }
    const secondPage = new URL(url).searchParams.get('page') === '2'
    const response = json([{ ...rawIssue, id: secondPage ? 202 : rawIssue.id, number: secondPage ? 'I67890' : rawIssue.number }])
    response.headers.set('Total_count', '2')
    response.headers.set('Total_page', '2')
    return response
  }
  const { scope, query, cache } = await setup()
  try {
    await query.refresh(true)
    await until(() => query.rows.value[0]?.relatedComments?.length === 1)
    await query.loadMore()
    await until(() => attempts === 2)
    assert.equal(query.rows.value.length, 2)
    assert.equal(query.rows.value[0].relatedComments?.[0].id, 42)
    respond(json([officialComment, rawComment]))
    await until(() => query.rows.value[1]?.relatedComments === null)
    cache.setQueryData(forumKeys.permission('feedback'), [{ id: officialComment.user.id }])
    await until(() => query.rows.value[0]?.relatedComments?.length === 2)
    assert.deepEqual(query.rows.value[0].relatedComments?.map(comment => comment.id), [42, 99])
    assert.equal(query.error.value, null)
  }
  finally {
    scope.stop()
    globalThis.fetch = originalFetch
  }
})

test('list invalidation refreshes related summaries without polluting cached topic pages', { timeout: 3000 }, async () => {
  const originalFetch = globalThis.fetch
  let commentId = 42
  globalThis.fetch = async input => String(input instanceof Request ? input.url : input).includes('/issues/comments')
    ? json([{ ...rawComment, id: commentId }])
    : json([rawIssue])
  const { scope, query, cache } = await setup()
  try {
    await query.refresh(true)
    await until(() => query.rows.value[0]?.relatedComments?.[0]?.id === 42)
    commentId = 43
    await cache.invalidateQueries({ key: forumKeys.topicLists(), active: true })
    await until(() => query.rows.value[0]?.relatedComments?.[0]?.id === 43)
    assert.equal(query.data.value?.pages[0].items[0].relatedComments, undefined)
    assert.equal(query.rows.value.length, 1)
    assert.equal(query.error.value, null)
  }
  finally {
    scope.stop()
    globalThis.fetch = originalFetch
  }
})
