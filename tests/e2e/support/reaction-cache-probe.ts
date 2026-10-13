import type { App } from 'vue'
import { createApp, h, ref } from 'vue'

/** Mount a second consumer of the same cached reaction outside the viewport. */
export async function mountReactionCacheProbe() {
  const componentUrl = '/forum/components/comment/ForumCommentReactionButtons.vue'
  const { default: ForumCommentReactionButtons } = await import(/* @vite-ignore */ componentUrl)
  const original = (document.getElementById('app') as HTMLElement & { __vue_app__: App }).__vue_app__
  const second = ref(false)
  const root = document.createElement('div')
  root.id = 'reaction-cache-probe'
  document.body.append(root)
  const app = createApp({
    setup() {
      return () => h('div', [
        h(ForumCommentReactionButtons, { topicId: '123', commentId: '99001', autoload: true }),
        second.value
          ? h('div', { 'data-probe': 'offscreen', 'style': 'margin-top: 2000px' }, [
              h(ForumCommentReactionButtons, { topicId: '123', commentId: '99001', autoload: false }),
            ])
          : null,
      ])
    },
  })
  app._context.provides = original._context.provides
  app.mount(root)
  return { showSecond: () => second.value = true }
}
