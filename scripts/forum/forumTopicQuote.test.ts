/* eslint-disable test/no-import-node-test -- use Node's built-in runner for this contract */
import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import {
  buildQuotedTopicFormHref,
  clearQuotedTopicRequest,
  isQuotableTopicType,
  normalizeQuotedTopicReference,
  readQuotedTopicRequest,
  shouldShowQuotedTopicImageBelow,
} from '../../src/forum/services/topicQuote'

test('quoted Topic URLs round-trip a validated reference and preserve unrelated state', () => {
  const href = buildQuotedTopicFormHref(
    '/docs/feedback/topic/ICROD8?comment-page=2#reply-123',
    { id: 'id4tlh', type: 'BUG' },
    'PUBLISH-TOPIC',
  )

  assert.equal(href, '/docs/feedback/topic/ICROD8?comment-page=2&quote-topic=ID4TLH&quote-type=BUG#PUBLISH-TOPIC-BUG')
  assert.deepEqual(readQuotedTopicRequest(href), { id: 'ID4TLH', type: 'BUG' })
})

test('quoted Topic requests reject incomplete and malformed external input', () => {
  assert.equal(readQuotedTopicRequest('/docs/feedback?quote-topic=ICROD8'), undefined)
  assert.equal(readQuotedTopicRequest('/docs/feedback?quote-topic=../../admin&quote-type=BUG'), undefined)
  assert.equal(readQuotedTopicRequest('/docs/feedback?quote-topic=ICROD8&quote-type=POST'), undefined)
  assert.equal(readQuotedTopicRequest('/docs/feedback?quote-topic=ICROD8&quote-type=ANN'), undefined)
  assert.equal(normalizeQuotedTopicReference({ id: 'ICROD8', type: 'ANN' }), undefined)
  assert.equal(isQuotableTopicType('ANN'), false)
  assert.equal(isQuotableTopicType('BUG'), true)
  assert.throws(() => buildQuotedTopicFormHref('/', { id: 'ICROD8', type: 'ANN' }, 'PUBLISH-TOPIC'), RangeError)
  assert.deepEqual(normalizeQuotedTopicReference({ id: ' icrod8 ', type: 'feat' }), { id: 'ICROD8', type: 'FEAT' })
  assert.throws(() => buildQuotedTopicFormHref('/', { id: 'bad', type: 'BUG' }, 'PUBLISH-TOPIC'), RangeError)
})

test('consuming quoted Topic parameters preserves history state, hash, and unrelated query', () => {
  const calls: unknown[][] = []
  const history = {
    state: { scrollPosition: 42 },
    replaceState: (...args: unknown[]) => calls.push(args),
  }

  assert.equal(clearQuotedTopicRequest(
    history,
    '/docs/feedback?view=card&quote-topic=ICROD8&quote-type=FEAT#PUBLISH-TOPIC-FEAT',
  ), true)
  assert.deepEqual(calls, [[
    history.state,
    '',
    '/docs/feedback?view=card#PUBLISH-TOPIC-FEAT',
  ]])
  assert.equal(clearQuotedTopicRequest(history, '/docs/feedback?view=card'), false)
})

test('only one sufficiently wide quoted image uses the large layout below the content', () => {
  const wide = { src: '/wide.png', width: 1600, height: 900 }
  const square = { src: '/square.png', width: 800, height: 800 }

  assert.equal(shouldShowQuotedTopicImageBelow([wide]), true)
  assert.equal(shouldShowQuotedTopicImageBelow([square]), false)
  assert.equal(shouldShowQuotedTopicImageBelow([{ src: '/unknown.png' }]), false)
  assert.equal(shouldShowQuotedTopicImageBelow([wide, square]), false)
  assert.equal(shouldShowQuotedTopicImageBelow([]), false)
})
