import assert from 'node:assert/strict'
import test from 'node:test'
import { PiniaColada } from '@pinia/colada'
import { createPinia } from 'pinia'
import { createSSRApp, effectScope } from 'vue'
import { clearApiCache } from '../../src/forum/api/gitee'
import { useForumCommentsQuery } from '../../src/forum/composables/data/useForumQueries'
import { FORUM_CONFIG } from '../../src/forum/services/forumConfig'

const headerCases: Record<string, string>[] = [{}, { Link: '<https://gitee.com/comments?page=2>; rel="last"' }]

for (const headers of headerCases) {
  test(`comments count and pagination survive ${'Link' in headers ? 'Link-only' : 'missing'} total headers`, async () => {
    clearApiCache()
    const original = globalThis.fetch
    const pages: number[] = []
    globalThis.fetch = async (input) => {
      const url = new URL(input instanceof Request ? input.url : String(input))
      const page = Number(url.searchParams.get('page'))
      pages.push(page)
      const size = page === 1 ? FORUM_CONFIG.DEFAULT_PAGE_SIZE : 1
      const comments = Array.from({ length: size }, (_, index) => ({
        id: (page - 1) * FORUM_CONFIG.DEFAULT_PAGE_SIZE + index,
        body: 'Comment',
        created_at: '2026-01-01T00:00:00Z',
      }))
      return new Response(JSON.stringify(comments), { headers: { 'Content-Type': 'application/json', ...headers } })
    }
    const scope = effectScope()
    const app = createSSRApp({ render: () => null }).use(createPinia()).use(PiniaColada, { queryOptions: { gcTime: 0 } })
    try {
      const query = app.runWithContext(() => scope.run(() => useForumCommentsQuery({ topicId: 'HEADERLESS', repo: 'Feedback', enabled: true }))!)
      await query.refresh(true)
      assert.equal(query.rows.value.length, FORUM_CONFIG.DEFAULT_PAGE_SIZE)
      assert.equal(query.total.value, FORUM_CONFIG.DEFAULT_PAGE_SIZE)
      assert.equal(query.canLoadMore.value, true)
      await query.loadMore()
      assert.equal(query.total.value, FORUM_CONFIG.DEFAULT_PAGE_SIZE + 1)
      assert.equal(query.canLoadMore.value, false)
      assert.deepEqual(pages, [1, 2])
    }
    finally {
      scope.stop()
      globalThis.fetch = original
      clearApiCache()
    }
  })
}
