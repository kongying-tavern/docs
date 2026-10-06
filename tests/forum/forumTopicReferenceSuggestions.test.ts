import type ForumAPI from '../../src/forum/api/types'
import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { renderForumTopic } from '../../src/forum/services/forumContentRenderer'
import { getTopicReferenceSuggestions, normalizeTopicReferenceId } from '../../src/forum/services/forumTopicReferenceSuggestions'

function topic(id: string, title: string): ForumAPI.Topic {
  return { id, title } as ForumAPI.Topic
}

test('reference suggestions rank exact IDs before prefixes and titles, deduplicate and cap results', () => {
  const topics = [topic('IABCDE', 'ID2DIO title'), topic('ID2DIOA', 'Long ID'), topic('ID2DIO', 'Exact'), topic('ID2DIO', 'Duplicate')]
  assert.deepEqual(getTopicReferenceSuggestions(topics, '#id2dio').map(item => item.id), ['ID2DIO', 'ID2DIOA', 'IABCDE'])
  assert.equal(getTopicReferenceSuggestions(topics, 'missing').length, 0)
  assert.equal(getTopicReferenceSuggestions(Array.from({ length: 8 }, (_, i) => topic(`IABCDE${i}`, 'Test')), '').length, 5)
})

test('manual references normalize legal Gitee topic IDs and reject incomplete or malformed values', () => {
  assert.equal(normalizeTopicReferenceId('#id2dio'), 'ID2DIO')
  assert.equal(normalizeTopicReferenceId(' IABCDE123 '), 'IABCDE123')
  for (const value of ['ID2', 'ABCDEF', '#ID2DIO!', 'IABCDE/path', 'IABCDE ID2DIO'])
    assert.equal(normalizeTopicReferenceId(value), undefined)
})

test('custom IDs render as internal references while code, URLs and identifier fragments remain literal', () => {
  const html = renderForumTopic(JSON.stringify({ type: 'doc', content: [{ type: 'paragraph', content: [
    { type: 'topicReference', attrs: { id: 'ID2DIO' } },
    { type: 'text', text: ' #ID2DIO', marks: [{ type: 'code' }] },
    { type: 'text', text: ' prefix#ID2DIO https://gitee.com/path#ID2DIO' },
  ] }] }), { topicHref: id => `/feedback/topic/${id}` })
  assert.equal(html.match(/href="\/feedback\/topic\/ID2DIO"/g)?.length, 1)
  assert.match(html, /<code> #ID2DIO<\/code>/)
  assert.match(html, /prefix#ID2DIO/)
})
