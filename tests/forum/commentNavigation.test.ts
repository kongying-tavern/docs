import { strict as assert } from 'node:assert'
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
