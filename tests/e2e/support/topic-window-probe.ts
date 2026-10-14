import type { App } from 'vue'
import type ForumAPI from '~/forum/api/types'
import { createApp, h, nextTick, ref, shallowRef } from 'vue'

/** Exercise mode migration with controlled heights, without network or card setup costs. */
export async function mountTopicWindowProbe(initialCount = 80) {
  const moduleUrl = '/forum/composables/view/useForumTopicWindow.ts'
  const { useForumTopicWindow }: typeof import('../../../src/forum/composables/view/useForumTopicWindow') = await import(/* @vite-ignore */ moduleUrl)
  const original = (document.getElementById('app') as HTMLElement & { __vue_app__: App }).__vue_app__
  const items = Array.from({ length: 160 }, (_, index) => ({ id: `probe-${index}` }) as ForumAPI.Topic)
  const data = shallowRef(items.slice(0, initialCount))
  const listKey = ref('first')
  const pending = ref(false)
  const active = ref(true)
  const root = document.createElement('div')
  root.style.cssText = 'position:relative;z-index:999;background:white;width:600px;margin:0 auto;'
  const originalElement = document.getElementById('app')!
  const previousDisplay = originalElement.style.display
  originalElement.style.display = 'none'
  document.body.append(root)
  const app = createApp({
    setup() {
      const view = useForumTopicWindow(() => data.value, active, () => listKey.value, () => pending.value)
      return () => h('ul', {
        'ref': view.setRoot,
        'data-probe-list': true,
        'data-windowed': view.windowed.value,
        'style': { position: 'relative', margin: 0, padding: 0, height: view.height.value === undefined ? undefined : `${view.height.value}px` },
      }, view.rows.value.map(({ item, index, start }) => h('li', {
        'key': item.id,
        'ref': view.measureRow,
        'data-topic-id': item.id,
        'data-index': index,
        'tabindex': 0,
        'style': {
          height: `${120 + (index % 7) * 43}px`,
          boxSizing: 'border-box',
          borderBottom: '1px solid black',
          listStyle: 'none',
          position: start === undefined ? undefined : 'absolute',
          top: start === undefined ? undefined : `${start}px`,
          width: '100%',
        },
      }, item.id)))
    },
  })
  app._context.provides = original._context.provides
  app.mount(root)
  await nextTick()
  return {
    setCount: (count: number) => {
      data.value = items.slice(0, count)
      pending.value = false
    },
    cloneRows: () => data.value = [...data.value],
    reset: (key: string, count?: number) => {
      listKey.value = key
      pending.value = count === undefined
      if (count !== undefined)
        data.value = items.slice(0, count)
    },
    dispose: () => {
      app.unmount()
      root.remove()
      originalElement.style.display = previousDisplay
    },
  }
}
