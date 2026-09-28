/* eslint-disable test/no-import-node-test */
import type ForumAPI from '../../src/forum/api/types'
import type { TopicStateFilter } from '../../src/forum/services/forumQueryContracts'
import type { ForumSearchState } from '../../src/forum/services/forumSearchQuery'
import type { StructuredTopicFetcher } from '../../src/forum/services/forumTopics'
import assert from 'node:assert/strict'
import test from 'node:test'
import { getStructuredForumTopics } from '../../src/forum/services/forumTopics'

type Params = Parameters<typeof getStructuredForumTopics>[0]

const baseParams: Params = {
  filter: 'all',
  sort: 'created',
  creator: 'alice',
  q: '',
  pageSize: 20,
}
const isOfficialUser = () => false

function topic(partial: Partial<ForumAPI.Topic>): ForumAPI.Topic {
  return {
    id: 'I12345',
    title: 'map crash',
    content: { text: 'after entering the map the client freezes' },
    contentRaw: 'after entering the map the client freezes',
    link: 'https://gitee.com/ky/docs/issues/I12345',
    labels: [],
    tags: [],
    goodIssue: false,
    commentCount: 0,
    user: { id: 1, login: 'alice', username: 'alice' },
    state: 'open',
    type: 'BUG',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...partial,
  }
}

function fetcher(pages: ForumAPI.Topic[][]) {
  const calls: Array<{ state: TopicStateFilter | undefined, page: number }> = []
  const fetchTopics: StructuredTopicFetcher = async (query, state) => {
    const page = query.current ?? 1
    calls.push({ state, page })
    return { data: pages[page - 1] ?? [], totalPage: undefined }
  }
  return { fetchTopics, calls }
}

test('closed facet on the default list returns progressing topics instead of an empty result', async () => {
  const progressing = topic({
    id: 'I_PROGRESSING',
    state: 'progressing',
    labels: ['CATA-LOGIN'],
  })
  const { fetchTopics, calls } = fetcher([[progressing]])

  const result = await getStructuredForumTopics(
    { ...baseParams, statuses: ['closed'] },
    isOfficialUser,
    fetchTopics,
  )

  assert.deepEqual(result.topics.map(item => item.id), ['I_PROGRESSING'])
  assert.equal(result.total, 1)
  assert.equal(result.totalPage, 1)
  assert.deepEqual(calls.map(call => call.page), [1])
})

test('status-label facets match topics whose gitee state is not the filter-derived state', async () => {
  const fixed = topic({
    id: 'I_FIXED',
    state: 'progressing',
    status: 'fixed',
    labels: ['ST-FIXED'],
  })
  const { fetchTopics } = fetcher([[fixed]])

  const result = await getStructuredForumTopics(
    { ...baseParams, statuses: ['fixed'] },
    isOfficialUser,
    fetchTopics,
  )

  assert.deepEqual(result.topics.map(item => item.id), ['I_FIXED'])
  assert.equal(result.topics.length, 1)
})

test('good-issue facet includes archived-state topics without the everything exclusion', async () => {
  const goodIssue = topic({
    id: 'I_GOOD',
    state: 'closed',
    goodIssue: true,
  })
  const { fetchTopics } = fetcher([[goodIssue]])

  const result = await getStructuredForumTopics(
    { ...baseParams, filter: 'everything', statuses: ['good-issue'] },
    isOfficialUser,
    fetchTopics,
  )

  assert.deepEqual(result.topics.map(item => item.id), ['I_GOOD'])
})

test('without a status facet the filter-derived state constraint still applies', async () => {
  const progressing = topic({ id: 'I_PROGRESSING', state: 'progressing' })
  const open = topic({ id: 'I_OPEN', state: 'open' })
  const { fetchTopics } = fetcher([[progressing, open]])

  const result = await getStructuredForumTopics(
    { ...baseParams, filter: 'closed' },
    isOfficialUser,
    fetchTopics,
  )

  assert.deepEqual(result.topics.map(item => item.id), ['I_PROGRESSING'])
})

