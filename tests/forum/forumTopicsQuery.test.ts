import type { ForumTopicListParams } from '../../src/forum/services/forumQueryContracts'
import assert from 'node:assert/strict'
import test from 'node:test'
import { PiniaColada } from '@pinia/colada'
import { createPinia } from 'pinia'
import { createSSRApp, effectScope, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { clearApiCache } from '../../src/forum/api/gitee'
import { useForumTopicsQuery } from '../../src/forum/composables/data/useForumQueries'
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
