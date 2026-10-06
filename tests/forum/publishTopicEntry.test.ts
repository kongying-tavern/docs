import assert from 'node:assert/strict'
import { it } from 'node:test'
import { resolvePublishTopicType } from '../../src/forum/services/form/publishTopicEntry'

it('generic entries show the chooser while specific hashes skip it', () => {
  assert.equal(resolvePublishTopicType('PUBLISH-TOPIC', ['BUG', 'FEAT']), undefined)
  for (const type of ['BUG', 'FEAT', 'ANN'] as const)
    assert.equal(resolvePublishTopicType(`PUBLISH-TOPIC-${type}`, ['BUG', 'FEAT', 'ANN']), type)
})
it('references retain their requested type and announcements require permission', () => {
  assert.equal(resolvePublishTopicType('PUBLISH-TOPIC', ['BUG', 'FEAT'], 'FEAT'), 'FEAT')
  assert.equal(resolvePublishTopicType('PUBLISH-TOPIC-BUG', ['BUG', 'FEAT'], 'FEAT'), 'FEAT')
  assert.equal(resolvePublishTopicType('PUBLISH-TOPIC-ANN', ['BUG', 'FEAT']), undefined)
  assert.equal(resolvePublishTopicType('PUBLISH-TOPIC-UNKNOWN', ['BUG', 'FEAT']), undefined)
})