test('duplicate ids across branches are deduplicated', async () => {
  const shared = topic({
    id: 'I_SHARED',
    state: 'progressing',
    status: 'fixed',
    labels: ['ST-FIXED'],
  })
  const { fetchTopics } = fetcher([[shared]])

  const result = await getStructuredForumTopics(
    { ...baseParams, statuses: ['closed', 'fixed'] },
    isOfficialUser,
    fetchTopics,
  )

  assert.equal(result.topics.length, 1)
  assert.equal(result.topics[0]?.id, 'I_SHARED')
})

test('published pages stay stable when later batches sort ahead, without duplicates or omissions', async () => {
  const make = (from: number) => Array.from({ length: 100 }, (_, index) => {
    const ts = new Date(Date.UTC(2026, 0, 1) + (from + index) * 60_000).toISOString()
    return topic({
      id: `I_${from + index}`,
      state: 'progressing',
      createdAt: ts,
      updatedAt: ts,
    })
  })
  const { fetchTopics, calls } = fetcher([make(0), make(100)])
  const params = { ...baseParams, sort: 'updated' as const, statuses: ['closed'] as ForumSearchState[] }

  const pages = []
  for (let page = 1; page <= 10; page++)
    pages.push(await getStructuredForumTopics(params, isOfficialUser, fetchTopics, page))

  assert.equal(pages[0]?.topics[0]?.id, 'I_99')
  assert.equal(pages[4]?.topics[0]?.id, 'I_19')
  assert.equal(pages[5]?.topics[0]?.id, 'I_199')
  assert.equal(pages[5]?.topics.at(-1)?.id, 'I_180')

  const ids = pages.flatMap(result => result.topics.map(item => String(item.id)))
  assert.equal(ids.length, 200)
  assert.equal(new Set(ids).size, 200)
  assert.deepEqual(new Set(ids), new Set(Array.from({ length: 200 }, (_, index) => `I_${index}`)))

  const eleventh = await getStructuredForumTopics(params, isOfficialUser, fetchTopics, 11)
  assert.equal(eleventh.topics.length, 0)
  assert.equal(eleventh.totalPage, 10)

  assert.deepEqual(calls.map(call => call.page), [1, 2, 3])
})

test('a branch stops at its fetch page cap and never requests beyond it', async () => {
  const fullPage = Array.from({ length: 100 }, (_, index) => topic({
    id: `I_${index}`,
    state: 'progressing',
  }))
  const { fetchTopics, calls } = fetcher([fullPage, fullPage, fullPage, fullPage, fullPage, fullPage])
  const params = { ...baseParams, statuses: ['closed'] as ForumSearchState[], q: 'map', pageSize: 1000 }

  await getStructuredForumTopics(params, isOfficialUser, fetchTopics, 1)

  assert.deepEqual(calls.map(call => call.page), [1, 2, 3, 4, 5])
})

test('branch fetching stops at an empty page without extra requests', async () => {
  const fullPage = Array.from({ length: 100 }, (_, index) => topic({
    id: `I_${index}`,
    state: 'progressing',
  }))
  const { fetchTopics, calls } = fetcher([fullPage, fullPage, fullPage, [], [], []])
  const params = { ...baseParams, statuses: ['closed'] as ForumSearchState[], q: 'no-such-text' }

  await getStructuredForumTopics(params, isOfficialUser, fetchTopics, 1)

  assert.deepEqual(calls.map(call => call.page), [1, 2, 3, 4])
})

test('client-side text matching filters the fetched branches across pages', async () => {
  const matching = topic({
    id: 'I_MATCH',
    title: 'map crash on load',
    content: { text: 'frames' },
    contentRaw: 'frames',
    state: 'progressing',
  })
  const { fetchTopics } = fetcher([[matching]])

  const result = await getStructuredForumTopics(
    { ...baseParams, filter: 'everything', statuses: ['closed'], q: 'map' },
    isOfficialUser,
    fetchTopics,
  )

  assert.deepEqual(result.topics.map(item => item.id), ['I_MATCH'])
})
