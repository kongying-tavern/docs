import type { App } from 'vue'
import { createApp, h, nextTick, ref } from 'vue'

export async function mountListPrefetchProbe() {
  const moduleUrl = '/forum/composables/view/useForumListPrefetch.ts'
  const { useForumListPrefetch } = await import(/* @vite-ignore */ moduleUrl)
  const original = (document.getElementById('app') as HTMLElement & { __vue_app__: App }).__vue_app__
  const host = ref<HTMLElement | null>(null)
  const itemCount = ref(0)
  let calls = 0
  let release!: () => void
  const pending = new Promise<void>(resolve => release = resolve)
  const root = document.createElement('div')
  document.body.append(root)
  const app = createApp({
    setup() {
      useForumListPrefetch({
        get itemCount() { return itemCount.value },
        canLoadMore: true,
        loadMore: () => {
          calls++
          return pending
        },
      }, host, ref(true))
      return () => h('div', { ref: host })
    },
  })
  app._context.provides = original._context.provides
  app.mount(root)
  await nextTick()
  return {
    start: () => itemCount.value = 1,
    calls: () => calls,
    dispose: () => {
      app.unmount()
      root.remove()
    },
    release,
  }
}
