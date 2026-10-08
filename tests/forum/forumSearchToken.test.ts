import assert from 'node:assert/strict'
import { test, vi } from 'vitest'
import { effectScope, ref } from 'vue'

// 解析结果依赖真实文案：en 的状态与标签显示名带空格（"Not planned"、"Documentation issue"）
vi.mock('@/hooks/useLocalized', async () => {
  const { ref } = await import('vue')
  const { default: forum } = await import('../../.vitepress/locales/en/forum')
  return { useLocalized: () => ({ message: ref({ forum }) }) }
})
vi.mock('~/forum/composables/state/useForumLabelStore', async () => {
  const { ref } = await import('vue')
  return { useForumLabelStore: () => ({ categoryLabels: ref([]) }) }
})

const { useForumSearchToken } = await import('~/forum/composables/view/useForumSearchToken')
const { useForumSearchFilters } = await import('~/forum/components/search/composables/useForumSearchFilters')

const scope = effectScope()
const token = scope.run(() => useForumSearchToken())!

function chip(query: string) {
  const ref_ = ref(query)
  return { ref: ref_, filters: scope.run(() => useForumSearchFilters(ref_, () => false))! }
}

test('multi-word state labels survive the format → parse round trip', () => {
  const formatted = token.formatSearchToken({ text: '', tags: [], states: ['not-planned', 'needs-more-info'], author: null })
  assert.equal(formatted, 'state:Not planned,Needs more info')
  assert.deepEqual(token.parseSearchToken(formatted).states, ['not-planned', 'needs-more-info'])
})

test('a single-word state before a multi-word one does not truncate the list', () => {
  const formatted = token.formatSearchToken({ text: '', tags: [], states: ['fixed', 'not-planned'], author: null })
  assert.equal(formatted, 'state:Fixed,Not planned')
  assert.deepEqual(token.parseSearchToken(formatted).states, ['fixed', 'not-planned'])
})

test('multi-word tag labels survive the format → parse round trip', () => {
  const formatted = token.formatSearchToken({ text: '', tags: ['CATA-DOCS', 'CATA-ALL-PLATFORM'], states: [], author: null })
  assert.equal(formatted, 'tags:Documentation issue,All platforms')
  assert.deepEqual(token.parseSearchToken(formatted).tags, ['CATA-DOCS', 'CATA-ALL-PLATFORM'])
})

test('multi-word values stop at the next facet token and keep trailing keywords out', () => {
  const parsed = token.parseSearchToken('state:Needs triage author:alice')
  assert.deepEqual(parsed.states, ['needs-triage'])
  assert.equal(parsed.author, 'alice')
  assert.deepEqual(token.parseSearchToken('state:Not planned map crash').states, ['not-planned'])
})

test('raw ids and unsupported values keep their previous behaviour', () => {
  assert.deepEqual(token.parseSearchToken('state:not-planned').states, ['not-planned'])
  assert.deepEqual(token.parseSearchToken('state:nope').states, [])
  assert.deepEqual(token.parseSearchToken('state:fixed,,closed').states, ['fixed', 'closed'])
  assert.equal(token.findSearchFacet('state:Not planned'), 'state')
})

test('re-applying the back-filled filter chip keeps the multi-word state', () => {
  const { filters } = chip('state:not-planned')
  assert.equal(filters.filterToken.value, 'state:Not planned')
  assert.equal(filters.filterDraft.value, 'state:Not planned')
  assert.equal(filters.applyDraft(), 'state:not-planned')
})

test('re-applying a multi-word tag chip does not corrupt the tag', () => {
  const { filters } = chip('tags:CATA-DOCS')
  assert.equal(filters.filterToken.value, 'tags:Documentation issue')
  assert.equal(filters.applyDraft(), 'tags:CATA-DOCS')
})
