import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { resolveForumDirection, resolveForumScroll, resolveForumSharedRoute } from '../../src/forum/router/forumViewTransition'
import {
  buildForumHref,
  canonicalizeForumLocation,
  isSameForumDestination,
  navigateForumDestination,
  parseForumLocation,
  readForumCommentId,
} from '../../src/forum/services/forumRoute'

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
      filter: 'all',
      topicType: 'bug',
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
    list: { filter: 'all', topicType: 'all', sort: 'created', q: '', creator: null },
  })
  assert.equal(parsed?.canonicalHref, '/docs/feedback?view=compact')
})

test('round-trips archived and everything list filters', () => {
  const archived = parseForumLocation('/docs/feedback/archived', ROUTE_OPTIONS)
  const everything = parseForumLocation('/docs/feedback/everything', ROUTE_OPTIONS)

  assert.equal(archived?.route.name === 'home' ? archived.route.list.filter : null, 'archived')
  assert.equal(archived?.canonicalHref, '/docs/feedback/archived')
  assert.equal(everything?.route.name === 'home' ? everything.route.list.filter : null, 'everything')
  assert.equal(everything?.canonicalHref, '/docs/feedback/everything')
})

test('round-trips combined range and type paths for home and user lists', () => {
  const home = parseForumLocation('/docs/feedback/closed/bug?q=crash&sort=updated', ROUTE_OPTIONS)
  const user = parseForumLocation('/docs/en/feedback/user/alice/archived/feat', ROUTE_OPTIONS)

  assert.equal(home?.route.name === 'home' ? home.route.list.filter : null, 'closed')
  assert.equal(home?.route.name === 'home' ? home.route.list.topicType : null, 'bug')
  assert.equal(home?.canonicalHref, '/docs/feedback/closed/bug?q=crash&sort=updated')
  assert.equal(user?.route.name === 'user' ? user.route.list.filter : null, 'archived')
  assert.equal(user?.route.name === 'user' ? user.route.list.topicType : null, 'feat')
  assert.equal(user?.canonicalHref, '/docs/en/feedback/user/alice/archived/feat')

  const legacy = parseForumLocation('/docs/feedback/feat', ROUTE_OPTIONS)
  assert.equal(legacy?.route.name === 'home' ? legacy.route.list.filter : null, 'all')
  assert.equal(legacy?.route.name === 'home' ? legacy.route.list.topicType : null, 'feat')
  assert.equal(legacy?.canonicalHref, '/docs/feedback/feat')
  assert.equal(parseForumLocation('/docs/feedback/bug/closed', ROUTE_OPTIONS), null)
})

test('round-trips localized Topic and encoded User routes', () => {
  const topic = parseForumLocation('/docs/en/feedback/topic/AB%20123', ROUTE_OPTIONS)
  const user = parseForumLocation('/docs/ja/feedback/user/%E7%A9%BA%20%E8%8D%A7/closed?q=test', ROUTE_OPTIONS)

  assert.deepEqual(topic?.route, { name: 'topic', locale: 'en', topicId: 'AB 123', commentPage: 1 })
  assert.equal(topic?.canonicalHref, '/docs/en/feedback/topic/AB%20123')
  assert.deepEqual(user?.route, {
    name: 'user',
    locale: 'ja',
    username: '空 荧',
    list: { filter: 'closed', topicType: 'all', sort: 'created', q: 'test', creator: '空 荧' },
  })
  assert.equal(user?.canonicalHref, '/docs/ja/feedback/user/%E7%A9%BA%20%E8%8D%A7/closed?q=test')
})

test('round-trips dedicated Search routes with list and user scopes', () => {
  const home = parseForumLocation('/docs/feedback/search/closed/bug?q=map&sort=updated', ROUTE_OPTIONS)
  const user = parseForumLocation('/docs/en/feedback/user/alice/search/feat?q=crash', ROUTE_OPTIONS)

  assert.deepEqual(home?.route, {
    name: 'search',
    locale: 'root',
    username: null,
    list: { filter: 'closed', topicType: 'bug', sort: 'updated', q: 'map', creator: null },
  })
  assert.equal(home?.canonicalHref, '/docs/feedback/search/closed/bug?q=map&sort=updated')
  assert.deepEqual(user?.route, {
    name: 'search',
    locale: 'en',
    username: 'alice',
    list: { filter: 'all', topicType: 'feat', sort: 'created', q: 'crash', creator: 'alice' },
  })
  assert.equal(user?.canonicalHref, '/docs/en/feedback/user/alice/search/feat?q=crash')
  assert.equal(parseForumLocation('/docs/feedback/search/bug/closed', ROUTE_OPTIONS), null)
})

