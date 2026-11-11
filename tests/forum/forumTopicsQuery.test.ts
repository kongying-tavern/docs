import type { ForumTopicListParams } from '../../src/forum/services/forumQueryContracts'
import assert from 'node:assert/strict'
import { PiniaColada } from '@pinia/colada'
import { createPinia } from 'pinia'
import { test } from 'vitest'
import { createSSRApp, effectScope, nextTick, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { clearApiCache } from '../../src/forum/api/gitee'
import { useForumTopicsQuery } from '../../src/forum/composables/data/useForumQueries'
import { useUserAuthStore } from '../../src/forum/stores/auth/useUserAuth'
import { useUserInfoStore } from '../../src/forum/stores/auth/useUserInfo'

test('a late topic response cannot replace rows after the filter changes', { timeout: 3000 }, async () => {
  clearApiCache()
  const originalFetch = globalThis.fetch
  let release!: () => void
  let notifyStarted!: () => void
  const pending = new Promise<void>(resolve => release = resolve)
  const started = new Promise<void>(resolve => notifyStarted = resolve)
  const requests: string[] = []
  globalThis.fetch = async (input) => {
    const url = new URL(input instanceof Request ? input.url : String(input))
    const state = url.searchParams.get('state') ?? 'all'
    requests.push(state)
    if (state === 'open') {
      notifyStarted()
      await pending
    }
    return new Response(JSON.stringify([{
      id: state === 'open' ? 101 : 102,
      number: state === 'open' ? 'IOLD' : 'INEW',
      state,
      title: 'BUG: Filter race',
      body: 'Body',
      comments: 0,
      labels: [{ name: 'TYP-BUG' }],
      user: { id: 7, login: 'alice', name: 'Alice', avatar_url: '', html_url: 'https://gitee.com/alice' },
      html_url: 'https://gitee.com/example/issues/INEW',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    }]), { headers: { 'Content-Type': 'application/json' } })
  }
  const scope = effectScope()
  const app = createSSRApp({
    setup: () => {
      useUserInfoStore()
      return () => null
    },
  })
    .use(createPinia())
    .use(PiniaColada, { queryOptions: { gcTime: 0 } })
  let oldRefresh: Promise<unknown> | undefined
  try {
    await renderToString(app)
    const params = ref<ForumTopicListParams>({ filter: 'all', sort: 'created', creator: null, q: '' })
    const query = app.runWithContext(() => scope.run(() => useForumTopicsQuery(params))!)
    oldRefresh = query.refresh(true)
    await started
    params.value = { ...params.value, filter: 'closed' }
    await query.refresh(true)
    assert.deepEqual(query.rows.value.map(topic => topic.id), ['INEW'])
    release()
    await oldRefresh
    assert.deepEqual(query.rows.value.map(topic => topic.id), ['INEW'])
    assert.equal(query.error.value, null)
    assert.deepEqual(requests, ['open', 'progressing'])
  }
  finally {
    release()
    await oldRefresh
    scope.stop()
    globalThis.fetch = originalFetch
    clearApiCache()
  }
})

for (const leaveArchiveFirst of [false, true]) {
  test(`revoking archive access clears retained rows (public request already pending: ${leaveArchiveFirst})`, async () => {
    clearApiCache()
    const originalFetch = globalThis.fetch
    let release!: () => void
    let notifyStarted!: () => void
    const pending = new Promise<void>(resolve => release = resolve)
    const started = new Promise<void>(resolve => notifyStarted = resolve)
    const loggedIn = ref(true)
    const params = ref<ForumTopicListParams>({ filter: 'archived', sort: 'created', creator: 'alice', q: '' })
    globalThis.fetch = async (input) => {
      const url = new URL(input instanceof Request ? input.url : String(input))
      const archived = url.searchParams.get('state') === 'closed'
      if (!archived) {
        notifyStarted()
        await pending
      }
      return new Response(JSON.stringify([{
        id: archived ? 201 : 202,
        number: archived ? 'IARCHIVED' : 'IPUBLIC',
        state: archived ? 'closed' : 'open',
        title: 'FEAT: Archive access',
        body: 'Body',
        comments: 0,
        labels: [{ name: 'TYP-FEAT' }],
        user: { id: 7, login: 'alice', name: 'Alice', avatar_url: '', html_url: 'https://gitee.com/alice' },
        html_url: 'https://gitee.com/example/issues/201',
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      }]), { headers: { 'Content-Type': 'application/json' } })
    }
    const scope = effectScope()
    const app = createSSRApp({ setup: () => () => null })
      .use(createPinia())
      .use(PiniaColada, { queryOptions: { gcTime: 0 } })
    let publicRefresh: Promise<unknown> | undefined
    try {
      await renderToString(app)
      const query = app.runWithContext(() => {
        Object.defineProperty(useUserAuthStore(), 'isLoggedIn', { get: () => loggedIn.value })
        useUserInfoStore().info = { id: 7, login: 'alice', username: 'Alice', avatar: '', homepage: '' }
        return scope.run(() => useForumTopicsQuery(params, true, 'user:alice'))!
      })
      await query.refresh(true)
      assert.deepEqual(query.rows.value.map(topic => topic.id), ['IARCHIVED'])
      if (leaveArchiveFirst)
        params.value = { ...params.value, filter: 'all' }
      else
        loggedIn.value = false
      await nextTick()
      publicRefresh = query.refresh(true)
      await started
      loggedIn.value = false
      await nextTick()
      assert.equal(query.isPlaceholderData.value, false)
      assert.equal(query.rows.value.length, 0)
      release()
      await publicRefresh
      assert.deepEqual(query.rows.value.map(topic => topic.id), ['IPUBLIC'])
    }
    finally {
      release()
      await publicRefresh
      scope.stop()
      globalThis.fetch = originalFetch
      clearApiCache()
    }
  })
}
