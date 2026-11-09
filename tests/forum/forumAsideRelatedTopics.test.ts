import type ForumAPI from '../../src/forum/api/types'
import assert from 'node:assert/strict'
import { test, vi } from 'vitest'
import { createSSRApp, h, ref } from 'vue'
import { createI18n } from 'vue-i18n'
import { renderToString } from 'vue/server-renderer'
import { normalizeIssue } from '../../src/forum/api/gitee/normalize'
import ForumAsideRelatedTopics from '../../src/forum/components/aside/ForumAsideRelatedTopics.vue'

const mocks = vi.hoisted(() => ({ topics: [] as ForumAPI.Topic[] }))

vi.mock('~/forum/composables/data/useForumQueries', () => ({
  useForumTopicsQuery: () => ({ rows: ref(mocks.topics) }),
}))
vi.mock('~/forum/composables/state/useForumRoute', () => ({
  useForumRoute: () => ({ topicHref: (id: string) => `/feedback/topic/${id}` }),
}))
vi.mock('@/components/ui/User.vue', () => ({ default: { render: () => null } }))
vi.mock('~/forum/components/ui/ForumTime.vue', () => ({ default: { render: () => null } }))
vi.mock('~/forum/components/ui/ForumTopicLifecycle.vue', () => ({ default: { render: () => null } }))

test('related BUG topics display decoded bodies even when legacy titles contain truncated JSON', async () => {
  const text = '地图标记无法正常显示'
  const bug = normalizeIssue({
    number: 'IKTAMR',
    title: 'BUG:{"type":"doc...',
    body: JSON.stringify({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] }),
    labels: [{ name: 'CATA-DOCS' }],
    state: 'open',
    comments: 0,
  } as GITEE.IssueInfo)
  mocks.topics = [bug, { ...bug, id: 'IFEAT1', type: 'FEAT', title: '保留建议标题' }]
  const app = createSSRApp({
    render: () => h(ForumAsideRelatedTopics, { topic: { ...bug, id: 'ICURRENT' } }),
  })
  app.use(createI18n({
    legacy: false,
    locale: 'zh',
    messages: { zh: { forum: { aside: { related: { title: '相关反馈' } }, sidebar: { totalComments: '{count}' } } } },
  }))
  const html = await renderToString(app)
  assert.ok(html.includes(text))
  assert.ok(html.includes('保留建议标题'))
  assert.ok(html.includes('/feedback/topic/IKTAMR'))
  assert.ok(!html.includes('doc...'))
})