test('non-Forum locale transition drops the previous Forum list tuple', () => {
  const stale = parseForumLocation('/docs/feedback/bug?q=stale&sort=updated', ROUTE_OPTIONS)
  const current = parseForumLocation('/docs/en/community', ROUTE_OPTIONS)
  const currentLocale = current?.route.locale ?? 'en'
  const currentList = current?.route && 'list' in current.route
    ? current.route.list
    : { filter: 'all', topicType: 'all', sort: 'created', q: '', creator: 'alice' } as const

  assert.equal(stale?.route.name, 'home')
  assert.equal(current, null)
  assert.equal(buildForumHref({
    name: 'user',
    locale: currentLocale,
    username: 'alice',
    list: currentList,
  }, {
    ...ROUTE_OPTIONS,
    currentUrl: '/docs/en/community',
  }), '/docs/en/feedback/user/alice')
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

test('caps search at the structured-query contract', () => {
  const parsed = parseForumLocation(`/docs/feedback?q=${'x'.repeat(300)}`, ROUTE_OPTIONS)

  assert.equal(parsed?.route.name, 'home')
  assert.equal(parsed?.route.name === 'home' ? parsed.route.list.q.length : 0, 240)
  assert.equal(parsed?.canonicalHref, `/docs/feedback?q=${'x'.repeat(240)}`)
})

test('builders preserve unrelated query and hash while replacing owned list state', () => {
  const href = buildForumHref({
    name: 'user',
    locale: 'en',
    username: 'alice/bob',
    list: { filter: 'all', topicType: 'feat', sort: 'updated', q: 'map', creator: 'ignored' },
  }, {
    ...ROUTE_OPTIONS,
    currentUrl: '/docs/feedback?view=card&q=old&sort=created#comments',
  })

  assert.equal(href, '/docs/en/feedback/user/alice%2Fbob/feat?view=card&q=map&sort=updated#comments')
})

test('round-trips Topic comment loading state and canonicalizes invalid pages', () => {
  const parsed = parseForumLocation('/docs/feedback/topic/123?comment-page=3#reply-456', ROUTE_OPTIONS)
  const invalid = parseForumLocation('/docs/feedback/topic/123?comment-page=-2#reply-456', ROUTE_OPTIONS)

  assert.deepEqual(parsed?.route, { name: 'topic', locale: 'root', topicId: '123', commentPage: 3 })
  assert.equal(parsed?.canonicalHref, '/docs/feedback/topic/123?comment-page=3#reply-456')
  assert.deepEqual(invalid?.route, { name: 'topic', locale: 'root', topicId: '123', commentPage: 1 })
  assert.equal(invalid?.canonicalHref, '/docs/feedback/topic/123#reply-456')
})

test('reads numeric and encoded string comment IDs from reply hashes', () => {
  assert.equal(readForumCommentId('#reply-456'), '456')
  assert.equal(readForumCommentId('/docs/feedback/topic/123?comment-page=3#reply-review%2Fabc'), 'review/abc')
  assert.equal(readForumCommentId('#reply-'), null)
  assert.equal(readForumCommentId('#reply-%E0%A4%A'), null)
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

test('Forum transitions follow the element that explains the navigation', () => {
  const home = { name: 'home', locale: 'root', list: { filter: 'all', topicType: 'all', sort: 'created', q: '', creator: null } } as const
  const topic = { name: 'topic', locale: 'root', topicId: 'I123', commentPage: 1 } as const
  const user = { name: 'user', locale: 'root', username: 'alice', list: { ...home.list, creator: 'alice' } } as const

  assert.equal(resolveForumSharedRoute(home, topic), topic)
  assert.equal(resolveForumSharedRoute(topic, user), user)
  assert.equal(resolveForumSharedRoute(topic, home), topic)
  assert.equal(resolveForumSharedRoute(home, home), null)
})

test('Forum navigation restores saved scroll only for history entries', () => {
  assert.deepEqual(resolveForumScroll({}), { isBack: false, top: 0 })
  assert.deepEqual(resolveForumScroll({ scrollPosition: 420 }), { isBack: true, top: 420 })
  assert.deepEqual(resolveForumScroll({ scrollPosition: -1 }), { isBack: true, top: 0 })
  assert.deepEqual(resolveForumScroll({ scrollPosition: 'invalid' }), { isBack: true, top: 0 })
})

test('Topic return links use the same back direction as browser history', () => {
  const home = { name: 'home', locale: 'root', list: { filter: 'all', topicType: 'all', sort: 'created', q: '', creator: null } } as const
  const topic = { name: 'topic', locale: 'root', topicId: 'I123', commentPage: 1 } as const

  assert.equal(resolveForumDirection(topic, home, false), 'back')
  assert.equal(resolveForumDirection(home, topic, false), 'forward')
  assert.equal(resolveForumDirection(topic, home, true), 'back')
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
