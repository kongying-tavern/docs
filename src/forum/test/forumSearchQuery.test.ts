/* eslint-disable test/no-import-node-test */
import assert from 'node:assert/strict'
import test from 'node:test'
import { clearStructuredSearchFilters, mergeTypedSearchFacet } from '../services/forumSearchInput'
import {
  appendForumSearchFacet,
  parseForumSearchQuery,
  removeForumSearchFacet,
  stringifyForumSearchQuery,
  toggleForumSearchFacet,
} from '../services/forumSearchQuery'
import { getForumSearchUserGroups } from '../services/forumSearchUsers'

test('parses grouped tags and states without consuming ordinary keywords', () => {
  assert.deepEqual(parseForumSearchQuery('tags:CATA-DOCS,CATA-TYPOS state:closed,fixed map crash'), {
    text: 'map crash',
    tags: ['CATA-DOCS', 'CATA-TYPOS'],
    states: ['closed', 'fixed'],
    author: null,
  })
})

test('ignores unsupported state values from hand-edited URLs', () => {
  assert.deepEqual(parseForumSearchQuery('state:fixed,nope query'), {
    text: 'query',
    tags: [],
    states: ['fixed'],
    author: null,
  })
})

test('appending a facet preserves and deduplicates all existing filters', () => {
  const withTag = appendForumSearchFacet('state:closed map', 'tags', 'CATA-DOCS')
  const withStatus = appendForumSearchFacet(withTag, 'state', 'fixed')
  assert.equal(withStatus, 'tags:CATA-DOCS state:closed,fixed map')
  assert.equal(appendForumSearchFacet(withStatus, 'state', 'fixed'), withStatus)
})

test('removing one highlighted facet preserves the other facet and keywords', () => {
  const query = 'tags:CATA-DOCS,CATA-TYPOS state:closed map crash'
  assert.equal(removeForumSearchFacet(query, 'tags'), 'state:closed map crash')
  assert.equal(removeForumSearchFacet(query, 'state'), 'tags:CATA-DOCS,CATA-TYPOS map crash')
})

test('stringifier emits a stable GitHub-style token order', () => {
  assert.equal(stringifyForumSearchQuery({
    text: '  map   crash ',
    tags: ['CATA-DOCS', 'CATA-DOCS'],
    states: ['fixed', 'closed'],
    author: null,
  }), 'tags:CATA-DOCS state:fixed,closed map crash')
})

test('author is a single replaceable facet and remains separate from keywords', () => {
  assert.deepEqual(parseForumSearchQuery('tags:CATA-DOCS author:alice map'), {
    text: 'map',
    tags: ['CATA-DOCS'],
    states: [],
    author: 'alice',
  })
  assert.equal(appendForumSearchFacet('author:alice map', 'author', 'bob'), 'author:bob map')
  assert.equal(removeForumSearchFacet('state:closed author:bob map', 'author'), 'state:closed map')
})

test('author suggestions deduplicate loaded users and use team members as a non-repeating fallback', () => {
  const groups = getForumSearchUserGroups([
    { id: 1, login: 'Alice', username: 'Alice', avatar: 'alice.png' },
    { id: 2, login: 'alice', username: 'Duplicate Alice' },
    { id: 3, login: 'bob', username: 'Bob' },
  ], [
    { id: 4, login: 'ALICE', username: 'Team Alice' },
    { id: 5, login: 'carol', username: 'Carol' },
  ])

  assert.deepEqual(groups.map(group => group.users.map(user => user.login)), [
    ['Alice', 'bob'],
    ['carol'],
  ])
  assert.deepEqual(
    getForumSearchUserGroups(groups[0].users, groups[1].users, 'bo')
      .flatMap(group => group.users.map(user => user.login)),
    ['bob'],
  )
})

test('facet toggles share one query-level implementation', () => {
  assert.equal(toggleForumSearchFacet('map', 'tags', 'CATA-DOCS'), 'tags:CATA-DOCS map')
  assert.equal(toggleForumSearchFacet('tags:CATA-DOCS map', 'tags', 'CATA-DOCS'), 'map')
  assert.equal(toggleForumSearchFacet('state:fixed map', 'state', 'fixed'), 'map')
  assert.equal(toggleForumSearchFacet('author:alice map', 'author', 'ALICE'), 'map')
  assert.equal(toggleForumSearchFacet('map', 'state', 'unsupported'), 'map')
})

test('input filter transitions preserve keywords and merge repeated facets', () => {
  assert.equal(clearStructuredSearchFilters('tags:CATA-DOCS state:fixed author:alice map crash'), 'map crash')
  assert.equal(mergeTypedSearchFacet('tags:CATA-DOCS state:fixed author:alice', {
    tags: ['CATA-DOCS', 'CATA-TYPOS'],
    states: ['closed'],
    author: null,
  }), 'tags:CATA-DOCS,CATA-TYPOS state:fixed,closed author:alice')
  assert.equal(mergeTypedSearchFacet('author:alice', { tags: [], states: [], author: 'bob' }), 'author:bob')
})
