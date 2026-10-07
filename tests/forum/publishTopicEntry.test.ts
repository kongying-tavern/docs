import assert from 'node:assert/strict'
import { test } from 'vitest'
import { resolvePublishTopicType } from '../../src/forum/services/form/publishTopicEntry'

test('generic entries show the chooser while specific hashes skip it', () => {
  assert.equal(resolvePublishTopicType('PUBLISH-TOPIC', ['BUG', 'FEAT']), undefined)
  for (const type of ['BUG', 'FEAT', 'ANN'] as const)
    assert.equal(resolvePublishTopicType(`PUBLISH-TOPIC-${type}`, ['BUG', 'FEAT', 'ANN']), type)
})
test('references retain their requested type and announcements require permission', () => {
  assert.equal(resolvePublishTopicType('PUBLISH-TOPIC', ['BUG', 'FEAT'], 'FEAT'), 'FEAT')
  assert.equal(resolvePublishTopicType('PUBLISH-TOPIC-BUG', ['BUG', 'FEAT'], 'FEAT'), 'FEAT')
  assert.equal(resolvePublishTopicType('PUBLISH-TOPIC-ANN', ['BUG', 'FEAT']), undefined)
  assert.equal(resolvePublishTopicType('PUBLISH-TOPIC-UNKNOWN', ['BUG', 'FEAT']), undefined)
})
