/* eslint-disable test/no-import-node-test */
import assert from 'node:assert/strict'
import test from 'node:test'
import { buildTopicListRequest } from '../../.vitepress/theme/apis/forum/gitee/issues'
import { forumKeys } from '../../src/services/forum/forumQueryContracts'
import { buildForumHref, parseForumLocation } from '../../src/services/forum/forumRoute'
import { buildForumProviderRequest } from '../../src/services/forumService'

const routeOptions = { base: '/docs/', locales: ['root', 'en', 'ja'] } as const

const filters = [
  ['all', 'open', null],
  ['bug', 'open', 'TYP-BUG'],
  ['feat', 'open', 'TYP-FEAT'],
  ['closed', 'progressing', null],
] as const

test('provider mapping preserves filter, q, creator, sort, and page for every matrix row', () => {
  for (const [filter, state, label] of filters) {
    for (const q of ['', 'map crash']) {
      for (const creator of [null, 'alice']) {
        const provider = buildForumProviderRequest({
          filter,
          sort: 'updated',
          q,
          creator,
          page: 3,
          pageSize: 20,
        })

        assert.equal(provider.state, state)
        assert.deepEqual(provider.query, {
          current: 3,
          pageSize: 20,
          sort: 'updated',
          creator,
          filter: label,
        })
        assert.equal(provider.search, q || undefined)

        const request = buildTopicListRequest(provider.query, provider.state, provider.search)
        assert.equal(request.searchParams.state, state)
        assert.equal(request.searchParams.page, 3)
        assert.equal(request.searchParams.per_page, 20)
        if (q) {
          assert.equal(request.endpoint, 'search/issues')
          assert.equal(request.searchParams.q, q)
          assert.equal(request.searchParams.author, creator || undefined)
          assert.equal(request.searchParams.creator, undefined)
          assert.equal(request.searchParams.label, label || undefined)
          assert.equal(request.searchParams.labels, undefined)
          assert.equal(request.searchParams.sort, 'updated_at')
        }
        else {
          assert.match(request.endpoint, /\/issues$/)
          assert.equal(request.searchParams.creator, creator || undefined)
          assert.equal(request.searchParams.labels, label || undefined)
        }
      }
    }
  }
})

test('equivalent defaults normalize to one page-free list key', () => {
  const base = forumKeys.topicList({ filter: 'all', sort: 'created', q: '', creator: null })
  const equivalent = forumKeys.topicList({ filter: 'all', sort: 'created', q: '   ', creator: '  ' })

  assert.deepEqual(equivalent, base)
  assert.equal(JSON.stringify(base).includes('"page"'), false)
})

test('load-more request changes only the page while retaining the committed tuple', () => {
  const first = buildForumProviderRequest({
    filter: 'closed',
    sort: 'updated',
    q: ' crash ',
    creator: ' alice ',
    page: 1,
  })
  const next = buildForumProviderRequest({
    filter: 'closed',
    sort: 'updated',
    q: ' crash ',
    creator: ' alice ',
    page: 2,
  })

  assert.deepEqual(
    { ...next, query: { ...next.query, current: first.query.current } },
    first,
  )
  assert.equal(next.query.current, 2)
})

test('User filter and clear-search transitions preserve the rest of the URL tuple', () => {
  const currentUrl = '/docs/ja/feedback/user/alice/feat?q=map&sort=updated&view=card#results'
  const parsed = parseForumLocation(currentUrl, routeOptions)
  assert.equal(parsed?.route.name, 'user')
  if (!parsed || parsed.route.name !== 'user')
    return

  const filtered = { ...parsed.route, list: { ...parsed.route.list, filter: 'closed' as const } }
  assert.equal(buildForumHref(filtered, { ...routeOptions, currentUrl }), '/docs/ja/feedback/user/alice/closed?q=map&sort=updated&view=card#results')

  const cleared = { ...filtered, list: { ...filtered.list, q: '' } }
  assert.equal(buildForumHref(cleared, { ...routeOptions, currentUrl }), '/docs/ja/feedback/user/alice/closed?sort=updated&view=card#results')
})
