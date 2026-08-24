/* eslint-disable test/no-import-node-test -- use Node's built-in runner for this contract */
import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import {
  buildForumHref,
  canonicalizeForumLocation,
  isSameForumDestination,
  navigateForumDestination,
  parseForumLocation,
} from '../../src/services/forum/forumRoute'

const ROUTE_OPTIONS = {
  base: '/docs/',
  locales: ['root', 'en', 'ja'],
} as const

test('parses and canonically builds root Forum list routes', () => {
  const parsed = parseForumLocation(
    'https://example.test/docs/feedback/bug?q=%20crash%20&sort=updated&view=card#results',
    ROUTE_OPTIONS,
  )

  assert.deepEqual(parsed?.route, {
    name: 'home',
    locale: 'root',
    list: {
      filter: 'bug',
      sort: 'updated',
      q: 'crash',
      creator: null,
    },
  })
  assert.equal(parsed?.canonicalHref, '/docs/feedback/bug?q=crash&sort=updated&view=card#results')
})

test('omits default list values and canonicalizes legacy all and invalid sort', () => {
  const parsed = parseForumLocation('/docs/feedback/all?sort=recent&q=%20%20&view=compact', ROUTE_OPTIONS)

  assert.deepEqual(parsed?.route, {
    name: 'home',
    locale: 'root',
    list: { filter: 'all', sort: 'created', q: '', creator: null },
  })
  assert.equal(parsed?.canonicalHref, '/docs/feedback?view=compact')
})

test('round-trips localized Topic and encoded User routes', () => {
  const topic = parseForumLocation('/docs/en/feedback/topic/AB%20123', ROUTE_OPTIONS)
  const user = parseForumLocation('/docs/ja/feedback/user/%E7%A9%BA%20%E8%8D%A7/closed?q=test', ROUTE_OPTIONS)

  assert.deepEqual(topic?.route, { name: 'topic', locale: 'en', topicId: 'AB 123' })
  assert.equal(topic?.canonicalHref, '/docs/en/feedback/topic/AB%20123')
  assert.deepEqual(user?.route, {
    name: 'user',
    locale: 'ja',
    username: '空 荧',
    list: { filter: 'closed', sort: 'created', q: 'test', creator: '空 荧' },
  })
  assert.equal(user?.canonicalHref, '/docs/ja/feedback/user/%E7%A9%BA%20%E8%8D%A7/closed?q=test')
})

test('matches reserved resources before filters and rejects invalid paths', () => {
  assert.equal(parseForumLocation('/docs/feedback/nope', ROUTE_OPTIONS), null)
  assert.equal(parseForumLocation('/docs/feedback/topic', ROUTE_OPTIONS), null)
  assert.equal(parseForumLocation('/docs/feedback/topic/id/extra', ROUTE_OPTIONS), null)
  assert.equal(parseForumLocation('/docs/feedback/user/name/nope', ROUTE_OPTIONS), null)
  assert.equal(parseForumLocation('/docs-extra/feedback', ROUTE_OPTIONS), null)
  assert.equal(parseForumLocation('/docs/feedback-not-a-route', ROUTE_OPTIONS), null)
  assert.equal(parseForumLocation('/docs/feedback/user/%E0%A4%A', ROUTE_OPTIONS), null)
})

test('caps search at the 50-character UI contract', () => {
  const parsed = parseForumLocation(`/docs/feedback?q=${'x'.repeat(70)}`, ROUTE_OPTIONS)

  assert.equal(parsed?.route.name, 'home')
  assert.equal(parsed?.route.name === 'home' ? parsed.route.list.q.length : 0, 50)
  assert.equal(parsed?.canonicalHref, `/docs/feedback?q=${'x'.repeat(50)}`)
})

test('builders preserve unrelated query and hash while replacing owned list state', () => {
  const href = buildForumHref({
    name: 'user',
    locale: 'en',
    username: 'alice/bob',
    list: { filter: 'feat', sort: 'updated', q: 'map', creator: 'ignored' },
  }, {
    ...ROUTE_OPTIONS,
    currentUrl: '/docs/feedback?view=card&q=old&sort=created#comments',
  })

  assert.equal(href, '/docs/en/feedback/user/alice%2Fbob/feat?view=card&q=map&sort=updated#comments')
})

test('same destination navigation compares the complete URL', () => {
  assert.equal(isSameForumDestination('/docs/feedback?q=map#results', '/docs/feedback?q=map#results'), true)
  assert.equal(isSameForumDestination('/docs/feedback?q=map', '/docs/feedback?q=other'), false)
})

test('same destination navigation is a no-op', async () => {
  const calls: string[] = []
  const go = (href: string) => {
    calls.push(href)
  }

  assert.equal(await navigateForumDestination('/docs/feedback?q=map', '/docs/feedback?q=map', go), false)
  assert.deepEqual(calls, [])
  assert.equal(await navigateForumDestination('/docs/feedback?q=map', '/docs/feedback?q=other', go), true)
  assert.deepEqual(calls, ['/docs/feedback?q=other'])
})

test('canonicalization preserves the current History state object', () => {
  const state = { scrollPosition: 420, key: 'vitepress' }
  const calls: unknown[][] = []
  const history = {
    state,
    replaceState: (...args: unknown[]) => calls.push(args),
  }

  assert.equal(canonicalizeForumLocation(history, '/docs/feedback/all', '/docs/feedback'), true)
  assert.deepEqual(calls, [[state, '', '/docs/feedback']])
  assert.equal(canonicalizeForumLocation(history, '/docs/feedback', '/docs/feedback'), false)
  assert.equal(calls.length, 1)
})

test('ships exactly three scoped Vercel Forum rewrites and localized shells', () => {
  const readSource = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8')
  const config = JSON.parse(readSource('vercel.json'))

  assert.deepEqual(config.rewrites, [
    { source: '/docs/feedback/:path*', destination: '/docs/feedback' },
    { source: '/docs/en/feedback/:path*', destination: '/docs/en/feedback' },
    { source: '/docs/ja/feedback/:path*', destination: '/docs/ja/feedback' },
  ])
  for (const path of ['src/zh/feedback.md', 'src/en/feedback.md', 'src/ja/feedback.md']) {
    const shell = readSource(path)
    assert.match(shell, /layout: Forum/)
    assert.match(shell, /<ForumRouteView \/>/)
  }
})
