import assert from 'node:assert/strict'
import { test, vi } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import ForumReactionStatsDialog from '../../src/forum/components/ui/ForumReactionStatsDialog.vue'

const stats = vi.hoisted(() => ({ commentId: undefined as string | undefined, viewCount: 3642 }))

vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))
vi.mock('~/forum/composables/data/useReactionStats', async () => {
  const { ref } = await import('vue')
  return {
    useReactionStats: () => ({
      open: ref(true),
      target: ref(stats.commentId
        ? { kind: 'comment', topicId: 'ICROD8', commentId: stats.commentId }
        : { kind: 'topic', topicId: 'ICROD8' }),
    }),
  }
})
vi.mock('~/forum/composables/data/useForumReaction', async () => {
  const { ref } = await import('vue')
  return {
    useForumReaction: () => ({
      data: ref({ data: { likeCount: 7, dislikeCount: 0, clickCount: 14, viewCount: stats.viewCount }, state: null }),
      error: ref(null),
      isLoading: ref(false),
      refetch: vi.fn(),
    }),
  }
})
vi.mock('@/components/ui/dialog', () => {
  const slot = { template: '<div><slot /></div>' }
  return Object.fromEntries([
    'Dialog',
    'DialogClose',
    'DialogContent',
    'DialogFooter',
    'DialogHeader',
    'DialogTitle',
  ].map(name => [name, slot]))
})
vi.mock('@/components/ui/button', () => ({ Button: { template: '<button><slot /></button>' } }))
vi.mock('@/components/ui/text-morph', () => ({ TextMorph: { props: ['text'], template: '<span>{{ text }}</span>' } }))

for (const commentId of [undefined, '99001']) {
  test(`reaction stats display server viewCount for ${commentId ? 'comments' : 'topics'}, independently of clickCount`, async () => {
    stats.commentId = commentId
    stats.viewCount = 3642
    const html = await renderToString(createSSRApp({ render: () => h(ForumReactionStatsDialog) }))
    assert.match(html, /forum\.topic\.menu\.reactionStats\.views<\/span>\s*<span[^>]*>3642<\/span>/)
    assert.match(html, /forum\.topic\.menu\.reactionStats\.clicks<\/span>\s*<span[^>]*>14<\/span>/)
  })
}

test('reaction stats preserve zero views even when clickCount is nonzero', async () => {
  stats.viewCount = 0
  const html = await renderToString(createSSRApp({ render: () => h(ForumReactionStatsDialog) }))
  assert.match(html, /forum\.topic\.menu\.reactionStats\.views<\/span>\s*<span[^>]*>0<\/span>/)
  assert.match(html, /forum\.topic\.menu\.reactionStats\.clicks<\/span>\s*<span[^>]*>14<\/span>/)
})
