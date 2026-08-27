/* eslint-disable test/no-import-node-test -- use Node's built-in runner for this contract */
import type ForumAPI from '../../.vitepress/theme/apis/forum/api'
import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { getForumSearchSuggestions } from '../../src/services/forum/forumSearchSuggestions'

function topic(id: string, title: string, text: string): ForumAPI.Topic {
  return { id, title, content: { text } } as ForumAPI.Topic
}

test('local suggestions search topic IDs, titles, and full text in relevance order', () => {
  const suggestions = getForumSearchSuggestions([
    topic('body', '画布位置更换', '希望可以复制到最底下，避免反复拖动。'),
    topic('title', '复制功能建议', '另一段正文'),
    topic('COPY-ID', '另一个建议', '没有匹配内容'),
  ], '复制')

  assert.deepEqual(suggestions.map(item => item.topic.id), ['title', 'body'])
  assert.match(suggestions[1].excerpt, /复制到最底下/)

  assert.deepEqual(
    getForumSearchSuggestions([topic('IHMOJE', '海外用户注册帮助', '正文')], 'hmoj')
      .map(item => item.topic.id),
    ['IHMOJE'],
  )
})
