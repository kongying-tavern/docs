import assert from 'node:assert/strict'
import { test } from 'vitest'
import { buildPublishedTopicTitle, resolvePublishTopicType } from '../../src/forum/services/form/publishTopicEntry'

test('published titles use readable rich text and preserve explicit and legacy titles', () => {
  const text = '地图标记无法正常显示，请检查'
  const rich = JSON.stringify({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] })
  assert.equal(buildPublishedTopicTitle('BUG', '', rich), `BUG:${text.substring(0, 12)}...`)
  assert.equal(buildPublishedTopicTitle('BUG', '', text), `BUG:${text.substring(0, 12)}...`)
  assert.equal(buildPublishedTopicTitle('FEAT', '自定义标题', rich), 'FEAT:自定义标题')
})

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
