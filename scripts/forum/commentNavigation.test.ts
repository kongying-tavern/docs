/* eslint-disable test/no-import-node-test -- use Node's built-in runner for this contract */
import { strict as assert } from 'node:assert'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { resolveCommentTargetState, resolveRestoredCommentPage } from '../../src/forum/services/commentNavigation'

test('comment targets distinguish loading, ready, missing, and ordinary browsing states', () => {
  assert.equal(resolveCommentTargetState({
    targetCommentId: null,
    hasTargetComment: false,
    loading: false,
    canLoadMore: false,
    hasError: false,
  }), 'none')
  assert.equal(resolveCommentTargetState({
    targetCommentId: '42',
    hasTargetComment: false,
    loading: false,
    canLoadMore: true,
    hasError: false,
  }), 'loading')
  assert.equal(resolveCommentTargetState({
    targetCommentId: '42',
    hasTargetComment: true,
    loading: false,
    canLoadMore: true,
    hasError: false,
  }), 'ready')
  assert.equal(resolveCommentTargetState({
    targetCommentId: 'deleted',
    hasTargetComment: false,
    loading: false,
    canLoadMore: false,
    hasError: false,
  }), 'missing')
  assert.equal(resolveCommentTargetState({
    targetCommentId: '42',
    hasTargetComment: false,
    loading: false,
    canLoadMore: false,
    hasError: true,
  }), 'loading')
})

test('restored comment pages keep a requested page while loading and canonicalize an exhausted list', () => {
  assert.equal(resolveRestoredCommentPage(1, 3, true), 3)
  assert.equal(resolveRestoredCommentPage(3, 1, true), 3)
  assert.equal(resolveRestoredCommentPage(2, 5, false), 2)
})

test('comment UI keeps manual pagination and persistent deep-link focus contracts', async () => {
  const [areaSource, commentSource] = await Promise.all([
    readFile(new URL('../../src/forum/components/comment/ForumCommentArea.vue', import.meta.url), 'utf8'),
    readFile(new URL('../../src/forum/components/comment/ForumCommentItem.vue', import.meta.url), 'utf8'),
  ])

  assert.match(areaSource, /:can-load-more="canLoadMoreComment"/)
  assert.match(areaSource, /:load-more="loadMoreComment"/)
  assert.match(areaSource, /tabindex="-1"/)
  assert.match(areaSource, /\.focus\(\{ preventScroll: true \}\)/)
  assert.match(areaSource, /targetCommentState === 'missing'/)
  const stateSource = await readFile(new URL('../../src/forum/components/comment/composables/useCommentAreaState.ts', import.meta.url), 'utf8')
  assert.match(stateSource, /useEventListener\(window, 'hashchange', syncBrowserHref\)/)
  assert.match(commentSource, /\.topic-comment-item:target \{[\s\S]*outline: 2px solid var\(--vp-c-brand-1\)/)
})
